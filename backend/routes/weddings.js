import express from 'express';
import { createWedding, getWeddingQR, getWeddings, extendWeddingQR } from '../controllers/weddingController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getWeddings);
router.post('/', authenticate, createWedding);
router.post('/:id/extend', authenticate, extendWeddingQR);
router.get('/:id/qr', getWeddingQR); // Public route for guest form

export default router;
