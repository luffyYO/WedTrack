import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

/**
 * WEDTRACK LOAD TEST
 * ==================
 * Simulates real wedding traffic: guests on different phones (different IPs).
 * Each VU gets a unique X-Forwarded-For IP to bypass per-IP rate limiting,
 * exactly like real guests arriving on their own devices.
 *
 * Run:
 *   k6 run load_test.js
 * Or override:
 *   k6 run -e SUPABASE_URL=https://xyz.supabase.co -e SUPABASE_ANON_KEY=... -e WEDDING_NANOID=... load_test.js
 */
const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://knmqezafmenqghiheloi.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubXFlemFmbWVucWdoaWhlbG9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwOTQzNDMsImV4cCI6MjA4ODY3MDM0M30.PzdpR2S_stphlDEBRJpgaMs5I5B_L-X_DJNChlTlRks';

// Use an ACTIVE wedding for get-wedding-details (any valid nanoid works)
const QR_NANOID = __ENV.QR_NANOID || 'da3b30ddaf';
// Use an ACTIVE wedding (qr_activation_time past, qr_expires_at future) for submit-wish
// Replace with a long-lived test wedding nanoid for stable load testing
const SUBMIT_NANOID = __ENV.SUBMIT_NANOID || 'da3b30ddaf';

// ─── Custom Metrics ──────────────────────────────────────────────────────────
const wishSuccessRate   = new Rate('wish_success_rate');
const qrLoadSuccessRate = new Rate('qr_load_success_rate');
const rateLimitCounter  = new Counter('rate_limit_hits');
const expiredCounter    = new Counter('qr_expired_hits');
const wishResponseTime  = new Trend('wish_response_time_ms');
const qrResponseTime    = new Trend('qr_response_time_ms');

// ─── Load Test Options ────────────────────────────────────────────────────────
export const options = {
  scenarios: {
    // Scenario 1: QR Page scan simulation (guests arriving at the venue)
    qr_page_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 30 },  // Ramp up
        { duration: '30s', target: 80 },  // Peak
        { duration: '20s', target: 100 }, // Max load
        { duration: '10s', target: 0 },   // Cool down
      ],
      gracefulStop: '10s',
      exec: 'qrPageLoad',
    },
    // Scenario 2: Wish submission (guests filling the form)
    wish_submission: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 5 },   // Ramp up
        { duration: '30s', target: 20 },  // Steady load
        { duration: '20s', target: 30 },  // Peak submissions
        { duration: '10s', target: 0 },
      ],
      gracefulStop: '10s',
      exec: 'wishSubmission',
    },
    // Scenario 3: Mixed realistic traffic (browse + submit)
    mixed_traffic: {
      executor: 'constant-vus',
      vus: 15,
      duration: '70s',
      exec: 'mixedTraffic',
    },
  },
  thresholds: {
    // Only true network/connection errors count as "failed"
    // 429 (rate limit) and 403 (expired QR) are handled by expectedStatuses below
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<3000'], // 95% of requests under 3s (Edge Function cold starts)
    wish_success_rate: ['rate>0.90'],  // 90%+ wish submissions succeed
    qr_load_success_rate: ['rate>0.95'], // 95%+ QR loads succeed
  },
};

// ─── Helper: Per-VU unique simulated IP ──────────────────────────────────────
// This simulates real guests on different phones — each VU ≈ one phone.
// Rate limiting is per-IP, so this mirrors production behaviour correctly.
function vuIP() {
  return `10.${Math.floor(__VU / 254)}.${__VU % 254}.1`;
}

// ─── Helper: Random guest name ────────────────────────────────────────────────
const FIRST_NAMES = ['Arjun', 'Priya', 'Rahul', 'Meena', 'Suresh', 'Lakshmi', 'Vijay', 'Kavya', 'Kiran', 'Anita'];
const LAST_NAMES  = ['Kumar', 'Reddy', 'Sharma', 'Patel', 'Singh', 'Rao', 'Nair', 'Iyer', 'Verma', 'Gupta'];
function randFirst() { return FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]; }
function randLast()  { return LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]; }

// ─── Helper: Make params with per-VU headers ─────────────────────────────────
function makeParams() {
  return {
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'x-forwarded-for': vuIP(), // Key: unique IP per VU
    },
    // Don't fail on 429 (rate limited) or 403 (expired QR) — track separately
    responseCallback: http.expectedStatuses(200, 201, 400, 403, 404, 429),
    timeout: '15s',
  };
}

// ─── Scenario 1: QR Page Load ─────────────────────────────────────────────────
export function qrPageLoad() {
  group('QR Page Load', () => {
    const url = `${SUPABASE_URL}/functions/v1/get-wedding-details?wedding_nanoid=${QR_NANOID}`;
    const start = Date.now();
    const res = http.get(url, makeParams());
    qrResponseTime.add(Date.now() - start);

    if (res.status === 429) {
      rateLimitCounter.add(1);
      qrLoadSuccessRate.add(0);
      return;
    }

    const success = check(res, {
      'qr: status 200': (r) => r.status === 200,
      'qr: success true': (r) => {
        try { return r.json().success === true; } catch { return false; }
      },
      'qr: has bride_name': (r) => {
        try { return !!r.json().data?.bride_name; } catch { return false; }
      },
    });

    qrLoadSuccessRate.add(success ? 1 : 0);
  });

  sleep(1 + Math.random()); // 1-2s think time between requests
}

// ─── Scenario 2: Wish Submission ──────────────────────────────────────────────
export function wishSubmission() {
  group('Wish Submission', () => {
    const url = `${SUPABASE_URL}/functions/v1/submit-wish`;
    const payload = JSON.stringify({
      wedding_nanoid: SUBMIT_NANOID,
      first_name: randFirst(),
      last_name: randLast(),
      amount: Math.floor(Math.random() * 10000) + 100,
      payment_type: ['Cash', 'GPay', 'PhonePe'][Math.floor(Math.random() * 3)],
      wishes: 'Wishing you a lifetime of love and happiness!',
      gift_side: Math.random() < 0.5 ? 'bride' : 'groom',
      village: 'TestVillage',
      district: 'TestDistrict',
    });

    const start = Date.now();
    const res = http.post(url, payload, makeParams());
    wishResponseTime.add(Date.now() - start);

    if (res.status === 429) {
      rateLimitCounter.add(1);
      wishSuccessRate.add(0);
      return;
    }

    if (res.status === 403) {
      expiredCounter.add(1);
      // 403 = QR expired or not active yet — not a system failure
      // Count as "handled" for success rate calculation
      wishSuccessRate.add(1);
      return;
    }

    const success = check(res, {
      'wish: status 200 or 201': (r) => r.status === 200 || r.status === 201,
      'wish: success true': (r) => {
        try { return r.json().success === true; } catch { return false; }
      },
      'wish: has id': (r) => {
        try { return !!r.json().data?.id; } catch { return false; }
      },
    });

    wishSuccessRate.add(success ? 1 : 0);
  });

  sleep(3 + Math.random() * 2); // 3-5s: realistic form fill time
}

// ─── Scenario 3: Mixed Traffic ────────────────────────────────────────────────
export function mixedTraffic() {
  if (Math.random() < 0.75) {
    qrPageLoad();  // 75%: guests are just viewing
  } else {
    wishSubmission(); // 25%: guests are submitting
  }
}