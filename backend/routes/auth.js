import express from 'express';
import { login, signup, getProfile } from '../controllers/authController.js';

const router = express.Router();

router.post('/auth/login', login);
router.post('/auth/signup', signup);
router.get('/user/profile', getProfile); // Endpoint mapped for GET /api/user/profile if mounted on /api or /api/auth depending on preference

export default router;
