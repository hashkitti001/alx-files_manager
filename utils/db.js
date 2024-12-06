import mongodb from "mongodb";

/**
 * Represents the DBClient
 */
class DBClient {
    constructor() {
        const host = process.env.DB_HOST || "localhost";
        const port = process.env.DB_PORT || 27017;
        const database = process.env.DB_DATABASE || "files_manager";
        const dbURL = `mongodb://${host}:${port}/${database}`;

        this.databaseName = database;
        this.client = new mongodb.MongoClient(dbURL, { useUnifiedTopology: true });
        this.connect(); 
    }

    async connect() {
        try {
            await this.client.connect();
            console.log("Connected to MongoDB");
        } catch (error) {
            console.error("Failed to connect to MongoDB:", error);
        }
    }

    /**
     * Returns the database instance
     * @returns {mongodb.Db}
     */
    db() {
        return this.client.db(this.databaseName);
    }

    isAlive() {
        return !!this.client.isConnected();
    }

    async nbFiles() {
        return this.db().collection("files").countDocuments();
    }

    async nbUsers() {
        return this.db().collection("users").countDocuments();
    }
}

const dbClient = new DBClient();
export default dbClient;
