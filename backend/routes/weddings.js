import express from 'express';
import { createWedding, getWeddingQR, getWeddings } from '../controllers/weddingController.js';

const router = express.Router();

router.get('/', getWeddings);
router.post('/', createWedding);
router.get('/:id/qr', getWeddingQR);

export default router;
