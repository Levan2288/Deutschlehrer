// js/admin-main.js — Точка входа админ-панели
import { DatabaseService } from './DatabaseService.js';
import { AdminLeadManager } from './AdminLeadManager.js';
import { AdminScheduleManager } from './AdminScheduleManager.js';
import { AdminPricingManager } from './AdminPricingManager.js';
import { AdminServiceManager } from './AdminServiceManager.js';

class AdminApp {
    constructor() {
        this.db = new DatabaseService();
        this.managers = {};
        this.currentTab = 'leads';
    }

    async init() {
        const connected = await this.db.init();
        document.getElementById('loading-overlay').remove();

        if (!connected) {
            document.querySelector('main').innerHTML = `
                <div class="text-center py-20">
                    <i class="fas fa-exclamation-triangle text-red-400 text-4xl mb-4"></i>
                    <h2 class="text-xl font-bold text-gray-900 mb-2">Ошибка подключения</h2>
                    <p class="text-gray-500">Не удалось подключиться к Firebase. Проверьте интернет.</p>
                </div>
            `;
            return;
        }

        this.managers.leads = new AdminLeadManager(this.db);
        this.managers.schedule = new AdminScheduleManager(this.db);
        this.managers.packages = new AdminPricingManager(this.db);
        this.managers.services = new AdminServiceManager(this.db);

        this.managers.leads.init();
        this.managers.leads._initialized = true;
        this._bindTabs();
    }

    _bindTabs() {
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = link.dataset.tab;
                if (tab === this.currentTab) return;
                this._switchTab(tab);
            });
        });
    }

    _switchTab(tab) {
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        document.querySelector(`.sidebar-link[data-tab="${tab}"]`).classList.add('active');

        document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
        document.getElementById(`tab-${tab}`).classList.add('active');

        if (!this.managers[tab]._initialized) {
            this.managers[tab].init();
            this.managers[tab]._initialized = true;
        }

        this.currentTab = tab;
    }
}

const app = new AdminApp();
app.init();
