import { APP_SETTINGS } from './config.js';

export class CalendarUI {
    constructor(containerId, onDateSelect, onTimeSelect) {
        this.container = document.getElementById(containerId);
        this.currentDate = new Date();
        this.selectedDate = null;
        this.selectedTime = null;
        this.onDateSelect = onDateSelect; // Callback функция
        this.onTimeSelect = onTimeSelect; // Callback функция
    }

    render(date = this.currentDate) {
        const year = date.getFullYear();
        const month = date.getMonth();
        
        // Обновляем заголовок
        document.getElementById('current-month').innerText = date.toLocaleString(APP_SETTINGS.locale, { month: 'long', year: 'numeric' });

        const grid = document.getElementById('calendar-grid');
        grid.innerHTML = '';

        const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; 
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        today.setHours(0,0,0,0);

        // Пустые ячейки
        for (let i = 0; i < firstDayIndex; i++) {
            grid.innerHTML += '<div></div>';
        }

        // Дни
        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, month, d);
            const isPast = dateObj < today;
            const isSelected = this.selectedDate && dateObj.toDateString() === this.selectedDate.toDateString();

            const cell = document.createElement('div');
            cell.className = `calendar-day h-14 w-14 flex items-center justify-center cursor-pointer transition-all text-sm font-black border border-transparent rounded-full
                ${isPast ? 'disabled text-gray-300 line-through cursor-not-allowed' : 'hover:bg-brand/10 hover:text-brand'} 
                ${isSelected ? 'selected bg-brand text-white shadow-lg' : 'text-gray-900'}`;
            cell.innerText = d;

            if (!isPast) {
                cell.onclick = () => this.handleDateClick(dateObj);
            }
            grid.appendChild(cell);
        }
    }

    handleDateClick(date) {
        this.selectedDate = date;
        this.render(); // Перерисовка для подсветки
        this.onDateSelect(date);
    }

    handleTimeClick(time, buttonElement) {
        this.selectedTime = time;
        document.querySelectorAll('.time-slot').forEach(el => {
            el.classList.remove('selected', 'bg-brand', 'text-white', 'border-brand');
            el.classList.add('border-gray-200', 'bg-white');
        });
        buttonElement.classList.add('selected', 'bg-brand', 'text-white', 'border-brand');
        buttonElement.classList.remove('border-gray-200', 'bg-white');
        this.onTimeSelect(time);
    }

    changeMonth(offset) {
        this.currentDate.setMonth(this.currentDate.getMonth() + offset);
        this.render();
    }
}