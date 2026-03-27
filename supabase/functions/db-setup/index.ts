
import postgres from 'https://deno.land/x/postgresjs@v3.3.3/mod.js'
import { corsHeaders, successResponse, errorResponse } from '../_shared/utils.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const sql = postgres(Deno.env.get('DATABASE_URL')!)

  try {
    const query = await req.json()
    const result = await sql.unsafe(query.sql)
    return successResponse(result)
  } catch (error) {
    return errorResponse(error.message)
  }
})
