// js/main.js — Точка входа приложения
import { DatabaseService } from './DatabaseService.js';
import { CalendarUI } from './CalendarUI.js';
import { PackageManager } from './PackageManager.js';
import { BookingManager } from './BookingManager.js';
import { Validator } from './Validator.js';

/**
 * Инициализация приложения.
 * Все компоненты создаются здесь и связываются через BookingManager.
 */
async function initApp() {
    try {
        // 1. БД
        const db = new DatabaseService();
        const dbReady = await db.init();
        
        if (!dbReady) {
            console.warn("[App] БД недоступна — форма работает, отправка может не пройти.");
        }

        // 2. UI-компоненты
        const calendar = new CalendarUI();
        const packageManager = new PackageManager();

        // 3. Оркестратор
        const booking = new BookingManager(db, calendar, packageManager);

        // 4. Инициализация
        calendar.init();
        packageManager.init();
        booking.init();

        // 5. Диагностика (dev)
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            await Validator.testConnection(db);
        }

        console.log("[App] ✅ Приложение инициализировано");

    } catch (error) {
        console.error("[App] Критическая ошибка:", error);
    }
}

document.addEventListener('DOMContentLoaded', initApp);