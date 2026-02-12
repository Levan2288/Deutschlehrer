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

        this.form = document.getElementById('booking-form');
        this.btn = document.getElementById('book-btn');
        this.formContent = document.getElementById('form-content');
        this.successBlock = document.getElementById('booking-success');
        this.displayDate = document.getElementById('display-date');
        this.bookingDetails = document.getElementById('booking-details');
        this.errorContainer = document.getElementById('form-errors');
    }

    init() {
        if (this.form) {
            this.form.removeAttribute('onsubmit');
            this.form.addEventListener('submit', (e) => this._handleSubmit(e));
        }

        // Колбэки от календаря
        this.calendar.onDateSelect = (date) => this._onDateSelected(date);
        this.calendar.onTimeSelect = (time) => this._onTimeSelected(time);

        // Колбэк от пакетов — активировать форму при выборе пакета
        this.packageManager.onPackageSelect = () => this._clearErrors();

        // Кнопка "Вернуться" на экране успеха (убираем inline onclick)
        const resetBtn = document.getElementById('btn-reset-form');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => location.reload());
        }
    }

    _onDateSelected(date) {
        const formatted = date.toLocaleDateString(APP_SETTINGS.locale, {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        
        if (this.displayDate) {
            this.displayDate.innerText = formatted;
        }

        // Активируем правую панель
        if (this.bookingDetails) {
            this.bookingDetails.classList.remove('opacity-50', 'pointer-events-none');
            this.bookingDetails.classList.add('opacity-100');
        }

        document.getElementById('date-input').value = formatted;
    }

    _onTimeSelected(time) {
        if (this.displayDate) {
            const dateText = this.displayDate.innerText.split(' в ')[0];
            this.displayDate.innerHTML = `${dateText} <span class="text-brand font-black">в ${time}</span>`;
        }
        document.getElementById('time-input').value = time;
    }

    async _handleSubmit(e) {
        e.preventDefault();
        this._clearErrors();

        const formData = new FormData(e.target);

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
            this._showErrors(validation.errors);
            return;
        }

        // Отправка
        this._setLoading(true);

        const result = await this.db.saveLead(leadData);

        if (result.success) {
            this._showSuccess();
        } else {
            this._showErrors([result.error || "Ошибка сервера. Попробуйте позже."]);
            this._setLoading(false);
        }
    }

    /** Показ ошибок в UI (вместо alert) */
    _showErrors(errors) {
        if (!this.errorContainer) return;
        this.errorContainer.innerHTML = errors.map(err => 
            `<div class="flex items-center gap-2 text-red-600 text-sm">
                <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
                <span>${err}</span>
            </div>`
        ).join('');
        this.errorContainer.classList.remove('hidden');
        
        // Скролл к ошибкам
        this.errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    _clearErrors() {
        if (!this.errorContainer) return;
        this.errorContainer.innerHTML = '';
        this.errorContainer.classList.add('hidden');
    }

    _setLoading(state) {
        if (!this.btn) return;
        this.btn.disabled = state;
        this.btn.innerHTML = state
            ? '<i class="fas fa-spinner fa-spin mr-2"></i> Отправка...'
            : 'Подтвердить запись';
    }

    _showSuccess() {
        if (this.formContent) this.formContent.classList.add('hidden');
        if (this.successBlock) this.successBlock.classList.remove('hidden');
    }
}