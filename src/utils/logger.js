const fs = require('fs-extra');
const path = require('path');
const config = require('../../config/config');

class Logger {
    constructor() {
        this.logLevel = config.logLevel;
        this.logToFile = config.logToFile;
        this.logsPath = config.logsPath;
        
        if (this.logToFile) {
            fs.ensureDirSync(this.logsPath);
        }
        
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
    }

    shouldLog(level) {
        return this.levels[level] <= this.levels[this.logLevel];
    }

    getTimestamp() {
        return new Date().toISOString();
    }

    formatMessage(level, message, meta = {}) {
        const timestamp = this.getTimestamp();
        const metaStr = Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}]: ${message}${metaStr}`;
    }

    async writeToFile(level, message) {
        if (!this.logToFile) return;
        
        const date = new Date().toISOString().split('T')[0];
        const logFile = path.join(this.logsPath, `${date}.log`);
        
        try {
            await fs.appendFile(logFile, message + '\n');
        } catch (error) {
            console.error('Error writing to log file:', error.message);
        }
    }

    log(level, message, meta = {}) {
        if (!this.shouldLog(level)) return;
        
        const formattedMessage = this.formatMessage(level, message, meta);
        
        // Console output with colors
        const colors = {
            error: '\x1b[31m', // Red
            warn: '\x1b[33m',  // Yellow
            info: '\x1b[36m',  // Cyan
            debug: '\x1b[35m', // Magenta
            reset: '\x1b[0m'
        };
        
        console.log(`${colors[level]}${formattedMessage}${colors.reset}`);
        
        // Write to file
        this.writeToFile(level, formattedMessage);
    }

    error(message, meta = {}) {
        this.log('error', message, meta);
    }

    warn(message, meta = {}) {
        this.log('warn', message, meta);
    }

    info(message, meta = {}) {
        this.log('info', message, meta);
    }

    debug(message, meta = {}) {
        this.log('debug', message, meta);
    }

    // Command logging
    logCommand(command, user, group, success = true, error = null) {
        const meta = {
            command,
            user: user?.split('@')[0] || 'unknown',
            group: group?.split('@')[0] || 'private',
            success
        };
        
        if (error) {
            meta.error = error.message;
            this.error(`Command failed: ${command}`, meta);
        } else {
            this.info(`Command executed: ${command}`, meta);
        }
    }

    // Activity logging
    logActivity(activity, details = {}) {
        this.info(`Activity: ${activity}`, details);
    }
}

module.exports = new Logger();
