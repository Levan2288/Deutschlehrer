// js/CalendarUI.js

/**
 * Компонент календаря и выбора времени.
 * Не зависит от глобальных функций — общается через колбэки.
 * Локаль задаётся извне через setLocale() (от LanguageSwitcher).
 * 
 * Будущее: поддержка busySlots — заблокированные слоты от админа.
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
        this.locale = options.locale || 'de-DE';
        
        // Будущее: занятые слоты (загружаются из БД)
        this.busySlots = [];
        // Будущее: выходные дни админа
        this.blockedDays = [];

        this.onDateSelect = options.onDateSelect || (() => {});
        this.onTimeSelect = options.onTimeSelect || (() => {});
    }

    init() {
        this._bindNavigation();
        this._bindTimeSlots();
        this.render();
    }

    _bindNavigation() {
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.changeMonth(-1));
        }
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.changeMonth(1));
        }
    }

    _bindTimeSlots() {
        if (!this.timeSlotsContainer) return;
        
        this.timeSlotsContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.time-slot');
            if (!btn || btn.disabled) return;
            
            const time = btn.dataset.time;
            if (time) this._handleTimeClick(time, btn);
        });
    }

    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        if (this.monthLabel) {
            this.monthLabel.innerText = this.currentDate.toLocaleString(
                this.locale, 
                { month: 'long', year: 'numeric' }
            );
        }

        if (!this.calendarGrid) return;
        this.calendarGrid.innerHTML = '';

        const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < firstDayIndex; i++) {
            const empty = document.createElement('div');
            this.calendarGrid.appendChild(empty);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, month, d);
            const isPast = dateObj < today;
            const isBlocked = this._isDayBlocked(dateObj);
            const isSelected = this.selectedDate && dateObj.toDateString() === this.selectedDate.toDateString();

            const cell = document.createElement('div');
            cell.innerText = d;
            cell.className = this._getDayCellClass(isPast || isBlocked, isSelected);

            if (!isPast && !isBlocked) {
                cell.addEventListener('click', () => this._handleDateClick(dateObj));
            }

            this.calendarGrid.appendChild(cell);
        }
    }

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

    _handleDateClick(date) {
        this.selectedDate = date;
        this.selectedTime = null; // Сброс времени при смене даты
        this._resetTimeSlots();
        this.render();
        this.onDateSelect(date);
    }

    _handleTimeClick(time, buttonElement) {
        this.selectedTime = time;

        // Сброс всех слотов
        this.timeSlotsContainer.querySelectorAll('.time-slot').forEach(el => {
            el.classList.remove('bg-brand', 'text-white', 'border-brand');
            el.classList.add('border-gray-200', 'bg-white');
        });

        // Подсветка выбранного
        buttonElement.classList.add('bg-brand', 'text-white', 'border-brand');
        buttonElement.classList.remove('border-gray-200', 'bg-white');

        this.onTimeSelect(time);
    }

    /** Сброс подсветки слотов времени */
    _resetTimeSlots() {
        if (!this.timeSlotsContainer) return;
        this.timeSlotsContainer.querySelectorAll('.time-slot').forEach(el => {
            el.classList.remove('bg-brand', 'text-white', 'border-brand');
            el.classList.add('border-gray-200', 'bg-white');
            el.disabled = false;
        });
    }

    /**
     * БУДУЩЕЕ: Обновление занятых слотов.
     * Вызывается после загрузки данных из БД.
     */
    updateBusySlots(busyTimes = []) {
        this.busySlots = busyTimes;
        if (!this.timeSlotsContainer) return;
        
        this.timeSlotsContainer.querySelectorAll('.time-slot').forEach(el => {
            const time = el.dataset.time;
            if (busyTimes.includes(time)) {
                el.disabled = true;
                el.classList.add('opacity-40', 'cursor-not-allowed', 'line-through');
                el.classList.remove('hover:border-brand', 'hover:text-brand');
            }
        });
    }

    /**
     * БУДУЩЕЕ: Проверка, заблокирован ли день админом.
     */
    _isDayBlocked(dateObj) {
        const dateStr = dateObj.toISOString().split('T')[0];
        return this.blockedDays.includes(dateStr);
    }

    /**
     * БУДУЩЕЕ: Установка заблокированных дней из расписания админа.
     */
    setBlockedDays(days = []) {
        this.blockedDays = days;
        this.render();
    }

    /** Смена локали (вызывается из LanguageSwitcher) */
    setLocale(locale) {
        this.locale = locale;
        this.render();
    }

    changeMonth(offset) {
        this.currentDate.setMonth(this.currentDate.getMonth() + offset);
        this.render();
    }
}