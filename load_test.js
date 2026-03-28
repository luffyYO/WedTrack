import http from 'k6/http';
import { check, sleep } from 'k6';

// k6 Configuration Options
export const options = {
    // 1. Simulating 100 Concurrent Virtual Users (VUs)
    vus: 100,
    
    // 2. Test Duration
    duration: '100s', 

    // Alternatively, you can use stages for a more realistic ramp-up:
    /*
    stages: [
        { duration: '10s', target: 50 },  // Ramp up to 50 users over 10 seconds
        { duration: '30s', target: 100 }, // Stay at 100 users for 30 seconds
        { duration: '10s', target: 0 },   // Ramp down to 0 users
    ],
    */

    // 3. Success Criteria (Thresholds)
    thresholds: {
        // 95% of requests should load in under 500ms
        http_req_duration: ['p(95)<500'],
        // Less than 1% of requests should fail
        http_req_failed: ['rate<0.01'],
    },
};

const BASE_URL = 'http://localhost:3000';

// Replace this with a valid wedding ID from your database to test the guest form route accurately
const TEST_WEDDING_ID = 'test-wedding-123'; 

// The main test scenario that each Virtual User will execute
export default function () {
    // --- 1. Hit the Landing Page ---
    const resHome = http.get(`${BASE_URL}/`);
    check(resHome, {
        'Landing page loaded successfully (200)': (r) => r.status === 200,
    });
    
    // Simulate user reading the page for 1-2 seconds
    sleep(Math.random() * 2 + 1); 

    // --- 2. Hit the Guest Form Page ---
    const resGuestForm = http.get(`${BASE_URL}/w/${TEST_WEDDING_ID}`);
    check(resGuestForm, {
        'Guest form loaded successfully (200)': (r) => r.status === 200,
    });
    
    // Simulate user filling out the form for 2-4 seconds
    sleep(Math.random() * 3 + 2);

    // --- 3. Hit the Dashboard Page ---
    // Note: Since WedTrack is a React Single Page Application (SPA), hitting this URL
    // via k6 HTTP just downloads the HTML/JS. To test the actual data fetching, 
    // you would normally hit your Supabase APIs directly here.
    const resDashboard = http.get(`${BASE_URL}/dashboard`);
    check(resDashboard, {
        'Dashboard loaded successfully (200)': (r) => r.status === 200,
    });
    
    // Simulate user viewing dashboard
    sleep(1);
}
