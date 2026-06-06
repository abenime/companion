import { Router } from 'express';
import { WellnessController } from '../controllers/wellness.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.get('/scores', authenticateJWT, WellnessController.getDailyFeatures);
router.post('/inference', authenticateJWT, WellnessController.runAIInference);
router.get('/predictions', authenticateJWT, WellnessController.getPredictionsTimeline);
router.delete('/logs/today', authenticateJWT, WellnessController.deleteTodayLogs);
router.delete('/logs/all', authenticateJWT, WellnessController.purgeAllLogs);

// Subscription and Payment Endpoints
router.get('/subscription', authenticateJWT, WellnessController.getSubscription);
router.post('/subscription/chapa/initialize', authenticateJWT, WellnessController.initializeChapaPayment);
router.get('/subscription/chapa/verify/:tx_ref', WellnessController.verifyChapaPayment);

export default router;
