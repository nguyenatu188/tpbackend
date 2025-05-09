import express from 'express'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.route.js'
import tripRoutes from './routes/trip.route.js'

import userRoutes from './routes/user.route.js';


dotenv.config()

const app = express()
const PORT = process.env.PORT || 5001

// Middleware
app.use(cookieParser())
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/trip', tripRoutes)

app.use('/api/users', userRoutes);


// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
