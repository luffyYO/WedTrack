import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1'

// Standardized Response Helper
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const successResponse = (data: any, status = 200, headers = {}) => {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', ...headers },
  });
};

export const createSuccessResponse = successResponse;

export const errorResponse = (message: string, status = 400) => {
  console.error(`[Error] ${message}`);
  return new Response(JSON.stringify({ success: false, message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
};

export const createErrorResponse = errorResponse;

// Auth Helper
export const getAuthUser = async (supabase: SupabaseClient) => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
};

// Logging Helper
export const logEvent = (name: string, data: any) => {
  console.log(`[Event: ${name}] ${JSON.stringify(data, null, 2)}`);
};
