import express from 'express';
import { submitGuestForm, getGuestsByWedding, confirmGuestPayment, deleteGuest } from '../controllers/guestController.js';

const router = express.Router();

router.post('/', submitGuestForm);
router.get('/wedding/:weddingId', getGuestsByWedding);
router.put('/:id/confirm', confirmGuestPayment);
router.delete('/:id', deleteGuest);

export default router;
