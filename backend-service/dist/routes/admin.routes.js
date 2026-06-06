"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Apply authenticateJWT middleware globally for admin routes
router.use(auth_middleware_1.authenticateJWT);
router.get('/users', admin_controller_1.AdminController.getUsers);
router.delete('/users/:id/purge', admin_controller_1.AdminController.purgeUser);
router.get('/settings', admin_controller_1.AdminController.getSettings);
router.put('/settings', admin_controller_1.AdminController.updateSettings);
router.post('/pricing/plans', admin_controller_1.AdminController.createPricingPlan);
router.put('/pricing/plans/:id', admin_controller_1.AdminController.updatePricingPlan);
router.delete('/pricing/plans/:id', admin_controller_1.AdminController.deletePricingPlan);
router.get('/pricing/plans', admin_controller_1.AdminController.getPlans);
router.patch('/subscriptions/:id', admin_controller_1.AdminController.updateUserSubscription);
exports.default = router;
