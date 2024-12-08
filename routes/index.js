import express from 'express'
import { getStats, getStatus } from '../controllers/AppController'
import { postNew, getMe } from '../controllers/UserController'
import { getConnect, getDisconnect } from '../controllers/AuthController'
import {postUpload, getShow} from '../controllers/FilesController'
import xTokenAuthenticate from '../middleware/auth'

const router = express.Router()

const dummy = (req, res) => {
    res.send({ "message": "Everything works!" })
}
router.get('/status', getStatus)
router.get('/stats', getStats)
router.post('/users', postNew)
router.get("/connect", getConnect)
router.get("/disconnect", getDisconnect)
router.get("/users/me", xTokenAuthenticate, getMe)
router.post("/files", xTokenAuthenticate, postUpload)
router.get("/files/:id", xTokenAuthenticate, getShow)
router.get("/files", xTokenAuthenticate, getIndex)

export default router 