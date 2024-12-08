import dbClient from "../utils/db"
import { v4 } from "uuid"
import sha1 from "sha1"
import redisClient from "../utils/redis"
import Buffer from 'node:buffer'

const getConnect = async (req, res) => {
    /**
     * Sign-in the user by generating a new authentication token.
     */
    const token = req.headers.authorization.split(" ")[1]
    const userDeets = Buffer.from(token, 'base64').toString()
    const [email, password] = userDeets.split(":")
    const userExists = await dbClient.db().collection("users").findOne({
         email,
         password: sha1(password)
        })
    if (!userExists) {
        res.status(401).json({ "error": "Unauthorized" })
        return
    }
    const randomString = v4()
    const userKey = `auth_${randomString}`
    await redisClient.set(userKey, 24 * 3600, userExists._id)
    res.status(200).json({ "token": randomString })
}

const getDisconnect = async (req, res) => {
    /**
     *  Signs out the user based on the token.
     */
    const token = req.headers['x-token'];

    await redisClient.del(`auth_${token}`);
    res.status(204).send();
}

export {getConnect, getDisconnect}