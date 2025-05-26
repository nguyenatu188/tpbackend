import { Request, Response } from 'express'
import prisma from '../db/prisma.js'

export const getReferenceLinksByTrip = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id
    const tripId = req.params.tripId

    // Kiểm tra quyền truy cập trip
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        isActive: true,
        OR: [
          { ownerId: userId },
          { sharedUsers: { some: { id: userId } } }
        ]
      }
    })

    if (!trip) {
      res.status(404).json({ 
        message: "Trip not found or you don't have access"
      })
      return
    }

    // Lấy danh sách links
    const links = await prisma.referenceLink.findMany({
      where: { tripId },
      orderBy: { title: 'desc' }
    })

    res.status(200).json(links)
  } catch (error) {
    console.error("Lỗi khi lấy reference links:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

export const addReferenceLink = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id
    const tripId = req.params.id
    const { url, title, description, image } = req.body

    // Validate required fields
    if (!url) {
      res.status(400).json({ message: "URL is required" })
      return
    }

    // Kiểm tra trip tồn tại và user có quyền
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { ownerId: true }
    })

    if (!trip) {
      res.status(404).json({ message: "Trip not found" })
      return
    }

    if (trip.ownerId !== userId) {
      res.status(403).json({ message: "Not authorized to add links to this trip" })
      return
    }

    // Tạo reference link mới
    const newLink = await prisma.referenceLink.create({
      data: {
        url,
        title,
        description,
        image,
        tripId
      }
    })

    res.status(201).json(newLink)
  } catch (error) {
    console.error("Lỗi khi thêm reference link:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

export const deleteReferenceLink = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id
    const linkId = req.params.id

    // Tìm link và kiểm tra quyền
    const link = await prisma.referenceLink.findUnique({
      where: { id: linkId },
      include: {
        trip: {
          select: { ownerId: true }
        }
      }
    })

    if (!link) {
      res.status(404).json({ message: "Link not found" })
      return
    }

    if (link.trip.ownerId !== userId) {
      res.status(403).json({ message: "Not authorized to delete this link" })
      return
    }

    // Xóa link
    await prisma.referenceLink.delete({
      where: { id: linkId }
    })

    res.status(200).json({ message: "Reference link deleted successfully" })
  } catch (error) {
    console.error("Lỗi khi xóa reference link:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}