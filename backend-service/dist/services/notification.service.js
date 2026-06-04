"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushNotificationService = void 0;
const admin = __importStar(require("firebase-admin"));
class PushNotificationService {
    constructor() {
        if (admin.apps.length === 0) {
            // Under normal circumstances, initialize with credentials.
            // For hackathons, if service accounts are absent, initialize in sandbox mode.
            try {
                admin.initializeApp({
                    credential: admin.credential.applicationDefault()
                });
            }
            catch (err) {
                console.warn('Firebase applicationDefault credentials absent. Initializing in mock simulation mode.');
            }
        }
    }
    async sendWellnessIntervention(userFcmToken, state, recommendation) {
        if (admin.apps.length === 0) {
            console.log(`[SIMULATION] FCM Dispatching payload to token ${userFcmToken.substring(0, 10)}...:`);
            console.log(`  Title: Wellness Alert [State: ${state}]`);
            console.log(`  Body: ${recommendation}`);
            return true;
        }
        const payload = {
            token: userFcmToken,
            notification: {
                title: 'Wellness Alert 🧠',
                body: recommendation
            },
            data: {
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
                wellnessState: state,
                triggeredAt: Date.now().toString()
            },
            android: {
                priority: 'high',
                notification: {
                    channelId: 'TelemetryServiceChannel',
                    sound: 'default'
                }
            }
        };
        try {
            const response = await admin.messaging().send(payload);
            console.log(`Successfully dispatched FCM intervention: ${response}`);
            return true;
        }
        catch (error) {
            console.error('FCM dispatch failed:', error);
            return false;
        }
    }
}
exports.PushNotificationService = PushNotificationService;
