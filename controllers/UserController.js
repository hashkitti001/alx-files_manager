import dbClient from "../utils/db";
import sha1 from "sha1";
import redisClient from "../utils/redis";

const postNew = async (req, res) => {
    const { email, password } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Missing email" });
    }
    if (!password) {
        return res.status(400).json({ error: "Missing password" });
    }

    try {
        const user = await dbClient.db().collection("users").findOne({ email });
        if (user) {
            return res.status(400).json({ error: "Already exist" });
        }

        const newUser = await dbClient.db().collection("users").insertOne({
            email,
            password: sha1(password),
        });

        const userId = newUser.insertedId.toString();
        return res.status(201).json({ id: userId, email });
    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

const getMe = async (req, res) => {
    /**
     * Retrieve the user based on the token used.
     */
    const token = req.headers["x-token"]; // Extract token from header

    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const userId = await redisClient.get(`auth_${token}`); // Fetch userId using token
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user = await dbClient.db().collection("users").findOne({
            _id: new ObjectId(userId), // Correct ObjectId usage
        });

        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Return user details
        return res.status(200).json({ id: user._id.toString(), email: user.email });
    } catch (error) {
        console.error("Error retrieving user:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}; 

export { postNew, getMe };
