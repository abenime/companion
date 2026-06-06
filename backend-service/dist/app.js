"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const signal_routes_1 = __importDefault(require("./routes/signal.routes"));
const wellness_routes_1 = __importDefault(require("./routes/wellness.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const database_1 = require("./config/database"); // adjust path if needed
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
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
        const db = database_1.DatabaseConnection.getInstance();
        const result = await db.query('SELECT NOW() as database_time');
        res.status(200).json({
            status: 'DATABASE_CONNECTED',
            databaseTime: result.rows[0].database_time
        });
    }
    catch (error) {
        console.error('Database Connection Failed:', error);
        res.status(500).json({
            status: 'DATABASE_FAILED',
            error: error instanceof Error
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
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/signals', signal_routes_1.default);
app.use('/api/v1/wellness', wellness_routes_1.default);
app.use('/api/v1/admin', admin_routes_1.default);
/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
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
    console.log(`Server running on port ${PORT}`);
});
exports.default = app;
