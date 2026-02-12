// js/PackageManager.js
import { APP_SETTINGS } from './config.js';

/**
 * Управление выбором пакетов/тарифов.
 * Обрабатывает клики по карточкам, подсвечивает выбранный,
 * обновляет бейдж в форме и hidden input.
 */
export class PackageManager {
    constructor() {
        this.selectedPackage = null;
        this.packageCards = [];
        this.packageBadge = document.getElementById('selected-package-badge');
        this.packageInput = document.getElementById('package-input');
        this.lang = null; // Устанавливается извне
        
        // Колбэк — вызывается при выборе пакета (можно подписаться извне)
        this.onPackageSelect = () => {};
    }

    /** Инициализация: находим карточки, вешаем обработчики */
    init() {
        this.packageCards = document.querySelectorAll('.package-card');
        this._bindCards();
    }

    /** Делегирование кликов на карточки тарифов */
    _bindCards() {
        this.packageCards.forEach(card => {
            card.addEventListener('click', () => {
                const packageKey = card.dataset.package;
                if (packageKey) this._selectPackage(packageKey, card);
            });
        });
    }

    /** Логика выбора пакета */
    _selectPackage(packageKey, cardElement) {
        const pkg = APP_SETTINGS.packages[packageKey];
        if (!pkg) return;

        this.selectedPackage = packageKey;

        // Сброс всех карточек
        this.packageCards.forEach(c => c.classList.remove('selected'));
        
        // Подсветка выбранной
        cardElement.classList.add('selected');

        // Обновление бейджа
        if (this.packageBadge) {
            this.packageBadge.className = `text-xs font-bold px-3 py-1 rounded-full ${pkg.badgeClass}`;
            // Берём перевод бейджа из i18n, если доступен
            const badgeKey = `badge.${packageKey}`;
            const badgeText = this.lang ? this.lang.t(badgeKey) : (pkg.badgeText || pkg.label);
            this.packageBadge.innerText = badgeText;
            // Убираем data-i18n чтобы переключатель не перезаписывал выбранный бейдж
            this.packageBadge.removeAttribute('data-i18n');
        }

        // Обновление hidden input
        if (this.packageInput) {
            this.packageInput.value = packageKey;
        }

        // Плавный скролл к секции бронирования
        const bookingSection = document.getElementById('booking');
        if (bookingSection) {
            setTimeout(() => {
                bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        }

        // Уведомляем подписчиков
        this.onPackageSelect(packageKey, pkg);
        
        console.log(`[Package] Выбран: ${packageKey}`);
    }

    /** Получение данных текущего пакета */
    getSelectedPackageInfo() {
        if (!this.selectedPackage) return null;
        return APP_SETTINGS.packages[this.selectedPackage] || null;
    }
}