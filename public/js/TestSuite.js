export class TestSuite {
    static validateBooking(data) {
        const errors = [];
        if (!data.name || data.name.length < 2) errors.push("Имя слишком короткое");
        if (!data.phone || !data.phone.match(/^[\d\+\-\(\)\s]+$/)) errors.push("Неверный формат телефона");
        if (!data.date) errors.push("Дата не выбрана");
        if (!data.time) errors.push("Время не выбрано");
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static async runIntegrationTest(dbService) {
        console.group("🧪 Integration Test");
        console.log("Checking DB connection...");
        if(dbService.isConnected) {
            console.log("✅ DB Connected");
        } else {
            console.error("❌ DB Disconnected");
        }
        console.groupEnd();
    }
}