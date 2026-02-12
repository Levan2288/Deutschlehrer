// js/Validator.js

/**
 * Валидация данных бронирования.
 * Статический класс — не требует инстанцирования.
 */
export class Validator {
    /**
     * Проверка данных перед отправкой.
     * @param {Object} data — данные формы
     * @returns {{ isValid: boolean, errors: string[] }}
     */
    static validateBooking(data) {
        const errors = [];

        if (!data.package) {
            errors.push("Выберите пакет обучения");
        }
        if (!data.name || data.name.trim().length < 2) {
            errors.push("Укажите имя (минимум 2 символа)");
        }
        if (!data.phone || data.phone.trim().length < 5) {
            errors.push("Укажите номер телефона");
        }
        if (!data.date) {
            errors.push("Выберите дату в календаре");
        }
        if (!data.time) {
            errors.push("Выберите время занятия");
        }

        return { isValid: errors.length === 0, errors };
    }

    /** Диагностический тест подключения к БД */
    static async testConnection(dbService) {
        console.group("🧪 Integration Test");
        console.log("DB connected:", dbService.isConnected);
        console.log("UID:", dbService.uid);
        console.groupEnd();
    }
}