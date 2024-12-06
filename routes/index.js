import express from 'express'
import { getStats, getStatus } from '../controllers/AppController'
import {postNew} from '../controllers/UserController'
const router = express.Router()

const dummy = (req, res) => {
    res.send({ "message": "Everything works!" })
}
router.get('/status', getStatus)
router.get('/stats', getStats)
router.post('/users', postNew)

export default router 