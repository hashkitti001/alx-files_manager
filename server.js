import express from 'express'
import router from './routes/index'
import process from 'process'

const PORT = process.env.PORT || 5000

const app = express()
app.use(express.json())

app.use(router)

app.listen(PORT, () => {
    console.log("Server running on port", PORT)
})