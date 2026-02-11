import { DatabaseService } from './DatabaseService.js';
import { CalendarUI } from './CalendarUI.js';
import { TestSuite } from './TestSuite.js';
import { APP_SETTINGS } from './config.js';

// Инициализация сервисов
const db = new DatabaseService();
let ui;

// Колбэки для UI
const onDateSelect = (date) => {
    const formatted = date.toLocaleDateString(APP_SETTINGS.locale, { day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('display-date').innerText = formatted;
    document.getElementById('booking-details').classList.remove('opacity-50', 'pointer-events-none');
};

const onTimeSelect = (time) => {
    const dateText = document.getElementById('display-date').innerText.split(' в ')[0];
    document.getElementById('display-date').innerHTML = `${dateText} <span class="text-brand">в ${time}</span>`;
};

// Запуск приложения
async function initApp() {
    await db.init();
    TestSuite.runIntegrationTest(db); // Запуск тестов при старте

    ui = new CalendarUI('calendar-container', onDateSelect, onTimeSelect);
    ui.render();

    // Привязка кнопок
    window.changeMonth = (val) => ui.changeMonth(val);
    window.selectTime = (t) => ui.handleTimeClick(t, event.target);
    
    // Обработка формы
    document.getElementById('booking-form').onsubmit = handleFormSubmit;
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('book-btn');
    const formData = new FormData(e.target);

    const leadData = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        date: ui.selectedDate ? ui.selectedDate.toISOString() : null,
        time: ui.selectedTime
    };

    // 1. Тестирование данных
    const validation = TestSuite.validateBooking(leadData);
    if (!validation.isValid) {
        alert("Ошибка валидации:\n" + validation.errors.join("\n"));
        return;
    }

    // 2. Визуализация загрузки
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> ЗАПИСЬ...';

    // 3. Отправка в БД
    const result = await db.saveLead(leadData);

    if (result.success) {
        document.getElementById('form-content').classList.add('hidden');
        document.getElementById('booking-success').classList.remove('hidden');
    } else {
        alert("Ошибка сервера. Попробуйте позже.");
        btn.disabled = false;
        btn.innerHTML = 'Попробовать снова';
    }
}

// Старт
document.addEventListener('DOMContentLoaded', initApp);