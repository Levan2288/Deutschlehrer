// js/AdminLeadManager.js
import { APP_SETTINGS } from './config.js';

/**
 * Управление лидами в админ-панели.
 * Отображение таблицы, фильтрация, смена статуса.
 */
export class AdminLeadManager {
    constructor(db) {
        this.db = db;
        this.leads = [];
        this.currentFilter = '';
        this.tableBody = document.getElementById('leads-table-body');
        this.filtersContainer = document.getElementById('lead-filters');
        this.refreshBtn = document.getElementById('btn-refresh-leads');
    }

    init() {
        this._bindFilters();
        this.refreshBtn.addEventListener('click', () => this.loadLeads());
        this.loadLeads();
    }

    async loadLeads() {
        this.tableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-12 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Загрузка...</td></tr>';
        this.leads = await this.db.getLeads(this.currentFilter || null);
        this._render();
    }

    _bindFilters() {
        this.filtersContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.filter-btn');
            if (!btn) return;

            this.filtersContainer.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('active', 'bg-brand', 'text-white');
                b.classList.add('bg-white', 'text-gray-600', 'border', 'border-gray-200');
            });
            btn.classList.remove('bg-white', 'text-gray-600', 'border', 'border-gray-200');
            btn.classList.add('active', 'bg-brand', 'text-white');

            this.currentFilter = btn.dataset.filter;
            this.loadLeads();
        });
    }

    _render() {
        if (this.leads.length === 0) {
            this.tableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-12 text-center text-gray-400">Нет лидов</td></tr>';
            return;
        }

        this.tableBody.innerHTML = this.leads.map(lead => {
            const statusInfo = APP_SETTINGS.leadStatuses[lead.status] || APP_SETTINGS.leadStatuses.new;
            const pkgInfo = APP_SETTINGS.packages[lead.package];
            const pkgLabel = pkgInfo ? pkgInfo.label : lead.package;
            const dateDisplay = lead.readableDate || lead.date || '—';

            return `
                <tr class="border-t border-gray-50 hover:bg-gray-50 transition">
                    <td class="px-6 py-4 text-sm text-gray-700">${this._escapeHtml(dateDisplay)}</td>
                    <td class="px-6 py-4 text-sm font-medium text-gray-800">${this._escapeHtml(pkgLabel)}</td>
                    <td class="px-6 py-4 text-sm text-gray-700">${this._escapeHtml(lead.name)}</td>
                    <td class="px-6 py-4 text-sm text-gray-700">${this._escapeHtml(lead.phone)}</td>
                    <td class="px-6 py-4">
                        <select data-lead-id="${lead.id}" class="lead-status-select text-xs font-bold rounded-lg px-3 py-1.5 border-0 cursor-pointer outline-none"
                                style="background-color: ${statusInfo.color}20; color: ${statusInfo.color}">
                            ${this._statusOptions(lead.status)}
                        </select>
                    </td>
                </tr>
            `;
        }).join('');

        this.tableBody.querySelectorAll('.lead-status-select').forEach(select => {
            select.addEventListener('change', (e) => this._onStatusChange(e));
        });
    }

    _statusOptions(currentStatus) {
        return Object.entries(APP_SETTINGS.leadStatuses).map(([key, val]) => {
            const selected = key === currentStatus ? 'selected' : '';
            return `<option value="${key}" ${selected}>${val.label}</option>`;
        }).join('');
    }

    async _onStatusChange(e) {
        const select = e.target;
        const leadId = select.dataset.leadId;
        const newStatus = select.value;
        const statusInfo = APP_SETTINGS.leadStatuses[newStatus];

        select.disabled = true;
        const result = await this.db.updateLeadStatus(leadId, newStatus);
        select.disabled = false;

        if (result.success) {
            select.style.backgroundColor = `${statusInfo.color}20`;
            select.style.color = statusInfo.color;
        } else {
            this.loadLeads();
        }
    }

    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
}
