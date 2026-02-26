const axios = require('axios');
const config = require('../../config/config');
const helpers = require('../utils/helpers');
const logger = require('../utils/logger');

const aiCommands = {
    // AI Chat dengan Gemini/OpenAI
    async jawab(sock, message, args) {
        const groupId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;

        if (args.length === 0) {
            return await sock.sendMessage(groupId, {
                text: `❌ *Format Salah*\n\n` +
                      `Gunakan: \`${config.prefix}jawab <pertanyaan>\`\n\n` +
                      `Contoh:\n` +
                      `\`${config.prefix}jawab Apa itu fotosintesis?\`\n` +
                      `\`${config.prefix}jawab Jelaskan teorema Pythagoras\``,
                mentions: [sender]
            }, { quoted: message });
        }

        const pertanyaan = args.join(' ');

        // Send typing indicator
        await sock.sendPresenceUpdate('composing', groupId);

        try {
            let jawaban = '';

            // Try Gemini first, fallback to OpenAI
            if (config.geminiApiKey) {
                jawaban = await this.askGemini(pertanyaan);
            } else if (config.openaiApiKey) {
                jawaban = await this.askOpenAI(pertanyaan);
            } else {
                // Fallback to simple response
                jawaban = `Maaf, fitur AI belum dikonfigurasi.\n\n` +
                         `Silakan tambahkan API key di file .env:\n` +
                         `- GEMINI_API_KEY (dari makersuite.google.com)\n` +
                         `- atau OPENAI_API_KEY (dari platform.openai.com)`;
            }

            // Stop typing indicator
            await sock.sendPresenceUpdate('paused', groupId);

            let response = `🤖 *AI Assistant*\n\n`;
            response += `*Pertanyaan:* ${pertanyaan}\n\n`;
            response += `*Jawaban:*\n${jawaban}\n\n`;
            response += `⚠️ *Catatan:* Jawaban AI mungkin tidak selalu akurat.`;

            await sock.sendMessage(groupId, {
                text: response,
                mentions: [sender]
            }, { quoted: message });

        } catch (error) {
            await sock.sendPresenceUpdate('paused', groupId);
            logger.error('Error in AI response:', error.message);
            
            await sock.sendMessage(groupId, {
                text: `❌ *Gagal Mendapatkan Jawaban*\n\n` +
                      `Maaf, terjadi kesalahan saat memproses pertanyaan.\n` +
                      `Silakan coba lagi nanti.`,
                mentions: [sender]
            }, { quoted: message });
        }
    },

    // Ask Gemini API
    async askGemini(question) {
        try {
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config.geminiApiKey}`,
                {
                    contents: [{
                        parts: [{
                            text: `Kamu adalah asisten untuk siswa SMA. Jawab dengan singkat, jelas, dan mudah dipahami.\n\nPertanyaan: ${question}`
                        }]
                    }]
                },
                {
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            if (response.data.candidates && response.data.candidates[0]) {
                return response.data.candidates[0].content.parts[0].text;
            }
            
            throw new Error('No response from Gemini');
        } catch (error) {
            logger.error('Gemini API error:', error.response?.data || error.message);
            throw error;
        }
    },

    // Ask OpenAI API
    async askOpenAI(question) {
        try {
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: 'Kamu adalah asisten untuk siswa SMA. Jawab dengan singkat, jelas, dan mudah dipahami dalam Bahasa Indonesia.'
                        },
                        {
                            role: 'user',
                            content: question
                        }
                    ],
                    max_tokens: 500,
                    temperature: 0.7
                },
                {
                    headers: {
                        'Authorization': `Bearer ${config.openaiApiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data.choices[0].message.content;
        } catch (error) {
            logger.error('OpenAI API error:', error.message);
            throw error;
        }
    },

    // Ringkas teks
    async ringkas(sock, message, args) {
        const groupId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;

        if (args.length === 0) {
            return await sock.sendMessage(groupId, {
                text: `❌ *Format Salah*\n\n` +
                      `Gunakan: \`${config.prefix}ringkas <teks>\`\n\n` +
                      `Contoh:\n` +
                      `\`${config.prefix}ringkas Fotosintesis adalah proses dimana tumbuhan...\``,
                mentions: [sender]
            }, { quoted: message });
        }

        const teks = args.join(' ');

        if (teks.length < 50) {
            return await sock.sendMessage(groupId, {
                text: `❌ *Teks Terlalu Pendek*\n\n` +
                      `Teks minimal 50 karakter untuk diringkas.\n` +
                      `Panjang teks saat ini: ${teks.length} karakter.`,
                mentions: [sender]
            }, { quoted: message });
        }

        await sock.sendPresenceUpdate('composing', groupId);

        try {
            let ringkasan = '';

            if (config.geminiApiKey) {
                ringkasan = await this.askGemini(`Ringkas teks berikut dalam 2-3 kalimat:\n\n${teks}`);
            } else if (config.openaiApiKey) {
                ringkasan = await this.askOpenAI(`Ringkas teks berikut dalam 2-3 kalimat:\n\n${teks}`);
            } else {
                // Simple summary without AI
                const sentences = teks.split(/[.!?]+/).filter(s => s.trim().length > 0);
                ringkasan = sentences.slice(0, 2).join('. ') + '.';
                if (sentences.length > 2) {
                    ringkasan += '\n\n(Diperlukan API key untuk ringkasan yang lebih baik)';
                }
            }

            await sock.sendPresenceUpdate('paused', groupId);

            let response = `📝 *Ringkasan*\n\n`;
            response += `*Teks Asli:*\n${helpers.truncate(teks, 200)}...\n\n`;
            response += `*Ringkasan:*\n${ringkasan}`;

            await sock.sendMessage(groupId, {
                text: response,
                mentions: [sender]
            }, { quoted: message });

        } catch (error) {
            await sock.sendPresenceUpdate('paused', groupId);
            logger.error('Error summarizing:', error.message);
            
            await sock.sendMessage(groupId, {
                text: config.messages.error,
                mentions: [sender]
            }, { quoted: message });
        }
    },

    // Cari arti kata (Kamus)
    async arti(sock, message, args) {
        const groupId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;

        if (args.length === 0) {
            return await sock.sendMessage(groupId, {
                text: `❌ *Format Salah*\n\n` +
                      `Gunakan: \`${config.prefix}arti <kata>\`\n\n` +
                      `Contoh:\n` +
                      `\`${config.prefix}arti fotosintesis\`\n` +
                      `\`${config.prefix}arti revolusi\``,
                mentions: [sender]
            }, { quoted: message });
        }

        const kata = args.join(' ').toLowerCase();

        try {
            // Try to get definition from API or use AI
            let definisi = '';
            
            if (config.geminiApiKey || config.openaiApiKey) {
                await sock.sendPresenceUpdate('composing', groupId);
                
                const prompt = `Berikan definisi singkat dan jelas untuk kata "${kata}" dalam Bahasa Indonesia. Sertakan contoh penggunaan.`;
                
                if (config.geminiApiKey) {
                    definisi = await this.askGemini(prompt);
                } else {
                    definisi = await this.askOpenAI(prompt);
                }
                
                await sock.sendPresenceUpdate('paused', groupId);
            } else {
                // Fallback
                definisi = `Definisi untuk "${kata}" tidak tersedia dalam database lokal.\n\n` +
                          `Silakan tambahkan API key AI di file .env untuk fitur kamus lengkap.`;
            }

            let response = `📖 *Kamus*\n\n`;
            response += `*Kata:* ${kata}\n\n`;
            response += `*Definisi:*\n${definisi}`;

            await sock.sendMessage(groupId, {
                text: response,
                mentions: [sender]
            }, { quoted: message });

        } catch (error) {
            await sock.sendPresenceUpdate('paused', groupId);
            logger.error('Error getting definition:', error.message);
            
            await sock.sendMessage(groupId, {
                text: config.messages.error,
                mentions: [sender]
            }, { quoted: message });
        }
    }
};

// Bind all methods to aiCommands object to preserve 'this' context
for (const key of Object.keys(aiCommands)) {
    if (typeof aiCommands[key] === 'function') {
        aiCommands[key] = aiCommands[key].bind(aiCommands);
    }
}

module.exports = aiCommands;
