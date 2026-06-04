import * as admin from 'firebase-admin';

export class PushNotificationService {
    
    constructor() {
        if (admin.apps.length === 0) {
            // Under normal circumstances, initialize with credentials.
            // For hackathons, if service accounts are absent, initialize in sandbox mode.
            try {
                admin.initializeApp({
                    credential: admin.credential.applicationDefault()
                });
            } catch (err) {
                console.warn('Firebase applicationDefault credentials absent. Initializing in mock simulation mode.');
            }
        }
    }

    public async sendWellnessIntervention(userFcmToken: string, state: string, recommendation: string): Promise<boolean> {
        if (admin.apps.length === 0) {
            console.log(`[SIMULATION] FCM Dispatching payload to token ${userFcmToken.substring(0, 10)}...:`);
            console.log(`  Title: Wellness Alert [State: ${state}]`);
            console.log(`  Body: ${recommendation}`);
            return true;
        }

        const payload: admin.messaging.Message = {
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
        } catch (error) {
            console.error('FCM dispatch failed:', error);
            return false;
        }
    }
}
