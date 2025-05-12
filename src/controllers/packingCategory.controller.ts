import { Request, Response } from 'express';
import prisma from '../db/prisma.js';

// GET: /categories
export const getAllPackingCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.packingCategory.findMany({
      include: {
        items: true,
      },
    });
    res.json(categories);
  } catch (error) {
    console.error('Get Packing Categories Error:', error);
    res.status(500).json({ error: 'Failed to get packing categories' });
  }
};

// POST: /categories
export const createPackingCategory = async (req: Request, res: Response) => {
  const { name, tripId, isDefault } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!name) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }

  // Nếu isDefault là false, tripId phải có
  if (isDefault === false && !tripId) {
    res.status(400).json({ error: 'tripId is required when isDefault is false' });
    return;
  }

  try {
    const newCategory = await prisma.packingCategory.create({
      data: {
        name,
        tripId: isDefault === false ? tripId : null,
        ...(isDefault !== undefined && { isDefault }), // Chỉ truyền isDefault nếu nó được cung cấp
      },
    });
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Create Packing Category Error:', error);
    res.status(500).json({ error: 'Failed to create packing category' });
  }
};

