export const config = {
  auth: false,
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1'
import { corsHeaders, successResponse, errorResponse } from '../_shared/utils.ts'
import { checkRateLimit } from '../_shared/redis.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const wedding_nanoid = url.searchParams.get('wedding_nanoid')?.trim()
    const page  = Math.max(1, parseInt(url.searchParams.get('page')  || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50')))
    const offset = (page - 1) * limit

    console.log(`[fetch-wishes] nanoid=${wedding_nanoid} page=${page} limit=${limit}`)

    if (!wedding_nanoid) {
      return errorResponse('Missing required parameter: wedding_nanoid', 400)
    }

    // ─── Rate Limit: 300 req/min per IP ──────────────────────────────────────
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateLimit = await checkRateLimit(`fetch_wishes:${clientIp}`, 300, 60)
    if (!rateLimit.success) {
      return new Response(
        JSON.stringify({ success: false, message: 'Rate limit exceeded.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } }
      )
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ─── Step 1: Resolve nanoid → wedding UUID ────────────────────────────────
    const { data: weddingRows, error: wError } = await adminClient
      .from('weddings')
      .select('id')
      .eq('nanoid', wedding_nanoid)
      .eq('payment_status', 'paid')
      .limit(1)

    if (wError) {
      console.error('[fetch-wishes] Wedding lookup error:', JSON.stringify(wError))
      return errorResponse(`Database error: ${wError.message}`, 500)
    }

    if (!weddingRows || weddingRows.length === 0) {
      console.warn('[fetch-wishes] No wedding found for nanoid:', wedding_nanoid)
      return errorResponse('Wedding not found', 404)
    }

    const weddingId = weddingRows[0].id

    // ─── Step 2: Fetch paginated wishes ──────────────────────────────────────
    // Only returns guests who left a wish (non-null, non-empty)
    const { data: wishes, error: dError, count } = await adminClient
      .from('guests')
      .select('id, fullname, wishes, created_at', { count: 'exact' })
      .eq('wedding_id', weddingId)
      .not('wishes', 'is', null)
      .neq('wishes', '')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (dError) {
      console.error('[fetch-wishes] Guests query error:', JSON.stringify(dError))
      return errorResponse(`Failed to fetch wishes: ${dError.message}`, 500)
    }

    const total      = count ?? 0
    const totalPages = Math.ceil(total / limit)

    return successResponse({
      wishes: wishes ?? [],
      pagination: { page, limit, total, totalPages, hasMore: page < totalPages },
    }, 200, {
      'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
    })

  } catch (error: any) {
    console.error('[fetch-wishes] Unhandled error:', error.message)
    return errorResponse(error.message || 'Internal server error', 500)
  }
})
