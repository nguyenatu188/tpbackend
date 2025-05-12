import { Request, Response } from 'express';
import prisma from '../db/prisma.js';

// Lấy danh sách activities theo tripId
export const getActivitiesByTripId = async (req: Request, res: Response): Promise<void> => {
  const { tripId } = req.params;
  const userId = req.user.id;

  try {
    // Kiểm tra tripId hợp lệ
    if (!tripId) {
      res.status(400).json({ error: 'Trip ID is required' });
      return;
    }

    // Kiểm tra trip tồn tại và user có quyền truy cập
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        isActive: true,
        OR: [
          { ownerId: userId },
          { sharedUsers: { some: { id: userId } } },
        ],
      },
    });

    if (!trip) {
      res.status(404).json({ error: 'Trip not found or you don\'t have access' });
      return;
    }

    // Lấy danh sách activities theo tripId
    const activities = await prisma.activity.findMany({
      where: {
        tripId: tripId,
      },
      select: {
        id: true,
        name: true,
        location: true,
        time: true,
        price: true,
        category: true,
        tripId: true,
      },
      orderBy: { time: 'asc' },
    });

    // Trả về danh sách activities
    res.status(200).json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};




// Lấy danh sách packing items theo tripId
export const getPackingItemsByTripId = async (req: Request, res: Response): Promise<void> => {
  const { tripId } = req.params;
  const userId = req.user.id;

  try {
    // Kiểm tra tripId hợp lệ
    if (!tripId) {
      res.status(400).json({ error: 'Trip ID is required' });
      return;
    }

    // Kiểm tra trip tồn tại và user có quyền truy cập
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        isActive: true,
        OR: [
          { ownerId: userId },
          { sharedUsers: { some: { id: userId } } },
        ],
      },
    });

    if (!trip) {
      res.status(404).json({ error: 'Trip not found or you don\'t have access' });
      return;
    }

    // Lấy danh sách packing items theo tripId
    const packingItems = await prisma.packingItem.findMany({
      where: {
        tripId: tripId,
      },
    });

    // Trả về danh sách packing items
    res.status(200).json(packingItems);
  } catch (error) {
    console.error('Error fetching packing items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Thêm packing item mới
export const addPackingItem = async (req: Request, res: Response): Promise<void> => {
  const { tripId } = req.params;
  const { name, quantity } = req.body;
  const userId = req.user.id;

  try {
    if (!name || quantity === undefined) {
      res.status(400).json({ error: 'Name and quantity are required' });
      return;
    }

    // Kiểm tra trip tồn tại và user có quyền truy cập
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        isActive: true,
        OR: [
          { ownerId: userId },
          { sharedUsers: { some: { id: userId } } },
        ],
      },
    });

    if (!trip) {
      res.status(404).json({ error: 'Trip not found or you don\'t have access' });
      return;
    }

    // Thêm packing item mới
    const newPackingItem = await prisma.packingItem.create({
      data: {
        name,
        quantity,
        tripId,
      },
    });

    res.status(201).json(newPackingItem);
  } catch (error) {
    console.error('Error adding packing item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Cập nhật packing item
export const updatePackingItem = async (req: Request, res: Response): Promise<void> => {
  const { tripId, packingItemId } = req.params;
  const { name, quantity, checked } = req.body;
  const userId = req.user.id;

  try {
    if (!name && quantity === undefined && checked === undefined) {
      res.status(400).json({ error: 'At least one field (name, quantity, checked) is required to update' });
      return;
    }

    // Kiểm tra trip tồn tại và user có quyền truy cập
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        isActive: true,
        OR: [
          { ownerId: userId },
          { sharedUsers: { some: { id: userId } } },
        ],
      },
    });

    if (!trip) {
      res.status(404).json({ error: 'Trip not found or you don\'t have access' });
      return;
    }

    // Kiểm tra packing item tồn tại
    const packingItem = await prisma.packingItem.findUnique({
      where: {
        id: packingItemId,
      },
    });

    if (!packingItem) {
      res.status(404).json({ error: 'Packing item not found' });
      return;
    }

    // Cập nhật packing item
    const updatedPackingItem = await prisma.packingItem.update({
      where: {
        id: packingItemId,
      },
      data: {
        name: name ?? packingItem.name,  // Chỉ cập nhật nếu có giá trị mới
        quantity: quantity ?? packingItem.quantity,
        checked: checked ?? packingItem.checked,
      },
    });

    res.status(200).json(updatedPackingItem);
  } catch (error) {
    console.error('Error updating packing item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Xóa packing item
export const deletePackingItem = async (req: Request, res: Response): Promise<void> => {
  const { tripId, packingItemId } = req.params;
  const userId = req.user.id;

  try {
    // Kiểm tra trip tồn tại và user có quyền truy cập
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        isActive: true,
        OR: [
          { ownerId: userId },
          { sharedUsers: { some: { id: userId } } },
        ],
      },
    });

    if (!trip) {
      res.status(404).json({ error: 'Trip not found or you don\'t have access' });
      return;
    }

    // Kiểm tra packing item tồn tại
    const packingItem = await prisma.packingItem.findUnique({
      where: {
        id: packingItemId,
      },
    });

    if (!packingItem) {
      res.status(404).json({ error: 'Packing item not found' });
      return;
    }

    // Xóa packing item
    await prisma.packingItem.delete({
      where: {
        id: packingItemId,
      },
    });

    res.status(200).json({ message: 'Packing item deleted successfully' });
  } catch (error) {
    console.error('Error deleting packing item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};