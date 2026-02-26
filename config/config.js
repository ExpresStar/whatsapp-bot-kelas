require('dotenv').config();

const config = {
    // Bot Settings
    botName: process.env.BOT_NAME || 'Bot Kelas SMA',
    prefix: process.env.PREFIX || '.',
    timezone: process.env.TIMEZONE || 'Asia/Jakarta',
    
    // Database
    dbMode: process.env.DB_MODE || 'json',
    mongodbUri: process.env.MONGODB_URI,
    
    // API Keys
    openaiApiKey: process.env.OPENAI_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
    weatherApiKey: process.env.WEATHER_API_KEY,
    
    // Admin & Groups
    adminNumbers: (process.env.ADMIN_NUMBERS || '').split(',').map(n => n.trim()).filter(Boolean),
    allowedGroups: (process.env.ALLOWED_GROUPS || '').split(',').map(g => g.trim()).filter(Boolean),
    
    // Anti Spam
    cooldownSeconds: parseInt(process.env.COOLDOWN_SECONDS) || 3,
    
    // Reminder
    reminderCheckInterval: parseInt(process.env.REMINDER_CHECK_INTERVAL) || 60,
    
    // Logging
    logLevel: process.env.LOG_LEVEL || 'info',
    logToFile: process.env.LOG_TO_FILE === 'true',
    
    // Paths
    dataPath: './data',
    logsPath: './logs',
    sessionPath: './session',
    
    // Messages
    messages: {
        noPermission: '❌ *Akses Ditolak*\n\nKamu tidak memiliki izin untuk menggunakan command ini.',
        cooldown: '⏳ *Tunggu Sebentar*\n\nKamu terlalu cepat! Tunggu {seconds} detik lagi.',
        error: '❌ *Terjadi Kesalahan*\n\nMaaf, terjadi kesalahan. Silakan coba lagi nanti.',
        groupOnly: '❌ *Hanya untuk Grup*\n\nCommand ini hanya bisa digunakan di grup.',
        adminOnly: '❌ *Khusus Admin*\n\nCommand ini hanya bisa digunakan oleh admin.',
        invalidFormat: '❌ *Format Salah*\n\nGunakan format: {format}'
    }
};

module.exports = config;
