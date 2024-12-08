import mongoDBCore from 'mongodb/lib/core';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

/**
 * Retrieve a user based on the x-token header.
 */
export const getUserFromXToken = async (req) => {
    const token = req.headers['x-token'];
    if (!token) return null;

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return null;

    const user = await dbClient.db().collection('users')
        .findOne({ _id: new mongoDBCore.BSON.ObjectId(userId) });
    return user || null;
};

/**
 * Middleware for X-Token authentication.
 */
export const xTokenAuthenticate = async (req, res, next) => {
    try {
        const user = await getUserFromXToken(req);

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        req.user = user;
        next();
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export default xTokenAuthenticate;
