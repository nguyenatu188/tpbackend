import { Request, Response } from 'express';
import prisma from '../db/prisma.js';

// GET: /getAllTransports
export const getAllTransports = async (req: Request, res: Response) => {
  try {
    const transports = await prisma.transport.findMany({
      include: {
        trip: true,
      },
      orderBy: {
        startDate: 'asc', // Sắp xếp theo startDate tăng dần
      },
    });
    res.json(transports);
  } catch (error) {
    console.error('Get Transports Error:', error);
    res.status(500).json({ error: 'Failed to get transports' });
  } finally {
    await prisma.$disconnect();
  }
};

// GET: /getTransports?tripId=<tripId>
export const getTransportsByTripId = async (req: Request, res: Response) => {
  const tripId = req.query.tripId as string;

  if (!tripId) {
    res.status(400).json({ error: 'tripId is required in query parameters' });
    return;
  }

  try {
    const transports = await prisma.transport.findMany({
      where: {
        tripId,
      },
      include: {
        trip: true,
      },
      orderBy: {
        startDate: 'asc', // Sắp xếp theo startDate tăng dần
      },
    });
    res.json(transports);
  } catch (error) {
    console.error('Get Transports by TripId Error:', error);
    res.status(500).json({ error: 'Failed to get transports' });
  } finally {
    await prisma.$disconnect();
  }
};

// POST: /createTransport
export const createTransport = async (req: Request, res: Response) => {
  const { type, from, to, price, tripId, startDate, endDate } = req.body;

  // Kiểm tra tất cả các trường bắt buộc, bao gồm price
  if (!type || !from || !to || price == null || !tripId || !startDate || !endDate) {
    res.status(400).json({ error: 'Type, from, to, price, tripId, startDate, and endDate are required' });
    return;
  }

  try {
    // Kiểm tra tripId có tồn tại
    const tripExists = await prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!tripExists) {
      res.status(400).json({ error: 'Invalid tripId' });
      return;
    }

    // Kiểm tra trùng: type, from, to trong cùng tripId
    const existingTransport = await prisma.transport.findFirst({
      where: {
        type,
        from,
        to,
        tripId,
      },
    });

    if (existingTransport) {
      res.status(400).json({ error: `Transport with type "${type}", from "${from}", to "${to}" already exists in this trip` });
      return;
    }

    // Validate startDate và endDate
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);
    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      res.status(400).json({ error: 'Invalid startDate or endDate format' });
      return;
    }

    // Kiểm tra startDate phải trước endDate
    if (parsedStartDate >= parsedEndDate) {
      res.status(400).json({ error: 'startDate must be before endDate' });
      return;
    }

    // Kiểm tra price là số không âm
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      res.status(400).json({ error: 'Price must be a non-negative number' });
      return;
    }

    // Kiểm tra chồng lấn thời gian
    const existingTransports = await prisma.transport.findMany({
      where: { tripId },
      select: { startDate: true, endDate: true },
    });

    const hasOverlap = existingTransports.some((transport) => {
      const existingStart = new Date(transport.startDate);
      const existingEnd = new Date(transport.endDate);
      return (
        (parsedStartDate <= existingEnd && parsedStartDate >= existingStart) ||
        (parsedEndDate >= existingStart && parsedEndDate <= existingEnd) ||
        (parsedStartDate <= existingStart && parsedEndDate >= existingEnd)
      );
    });

    if (hasOverlap) {
      res.status(400).json({ error: 'Time range overlaps with an existing transport' });
      return;
    }

    // Tạo transport mới
    const newTransport = await prisma.transport.create({
      data: {
        type,
        from,
        to,
        price: parsedPrice,
        tripId,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
      },
    });
    res.status(201).json({ message: 'Transport created successfully', data: newTransport });
  } catch (error) {
    console.error('Create Transport Error:', error);
    res.status(500).json({ error: 'Failed to create transport' });
  } finally {
    await prisma.$disconnect();
  }
};
// PUT: /updateTransport/:id
export const updateTransport = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { type, from, to, price, tripId, startDate, endDate } = req.body;

  if (!type || !from || !to || price == null || !tripId || !startDate || !endDate) {
    res.status(400).json({ error: 'Type, from, to, price, tripId, startDate, and endDate are required' });
    return;
  }

  try {
    const transportExists = await prisma.transport.findUnique({
      where: { id },
    });

    if (!transportExists) {
      res.status(404).json({ error: 'Transport not found' });
      return;
    }

    const tripExists = await prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!tripExists) {
      res.status(400).json({ error: 'Invalid tripId' });
      return;
    }

    const existingTransport = await prisma.transport.findFirst({
      where: {
        type,
        from,
        to,
        tripId,
        id: { not: id },
      },
    });

    if (existingTransport) {
      res.status(400).json({ error: `Transport with type "${type}", from "${from}", to "${to}" already exists in this trip` });
      return;
    }

    // Validate startDate và endDate
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);
    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      res.status(400).json({ error: 'Invalid startDate or endDate format' });
      return;
    }

    if (parsedStartDate >= parsedEndDate) {
      res.status(400).json({ error: 'startDate must be before endDate' });
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      res.status(400).json({ error: 'Price must be a non-negative number' });
      return;
    }

    const existingTransports = await prisma.transport.findMany({
      where: {
        tripId,
        id: { not: id },
      },
      select: { startDate: true, endDate: true },
    });

    const hasOverlap = existingTransports.some((transport) => {
      const existingStart = new Date(transport.startDate);
      const existingEnd = new Date(transport.endDate);
      return (
        (parsedStartDate <= existingEnd && parsedStartDate >= existingStart) ||
        (parsedEndDate >= existingStart && parsedEndDate <= existingEnd) ||
        (parsedStartDate <= existingStart && parsedEndDate >= existingEnd)
      );
    });

    if (hasOverlap) {
      res.status(400).json({ error: 'Time range overlaps with an existing transport' });
      return;
    }

    // Cập nhật transport
    const updatedTransport = await prisma.transport.update({
      where: { id },
      data: {
        type,
        from,
        to,
        price: parsedPrice,
        tripId,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
      },
    });
    res.json({ message: 'Transport updated successfully', data: updatedTransport });
  } catch (error) {
    console.error('Update Transport Error:', error);
    res.status(500).json({ error: 'Failed to update transport' });
  } finally {
    await prisma.$disconnect();
  }
};
// DELETE: /deleteTransport/:id?tripId=<tripId>
export const deleteTransport = async (req: Request, res: Response) => {
  const { id } = req.params;
  const tripId = req.query.tripId as string;

  if (!tripId) {
    res.status(400).json({ error: 'tripId is required in query parameters' });
    return;
  }

  try {
    // Kiểm tra transport có tồn tại
    const transport = await prisma.transport.findUnique({
      where: { id },
    });

    if (!transport) {
      res.status(404).json({ error: 'Transport not found' });
      return;
    }

    // Kiểm tra transport thuộc tripId
    if (transport.tripId !== tripId) {
      res.status(403).json({ error: 'Can only delete transports from the current trip' });
      return;
    }

    // Xóa transport
    await prisma.transport.delete({
      where: { id },
    });

    res.status(204).json({ message: 'Transport deleted successfully' });
  } catch (error) {
    console.error('Delete Transport Error:', error);
    res.status(500).json({ error: 'Failed to delete transport' });
  } finally {
    await prisma.$disconnect();
  }
};