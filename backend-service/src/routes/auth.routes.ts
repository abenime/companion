import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Connection Settings managing OAuth calendars & fitness sync
router.get('/connections', authenticateJWT, AuthController.getConnections);
router.patch('/connections', authenticateJWT, AuthController.updateConnections);

export default router;
