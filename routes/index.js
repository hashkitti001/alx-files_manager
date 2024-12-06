import express from 'express'
import { getStats, getStatus } from '../controllers/AppController'
import { postNew } from '../controllers/UserController'
import { getConnect } from '../controllers/AuthController'
const router = express.Router()

const dummy = (req, res) => {
    res.send({ "message": "Everything works!" })
}
router.get('/status', getStatus)
router.get('/stats', getStats)
router.post('/users', postNew)
router.get("/connect", getConnect)
// router.get("/disconnect", getDisconnect)
// router.get("/users/me", getMe)

export default router 