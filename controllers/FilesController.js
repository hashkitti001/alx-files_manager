import fs from "fs/promises";
import path from "path";
import os from "os";
import mt from "mime-types"
import { mkdir } from "fs/promises";
import { v4 } from "uuid";
import mongoDBCore from "mongodb/lib/core";
import dbClient from "../utils/db";
import Queue from 'bull/lib/queue'
import Buffer from 'node:buffer'
import process from 'node:process'

const VALID_UPLOAD_TYPES = {
    folder: "folder",
    file: "file",
    image: "image",
};
const DEFAULT_ROOT_FOLDER = 'files_manager';
const ROOT_PARENT_ID = 0;
const ROOT_FOLDER_ID = 0;
const NULL_ID = Buffer.alloc(24, '0').toString('utf-8');
const fileQueue = new Queue("thumbnail generation")
const MAX_FILES_PER_PAGE = 10

const isValidId = (id) => {
    const size = 24;
    const charRanges = [
        [48, 57], // 0 - 9
        [97, 102], // a - f
        [65, 70], // A - F
    ];
    if (typeof id !== 'string' || id.length !== size) {
        return false;
    }
    return [...id].every((c) => charRanges.some(([low, high]) => c.charCodeAt(0) >= low && c.charCodeAt(0) <= high));
};

