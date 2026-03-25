import express from 'express';
import { 
    adminLogin, 
    verify2FA,
    getDashboardStats, 
    getUsersList, 
    getWeddingsList, 
    getQrAnalytics, 
    getActivityLogs, 
    updateSettings,
    deleteUser,
    deleteWedding,
    generate2FASecret,
    enable2FA,
    disable2FA,
    getAdminProfile
} from '../controllers/adminController.js';
import { verifyAdmin } from '../middleware/adminAuth.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Strict rate limiting for admin login to prevent brute force
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login requests per windowMs
    message: { error: 'Too many login attempts, please try again after 15 minutes' }
});

// Public admin routes
router.post('/login', loginLimiter, adminLogin);
router.post('/verify-2fa', loginLimiter, verify2FA);

// Protected admin routes
router.use(verifyAdmin);

router.get('/profile', getAdminProfile);
router.get('/stats', getDashboardStats);
router.get('/users', getUsersList);
router.get('/weddings', getWeddingsList);
router.get('/qrs', getQrAnalytics);
router.get('/analytics', getQrAnalytics); // Fallback if requested
router.get('/logs', getActivityLogs);
router.put('/settings', updateSettings);
router.delete('/users/:id', deleteUser);
router.delete('/weddings/:id', deleteWedding);

// Protected 2FA Management Routes
router.post('/2fa/generate', generate2FASecret);
router.post('/2fa/enable', enable2FA);
router.post('/2fa/disable', disable2FA);

export default router;
