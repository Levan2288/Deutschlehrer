// js/CalendarUI.js
import { APP_SETTINGS } from './config.js';

/**
 * Компонент календаря и выбора времени.
 * Не зависит от глобальных функций — общается через колбэки.
 */
export class CalendarUI {
    constructor(options = {}) {
        this.calendarGrid = document.getElementById('calendar-grid');
        this.monthLabel = document.getElementById('current-month');
        this.prevBtn = document.getElementById('btn-prev-month');
        this.nextBtn = document.getElementById('btn-next-month');
        this.timeSlotsContainer = document.getElementById('time-slots-container');

        this.currentDate = new Date();
        this.selectedDate = null;
        this.selectedTime = null;

        // Колбэки — передаются извне (из BookingManager)
        this.onDateSelect = options.onDateSelect || (() => {});
        this.onTimeSelect = options.onTimeSelect || (() => {});
    }

    /** Инициализация: рендер + привязка событий навигации */
    init() {
        this._bindNavigation();
        this._bindTimeSlots();
        this.render();
    }

    /** Привязка кнопок ←/→ через addEventListener (не onclick в HTML) */
    _bindNavigation() {
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.changeMonth(-1));
        }
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.changeMonth(1));
        }
    }

    /** Делегирование кликов по слотам времени */
    _bindTimeSlots() {
        if (!this.timeSlotsContainer) return;
        
        this.timeSlotsContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.time-slot');
            if (!btn) return;
            
            const time = btn.dataset.time;
            if (time) this._handleTimeClick(time, btn);
        });
    }

    /** Рендер сетки календаря */
    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Заголовок месяца
        if (this.monthLabel) {
            this.monthLabel.innerText = this.currentDate.toLocaleString(
                APP_SETTINGS.locale, 
                { month: 'long', year: 'numeric' }
            );
        }

        if (!this.calendarGrid) return;
        this.calendarGrid.innerHTML = '';

        const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Пн = 0
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Пустые ячейки до первого дня
        for (let i = 0; i < firstDayIndex; i++) {
            const empty = document.createElement('div');
            this.calendarGrid.appendChild(empty);
        }

        // Дни месяца
        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, month, d);
            const isPast = dateObj < today;
            const isSelected = this.selectedDate && dateObj.toDateString() === this.selectedDate.toDateString();

            const cell = document.createElement('div');
            cell.innerText = d;
            cell.className = this._getDayCellClass(isPast, isSelected);

            if (!isPast) {
                cell.addEventListener('click', () => this._handleDateClick(dateObj));
            }

            this.calendarGrid.appendChild(cell);
        }
    }

    /** CSS-классы для ячейки дня */
    _getDayCellClass(isPast, isSelected) {
        const base = 'calendar-day h-14 w-14 flex items-center justify-center transition-all text-sm font-black border border-transparent rounded-full';
        
        if (isPast) {
            return `${base} text-gray-300 line-through cursor-not-allowed`;
        }
        if (isSelected) {
            return `${base} bg-brand text-white shadow-lg cursor-pointer`;
        }
        return `${base} hover:bg-brand/10 hover:text-brand cursor-pointer text-gray-900 bg-gray-50`;
    }

    /** Обработка клика по дате */
    _handleDateClick(date) {
        this.selectedDate = date;
        this.render(); // Перерисовка с подсветкой
        this.onDateSelect(date);
    }

    /** Обработка клика по времени */
    _handleTimeClick(time, buttonElement) {
        this.selectedTime = time;

        // Сброс всех слотов
        document.querySelectorAll('.time-slot').forEach(el => {
            el.classList.remove('bg-brand', 'text-white', 'border-brand');
            el.classList.add('border-gray-200', 'bg-white');
        });

        // Подсветка выбранного
        buttonElement.classList.add('bg-brand', 'text-white', 'border-brand');
        buttonElement.classList.remove('border-gray-200', 'bg-white');

        this.onTimeSelect(time);
    }

    /** Переключение месяца */
    changeMonth(offset) {
        this.currentDate.setMonth(this.currentDate.getMonth() + offset);
        this.render();
    }
}