// js/AdminServiceManager.js

/**
 * Управление услугами в админ-панели.
 * CRUD: добавление, редактирование, удаление услуг.
 */
export class AdminServiceManager {
    constructor(db) {
        this.db = db;
        this.services = [];
        this.editingId = null;

        this.list = document.getElementById('services-list');
        this.formWrapper = document.getElementById('service-form-wrapper');
        this.formTitle = document.getElementById('service-form-title');
        this.nameInput = document.getElementById('service-name');
        this.priceInput = document.getElementById('service-price');
        this.descInput = document.getElementById('service-description');
        this.editIdInput = document.getElementById('service-edit-id');
        this.addBtn = document.getElementById('btn-add-service');
        this.saveBtn = document.getElementById('btn-save-service');
        this.cancelBtn = document.getElementById('btn-cancel-service');
    }

    init() {
        this.addBtn.addEventListener('click', () => this._showForm());
        this.cancelBtn.addEventListener('click', () => this._hideForm());
        this.saveBtn.addEventListener('click', () => this._save());
        this._load();
    }

    async _load() {
        this.list.innerHTML = '<div class="text-center py-12 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Загрузка...</div>';
        this.services = await this.db.getServices();
        this._render();
    }

    _render() {
        if (this.services.length === 0) {
            this.list.innerHTML = '<div class="text-center py-12 text-gray-400">Нет услуг. Нажмите «Добавить».</div>';
            return;
        }

        this.list.innerHTML = this.services.map(svc => `
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between gap-4">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-3">
                        <span class="font-bold text-gray-900">${this._escapeHtml(svc.name)}</span>
                        <span class="text-brand font-bold text-sm">${this._escapeHtml(svc.price || '')}</span>
                    </div>
                    ${svc.description ? `<p class="text-sm text-gray-500 mt-1 truncate">${this._escapeHtml(svc.description)}</p>` : ''}
                </div>
                <div class="flex gap-2 flex-shrink-0">
                    <button data-action="edit" data-id="${svc.id}" class="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition">
                        <i class="fas fa-pen text-gray-500 text-xs pointer-events-none"></i>
                    </button>
                    <button data-action="delete" data-id="${svc.id}" class="w-9 h-9 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center transition">
                        <i class="fas fa-trash text-red-400 text-xs pointer-events-none"></i>
                    </button>
                </div>
            </div>
        `).join('');

        this.list.querySelectorAll('[data-action="edit"]').forEach(btn => {
            btn.addEventListener('click', () => this._editService(btn.dataset.id));
        });
        this.list.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', () => this._deleteService(btn.dataset.id));
        });
    }

    _showForm(service = null) {
        this.formWrapper.classList.remove('hidden');
        if (service) {
            this.formTitle.textContent = 'Редактировать услугу';
            this.nameInput.value = service.name || '';
            this.priceInput.value = service.price || '';
            this.descInput.value = service.description || '';
            this.editingId = service.id;
        } else {
            this.formTitle.textContent = 'Новая услуга';
            this.nameInput.value = '';
            this.priceInput.value = '';
            this.descInput.value = '';
            this.editingId = null;
        }
        this.nameInput.focus();
    }

    _hideForm() {
        this.formWrapper.classList.add('hidden');
        this.editingId = null;
    }

    _editService(id) {
        const svc = this.services.find(s => s.id === id);
        if (svc) this._showForm(svc);
    }

    async _deleteService(id) {
        if (!confirm('Удалить услугу?')) return;

        const result = await this.db.deleteService(id);
        if (result.success) {
            this.services = this.services.filter(s => s.id !== id);
            this._render();
        }
    }

    async _save() {
        const name = this.nameInput.value.trim();
        const price = this.priceInput.value.trim();
        const description = this.descInput.value.trim();

        if (!name) {
            this.nameInput.focus();
            return;
        }

        this.saveBtn.disabled = true;
        this.saveBtn.textContent = 'Сохраняю...';

        if (this.editingId) {
            const result = await this.db.updateService(this.editingId, { name, price, description });
            if (result.success) {
                const svc = this.services.find(s => s.id === this.editingId);
                if (svc) { svc.name = name; svc.price = price; svc.description = description; }
            }
        } else {
            const result = await this.db.addService({ name, price, description });
            if (result.success) {
                this.services.unshift({ id: result.id, name, price, description });
            }
        }

        this.saveBtn.disabled = false;
        this.saveBtn.textContent = 'Сохранить';
        this._hideForm();
        this._render();
    }

    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
}
