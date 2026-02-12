// js/main.js — Точка входа приложения
import { DatabaseService } from './DatabaseService.js';
import { CalendarUI } from './CalendarUI.js';
import { PackageManager } from './PackageManager.js';
import { BookingManager } from './BookingManager.js';
import { Validator } from './Validator.js';
import { LanguageSwitcher } from './LanguageSwitcher.js';

/**
 * Инициализация приложения.
 * Все компоненты создаются здесь и связываются через BookingManager.
 */
async function initApp() {
    try {
        // 1. i18n (инициализируется первым — влияет на все компоненты)
        const langSwitcher = new LanguageSwitcher();

        // 2. БД
        const db = new DatabaseService();
        const dbReady = await db.init();
        
        if (!dbReady) {
            console.warn("[App] БД недоступна — форма работает, отправка может не пройти.");
        }

        // 3. UI-компоненты
        const calendar = new CalendarUI({ locale: langSwitcher.getLocale() });
        const packageManager = new PackageManager();
        packageManager.lang = langSwitcher;

        // 4. Оркестратор
        const booking = new BookingManager(db, calendar, packageManager, langSwitcher);

        // 5. Инициализация
        langSwitcher.init();
        calendar.init();
        packageManager.init();
        booking.init();

        // 6. Реакция на смену языка
        langSwitcher.onLangChange = (lang) => {
            calendar.setLocale(langSwitcher.getLocale());
            // Обновить бейдж пакета если выбран
            if (packageManager.selectedPackage) {
                const badgeEl = document.getElementById('selected-package-badge');
                if (badgeEl) {
                    badgeEl.innerText = langSwitcher.t(`badge.${packageManager.selectedPackage}`);
                }
            }
            // Обновить отображение даты если выбрана
            if (calendar.selectedDate) {
                const displayDate = document.getElementById('display-date');
                if (displayDate) {
                    const formatted = calendar.selectedDate.toLocaleDateString(langSwitcher.getLocale(), {
                        day: 'numeric', month: 'long', year: 'numeric'
                    });
                    if (calendar.selectedTime) {
                        const atWord = langSwitcher.t('booking.time_at');
                        const separator = atWord ? ` ${atWord} ` : ' ';
                        displayDate.innerHTML = `${formatted} <span class="text-brand font-black">${separator}${calendar.selectedTime}</span>`;
                    } else {
                        displayDate.innerText = formatted;
                    }
                    document.getElementById('date-input').value = formatted;
                }
            }
        };

        // 7. Диагностика (dev)
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            await Validator.testConnection(db);
        }

        console.log("[App] ✅ Приложение инициализировано");

    } catch (error) {
        console.error("[App] Критическая ошибка:", error);
    }
}

document.addEventListener('DOMContentLoaded', initApp);