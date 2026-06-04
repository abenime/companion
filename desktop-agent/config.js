require('dotenv').config();

module.exports = {
    // URL pointing to our Express API Server
    SERVER_URL: process.env.WELLNESS_SERVER_URL || 'http://localhost:3000',
    
    // User JWT access token for security authentication
    AUTH_TOKEN: process.env.WELLNESS_AUTH_TOKEN || 'test_token',
    
    // Active window polling rate (milliseconds)
    WINDOW_POLL_INTERVAL_MS: 5000,
    
    // Idle check rate (milliseconds)
    IDLE_CHECK_INTERVAL_MS: 10000,
    
    // Idle trigger threshold (milliseconds - defaults to 5 minutes)
    IDLE_THRESHOLD_MS: 300000,
    
    // How often to flush and batch sync metrics to backend (milliseconds - defaults to 1 minute)
    SYNC_INTERVAL_MS: 60000
};
