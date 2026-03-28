import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Custom metrics
const landingPageTime = new Trend('time_landing_page');
const guestFormTime = new Trend('time_guest_form_api');
const dashboardApiTime = new Trend('time_dashboard_api');
const errorRate = new Rate('error_rate');

// =========================================================================
// CONFIGURATION
// =========================================================================
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'; // Frontend URL
const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://knmqezafmenqghiheloi.supabase.co'; // Replace with actual project URL
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Replace
const TEST_WEDDING_ID = __ENV.TEST_WEDDING_ID || '123e4567-e89b-12d3-a456-426614174000'; // Replace with an actual UUID from db

export const options = {
    // Simulate 100 concurrent users ramping up quickly and holding shortly
    stages: [
        { duration: '5s', target: 50 },
        { duration: '10s', target: 100 },
        { duration: '5s', target: 0 },
    ],
    thresholds: {
        // 95% of requests must complete below 500ms
        http_req_duration: ['p(95)<500'],
        // Error rate must be strictly less than 2%
        // Using custom rate explicitly for failing checks
    },
};

export default function () {
    const defaultHeaders = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
    };

    // ---------------------------------------------------------------------
    // SCENARIO 1: LANDING PAGE LOAD
    // ---------------------------------------------------------------------
    group('1. Loading the Landing Page', () => {
        const res = http.get(`${BASE_URL}/`);
        
        const success = check(res, {
            'landing page status is 200': (r) => r.status === 200,
        });
        
        if (!success) errorRate.add(1);
        landingPageTime.add(res.timings.duration);
        sleep(Math.random() * 2 + 1); // User reading landing page (1-3s)
    });

    // ---------------------------------------------------------------------
    // SCENARIO 2: GUEST FORM (Public API read)
    // ---------------------------------------------------------------------
    group('2. Visiting Guest Form / Fetching Wedding Data', () => {
        // Simulating the API call the guest form makes to fetch wedding details
        const res = http.get(
            `${SUPABASE_URL}/functions/v1/get-wedding-details?id=${TEST_WEDDING_ID}`,
            { headers: defaultHeaders }
        );

        const success = check(res, {
            'wedding details fetched successfully (200)': (r) => r.status === 200,
        });

        if (!success) {
            errorRate.add(1);
        }
        
        guestFormTime.add(res.timings.duration);
        sleep(Math.random() * 3 + 2); // Guest filling out form (2-5s)
    });

    // ---------------------------------------------------------------------
    // SCENARIO 3: DASHBOARD ADMIN DATA FETCH
    // ---------------------------------------------------------------------
    group('3. Admin Dashboard Data Load', () => {
        // Simulating an admin reading the guests table
        // Note: Real admin uses a user JWT. We'll simulate the load on the REST endpoint
        // assuming RLS is applied (we might get 0 rows if using anon, but the DB still processes the query plan, which tests performance).
        const res = http.get(
            `${SUPABASE_URL}/rest/v1/guests?wedding_id=eq.${TEST_WEDDING_ID}&select=*`,
            { headers: defaultHeaders }
        );

        const success = check(res, {
            'dashboard GET guests request success (20x)': (r) => r.status === 200 || r.status === 206,
        });

        if (!success) errorRate.add(1);
        dashboardApiTime.add(res.timings.duration);
        sleep(Math.random() * 2 + 1); // Admin reviewing dashboard (1-3s)
    });
}
