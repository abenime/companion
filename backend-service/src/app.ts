import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import signalRoutes from './routes/signal.routes';
import wellnessRoutes from './routes/wellness.routes';
import adminRoutes from './routes/admin.routes';

import { DatabaseConnection } from './config/database'; // adjust path if needed

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/*
|--------------------------------------------------------------------------
| Basic Health Check
|--------------------------------------------------------------------------
*/

app.get('/health', (_, res) => {

    res.status(200).json({
        status: 'HEALTHY',
        timestamp: new Date().toISOString()
    });

});

/*
|--------------------------------------------------------------------------
| PostgreSQL Connection Test
|--------------------------------------------------------------------------
*/

app.get('/db-health', async (_, res) => {

    try {

        const db = DatabaseConnection.getInstance();
        const result = await db.query(
            'SELECT NOW() as database_time'
        );

        res.status(200).json({

            status: 'DATABASE_CONNECTED',

            databaseTime:
                result.rows[0].database_time

        });

    } catch (error) {

        console.error(
            'Database Connection Failed:',
            error
        );

        res.status(500).json({

            status: 'DATABASE_FAILED',

            error:
                error instanceof Error
                    ? error.message
                    : 'Unknown Error'

        });

    }

});

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/signals', signalRoutes);
app.use('/api/v1/wellness', wellnessRoutes);
app.use('/api/v1/admin', adminRoutes);

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

app.use((
    err:any,
    req:express.Request,
    res:express.Response,
    next:express.NextFunction
) => {

    console.error(
        'Unhandled Server Error:',
        err
    );

    res.status(500).json({
        error: 'Internal Server Error'
    });

});

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

app.listen(PORT, () => {

    console.log(
        `Server running on port ${PORT}`
    );

});

export default app;