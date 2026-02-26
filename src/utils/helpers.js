const moment = require('moment-timezone');
const config = require('../../config/config');

const helpers = {
    // Format tanggal ke format Indonesia
    formatDate(date, format = 'DD MMMM YYYY') {
        return moment(date).tz(config.timezone).format(format);
    },

    // Format tanggal dan waktu
    formatDateTime(date) {
        return moment(date).tz(config.timezone).format('DD MMMM YYYY HH:mm');
    },

    // Format relative time (besok, lusa, dll)
    formatRelativeTime(date) {
        const now = moment().tz(config.timezone);
        const target = moment(date).tz(config.timezone);
        const diffDays = target.diff(now, 'days');
        
        if (diffDays === 0) return 'Hari ini';
        if (diffDays === 1) return 'Besok';
        if (diffDays === 2) return 'Lusa';
        if (diffDays < 0) return `Lewat ${Math.abs(diffDays)} hari`;
        return `${diffDays} hari lagi`;
    },

    // Hitung sisa hari
    getDaysRemaining(date) {
        const now = moment().tz(config.timezone).startOf('day');
        const target = moment(date).tz(config.timezone).startOf('day');
        return target.diff(now, 'days');
    },

    // Cek apakah deadline H-1
    isDeadlineTomorrow(date) {
        return this.getDaysRemaining(date) === 1;
    },

    // Cek apakah deadline hari ini
    isDeadlineToday(date) {
        return this.getDaysRemaining(date) === 0;
    },

    // Format nomor telepon
    formatPhoneNumber(number) {
        return number.replace(/[^0-9]/g, '').replace(/^0/, '62');
    },

    // Cek apakah user adalah admin
    isAdmin(number) {
        const formattedNumber = this.formatPhoneNumber(number);
        return config.adminNumbers.some(admin => 
            formattedNumber.includes(admin) || admin.includes(formattedNumber)
        );
    },

    // Cek apakah grup diizinkan
    isAllowedGroup(groupId) {
        if (config.allowedGroups.length === 0) return true;
        return config.allowedGroups.includes(groupId);
    },

    // Parse command dan args
    parseCommand(text) {
        const prefix = config.prefix;
        if (!text.startsWith(prefix)) return null;
        
        const args = text.slice(prefix.length).trim().split(/\s+/);
        const command = args.shift().toLowerCase();
        
        return { command, args, fullArgs: args.join(' ') };
    },

    // Parse command dengan separator |
    parsePipeArgs(text) {
        return text.split('|').map(arg => arg.trim()).filter(Boolean);
    },

    // Capitalize first letter
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },

    // Truncate text
    truncate(text, length = 100) {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    },

    // Generate ID unik
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Format list dengan nomor
    formatNumberedList(items, formatter = null) {
        return items.map((item, index) => {
            const formatted = formatter ? formatter(item, index) : item;
            return `${index + 1}. ${formatted}`;
        }).join('\n');
    },

    // Escape markdown WhatsApp
    escapeMarkdown(text) {
        return text.replace(/[_*\[\]()~`>#+=|{}.!-]/g, '\\$&');
    },

    // Sleep/delay
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // Random picker
    randomPick(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    // Shuffle array
    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    // Format durasi
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        const parts = [];
        if (hours > 0) parts.push(`${hours} jam`);
        if (minutes > 0) parts.push(`${minutes} menit`);
        if (secs > 0) parts.push(`${secs} detik`);
        
        return parts.join(' ');
    },

    // Validasi format tanggal (DD-MM-YYYY atau DD/MM/YYYY)
    isValidDate(dateStr) {
        const regex = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/;
        if (!regex.test(dateStr)) return false;
        
        const [_, day, month, year] = dateStr.match(regex);
        const date = new Date(year, month - 1, day);
        return date.getDate() == day && date.getMonth() == month - 1;
    },

    // Parse tanggal dari string
    parseDate(dateStr) {
        const formats = ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'YYYY/MM/DD'];
        for (const format of formats) {
            const parsed = moment(dateStr, format, true);
            if (parsed.isValid()) return parsed.toDate();
        }
        return null;
    },

    // Get hari ini dalam bahasa Indonesia
    getHariIni() {
        const hari = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
        return hari[new Date().getDay()];
    },

    // Quote motivasi
    getMotivasiQuotes() {
        return [
            "Jangan menyerah, setiap usaha ada hasilnya! 💪",
            "Belajar itu investasi masa depanmu 📚",
            "Kesuksesan dimulai dari disiplin 🎯",
            "Setiap hari adalah kesempatan baru ✨",
            "Tugas selesai, main lebih tenang 🎮",
            "Kerjakan yang terbaik, hasil akan mengikuti 🌟",
            "Semangat! Deadline bukan akhir dunia 🚀",
            "Orang sukses tidak pernah menunda-nunda ⏰",
            "Fokus pada tujuanmu, bukan hambatannya 🏆",
            "Setiap langkah kecil membawamu lebih dekat ke impian 🌈",
            "Jangan takut gagal, takutlah untuk tidak mencoba 💫",
            "Kerja keras hari ini, santai esok hari 🌴",
            "Tetap semangat meski tugas menumpuk! 🔥",
            "Pendidikan adalah kunci membuka dunia 🗝️",
            "Sukses butuh proses, nikmati perjalanannya 🛤️"
        ];
    }
};

module.exports = helpers;
