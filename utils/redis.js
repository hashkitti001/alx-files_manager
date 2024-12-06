import { createClient } from "redis";
import { promisify } from "util"

/**
 * Represents a Redis client.
 */
class RedisClient {
    /**
     * Creates a new instance of the Redis class.
     */
    constructor() {
        this.client = createClient();
        this.isClientConnected = true
        this.client.on('error', (err) => {
            console.log("Redis client failed to connect", err.message || err.toString())
        })
        this.isClientConnected = false
        this.client.on('connect', () => {
            this.isClientConnected = true;
        })
    }

    /**
     *  Checks if a client is connected to the Redis server.
     *  @returns {boolean}
     */
    isAlive = () => {
        return this.isClientConnected;
    }
    /**
     * Retrieves the value of a given key.
     * @param {String} key The key of the item to retrieve.
     * @returns {String | Object}
     */
    get = async (key) => {
        return promisify(this.client.GET).bind(this.client)(key)
    }
    /**
     * Stores a key and it's value along with expiration time.
     * @param {String} key The key of the value to be stored.
     * @param {Number | String | Boolean} value The value of the item to be stored.
     * @param {Number} Expiration time in seconds.
     * @returns {Promise<void>}
     */
    set = async (key, duration, value) => {
        await promisify(this.client.SETEX).bind(this.client)(key, duration, value);
    }
    /**
     * Deletes a value with the given key
     * @param {String} key - The key of the item to be deleted
     * @returns {Promise<void>}
     */
    del = async (key) => {
        await promisify(this.client.DEL).bind(this.client)(key)
    }

}

const redisClient = new RedisClient()
export default redisClient;
