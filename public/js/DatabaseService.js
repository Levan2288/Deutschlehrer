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
    getDocs,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { FIREBASE_CONFIG, APP_SETTINGS } from './config.js';

/**
 * Сервис работы с Firebase.
 * Singleton-паттерн: одно соединение на всё приложение.
 * 
 * Архитектура рассчитана на расширение:
 * - saveLead()     → клиентская форма
 * - getLeads()     → будущая админка (список лидов)
 * - getBusySlots() → будущая админка (расписание)
 * - saveSchedule() → будущая админка (указание свободных дней/часов)
 */
export class DatabaseService {
    constructor() {
        this.app = null;
        this.auth = null;
        this.db = null;
        this.isConnected = false;
        this.uid = null;
        this._initPromise = null;
    }

    async init() {
        if (this.isConnected) return true;
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
            this._initPromise = null;
            return false;
        }
    }

    /**
     * Сохранение лида в Firestore.
     * Структура документа спроектирована для будущей CRM-админки.
     */
    async saveLead(leadData) {
        try {
            if (!this.isConnected) {
                const connected = await this.init();
                if (!connected) {
                    return { success: false, error: "Не удалось подключиться к базе данных." };
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
                
                // Метаданные для CRM / будущей админки
                status: 'new',          // new | valid | hold | trash | completed
                adminNotes: '',          // Заметки админа (будущее)
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                platform: 'web_v2',
                userAgent: navigator.userAgent,
                uid: this.uid,
                
                // Источник трафика (для ROI-анализа)
                referrer: document.referrer || 'direct',
                utmSource: this._getUtmParam('utm_source'),
                utmMedium: this._getUtmParam('utm_medium'),
                utmCampaign: this._getUtmParam('utm_campaign')
            };

            const leadsRef = collection(this.db, APP_SETTINGS.collectionName);
            const docRef = await addDoc(leadsRef, documentToSave);
            
            console.log("[DB] Лид создан, ID:", docRef.id);
            return { success: true, id: docRef.id };

        } catch (error) {
            console.error("[DB] Ошибка записи:", error);
            return { success: false, error: error.message || "Ошибка сервера" };
        }
    }

    /** Извлечение UTM-параметра из URL */
    _getUtmParam(param) {
        try {
            return new URLSearchParams(window.location.search).get(param) || '';
        } catch {
            return '';
        }
    }

    /**
     * БУДУЩЕЕ: Получение лидов для админки.
     * Фильтрация по статусу, сортировка по дате.
     */
    async getLeads(statusFilter = null) {
        try {
            if (!this.isConnected) await this.init();
            
            const leadsRef = collection(this.db, APP_SETTINGS.collectionName);
            let q;
            
            if (statusFilter) {
                q = query(leadsRef, where('status', '==', statusFilter), orderBy('createdAt', 'desc'));
            } else {
                q = query(leadsRef, orderBy('createdAt', 'desc'));
            }
            
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("[DB] Ошибка чтения лидов:", error);
            return [];
        }
    }

    /**
     * БУДУЩЕЕ: Получение занятых слотов на конкретную дату.
     * Позволит блокировать уже забронированное время в календаре.
     */
    async getBusySlots(dateStr) {
        try {
            if (!this.isConnected) await this.init();
            
            const leadsRef = collection(this.db, APP_SETTINGS.collectionName);
            const q = query(leadsRef, 
                where('date', '==', dateStr),
                where('status', 'in', ['new', 'valid'])
            );
            
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => doc.data().time).filter(Boolean);
        } catch (error) {
            console.error("[DB] Ошибка запроса слотов:", error);
            return [];
        }
    }

    // ═══════════════ АДМИН: Статус лида ═══════════════

    async updateLeadStatus(leadId, status) {
        try {
            if (!this.isConnected) await this.init();
            const leadRef = doc(this.db, APP_SETTINGS.collectionName, leadId);
            await updateDoc(leadRef, { status, updatedAt: serverTimestamp() });
            return { success: true };
        } catch (error) {
            console.error("[DB] Ошибка обновления статуса:", error);
            return { success: false, error: error.message };
        }
    }

    // ═══════════════ АДМИН: Расписание ═══════════════

    async getSchedule() {
        try {
            if (!this.isConnected) await this.init();
            const scheduleRef = collection(this.db, APP_SETTINGS.scheduleCollection);
            const snapshot = await getDocs(scheduleRef);
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (error) {
            console.error("[DB] Ошибка чтения расписания:", error);
            return [];
        }
    }

    async setScheduleForDate(dateStr, slots) {
        try {
            if (!this.isConnected) await this.init();
            const docRef = doc(this.db, APP_SETTINGS.scheduleCollection, dateStr);
            if (slots.length === 0) {
                await deleteDoc(docRef);
            } else {
                await setDoc(docRef, { slots, updatedAt: serverTimestamp() });
            }
            return { success: true };
        } catch (error) {
            console.error("[DB] Ошибка сохранения расписания:", error);
            return { success: false, error: error.message };
        }
    }

    // ═══════════════ АДМИН: Пакеты (цены) ═══════════════

    async getAdminPackages() {
        try {
            if (!this.isConnected) await this.init();
            const docRef = doc(this.db, APP_SETTINGS.settingsCollection, 'packages');
            const snap = await getDoc(docRef);
            return snap.exists() ? snap.data() : null;
        } catch (error) {
            console.error("[DB] Ошибка чтения пакетов:", error);
            return null;
        }
    }

    async saveAdminPackages(packages) {
        try {
            if (!this.isConnected) await this.init();
            const docRef = doc(this.db, APP_SETTINGS.settingsCollection, 'packages');
            await setDoc(docRef, { ...packages, updatedAt: serverTimestamp() });
            return { success: true };
        } catch (error) {
            console.error("[DB] Ошибка сохранения пакетов:", error);
            return { success: false, error: error.message };
        }
    }

    // ═══════════════ АДМИН: Услуги ═══════════════

    async getServices() {
        try {
            if (!this.isConnected) await this.init();
            const servicesRef = collection(this.db, APP_SETTINGS.servicesCollection);
            const snapshot = await getDocs(servicesRef);
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (error) {
            console.error("[DB] Ошибка чтения услуг:", error);
            return [];
        }
    }

    async addService(serviceData) {
        try {
            if (!this.isConnected) await this.init();
            const servicesRef = collection(this.db, APP_SETTINGS.servicesCollection);
            const docRef = await addDoc(servicesRef, {
                ...serviceData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error("[DB] Ошибка добавления услуги:", error);
            return { success: false, error: error.message };
        }
    }

    async updateService(serviceId, data) {
        try {
            if (!this.isConnected) await this.init();
            const docRef = doc(this.db, APP_SETTINGS.servicesCollection, serviceId);
            await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
            return { success: true };
        } catch (error) {
            console.error("[DB] Ошибка обновления услуги:", error);
            return { success: false, error: error.message };
        }
    }

    async deleteService(serviceId) {
        try {
            if (!this.isConnected) await this.init();
            const docRef = doc(this.db, APP_SETTINGS.servicesCollection, serviceId);
            await deleteDoc(docRef);
            return { success: true };
        } catch (error) {
            console.error("[DB] Ошибка удаления услуги:", error);
            return { success: false, error: error.message };
        }
    }
}