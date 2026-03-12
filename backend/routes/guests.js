import express from 'express';
import { submitGuestForm, getGuestsByWedding, confirmGuestPayment, deleteGuest } from '../controllers/guestController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/submit', submitGuestForm);
router.get('/wedding/:weddingId', authenticate, getGuestsByWedding);
router.put('/:id/confirm', authenticate, confirmGuestPayment);
router.delete('/:id', authenticate, deleteGuest);

export default router;
