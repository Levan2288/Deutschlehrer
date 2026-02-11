import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { FIREBASE_CONFIG, APP_SETTINGS } from './config.js';

export class DatabaseService {
    constructor() {
        this.app = initializeApp(FIREBASE_CONFIG);
        this.auth = getAuth(this.app);
        this.db = getFirestore(this.app);
        this.isConnected = false;
    }

    async init() {
        try {
            const userCredential = await signInAnonymously(this.auth);
            this.isConnected = true;
            console.log(`[DB] Connected as ${userCredential.user.uid}`);
            return true;
        } catch (error) {
            console.error("[DB] Auth Error:", error);
            return false;
        }
    }

    async saveLead(leadData) {
        if (!this.isConnected) await this.init();

        try {
            const docRef = await addDoc(collection(this.db, APP_SETTINGS.collectionName), {
                ...leadData,
                createdAt: serverTimestamp(),
                platform: 'web_oop_v1'
            });
            console.log("[DB] Lead saved with ID: ", docRef.id);
            return { success: true, id: docRef.id };
        } catch (e) {
            console.error("[DB] Error adding document: ", e);
            return { success: false, error: e };
        }
    }
}