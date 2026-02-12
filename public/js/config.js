// js/config.js — Центральная конфигурация приложения

export const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDYyNvv4Gzytbzj5-hMOMsbWxVUEXOlEL0",
    authDomain: "deutschlehrer-4f722.firebaseapp.com",
    projectId: "deutschlehrer-4f722",
    storageBucket: "deutschlehrer-4f722.firebasestorage.app",
    messagingSenderId: "798155335100",
    appId: "1:798155335100:web:7e1b159c41f34db13a37b9",
    measurementId: "G-L33MT9S3LT"
};

export const APP_SETTINGS = {
    collectionName: 'leads',
    // Будущее: коллекция расписания админа
    scheduleCollection: 'admin_schedule',
    // Будущее: коллекция статусов лидов
    leadStatusCollection: 'lead_statuses',
    
    locale: 'de-DE',
    timeSlots: ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00'],
    
    packages: {
        single: { 
            label: 'Пробный урок', 
            price: '45€',
            badgeClass: 'bg-gray-800 text-white',
            badgeText: 'Пробный (45€)'
        },
        pack10: { 
            label: 'Пакет 10 уроков', 
            price: '400€',
            badgeClass: 'bg-brand text-white',
            badgeText: 'Курс (400€)'
        },
        vip: { 
            label: 'VIP Терапия', 
            price: '600€',
            badgeClass: 'bg-gold text-white',
            badgeText: 'VIP (600€)'
        },
    },

    // Статусы лидов для будущей админки
    leadStatuses: {
        new: { label: 'Новый', color: '#3B82F6' },
        valid: { label: 'Валидный', color: '#22C55E' },
        hold: { label: 'На удержании', color: '#F59E0B' },
        trash: { label: 'Мусор', color: '#EF4444' },
        completed: { label: 'Завершён', color: '#6B7280' }
    }
};