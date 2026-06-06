import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// Apply authenticateJWT middleware globally for admin routes
router.use(authenticateJWT);

router.get('/users', AdminController.getUsers);
router.delete('/users/:id/purge', AdminController.purgeUser);
router.get('/settings', AdminController.getSettings);
router.put('/settings', AdminController.updateSettings);
router.post('/pricing/plans', AdminController.createPricingPlan);
router.put('/pricing/plans/:id', AdminController.updatePricingPlan);
router.get('/pricing/plans', AdminController.getPlans);
router.patch('/subscriptions/:id', AdminController.updateUserSubscription);

export default router;
