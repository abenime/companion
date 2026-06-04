import { Router } from 'express';
import { SignalController } from '../controllers/signal.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.post('/mobile', authenticateJWT, SignalController.ingestMobile);
router.post('/desktop', authenticateJWT, SignalController.ingestDesktop);

export default router;
