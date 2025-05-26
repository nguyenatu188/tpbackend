import express from 'express'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.route.js'
import tripRoutes from './routes/trip.route.js'

import userRoutes from './routes/user.route.js';
import packingCategoryRoutes from './routes/packingCategory.route.js';
import accommodationRoutes from './routes/accommodation.route.js'
import packingItemRoutes from './routes/packingItem.route.js';
import transportRoutes from './routes/transport.route.js'


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
app.use('/api/packingCategory', packingCategoryRoutes);
app.use('/api/packingItem', packingItemRoutes);

app.use('/api/accommodations', accommodationRoutes);
app.use('/api/transports', transportRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
