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
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Enable CORS for cross-device desktop, mobile, and web local calls
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Health Check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'HEALTHY', timestamp: new Date() });
});
// Register API Routes with versioning
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/signals', signal_routes_1.default);
app.use('/api/v1/wellness', wellness_routes_1.default);
// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});
// Boot listening socket
app.listen(PORT, () => {
    console.log(`Passive AI Wellness Ingestion API Server running on port ${PORT}`);
});
exports.default = app;
