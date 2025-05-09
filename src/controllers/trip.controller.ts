import { Request, Response } from "express"
import prisma from '../db/prisma.js'

export const getTripsByUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id

    const trips = await prisma.trip.findMany({
      where: {
        isActive: true,
        OR: [
          { ownerId: userId },
          { sharedUsers: { some: { id: userId } } },
        ],
      },
      orderBy: { startDate: "asc" },
      include: {
        owner: {
          select: { id: true, username: true, fullname: true, avatarUrl: true },
        },
        sharedUsers: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    })

    res.status(200).json(trips)
  } catch (error) {
    console.error("Lỗi khi lấy trip của user:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

export const addNewTrip = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id
    const {
      title,
      country,
      city,
      startDate,
      endDate,
      privacy,
    } = req.body

    const newTrip = await prisma.trip.create({
      data: {
        title,
        country,
        city,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        privacy,
        ownerId: userId,
      },
    })

    res.status(201).json(newTrip)
  } catch (error) {
    console.error("Lỗi khi tạo trip:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

export const deleteTrip = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id
    const tripId = req.params.id

    // Kiểm tra quyền xóa (chỉ owner mới được xóa)
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { ownerId: true },
    })

    if (!trip) {
      res.status(404).json({ message: "Trip not found" })
      return
    }

    if (trip.ownerId !== userId) {
      res.status(403).json({ message: "Not authorized to delete this trip" })
      return
    }

    // Xóa mềm
    await prisma.trip.update({
      where: { id: tripId },
      data: { isActive: false },
    })

    res.status(200).json({ message: "Trip deleted (soft)" })
  } catch (error) {
    console.error("Lỗi khi xóa trip:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

export const updateTripPrivacy = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id
    const tripId = req.params.id
    const { privacy } = req.body

    // Validate privacy value
    if (!privacy || !['PUBLIC', 'PRIVATE'].includes(privacy)) {
      res.status(400).json({ message: "Invalid privacy value. Must be PUBLIC or PRIVATE" })
      return
    }

    // Check if trip exists and user is the owner
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { ownerId: true },
    })

    if (!trip) {
      res.status(404).json({ message: "Trip not found" })
      return
    }

    if (trip.ownerId !== userId) {
      res.status(403).json({ message: "Not authorized to update this trip" })
      return
    }

    // Update trip privacy
    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: { privacy },
    })

    res.status(200).json({ 
      message: "Trip privacy updated successfully",
      privacy: updatedTrip.privacy
    })
  } catch (error) {
    console.error("Lỗi khi cập nhật privacy của trip:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}


export const getPublicTripsByUser = async (req: Request, res: Response) => {
  try {
    const targetUserId = req.params.userId

    // Kiểm tra user tồn tại
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    })

    if (!user) {
      res.status(404).json({ message: "User not found" })
      return
    }

    // Lấy danh sách trip PUBLIC của user đó
    const publicTrips = await prisma.trip.findMany({
      where: {
        ownerId: targetUserId,
        isActive: true,
        privacy: 'PUBLIC',
      },
      orderBy: { startDate: "asc" },
      include: {
        owner: {
          select: { id: true, username: true, fullname: true, avatarUrl: true },
        },
      },
    })

    res.status(200).json(publicTrips)
  } catch (error) {
    console.error("Lỗi khi lấy public trips của user:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}
