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
    locale: 'de-DE',
    timeSlots: ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00'],
    packages: {
        single: { label: 'Пробный урок (45€)', badgeClass: 'bg-gray-800 text-white' },
        pack10: { label: 'Пакет 10 уроков (400€)', badgeClass: 'bg-brand text-white' },
        vip:    { label: 'VIP Терапия (600€)', badgeClass: 'bg-gold text-white' },
    }
};