import dbClient from "../utils/db";
import sha1 from "sha1";

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
        return res.status(201).json({ id:userId, email });
    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export { postNew };