const postUpload = async (req, res) => {
    /**
     * Uploads a file 
     */
    const { user } = req;
    const { name, type, parentId = ROOT_PARENT_ID, isPublic = false, data: base64Data = "" } = req.body || {};

    try {

        if (!name) return res.status(400).json({ error: "Missing name" });
        if (!type || !(type in VALID_UPLOAD_TYPES)) return res.status(400).json({ error: "Missing type" });
        if (!base64Data && type !== VALID_UPLOAD_TYPES.folder) return res.status(400).json({ error: "Missing data" });

        if (parentId !== ROOT_PARENT_ID && parentId !== ROOT_PARENT_ID.toString()) {
            const parent = await dbClient.db().collection("files").findOne({
                _id: new mongoDBCore.BSON.ObjectId(isValidId(parentId) ? parentId : NULL_ID),
            });

            if (!parent) return res.status(400).json({ error: "Parent not found" });
            if (parent.type !== "folder") return res.status(400).json({ error: "Parent is not a folder" });
        }

        const userId = user._id.toString();
        const baseDir = process.env.FOLDER_PATH.trim() || path.join(os.tmpdir(), DEFAULT_ROOT_FOLDER);


        const newFile = {
            userId: new mongoDBCore.BSON.ObjectId(userId),
            name,
            type,
            isPublic,
            parentId: parentId === ROOT_PARENT_ID || parentId === ROOT_PARENT_ID.toString()
                ? "0"
                : new mongoDBCore.BSON.ObjectId(parentId),
        };


        await mkdir(baseDir, { recursive: true });

        if (type !== VALID_UPLOAD_TYPES.folder) {
            const localPath = path.join(baseDir, v4());


            try {
                const fileBuffer = Buffer.from(base64Data, "base64");
                await fs.writeFile(localPath, fileBuffer);
                newFile.localPath = localPath;
            } catch (error) {
               
                return res.status(400).json({ error: "Invalid data or file write error" });
            }
        }
        // Generate thumbnail here
        if (type === VALID_UPLOAD_TYPES.image) {
            const jobName = `Image thumbnail [${userId}-${fileId}]`;
            fileQueue.add({ userId, fileId, name: jobName });
          }


        const insertionInfo = await dbClient.db().collection("files").insertOne(newFile);
        const fileId = insertionInfo.insertedId.toString();

        

        return res.status(201).json({
            id: fileId,
            userId,
            name,
            type,
            isPublic,
            parentId: parentId === ROOT_PARENT_ID || parentId === ROOT_PARENT_ID.toString() ? 0 : parentId,
        });
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

const getShow = async (req, res) => {
    /**
     *  Retrieves a file document based on the ID.
     */
    const { user } = req
    const { id } = req.params.id
    const userId = user._id.toString()
    const file = await dbClient.db().collection("files").findOne({
        id,
        userId: user._id
    })
    if (id && !file) {
        res.status(404).json({ "error": "Not found" })
        return
    }
    res.status(200).json({
        id,
        userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId === ROOT_FOLDER_ID.toString()
            ? 0
            : file.parentId.toString(),
    });
    return
}
const getIndex = async (req, res) => {
    /**
     * Retrieves all users file documents for a specific parentId and with pagination.
     */
    const { user } = req
    const parentId = req.query.parentId || ROOT_PARENT_ID.toString()
    const page = /\d+/.test((req.query.page || '')).toString()
        ? Number.parseInt(req.query.page, 10)
        : 0;

    const filesFilter = {
        userId: user._id,
        parentId: parentId === ROOT_PARENT_ID.toString()
            ? parentId
            : new mongoDBCore.BSON.ObjectId(isValidId(parentId) ? parentId : NULL_ID)

    }
    const files = await (await (await dbClient.filesCollection())
        .aggregate([
            { $match: filesFilter },
            { $sort: { _id: -1 } },
            { $skip: page * MAX_FILES_PER_PAGE },
            { $limit: MAX_FILES_PER_PAGE },
            {
                $project: {
                    _id: 0,
                    id: '$_id',
                    userId: '$userId',
                    name: '$name',
                    type: '$type',
                    isPublic: '$isPublic',
                    parentId: {
                        $cond: { if: { $eq: ['$parentId', '0'] }, then: 0, else: '$parentId' },
                    },
                },
            },
        ])).toArray();
    res.status(200).json(files);


}

const putPublish = async (req, res) => {
    /**
     *  Sets isPublic to true on the file document based on the ID
     */
    const { user } = req
    const { id } = req.params
    const userId = user._id.toString()
    const fileFilter = {
        _id: new mongoDBCore.BSON.ObjectId(isValidId(id) ? id : NULL_ID),
        userId: new mongoDBCore.BSON.ObjectId(isValidId(userId) ? userId : NULL_ID)
    }
    const file = await dbClient.db().collection("files").findOne(fileFilter)
    if (!file) {
        res.status(404).json({ error: "Not found" })
        return
    }
    await dbClient.db().collection("files").updateOne(fileFilter, {
        $set: { isPublic: true }
    })
    res.status(200).json({
        id,
        userId,
        name: file.name,
        type: file.type,
        isPublic: true,
        parentId: file.parentId === ROOT_FOLDER_ID.toString()
            ? 0
            : file.parentId.toString(),
    })
    return
}

const putUnpublish = async (req, res) => {
    /**
     *  Sets isPublic to false on the file document based on the ID
     *  
     */
    const { user } = req
    const { id } = req.params
    const userId = user._id.toString()
    const fileFilter = {
        _id: new mongoDBCore.BSON.ObjectId(isValidId(id) ? id : NULL_ID),
        userId: new mongoDBCore.BSON.ObjectId(isValidId(userId) ? userId : NULL_ID)
    }
    const file = await dbClient.db().collection("files").findOne(fileFilter)
    if (!file) {
        res.status(404).json({ error: "Not found" })
        return
    }
    await dbClient.db().collection("files").updateOne(fileFilter, {
        $set: { isPublic: false }
    })
    res.status(200).json({
        id,
        userId,
        name: file.name,
        type: file.type,
        isPublic: false,
        parentId: file.parentId === ROOT_FOLDER_ID.toString()
            ? 0
            : file.parentId.toString(),
    })
    return
}
const getFile = async (req, res) => {
    /**
     *  Returns the content of the file document based on the ID:
     */
    const { user } = req
    const { id } = req.params
    const userId = user ? user._id.toString() : " ";

    const fileFilter = {
        _id: new mongoDBCore.BSON.ObjectId(isValidId(id) ? id : NULL_ID)
    }
    const file = await dbClient.db().collection("files").findOne(fileFilter)
    if (!file || (!file.isPublic && (file.userId.toString() !== userId))) {
        res.status(404).json({ error: "Not found" })
        return
    }
    if (file.type === VALID_UPLOAD_TYPES.folder) {
        res.status(400).json({ error: "A folder doesn't have content" })
        return
    }
    const localPath = file.localPath
    const fileContent = await fs.readFile(localPath)

    const fileMime = mt.lookup(file.name) || "application/octet-stream"

    res.setHeader("Content-Type", fileMime)
    res.status(200).send(fileContent)
    return;

}
export { postUpload, getShow, getIndex, putPublish, putUnpublish, getFile };
