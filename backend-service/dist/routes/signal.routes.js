"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const signal_controller_1 = require("../controllers/signal.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post('/mobile', auth_middleware_1.authenticateJWT, signal_controller_1.SignalController.ingestMobile);
router.post('/desktop', auth_middleware_1.authenticateJWT, signal_controller_1.SignalController.ingestDesktop);
exports.default = router;
