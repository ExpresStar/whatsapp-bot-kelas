const fs = require('fs-extra');
const path = require('path');
const mongoose = require('mongoose');
const config = require('../../config/config');
const logger = require('../utils/logger');

class Database {
    constructor() {
        this.mode = config.dbMode;
        this.dataPath = config.dataPath;
        this.ensureDirectories();
    }

    ensureDirectories() {
        if (this.mode === 'json') {
            fs.ensureDirSync(this.dataPath);
            ['tugas', 'jadwal', 'pengumuman', 'users', 'logs'].forEach(dir => {
                fs.ensureDirSync(path.join(this.dataPath, dir));
            });
        }
    }

    async connect() {
        if (this.mode === 'mongodb') {
            try {
                await mongoose.connect(config.mongodbUri);
                logger.info('Terhubung ke MongoDB');
            } catch (error) {
                logger.error('Gagal terhubung ke MongoDB:', error.message);
                logger.info('Beralih ke mode JSON...');
                this.mode = 'json';
                this.ensureDirectories();
            }
        } else {
            logger.info('Menggunakan database JSON');
        }
    }

    // Generic CRUD for JSON
    async readJSON(collection, id = null) {
        const filePath = path.join(this.dataPath, collection, `${id || 'data'}.json`);
        try {
            if (await fs.pathExists(filePath)) {
                return await fs.readJson(filePath);
            }
            return id ? null : [];
        } catch (error) {
            logger.error(`Error reading JSON ${collection}:`, error.message);
            return id ? null : [];
        }
    }

    async writeJSON(collection, data, id = null) {
        const filePath = path.join(this.dataPath, collection, `${id || 'data'}.json`);
        try {
            await fs.writeJson(filePath, data, { spaces: 2 });
            return true;
        } catch (error) {
            logger.error(`Error writing JSON ${collection}:`, error.message);
            return false;
        }
    }

    // Tugas Operations
    async getTugas(groupId = null) {
        if (this.mode === 'mongodb') {
            return await Tugas.find(groupId ? { groupId } : {}).sort({ deadline: 1 });
        }
        const tugas = await this.readJSON('tugas');
        return groupId ? tugas.filter(t => t.groupId === groupId) : tugas;
    }

    async addTugas(tugasData) {
        if (this.mode === 'mongodb') {
            const tugas = new Tugas(tugasData);
            return await tugas.save();
        }
        const tugas = await this.readJSON('tugas');
        const newTugas = {
            id: Date.now().toString(),
            ...tugasData,
            createdAt: new Date().toISOString(),
            reminded: false
        };
        tugas.push(newTugas);
        await this.writeJSON('tugas', tugas);
        return newTugas;
    }

    async deleteTugas(id, groupId = null) {
        if (this.mode === 'mongodb') {
            return await Tugas.findOneAndDelete({ id, groupId });
        }
        let tugas = await this.readJSON('tugas');
        const index = tugas.findIndex(t => t.id === id && (!groupId || t.groupId === groupId));
        if (index !== -1) {
            const deleted = tugas[index];
            tugas.splice(index, 1);
            await this.writeJSON('tugas', tugas);
            return deleted;
        }
        return null;
    }

    async updateTugas(id, updateData) {
        if (this.mode === 'mongodb') {
            return await Tugas.findOneAndUpdate({ id }, updateData, { new: true });
        }
        let tugas = await this.readJSON('tugas');
        const index = tugas.findIndex(t => t.id === id);
        if (index !== -1) {
            tugas[index] = { ...tugas[index], ...updateData };
            await this.writeJSON('tugas', tugas);
            return tugas[index];
        }
        return null;
    }

    // Jadwal Operations
    async getJadwal(groupId) {
        if (this.mode === 'mongodb') {
            return await Jadwal.findOne({ groupId });
        }
        return await this.readJSON('jadwal', groupId);
    }

    async setJadwal(groupId, jadwalData) {
        if (this.mode === 'mongodb') {
            return await Jadwal.findOneAndUpdate(
                { groupId },
                { groupId, ...jadwalData },
                { upsert: true, new: true }
            );
        }
        await this.writeJSON('jadwal', { groupId, ...jadwalData }, groupId);
        return { groupId, ...jadwalData };
    }

    // Pengumuman Operations
    async getPengumuman(groupId) {
        if (this.mode === 'mongodb') {
            return await Pengumuman.find({ groupId }).sort({ createdAt: -1 });
        }
        const pengumuman = await this.readJSON('pengumuman');
        return pengumuman.filter(p => p.groupId === groupId).sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );
    }

    async addPengumuman(data) {
        if (this.mode === 'mongodb') {
            const pengumuman = new Pengumuman(data);
            return await pengumuman.save();
        }
        const pengumuman = await this.readJSON('pengumuman');
        const newPengumuman = {
            id: Date.now().toString(),
            ...data,
            createdAt: new Date().toISOString()
        };
        pengumuman.push(newPengumuman);
        await this.writeJSON('pengumuman', pengumuman);
        return newPengumuman;
    }

    // User Operations
    async getUser(phone) {
        if (this.mode === 'mongodb') {
            return await User.findOne({ phone });
        }
        const users = await this.readJSON('users');
        return users.find(u => u.phone === phone);
    }

    async saveUser(userData) {
        if (this.mode === 'mongodb') {
            return await User.findOneAndUpdate(
                { phone: userData.phone },
                userData,
                { upsert: true, new: true }
            );
        }
        const users = await this.readJSON('users');
        const index = users.findIndex(u => u.phone === userData.phone);
        if (index !== -1) {
            users[index] = { ...users[index], ...userData };
        } else {
            users.push({ ...userData, createdAt: new Date().toISOString() });
        }
        await this.writeJSON('users', users);
        return userData;
    }
}

// MongoDB Schemas
const tugasSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    groupId: { type: String, required: true },
    mapel: { type: String, required: true },
    deskripsi: { type: String, required: true },
    deadline: { type: Date, required: true },
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    reminded: { type: Boolean, default: false }
});

const jadwalSchema = new mongoose.Schema({
    groupId: { type: String, required: true, unique: true },
    senin: [{ mapel: String, jam: String }],
    selasa: [{ mapel: String, jam: String }],
    rabu: [{ mapel: String, jam: String }],
    kamis: [{ mapel: String, jam: String }],
    jumat: [{ mapel: String, jam: String }],
    sabtu: [{ mapel: String, jam: String }],
    updatedAt: { type: Date, default: Date.now }
});

const pengumumanSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    groupId: { type: String, required: true },
    judul: { type: String, required: true },
    isi: { type: String, required: true },
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
    phone: { type: String, required: true, unique: true },
    name: { type: String },
    role: { type: String, default: 'siswa' },
    isAdmin: { type: Boolean, default: false },
    groups: [{ type: String }],
    lastActive: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

const Tugas = mongoose.model('Tugas', tugasSchema);
const Jadwal = mongoose.model('Jadwal', jadwalSchema);
const Pengumuman = mongoose.model('Pengumuman', pengumumanSchema);
const User = mongoose.model('User', userSchema);

module.exports = new Database();
