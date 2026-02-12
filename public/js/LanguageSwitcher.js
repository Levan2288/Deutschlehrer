// js/LanguageSwitcher.js
import { TRANSLATIONS, LOCALE_MAP } from './i18n.js';

/**
 * Переключатель языков.
 * Сохраняет выбор в localStorage, применяет переводы через data-i18n атрибуты.
 * Уведомляет подписчиков об изменении языка (для CalendarUI и т.д.)
 */
export class LanguageSwitcher {
    constructor() {
        this.currentLang = this._getSavedLang();
        this.onLangChange = () => {};
    }

    init() {
        this._renderSwitcher();
        this._bindEvents();
        this.applyTranslations();
    }

    /** Определение языка: localStorage → браузер → 'de' (дефолт для немецкого рынка) */
    _getSavedLang() {
        try {
            const saved = localStorage.getItem('lang');
            if (saved && TRANSLATIONS[saved]) return saved;
        } catch {}

        // Авто-определение по браузеру
        const browserLang = navigator.language?.slice(0, 2);
        if (browserLang === 'ko') return 'ko';
        if (browserLang === 'ru') return 'ru';
        return 'de';
    }

    /** Рендер компактного переключателя в nav */
    _renderSwitcher() {
        const container = document.getElementById('lang-switcher');
        if (!container) return;

        const langs = [
            { code: 'ru', label: 'RU', flag: '🇷🇺' },
            { code: 'de', label: 'DE', flag: '🇩🇪' },
            { code: 'ko', label: 'KO', flag: '🇰🇷' },
        ];

        container.innerHTML = langs.map(l => {
            const isActive = l.code === this.currentLang;
            return `<button data-lang="${l.code}" 
                class="lang-btn px-2 py-1 text-xs font-bold rounded-md transition-all
                ${isActive ? 'bg-brand text-white' : 'text-gray-500 hover:text-brand hover:bg-brand/5'}"
                aria-label="${l.label}">
                <span class="hidden sm:inline">${l.flag} </span>${l.label}
            </button>`;
        }).join('');
    }

    _bindEvents() {
        const container = document.getElementById('lang-switcher');
        if (!container) return;

        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.lang-btn');
            if (!btn) return;

            const lang = btn.dataset.lang;
            if (lang && lang !== this.currentLang) {
                this.setLang(lang);
            }
        });
    }

    setLang(lang) {
        if (!TRANSLATIONS[lang]) return;
        this.currentLang = lang;

        try { localStorage.setItem('lang', lang); } catch {}

        document.documentElement.lang = lang === 'ru' ? 'ru' : lang === 'ko' ? 'ko' : 'de';

        this._renderSwitcher();
        this.applyTranslations();
        this.onLangChange(lang);
    }

    /** Применяет переводы ко всем элементам с data-i18n */
    applyTranslations() {
        const t = TRANSLATIONS[this.currentLang];
        if (!t) return;

        // Текстовые элементы
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (t[key] !== undefined) {
                el.textContent = t[key];
            }
        });

        // innerHTML (для элементов с вложенной разметкой)
        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const key = el.dataset.i18nHtml;
            if (t[key] !== undefined) {
                el.innerHTML = t[key];
            }
        });

        // Плейсхолдеры
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.dataset.i18nPlaceholder;
            if (t[key] !== undefined) {
                el.placeholder = t[key];
            }
        });

        // Aria-label
        document.querySelectorAll('[data-i18n-aria]').forEach(el => {
            const key = el.dataset.i18nAria;
            if (t[key] !== undefined) {
                el.setAttribute('aria-label', t[key]);
            }
        });

        // Дни недели календаря
        const weekdayContainer = document.getElementById('cal-weekdays');
        if (weekdayContainer && t['cal.weekdays']) {
            const days = t['cal.weekdays'];
            const divs = weekdayContainer.querySelectorAll('div');
            divs.forEach((div, i) => {
                if (days[i]) div.textContent = days[i];
            });
        }
    }

    /** Получить перевод по ключу */
    t(key) {
        return TRANSLATIONS[this.currentLang]?.[key] || key;
    }

    /** Текущая локаль для Intl / toLocaleString */
    getLocale() {
        return LOCALE_MAP[this.currentLang] || 'de-DE';
    }
}