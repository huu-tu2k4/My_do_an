import db from '../models/index';

const addRefreshToken = async (token, userId, expiresAt) => {
    try {
        return await db.RefreshToken.create({ token, userId, expiresAt: new Date(expiresAt), revoked: false });
    } catch (e) {
        return null;
    }
}

const removeRefreshToken = async (token) => {
    try {
        const rt = await db.RefreshToken.findOne({ where: { token } });
        if (!rt) return false;
        await rt.destroy();
        return true;
    } catch (e) {
        return false;
    }
}

const findByToken = async (token) => {
    try {
        const rt = await db.RefreshToken.findOne({ where: { token } });
        return rt || null;
    } catch (e) {
        return null;
    }
}

export { addRefreshToken, removeRefreshToken, findByToken };
