import dbClient from '../utils/db'
import redisClient from '../utils/redis'
const getStatus = async (req, res) => {
    /**
     * Checks live status of Redis and MongoDB clients.
     */
    const redisAlive = redisClient.isAlive()
    const dbAlive = dbClient.isAlive()
    res.status(200).json({ "redis": redisAlive, "db": dbAlive })
    return
}

const getStats = async (req, res) => {
    /**
     * Gets statistics on MongoDB and redis collections.
     */
    res.status(200).json({
        "users": dbClient.nbUsers(),
        "files": dbClient.nbFiles()
    })
    return;
}

export { getStats, getStatus }