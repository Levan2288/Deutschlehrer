// js/BookingManager.js
import { APP_SETTINGS } from './config.js';
import { Validator } from './Validator.js';

/**
 * Центральный оркестратор бронирования.
 * Связывает UI-компоненты с DatabaseService.
 * Единственное место, где происходит submit формы.
 */
export class BookingManager {
    /**
     * @param {DatabaseService} db
     * @param {CalendarUI} calendar
     * @param {PackageManager} packageManager
     */
    constructor(db, calendar, packageManager) {
        this.db = db;
        this.calendar = calendar;
        this.packageManager = packageManager;

        // DOM-элементы формы
        this.form = document.getElementById('booking-form');
        this.btn = document.getElementById('book-btn');
        this.formContent = document.getElementById('form-content');
        this.successBlock = document.getElementById('booking-success');
        this.displayDate = document.getElementById('display-date');
        this.bookingDetails = document.getElementById('booking-details');
    }

    /** Инициализация: привязка submit + настройка колбэков календаря */
    init() {
        // Привязываем submit через addEventListener (убираем onsubmit из HTML)
        if (this.form) {
            this.form.removeAttribute('onsubmit');
            this.form.addEventListener('submit', (e) => this._handleSubmit(e));
        }

        // Настраиваем колбэки календаря
        this.calendar.onDateSelect = (date) => this._onDateSelected(date);
        this.calendar.onTimeSelect = (time) => this._onTimeSelected(time);
    }

    /** Колбэк: дата выбрана */
    _onDateSelected(date) {
        const formatted = date.toLocaleDateString(APP_SETTINGS.locale, {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        
        if (this.displayDate) {
            this.displayDate.innerText = formatted;
        }

        // Активируем правую панель с формой
        if (this.bookingDetails) {
            this.bookingDetails.classList.remove('opacity-50', 'pointer-events-none');
            this.bookingDetails.classList.add('opacity-100');
        }

        document.getElementById('date-input').value = formatted;
    }

    /** Колбэк: время выбрано */
    _onTimeSelected(time) {
        if (this.displayDate) {
            const dateText = this.displayDate.innerText.split(' в ')[0];
            this.displayDate.innerHTML = `${dateText} <span class="text-brand">в ${time}</span>`;
        }
        document.getElementById('time-input').value = time;
    }

    /** Обработка отправки формы */
    async _handleSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);

        // Собираем все данные в один объект
        const leadData = {
            name: formData.get('name')?.trim(),
            phone: formData.get('phone')?.trim(),
            goal: formData.get('goal')?.trim() || '',
            package: this.packageManager.selectedPackage,
            date: this.calendar.selectedDate ? this.calendar.selectedDate.toISOString() : null,
            time: this.calendar.selectedTime,
            readableDate: this.displayDate ? this.displayDate.innerText : ''
        };

        // Валидация
        const validation = Validator.validateBooking(leadData);
        if (!validation.isValid) {
            alert("Пожалуйста, исправьте:\n\n• " + validation.errors.join("\n• "));
            return;
        }

        // Отправка
        this._setLoading(true);

        const result = await this.db.saveLead(leadData);

        if (result.success) {
            this._showSuccess();
        } else {
            // FIX: result.error — это уже строка, не объект!
            alert("Ошибка: " + (result.error || "Неизвестная ошибка. Попробуйте позже."));
            this._setLoading(false);
        }
    }

    /** Состояние загрузки кнопки */
    _setLoading(state) {
        if (!this.btn) return;
        this.btn.disabled = state;
        this.btn.innerHTML = state
            ? '<i class="fas fa-spinner fa-spin mr-2"></i> ЗАПИСЬ...'
            : 'Подтвердить запись';
    }

    /** Показ экрана успеха */
    _showSuccess() {
        if (this.formContent) this.formContent.classList.add('hidden');
        if (this.successBlock) this.successBlock.classList.remove('hidden');
    }
}