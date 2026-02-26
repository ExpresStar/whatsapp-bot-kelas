const config = require('../../config/config');
const helpers = require('../utils/helpers');
const logger = require('../utils/logger');
const cooldown = require('../middleware/cooldown');
const auth = require('../middleware/auth');

class CommandHandler {
    constructor() {
        this.commands = new Map();
        this.aliases = new Map();
        this.middlewares = [];
        
        // Register default middlewares
        this.use(this.globalMiddleware.bind(this));
    }

    // Register middleware
    use(middleware) {
        this.middlewares.push(middleware);
    }

    // Global middleware
    async globalMiddleware(sock, message, command, args, next) {
        // Log command usage
        const sender = message.key.participant || message.key.remoteJid;
        const groupId = message.key.remoteJid;
        
        logger.logCommand(command, sender, groupId, true);
        
        // Apply cooldown
        return await cooldown.checkCooldown(sock, message, command, next);
    }

    // Register command
    register(name, handler, options = {}) {
        const command = {
            name: name.toLowerCase(),
            handler,
            description: options.description || 'Tidak ada deskripsi',
            usage: options.usage || `${config.prefix}${name}`,
            category: options.category || 'Umum',
            aliases: options.aliases || [],
            adminOnly: options.adminOnly || false,
            groupOnly: options.groupOnly || false,
            cooldown: options.cooldown !== false,
            middlewares: options.middlewares || []
        };

        this.commands.set(command.name, command);

        // Register aliases
        command.aliases.forEach(alias => {
            this.aliases.set(alias.toLowerCase(), command.name);
        });

        logger.debug(`Registered command: ${command.name}`);
    }

    // Get command
    getCommand(name) {
        const commandName = name.toLowerCase();
        const actualName = this.aliases.get(commandName) || commandName;
        return this.commands.get(actualName);
    }

    // Check if command exists
    hasCommand(name) {
        const commandName = name.toLowerCase();
        return this.commands.has(commandName) || this.aliases.has(commandName);
    }

    // Execute command
    async execute(sock, message, commandName, args) {
        const command = this.getCommand(commandName);
        
        if (!command) {
            return false;
        }

        try {
            // Check group only
            if (command.groupOnly && !auth.isGroup(message)) {
                await sock.sendMessage(message.key.remoteJid, {
                    text: config.messages.groupOnly
                }, { quoted: message });
                return true;
            }

            // Check admin only
            if (command.adminOnly) {
                const sender = message.key.participant || message.key.remoteJid;
                const groupId = message.key.remoteJid;
                
                const isBotAdmin = auth.isBotAdmin(sender);
                const isGroupAdmin = auth.isGroup(message) ? 
                    await auth.isGroupAdmin(sock, groupId, sender) : false;
                
                if (!isBotAdmin && !isGroupAdmin) {
                    await sock.sendMessage(message.key.remoteJid, {
                        text: config.messages.adminOnly,
                        mentions: [sender]
                    }, { quoted: message });
                    return true;
                }
            }

            // Execute middlewares
            const executeHandler = async () => {
                await command.handler(sock, message, args);
            };

            // Apply command-specific middlewares
            let finalHandler = executeHandler;
            for (const middleware of [...command.middlewares].reverse()) {
                const next = finalHandler;
                finalHandler = async () => await middleware(sock, message, command.name, args, next);
            }

            // Apply global middleware
            await this.globalMiddleware(sock, message, command.name, args, finalHandler);
            
            return true;
            
        } catch (error) {
            logger.error(`Error executing command ${commandName}:`, error.message);
            
            const sender = message.key.participant || message.key.remoteJid;
            const groupId = message.key.remoteJid;
            logger.logCommand(commandName, sender, groupId, false, error);
            
            await sock.sendMessage(message.key.remoteJid, {
                text: config.messages.error
            }, { quoted: message });
            
            return true;
        }
    }

    // Get all commands
    getAllCommands() {
        return Array.from(this.commands.values());
    }

    // Get commands by category
    getCommandsByCategory(category) {
        return this.getAllCommands().filter(cmd => 
            cmd.category.toLowerCase() === category.toLowerCase()
        );
    }

    // Get categories
    getCategories() {
        const categories = new Set();
        this.commands.forEach(cmd => categories.add(cmd.category));
        return Array.from(categories);
    }

    // Get help text
    getHelpText(commandName = null) {
        if (commandName) {
            const command = this.getCommand(commandName);
            if (!command) {
                return `❌ Command *${commandName}* tidak ditemukan.`;
            }

            let text = `📖 *Bantuan: ${helpers.capitalize(command.name)}*\n\n`;
            text += `*Deskripsi:* ${command.description}\n`;
            text += `*Penggunaan:* \`${command.usage}\`\n`;
            text += `*Kategori:* ${command.category}\n`;
            
            if (command.aliases.length > 0) {
                text += `*Alias:* ${command.aliases.join(', ')}\n`;
            }
            
            if (command.adminOnly) {
                text += `\n⚠️ *Command ini hanya untuk admin*\n`;
            }
            
            return text;
        }

        // General help
        let text = `🤖 *${config.botName}*\n\n`;
        text += `Halo! Saya adalah bot untuk membantu manajemen kelas.\n`;
        text += `Gunakan \`${config.prefix}help <command>\` untuk detail command.\n\n`;
        text += `*Daftar Command:*\n\n`;

        const categories = this.getCategories();
        categories.forEach(category => {
            const commands = this.getCommandsByCategory(category);
            text += `*${category}:*\n`;
            commands.forEach(cmd => {
                const adminBadge = cmd.adminOnly ? ' 👤' : '';
                text += `  • \`${config.prefix}${cmd.name}\` - ${cmd.description}${adminBadge}\n`;
            });
            text += '\n';
        });

        text += `\n💡 *Tips:*\n`;
        text += `• Gunakan \`${config.prefix}help <command>\` untuk detail\n`;
        text += `• 👤 = Khusus admin\n`;
        text += `• Jangan spam command!\n`;

        return text;
    }

    // Reload commands (for development)
    reload() {
        this.commands.clear();
        this.aliases.clear();
        logger.info('Commands reloaded');
    }
}

module.exports = new CommandHandler();
