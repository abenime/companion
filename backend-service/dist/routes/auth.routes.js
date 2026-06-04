"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post('/register', auth_controller_1.AuthController.register);
router.post('/login', auth_controller_1.AuthController.login);
// Connection Settings managing OAuth calendars & fitness sync
router.get('/connections', auth_middleware_1.authenticateJWT, auth_controller_1.AuthController.getConnections);
router.patch('/connections', auth_middleware_1.authenticateJWT, auth_controller_1.AuthController.updateConnections);
exports.default = router;
