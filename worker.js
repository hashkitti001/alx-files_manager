import Queue from "bull/lib/queue";
const fileQueue = new Queue("thumbnail generation")
import imageThumbnail from "image-thumbnail";
import fs from "fs/promises"
import dbClient from "./utils/db";
import mongoDBCore from "mongodb/lib/core"

const generateThumbnail = async (filePath, size) => {

    /**
     * Generates the thumbnail of an image with a given width size.
     * @param {String} filePath The location of the original file.
     * @param {number} size The width of the thumbnail.
     * @returns {Promise<void>}
     */
    const buffer = await imageThumbnail(filePath, { width: size })
    console.log(`Generating file: ${filePath}, size: ${size}`);
    return fs.writeFile(`${filePath}_${size}`, buffer)
}

fileQueue.process(async (job, done) => {
    const fileId = job.data.fileId || null
    const userId = job.data.userId || null

    if (!fileId) {
        throw new Error("Missing fileId")
    }
    if (!userId) {
        throw new Error("Missing userId");
    }
    console.log('Processing', job.data.name || '');
    const file = await dbClient.db().collection("files")
        .findOne({
            _id: new mongoDBCore.BSON.ObjectId(fileId),
            userId: new mongoDBCore.BSON.ObjectId(userId),
        });
    if (!file) {
        throw new Error("File not found")
    }
    const sizes = [500, 250, 100]

    Promise.all(sizes.map((size) => {
        generateThumbnail(file.localPath, size)
    })).then(() => {
        done()
    })
})