const config = require('../../config/config');
const CommandHandler = require('./CommandHandler');

class MessageHandler {
    constructor() {
        this.stats = {
            messagesReceived: 0,
            commandsExecuted: 0,
            errors: 0
        };
    }

    async handle(sock, message) {
        try {
            if (!message || !message.message) return;
            if (message.key.fromMe) return;

            this.stats.messagesReceived++;

            const text =
                message.message.conversation ||
                message.message.extendedTextMessage?.text ||
                message.message.imageMessage?.caption ||
                null;

            if (!text) return;

            if (!text.startsWith(config.prefix)) return;

            const args = text
                .slice(config.prefix.length)
                .trim()
                .split(/\s+/);

            const commandName = args.shift().toLowerCase();

            await CommandHandler.execute(
                sock,
                message,
                commandName,
                args
            );

            this.stats.commandsExecuted++;

        } catch (error) {
            this.stats.errors++;
            console.error("MessageHandler Error:", error);
        }
    }
}

module.exports = new MessageHandler();
