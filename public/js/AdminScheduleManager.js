// js/AdminScheduleManager.js
import { APP_SETTINGS } from './config.js';

/**
 * Управление расписанием в админ-панели.
 * Админ выбирает дату → отмечает доступные слоты → сохраняет.
 */
export class AdminScheduleManager {
    constructor(db) {
        this.db = db;
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.selectedDate = null;
        this.scheduleMap = {};

        this.monthTitle = document.getElementById('schedule-month-title');
        this.calendarGrid = document.getElementById('schedule-calendar-grid');
        this.slotsEmpty = document.getElementById('schedule-slots-empty');
        this.slotsContent = document.getElementById('schedule-slots-content');
        this.slotsCheckboxes = document.getElementById('schedule-time-checkboxes');
        this.selectedDateLabel = document.getElementById('schedule-selected-date');
        this.saveBtn = document.getElementById('btn-save-schedule');
        this.saveStatus = document.getElementById('schedule-save-status');
    }

    init() {
        document.getElementById('sch-prev-month').addEventListener('click', () => this._changeMonth(-1));
        document.getElementById('sch-next-month').addEventListener('click', () => this._changeMonth(1));
        this.saveBtn.addEventListener('click', () => this._saveSchedule());
        this._loadSchedule();
    }

    async _loadSchedule() {
        const schedule = await this.db.getSchedule();
        this.scheduleMap = {};
        schedule.forEach(entry => {
            this.scheduleMap[entry.id] = entry.slots || [];
        });
        this._renderCalendar();
    }

    _changeMonth(delta) {
        this.currentMonth += delta;
        if (this.currentMonth > 11) { this.currentMonth = 0; this.currentYear++; }
        if (this.currentMonth < 0) { this.currentMonth = 11; this.currentYear--; }
        this._renderCalendar();
    }

    _renderCalendar() {
        const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
        this.monthTitle.textContent = `${months[this.currentMonth]} ${this.currentYear}`;

        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        let startWeekDay = firstDay.getDay();
        if (startWeekDay === 0) startWeekDay = 7;

        let html = '';
        for (let i = 1; i < startWeekDay; i++) {
            html += '<div></div>';
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(this.currentYear, this.currentMonth, day);
            const dateStr = this._formatDate(date);
            const isPast = date < today;
            const hasSlots = this.scheduleMap[dateStr] && this.scheduleMap[dateStr].length > 0;
            const isSelected = this.selectedDate === dateStr;

            let classes = 'w-full aspect-square rounded-lg text-sm font-medium flex items-center justify-center transition cursor-pointer relative';
            if (isPast) {
                classes += ' text-gray-300 cursor-not-allowed';
            } else if (isSelected) {
                classes += ' bg-brand text-white font-bold';
            } else if (hasSlots) {
                classes += ' bg-green-100 text-green-700 hover:bg-green-200 font-bold';
            } else {
                classes += ' hover:bg-gray-100 text-gray-700';
            }

            const dot = hasSlots && !isSelected ? '<span class="absolute bottom-0.5 w-1 h-1 bg-green-500 rounded-full"></span>' : '';

            html += `<div class="${classes}" data-date="${dateStr}" ${isPast ? '' : 'role="button"'}>${day}${dot}</div>`;
        }

        this.calendarGrid.innerHTML = html;

        this.calendarGrid.querySelectorAll('[role="button"]').forEach(cell => {
            cell.addEventListener('click', () => this._selectDate(cell.dataset.date));
        });
    }

    _selectDate(dateStr) {
        this.selectedDate = dateStr;
        this._renderCalendar();
        this._renderSlots();
    }

    _renderSlots() {
        if (!this.selectedDate) return;

        this.slotsEmpty.classList.add('hidden');
        this.slotsContent.classList.remove('hidden');
        this.saveStatus.classList.add('hidden');

        const parts = this.selectedDate.split('-');
        this.selectedDateLabel.textContent = `${parts[2]}.${parts[1]}.${parts[0]}`;

        const existingSlots = this.scheduleMap[this.selectedDate] || [];

        this.slotsCheckboxes.innerHTML = APP_SETTINGS.timeSlots.map(slot => {
            const checked = existingSlots.includes(slot) ? 'checked' : '';
            return `
                <label class="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-100 transition">
                    <input type="checkbox" value="${slot}" ${checked}
                           class="w-5 h-5 text-brand bg-gray-100 border-gray-300 rounded focus:ring-brand focus:ring-2 accent-brand">
                    <span class="text-sm font-bold text-gray-700">${slot}</span>
                </label>
            `;
        }).join('');
    }

    async _saveSchedule() {
        if (!this.selectedDate) return;

        const checkboxes = this.slotsCheckboxes.querySelectorAll('input[type="checkbox"]:checked');
        const slots = Array.from(checkboxes).map(cb => cb.value);

        this.saveBtn.disabled = true;
        this.saveBtn.textContent = 'Сохраняю...';

        const result = await this.db.setScheduleForDate(this.selectedDate, slots);

        this.saveBtn.disabled = false;
        this.saveBtn.textContent = 'Сохранить';

        if (result.success) {
            if (slots.length > 0) {
                this.scheduleMap[this.selectedDate] = slots;
            } else {
                delete this.scheduleMap[this.selectedDate];
            }
            this._showStatus('Сохранено', 'text-green-600');
            this._renderCalendar();
        } else {
            this._showStatus('Ошибка сохранения', 'text-red-500');
        }
    }

    _showStatus(text, colorClass) {
        this.saveStatus.textContent = text;
        this.saveStatus.className = `text-center text-sm mt-3 ${colorClass}`;
        this.saveStatus.classList.remove('hidden');
        setTimeout(() => this.saveStatus.classList.add('hidden'), 3000);
    }

    _formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
}
