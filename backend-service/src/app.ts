import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import signalRoutes from './routes/signal.routes';
import wellnessRoutes from './routes/wellness.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for cross-device desktop, mobile, and web local calls
app.use(cors());
app.use(express.json());

// Health Check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'HEALTHY', timestamp: new Date() });
});

// Register API Routes with versioning
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/signals', signalRoutes);
app.use('/api/v1/wellness', wellnessRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Boot listening socket
app.listen(PORT, () => {
    console.log(`Passive AI Wellness Ingestion API Server running on port ${PORT}`);
});

export default app;
