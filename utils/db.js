import mongodb from "mongodb"
/**
  * Represents the DBClient
  */
class DBClient {
    /**
    * Creates an instance of the DBClient class.
    */

    constructor() {
        const host = process.env.DB_HOST || "localhost"
        const port = process.env.DB_PORT || 27017
        const database = process.env.DB_DATABASE || "files_manager"
        const dbURL = `mongodb://${host}:${post}/${database}`

        this.client = new mongodb.MongoClient(dbURL, { useUnifiedTopology: true })
        this.client.connect()
    }
    /**
     * Checks if a client is connected to the MongoDB server
     * @returns {boolean}
     */
    isAlive() {
        return this.client.isConnected();
    }
    /**
     * Gets the number of users in the database.
     * @returns {Promise<Number>}
     */
    nbFiles = async () => {
        return this.client.db().collection('files').countDocuments()
    }
    /**
     * Gets the number of users in the database.
     * @returns {Promise<Number>}
     */
    nbFiles = async () => {
        return this.client.db().collection('files').countDocuments()
    }
}

const dbClient = new DBClient()
export default dbClient