import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1'

// Standardized CORS Helper
export const getCorsHeaders = (req?: Request) => {
  const origin = req?.headers.get('origin') || '';
  const allowedOrigins = [
    'https://wedtrackss.in',
    'https://www.wedtrackss.in',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173',
  ];
  const allowOrigin = allowedOrigins.includes(origin) ? origin : (origin || '*');

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with, accept',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
};

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with, accept',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

export const successResponse = (data: any, status = 200, headers: HeadersInit = {}, req?: Request) => {
  const cors = req ? getCorsHeaders(req) : corsHeaders;
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json', ...headers },
  });
};

export const createSuccessResponse = successResponse;

export const errorResponse = (message: string, status = 400, headers: HeadersInit = {}, req?: Request) => {
  console.error(`[Error] ${message}`);
  const cors = req ? getCorsHeaders(req) : corsHeaders;
  return new Response(JSON.stringify({ success: false, message }), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json', ...headers },
  });
};

export const createErrorResponse = errorResponse;

// Auth Helper — always pass the token explicitly for reliability
export const getAuthUser = async (supabase: SupabaseClient, token?: string) => {
  const { data: { user }, error } = token
    ? await supabase.auth.getUser(token)
    : await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
};

// Logging Helper
export const logEvent = (name: string, data: any) => {
  console.log(`[Event: ${name}] ${JSON.stringify(data, null, 2)}`);
};

// ─── Plan Identifier Helpers ──────────────────────────────────────────────────
// Canonical set of plan identifiers that grant premium/pro features.
// 'premium' and '349' are legacy identifiers from a prior pricing system.
// All new weddings use 'pro'. All three must remain supported so that
// older weddings (created before the plan rename) work correctly.
export const PREMIUM_PLANS = ['pro', 'premium', '349'] as const;

/**
 * Returns true if the given plan identifier grants premium features
 * (WhatsApp notifications, phone number capture, push notifications).
 * Works for both current ('pro') and legacy ('premium', '349') plan strings.
 */
export const isPremiumPlan = (plan: string | null | undefined): boolean =>
  PREMIUM_PLANS.includes(plan as typeof PREMIUM_PLANS[number]);
