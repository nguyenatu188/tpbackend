import { Request, Response } from 'express'
import prisma from '../db/prisma.js'

export const getActivities = async (req: Request, res: Response) => {
  const { tripId } = req.params
  const userId = req.user?.id

  try {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { owner: true}
    })

    if (!trip) {
      res.status(404).json({ error: 'Trip not found' })
      return
    }

    // Authorization check
    const isPublic = trip.privacy === 'PUBLIC'
    const isOwner = trip.ownerId === userId

    if (!isPublic && !isOwner) {
      res.status(403).json({ error: 'Unauthorized access' })
      return
    }

    const activities = await prisma.activity.findMany({
      where: { tripId },
      orderBy: { time: 'asc' }
    })

    res.status(200).json({ data: activities })
  } catch (error) {
    console.error('Error getting activities:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const addActivity = async (req: Request, res: Response) => {
  const { tripId } = req.params
  const userId = req.user.id
  const { name, placeName, location, time, price } = req.body

  try {
    // Validation
    if (!name || !location) {
      res.status(400).json({ error: 'Name and location are required' })
      return
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { owner: true }
    })

    if (!trip) {
      res.status(404).json({ error: 'Trip not found' })
      return
    }

    // Authorization
    const isOwner = trip.ownerId === userId

    if (!isOwner) {
      res.status(403).json({ error: 'Unauthorized to add activity' })
      return
    }

    const parsedPrice = price ? (typeof price === 'string' ? parseFloat(price) : price) : 0

    const newActivity = await prisma.activity.create({
      data: {
        name,
        placeName,
        location,
        time: time,
        price: parsedPrice,
        tripId
      }
    })

    res.status(201).json({ message: 'Activity created', data: newActivity })
  } catch (error) {
    console.error('Error creating activity:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateActivity = async (req: Request, res: Response) => {
  const { tripId, activityId } = req.params
  const userId = req.user.id
  const { name, placeName, location, time, price } = req.body

  try {
    // Check activity exists and belongs to trip
    const activity = await prisma.activity.findFirst({
      where: { id: activityId, tripId }
    })

    if (!activity) {
      res.status(404).json({ error: 'Activity not found' })
      return
    }

    // Get trip for authorization
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { owner: true }
    })

    if (!trip) {
      res.status(404).json({ error: 'Trip not found' })
      return
    }

    // Authorization
    const isOwner = trip.ownerId === userId

    if (!isOwner) {
      res.status(403).json({ error: 'Unauthorized to update activity' })
      return
    }

    const parsedPrice = price ? (typeof price === 'string' ? parseFloat(price) : price) : 0

    const updatedActivity = await prisma.activity.update({
      where: { id: activityId },
      data: {
        name,
        placeName,
        location,
        time: time,
        price: parsedPrice
      }
    })

    res.status(200).json({ message: 'Activity updated', data: updatedActivity })
  } catch (error) {
    console.error('Error updating activity:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const deleteActivity = async (req: Request, res: Response) => {
  const { tripId, activityId } = req.params
  const userId = req.user.id

  try {
    // Check activity exists and belongs to trip
    const activity = await prisma.activity.findFirst({
      where: { id: activityId, tripId }
    })

    if (!activity) {
      res.status(404).json({ error: 'Activity not found' })
      return
    }

    // Get trip for authorization
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { owner: true }
    })

    if (!trip){ 
      res.status(404).json({ error: 'Trip not found' })
      return
    }

    // Authorization
    const isOwner = trip.ownerId === userId

    if (!isOwner) {
      res.status(403).json({ error: 'Unauthorized to delete activity' })
      return
    }

    await prisma.activity.delete({
      where: { id: activityId }
    })

    res.status(200).json({ message: 'Activity deleted' })
  } catch (error) {
    console.error('Error deleting activity:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
