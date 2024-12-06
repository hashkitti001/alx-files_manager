import sha1 from 'sha1';
import { Request } from 'express';
import mongoDBCore from 'mongodb/lib/core';
import dbClient from './db';
import redisClient from './redis';

export const getUserFromXToken = async (req) => {
    const token = req.headers['x-token'];
  
    if (!token) {
      return null;
    }
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return null;
    }
    const user = await (await dbClient.usersCollection())
      .findOne({ _id: new mongoDBCore.BSON.ObjectId(userId) });
      return user || null;
  };
  
  export default {
    getUserFromXToken: async (req) => getUserFromXToken(req),
  };