import { JSONFilePreset } from 'lowdb/node';
import bcrypt from 'bcrypt';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../secrets/mychromadbadminusers.json');

const defaultData = { users: [] };
const db = await JSONFilePreset(dbPath, defaultData);

function userCreate(id, username, password, createdAt, error)
{
    return {
        id: id,
        username: username,
        password: password,
        createdAt: createdAt,
        error: error
    };
}
function userWithError(errorMessage) {
    return userCreate(null, null, null, null, errorMessage);
}

export const User = {
    async findOne(username) {
        const user = db.data.users.find(u => u.username === username.toLowerCase());
        return user || userWithError('User not found');
    },

    async findById(id) {
        const user = db.data.users.find(u => u.id === id);
        return user || userWithError('User not found');
    },

    async create(username, password) {
        const existingUser = await this.findOne(username.toLowerCase());
        if (existingUser.id) {
            return userWithError('Username already in use');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const now = new Date();
        const userId = randomUUID();
        const newUser = userCreate(userId /*now.getTime().toString()*/, username.toLowerCase(), hashedPassword, now.toISOString(), null);
        db.data.users.push(newUser);
        await db.write();
        return newUser;
    },

    // Passwort-Check
    async verifyPassword(user, password) {
        if (!user || !user.id) {
            return false;
        }
        return bcrypt.compare(password, user.password);
    },

    // async updateTokens(userId, byTokenCount) {
    //     const user = await this.findById(userId);
    //     if (!user || !user.id) {
    //         return userWithError('User not found');
    //     }
    //     user.tokens = Number(user.tokens) + Number(byTokenCount);
    //     if (user.tokens < 0) {
    //         user.tokens = 0;
    //     }
    //     await db.write();
    //     return user;
    // }
};