const { 
    default: makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState,
    fetchLatestBaileysVersion 
} = require('@whiskeysockets/baileys');
const P = require('pino');
const qrcode = require('qrcode-terminal');
const path = require('path');

const config = require('../config/config');
const database = require('./database/Database');
const logger = require('./utils/logger');
const CommandHandler = require('./handlers/CommandHandler');
const MessageHandler = require('./handlers/MessageHandler');
const ReminderService = require('./services/ReminderService');

// Import commands
const tugasCommands = require('./commands/tugas');
const infoCommands = require('./commands/info');
const aiCommands = require('./commands/ai');
const utilCommands = require('./commands/utils');

class WhatsAppBot {
    constructor() {
        this.sock = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    async initialize() {
        try {
            logger.info('=================================');
            logger.info(`  ${config.botName} v1.0.0`);
            logger.info('  Starting initialization...');
            logger.info('=================================');

            // Initialize database
            await database.connect();

            // Register commands
            this.registerCommands();

            // Start WhatsApp connection
            await this.connectWhatsApp();

        } catch (error) {
            logger.error('Initialization error:', error.message);
            process.exit(1);
        }
    }

    async connectWhatsApp() {
        try {
            // Auth state
            const { state, saveCreds } = await useMultiFileAuthState(
                path.join(process.cwd(), config.sessionPath)
            );

            // Get latest Baileys version
            const { version, isLatest } = await fetchLatestBaileysVersion();
            logger.info(`Using Baileys v${version.join('.')}, isLatest: ${isLatest}`);

            // Create socket
            this.sock = makeWASocket({
                version,
                logger: P({ level: 'silent' }),
                printQRInTerminal: true,
                auth: state,
                browser: ['Bot Kelas SMA', 'Chrome', '1.0.0'],
                generateHighQualityLinkPreview: true,
                syncFullHistory: false,
                markOnlineOnConnect: true,
                keepAliveIntervalMs: 30000
            });

            // Connection handler
            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    logger.info('QR Code received. Scan with your phone!');
                    qrcode.generate(qr, { small: true });
                }

                if (connection === 'close') {
                    const shouldReconnect = 
                        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

                    logger.warn(`Connection closed. Reason: ${lastDisconnect?.error?.message || 'Unknown'}`);
                    
                    if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.reconnectAttempts++;
                        logger.info(`Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                        await this.connectWhatsApp();
                    } else {
                        logger.error('Max reconnection attempts reached or logged out');
                        process.exit(1);
                    }
                }

                if (connection === 'open') {
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    logger.info('=================================');
                    logger.info('  WhatsApp Connected!');
                    logger.info(`  User: ${this.sock.user.id}`);
                    logger.info(`  Name: ${this.sock.user.name}`);
                    logger.info('=================================');

                    // Start reminder service
                    ReminderService.start(this.sock);
                }
            });

            // Credentials update
            this.sock.ev.on('creds.update', saveCreds);

            // Message handler
            this.sock.ev.on('messages.upsert', async (event) => {
  const msg = event.messages[0];
  if (!msg.message) return;

const textMessage =
  msg.message.conversation ||
  msg.message.extendedTextMessage?.text ||
  '';

if (!message.startsWith('!')) return;

const args = message.trim().split(/ +/);
const command = args.shift().slice(1).toLowerCase();

console.log("Command:", command);


if (command === 'ping') {
  await sock.sendMessage(msg.key.remoteJid, { text: 'Pong!' });
}

  console.log("Incoming message:", msg);
});

            // Group participant updates
            this.sock.ev.on('group-participants.update', async (update) => {
                await MessageHandler.handleGroupParticipantUpdate(this.sock, update);
            });

        } catch (error) {
            logger.error('Connection error:', error.message);
            throw error;
        }
    }

    registerCommands() {
        logger.info('Registering commands...');

        // Tugas Commands
        CommandHandler.register('tambah_tugas', tugasCommands.tambahTugas, {
            description: 'Tambah tugas baru',
            usage: `${config.prefix}tambah_tugas Mapel | Deskripsi | DD-MM-YYYY`,
            category: 'Tugas',
            aliases: ['addtugas', 'tambahtugas'],
            adminOnly: true,
            groupOnly: true
        });

        CommandHandler.register('list_tugas', tugasCommands.listTugas, {
            description: 'Lihat daftar semua tugas',
            usage: `${config.prefix}list_tugas`,
            category: 'Tugas',
            aliases: ['tugas', 'daftartugas', 'lihattugas'],
            groupOnly: true
        });

        CommandHandler.register('hapus_tugas', tugasCommands.hapusTugas, {
            description: 'Hapus tugas berdasarkan nomor',
            usage: `${config.prefix}hapus_tugas <nomor>`,
            category: 'Tugas',
            aliases: ['deletetugas', 'hapustugas'],
            adminOnly: true,
            groupOnly: true
        });

        CommandHandler.register('deadline', tugasCommands.deadline, {
            description: 'Lihat deadline tugas terdekat',
            usage: `${config.prefix}deadline`,
            category: 'Tugas',
            aliases: ['deadlineterdekat', 'tugasmendesak'],
            groupOnly: true
        });

        CommandHandler.register('edit_tugas', tugasCommands.editTugas, {
            description: 'Edit tugas yang sudah ada',
            usage: `${config.prefix}edit_tugas <nomor> | field | nilai`,
            category: 'Tugas',
            aliases: ['edittugas', 'updatetugas'],
            adminOnly: true,
            groupOnly: true
        });

        // Info Commands
        CommandHandler.register('jadwal', infoCommands.jadwal, {
            description: 'Lihat jadwal pelajaran',
            usage: `${config.prefix}jadwal [hari]`,
            category: 'Info Kelas',
            aliases: ['schedule', 'pelajaran'],
            groupOnly: true
        });

        CommandHandler.register('pengumuman', infoCommands.pengumuman, {
            description: 'Lihat pengumuman terbaru',
            usage: `${config.prefix}pengumuman`,
            category: 'Info Kelas',
            aliases: ['announcement', 'info'],
            groupOnly: true
        });

        CommandHandler.register('tambah_pengumuman', infoCommands.tambahPengumuman, {
            description: 'Tambah pengumuman baru',
            usage: `${config.prefix}tambah_pengumuman Judul | Isi`,
            category: 'Info Kelas',
            aliases: ['addpengumuman'],
            adminOnly: true,
            groupOnly: true
        });

        CommandHandler.register('guru', infoCommands.guru, {
            description: 'Info guru dan kontak',
            usage: `${config.prefix}guru [mapel]`,
            category: 'Info Kelas',
            aliases: ['teacher', 'dataguru'],
            groupOnly: true
        });

        CommandHandler.register('kontak_kelas', infoCommands.kontakKelas, {
            description: 'Info kontak kelas',
            usage: `${config.prefix}kontak_kelas`,
            category: 'Info Kelas',
            aliases: ['kontak', 'anggotakelas'],
            groupOnly: true
        });

        // AI Commands
        CommandHandler.register('jawab', aiCommands.jawab, {
            description: 'Tanya jawab dengan AI',
            usage: `${config.prefix}jawab <pertanyaan>`,
            category: 'AI Assistant',
            aliases: ['ask', 'tanya', 'ai']
        });

        CommandHandler.register('ringkas', aiCommands.ringkas, {
            description: 'Ringkas teks panjang',
            usage: `${config.prefix}ringkas <teks>`,
            category: 'AI Assistant',
            aliases: ['summarize', 'summary']
        });

        CommandHandler.register('arti', aiCommands.arti, {
            description: 'Cari arti kata (kamus)',
            usage: `${config.prefix}arti <kata>`,
            category: 'AI Assistant',
            aliases: ['kamus', 'definisi', 'dictionary']
        });

        // Utility Commands
        CommandHandler.register('cuaca', utilCommands.cuaca, {
            description: 'Cek cuaca kota',
            usage: `${config.prefix}cuaca <kota>`,
            category: 'Utilitas',
            aliases: ['weather']
        });

        CommandHandler.register('tanggal', utilCommands.tanggal, {
            description: 'Info tanggal dan waktu',
            usage: `${config.prefix}tanggal`,
            category: 'Utilitas',
            aliases: ['date', 'waktu', 'jam']
        });

        CommandHandler.register('motivasi', utilCommands.motivasi, {
            description: 'Quote motivasi harian',
            usage: `${config.prefix}motivasi`,
            category: 'Utilitas',
            aliases: ['quote', 'inspirasi']
        });

        CommandHandler.register('random_anggota', utilCommands.randomAnggota, {
            description: 'Pilih anggota grup acak',
            usage: `${config.prefix}random_anggota [jumlah]`,
            category: 'Utilitas',
            aliases: ['random', 'pick', 'acak'],
            groupOnly: true
        });

        CommandHandler.register('ping', utilCommands.ping, {
            description: 'Cek status bot',
            usage: `${config.prefix}ping`,
            category: 'Utilitas',
            aliases: ['status', 'cek'],
            cooldown: false
        });

        CommandHandler.register('info', utilCommands.info, {
            description: 'Info tentang bot',
            usage: `${config.prefix}info`,
            category: 'Utilitas',
            aliases: ['about', 'botinfo']
        });

        CommandHandler.register('menu', utilCommands.menu, {
            description: 'Tampilkan menu bantuan',
            usage: `${config.prefix}menu [command]`,
            category: 'Utilitas',
            aliases: ['help', 'bantuan', 'start'],
            cooldown: false
        });

        // Admin Commands
        CommandHandler.register('cek_reminder', (sock, msg, args) => {
            ReminderService.manualCheck(sock, msg);
        }, {
            description: 'Cek deadline manual (admin)',
            usage: `${config.prefix}cek_reminder`,
            category: 'Admin',
            adminOnly: true,
            groupOnly: true
        });

        logger.info(`Registered ${CommandHandler.getAllCommands().length} commands`);
    }

    // Graceful shutdown
    async shutdown() {
        logger.info('Shutting down bot...');
        
        ReminderService.stop();
        
        if (this.sock) {
            await this.sock.logout();
        }
        
        process.exit(0);
    }
}

// Create bot instance
const bot = new WhatsAppBot();

// Handle process signals
process.on('SIGINT', () => bot.shutdown());
process.on('SIGTERM', () => bot.shutdown());

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error.message);
    bot.shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the bot
bot.initialize();
