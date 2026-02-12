// js/AdminPricingManager.js
import { APP_SETTINGS } from './config.js';

/**
 * Управление ценами пакетов в админ-панели.
 * Загружает из БД (или config по умолчанию), позволяет редактировать и сохранять.
 */
export class AdminPricingManager {
    constructor(db) {
        this.db = db;
        this.packages = {};
        this.container = document.getElementById('packages-cards');
        this.saveBtn = document.getElementById('btn-save-packages');
        this.saveStatus = document.getElementById('packages-save-status');
    }

    init() {
        this.saveBtn.addEventListener('click', () => this._save());
        this._load();
    }

    async _load() {
        const saved = await this.db.getAdminPackages();
        if (saved) {
            const { updatedAt, ...pkgs } = saved;
            this.packages = pkgs;
        } else {
            this.packages = JSON.parse(JSON.stringify(APP_SETTINGS.packages));
        }
        this._render();
    }

    _render() {
        const icons = { single: 'fa-flask', pack10: 'fa-rocket', vip: 'fa-crown' };
        const borders = { single: 'border-gray-200', pack10: 'border-brand', vip: 'border-gold' };

        this.container.innerHTML = Object.entries(this.packages).map(([key, pkg]) => `
            <div class="bg-white p-6 rounded-2xl shadow-sm border-2 ${borders[key] || 'border-gray-200'}">
                <div class="flex items-center gap-3 mb-5">
                    <div class="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center">
                        <i class="fas ${icons[key] || 'fa-box'} text-brand"></i>
                    </div>
                    <span class="text-xs font-bold text-gray-400 uppercase">${key}</span>
                </div>
                <div class="space-y-3">
                    <div>
                        <label class="text-xs font-bold text-gray-400 uppercase mb-1 block">Название</label>
                        <input type="text" data-pkg="${key}" data-field="label" value="${this._escapeAttr(pkg.label)}"
                               class="w-full bg-gray-50 border-2 border-transparent focus:bg-white focus:border-brand rounded-xl py-2.5 px-4 outline-none transition text-sm">
                    </div>
                    <div>
                        <label class="text-xs font-bold text-gray-400 uppercase mb-1 block">Цена</label>
                        <input type="text" data-pkg="${key}" data-field="price" value="${this._escapeAttr(pkg.price)}"
                               class="w-full bg-gray-50 border-2 border-transparent focus:bg-white focus:border-brand rounded-xl py-2.5 px-4 outline-none transition text-sm">
                    </div>
                    <div>
                        <label class="text-xs font-bold text-gray-400 uppercase mb-1 block">Текст бейджа</label>
                        <input type="text" data-pkg="${key}" data-field="badgeText" value="${this._escapeAttr(pkg.badgeText)}"
                               class="w-full bg-gray-50 border-2 border-transparent focus:bg-white focus:border-brand rounded-xl py-2.5 px-4 outline-none transition text-sm">
                    </div>
                </div>
            </div>
        `).join('');
    }

    async _save() {
        const inputs = this.container.querySelectorAll('input[data-pkg]');
        inputs.forEach(input => {
            const pkg = input.dataset.pkg;
            const field = input.dataset.field;
            if (this.packages[pkg]) {
                this.packages[pkg][field] = input.value;
            }
        });

        this.saveBtn.disabled = true;
        this.saveBtn.textContent = 'Сохраняю...';

        const result = await this.db.saveAdminPackages(this.packages);

        this.saveBtn.disabled = false;
        this.saveBtn.textContent = 'Сохранить изменения';

        if (result.success) {
            this._showStatus('Цены сохранены', 'text-green-600');
        } else {
            this._showStatus('Ошибка сохранения', 'text-red-500');
        }
    }

    _showStatus(text, colorClass) {
        this.saveStatus.textContent = text;
        this.saveStatus.className = `text-right text-sm mt-3 ${colorClass}`;
        this.saveStatus.classList.remove('hidden');
        setTimeout(() => this.saveStatus.classList.add('hidden'), 3000);
    }

    _escapeAttr(text) {
        return (text || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    }
}
