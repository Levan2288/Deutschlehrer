// js/DatabaseService.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { 
    getAuth, 
    signInAnonymously 
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { FIREBASE_CONFIG, APP_SETTINGS } from './config.js';

/**
 * Сервис работы с Firebase.
 * Singleton-паттерн: одно соединение на всё приложение.
 */
export class DatabaseService {
    constructor() {
        this.app = null;
        this.auth = null;
        this.db = null;
        this.isConnected = false;
        this.uid = null;
        this._initPromise = null; // Защита от повторных вызовов init()
    }

    /**
     * Инициализация Firebase + анонимная авторизация.
     * Безопасен для многократного вызова (идемпотентный).
     */
    async init() {
        // Если уже подключены — выходим
        if (this.isConnected) return true;
        
        // Если init() уже запущен — ждём его завершения (защита от race condition)
        if (this._initPromise) return this._initPromise;

        this._initPromise = this._doInit();
        return this._initPromise;
    }

    async _doInit() {
        try {
            this.app = initializeApp(FIREBASE_CONFIG);
            this.auth = getAuth(this.app);
            this.db = getFirestore(this.app);

            const userCredential = await signInAnonymously(this.auth);
            this.uid = userCredential.user.uid;
            this.isConnected = true;
            console.log(`[DB] Авторизация успешна: ${this.uid}`);
            return true;
        } catch (error) {
            console.error("[DB] Ошибка инициализации:", error.code, error.message);
            this._initPromise = null; // Сброс — позволяем повторную попытку
            return false;
        }
    }

    /**
     * Сохранение лида в Firestore.
     * @param {Object} leadData — данные из формы бронирования
     * @returns {Promise<{success: boolean, id?: string, error?: string}>}
     */
    async saveLead(leadData) {
        try {
            // Гарантируем подключение
            if (!this.isConnected) {
                const connected = await this.init();
                if (!connected) {
                    return { success: false, error: "Не удалось подключиться к базе данных. Проверьте интернет." };
                }
            }

            const documentToSave = {
                // Данные клиента
                name: leadData.name || "Аноним",
                phone: leadData.phone || "Не указан",
                goal: leadData.goal || "",
                package: leadData.package || "single",
                date: leadData.date || null,
                time: leadData.time || null,
                readableDate: leadData.readableDate || "",
                
                // Метаданные для CRM
                status: 'new',
                createdAt: serverTimestamp(),
                platform: 'web_oop_v2',
                userAgent: navigator.userAgent,
                uid: this.uid
            };

            const leadsRef = collection(this.db, APP_SETTINGS.collectionName);
            const docRef = await addDoc(leadsRef, documentToSave);
            
            console.log("[DB] Лид создан, ID:", docRef.id);
            return { success: true, id: docRef.id };

        } catch (error) {
            console.error("[DB] Ошибка записи:", error);
            return { success: false, error: error.message || "Неизвестная ошибка сервера" };
        }
    }

    /** Расширение: запрос занятых слотов */
    async getBusySlots(dateStr) {
        console.log(`[DB] Запрос занятых слотов для ${dateStr}`);
        return [];
    }
}