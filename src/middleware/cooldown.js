const NodeCache = require('node-cache');
const config = require('../../config/config');
const logger = require('../utils/logger');

class CooldownMiddleware {
    constructor() {
        // Cache dengan TTL sesuai konfigurasi
        this.cache = new NodeCache({ 
            stdTTL: config.cooldownSeconds,
            checkperiod: 120
        });
        
        // Whitelist untuk command tertentu yang tidak perlu cooldown
        this.whitelistedCommands = ['help', 'menu', 'ping'];
    }

    // Middleware function
    async checkCooldown(sock, message, command, next) {
        try {
            // Skip cooldown untuk whitelisted commands
            if (this.whitelistedCommands.includes(command)) {
                return await next();
            }

            const sender = message.key.participant || message.key.remoteJid;
            const cooldownKey = `${sender}_${command}`;
            
            // Cek apakah user sedang cooldown
            if (this.cache.has(cooldownKey)) {
                const remaining = this.cache.getTtl(cooldownKey);
                const secondsLeft = Math.ceil((remaining - Date.now()) / 1000);
                
                logger.debug(`Cooldown active for ${sender} on command ${command}`);
                
                await sock.sendMessage(message.key.remoteJid, {
                    text: config.messages.cooldown.replace('{seconds}', secondsLeft),
                    mentions: [sender]
                }, { quoted: message });
                
                return false;
            }

            // Set cooldown untuk user ini
            this.cache.set(cooldownKey, true);
            
            // Lanjutkan ke handler
            return await next();
            
        } catch (error) {
            logger.error('Error in cooldown middleware:', error.message);
            return await next(); // Lanjutkan meski error
        }
    }

    // Clear cooldown untuk user tertentu (untuk admin)
    clearCooldown(userId, command = null) {
        if (command) {
            const cooldownKey = `${userId}_${command}`;
            this.cache.del(cooldownKey);
        } else {
            // Clear semua cooldown untuk user ini
            const keys = this.cache.keys().filter(key => key.startsWith(`${userId}_`));
            this.cache.del(keys);
        }
    }

    // Get cooldown info
    getCooldownInfo(userId, command) {
        const cooldownKey = `${userId}_${command}`;
        const ttl = this.cache.getTtl(cooldownKey);
        
        if (!ttl) return null;
        
        return {
            active: true,
            remainingSeconds: Math.ceil((ttl - Date.now()) / 1000),
            expiresAt: new Date(ttl)
        };
    }

    // Get stats
    getStats() {
        return {
            totalCooldowns: this.cache.keys().length,
            keys: this.cache.keys()
        };
    }
}

module.exports = new CooldownMiddleware();
