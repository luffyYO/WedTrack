
import { corsHeaders, successResponse, errorResponse } from "../_shared/utils.ts";
import { checkRateLimit, getRedisClient } from "../_shared/redis.ts";

/**
 * redis-validation
 * Performs connection test (SET/GET), rate-limit simulation, and expiry checks.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const task = url.searchParams.get("task") || "connect";
    const redis = getRedisClient();

    // 1. Connection Test (SET/GET)
    if (task === "connect") {
      const testKey = "test_connection_active";
      await redis.set(testKey, "working");
      const val = await redis.get(testKey);

      if (val === "working") {
        return successResponse({ connected: true, value: val }, "Redis connection test passed.");
      }
      return errorResponse("Redis connection test failed: value mismatch.");
    }

    // 2. Rate Limiting Validation (Simulation)
    if (task === "hit") {
      const simulatedIp = url.searchParams.get("ip") || "test-user-1";
      const limit = 10;
      const window = 60;
      
      const res = await checkRateLimit(`validation_hit:${simulatedIp}`, limit, window);
      
      if (!res.success) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Too many requests",
          count: res.current,
          limit: res.limit
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      return successResponse({ 
        current: res.current, 
        limit: res.limit,
        remaining: limit - (res.current ?? 0)
      }, `Request allowed. Count: ${res.current}/${limit}`);
    }

    // 3. Expiry Check (10s TTL)
    if (task === "expiry") {
      const expiryKey = `test_expiry_${Date.now()}`;
      await redis.set(expiryKey, "temporary", { ex: 10 });
      const before = await redis.get(expiryKey);
      
      return successResponse({ 
        key: expiryKey, 
        value_before: before,
        instructions: "Verify after 10 seconds: value should be null."
      }, "Expiry key set for 10 seconds.");
    }

    return errorResponse("Unknown task requested.", 400);

  } catch (error: any) {
    console.error("[Redis Validation Error]", error.message);
    return errorResponse(error.message, 500);
  }
});
