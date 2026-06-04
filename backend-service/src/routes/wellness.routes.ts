import { Router } from 'express';
import { WellnessController } from '../controllers/wellness.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.get('/scores', authenticateJWT, WellnessController.getDailyFeatures);
router.post('/inference', authenticateJWT, WellnessController.runAIInference);
router.get('/predictions', authenticateJWT, WellnessController.getPredictionsTimeline);

export default router;
