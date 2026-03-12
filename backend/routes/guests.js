import express from 'express';
import rateLimit from 'express-rate-limit';
import { submitGuestForm, getGuestsByWedding, confirmGuestPayment, deleteGuest } from '../controllers/guestController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const guestSubmissionLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10,
  message: { error: 'Submission limit reached. This QR form allows only 10 submissions per IP.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/submit', guestSubmissionLimiter, submitGuestForm);
router.get('/wedding/:weddingId', authenticate, getGuestsByWedding);
router.put('/:id/confirm', authenticate, confirmGuestPayment);
router.delete('/:id', authenticate, deleteGuest);

export default router;
