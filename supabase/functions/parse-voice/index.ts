export const config = {
  auth: false,
};

import { corsHeaders, successResponse, errorResponse } from '../_shared/utils.ts';

// ----- Types ---------------------------------------------------------------
interface ParsedGuest {
  name: string;
  father_name: string;
  village: string;
  amount: number;
  message: string;
  phone: string;
}

// ─── System Prompt ──────────────────────────────────────────────────────────
// Handles Telugu, Hindi, English, and mixed-language inputs.
// All output is always English JSON — no prose.
const SYSTEM_PROMPT = `You are a multilingual data extraction assistant for an Indian wedding gift registry.

The user will give you a speech transcript in Telugu, Hindi, English, or a mix.

Extract EXACTLY these fields and return ONLY valid JSON. No extra text, no markdown, no explanation:

{
  "name": "<guest's full name>",
  "father_name": "<father's full name, only if mentioned>",
  "village": "<village or town name, only if mentioned>",
  "amount": <gift amount as integer, 0 if not mentioned>,
  "message": "<wedding wish/message in English, empty string if none>",
  "phone": "<10-digit Indian mobile number, no country code, no spaces>"
}

Rules:
- "name" is REQUIRED. If unclear, use whatever name-like text you find.
- "father_name": Look for "son of", "daughter of", "koduku of", "beta of", "S/O", "D/O" patterns in any language.
- "village": Look for "from", "nundi", "se", "ka/ki rehne wala" patterns.
- "amount": Convert word numbers to integers. "five hundred" → 500, "panch sau" → 500, "aidu vamdalu" → 500. Remove currency symbols.
- "message": Translate wishes to English if in another language. "shubhakankshalu" → "Best wishes". "shadi mubarak" → "Congratulations on your wedding".
- "phone": Extract digits only, normalize to 10 digits (drop leading +91 or 0).
- If a field is not mentioned, use "" for strings and 0 for amount.

Telugu hints: nenu = I am, peru = name, ammayyi = girl/bride, abbayi = boy/groom, nundi/nunchi = from, koduku = son, kuthuru = daughter
Hindi hints: main hoon = I am, naam = name, beta/putra = son, beti = daughter, se = from, gaon = village`;

// ─── Main Handler ───────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const body = await req.json();
    const { transcript } = body;

    // --- Input Validation ---
    if (!transcript || typeof transcript !== 'string') {
      return errorResponse('transcript is required', 400);
    }
    const clean = transcript.trim();
    if (clean.length < 3) {
      return errorResponse('transcript too short', 400);
    }
    if (clean.length > 2000) {
      return errorResponse('transcript too long (max 2000 chars)', 400);
    }

    // --- OpenAI Call ---
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      console.error('[parse-voice] OPENAI_API_KEY not set');
      return errorResponse('AI service not configured', 500);
    }

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.1,        // Low temperature → deterministic extraction
        max_tokens: 300,          // JSON is small, keep costs low
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: `Transcript: "${clean}"` },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errBody = await openaiRes.text();
      console.error('[parse-voice] OpenAI error:', openaiRes.status, errBody);
      return errorResponse(`AI parsing failed (${openaiRes.status})`, 502);
    }

    const openaiData = await openaiRes.json();
    const rawContent = openaiData.choices?.[0]?.message?.content ?? '{}';

    let parsed: Partial<ParsedGuest>;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      console.error('[parse-voice] JSON parse failed:', rawContent);
      return errorResponse('AI returned invalid response', 502);
    }

    // --- Sanitize & Map to DB schema names ---
    const result: ParsedGuest = {
      name:        String(parsed.name        ?? '').trim(),
      father_name: String(parsed.father_name ?? '').trim(),
      village:     String(parsed.village     ?? '').trim(),
      amount:      Math.abs(Number(parsed.amount) || 0),
      message:     String(parsed.message     ?? '').trim(),
      phone:       String(parsed.phone       ?? '').replace(/\D/g, '').slice(-10),
    };

    // Log for debugging (no PII beyond what's already in Supabase logs)
    console.log('[parse-voice] extracted:', JSON.stringify({
      hasName: !!result.name,
      hasPhone: !!result.phone,
      amount: result.amount,
    }));

    return successResponse(result);

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[parse-voice] SERVER ERROR:', msg);
    return errorResponse('Internal server error', 500);
  }
});
