import { Request, Response } from 'express';
import prisma from '../db/prisma.js';

// GET: /getAllPackingItems?tripId=<tripId>
export const getAllPackingItems = async (req: Request, res: Response) => {
  const tripId = req.query.tripId as string;

  if (!tripId) {
    res.status(400).json({ error: 'tripId is required in query parameters' });
    return;
  }

  try {
    const items = await prisma.packingItem.findMany({
      where: {
        OR: [
          { isDefault: true }, // Các item mặc định
          { tripId }, // Các item thuộc tripId
        ],
      },
      include: {
        category: true, // Bao gồm thông tin category
      },
    });
    res.json(items);
  } catch (error) {
    console.error('Get Packing Items Error:', error);
    res.status(500).json({ error: 'Failed to get packing items' });
  } finally {
    await prisma.$disconnect();
  }
};

// GET: /getPackingItemsByCategory?categoryId=<categoryId>&tripId=<tripId>
export const getPackingItemsByCategory = async (req: Request, res: Response) => {
  const { categoryId, tripId } = req.query;

  if (!categoryId || !tripId) {
    res.status(400).json({ error: 'categoryId and tripId are required in query parameters' });
    return;
  }

  try {
    // Kiểm tra category tồn tại và thuộc tripId hoặc là mặc định
    const category = await prisma.packingCategory.findUnique({
      where: { id: categoryId as string },
    });

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    if (!category.isDefault && category.tripId !== (tripId as string)) {
      res.status(403).json({ error: 'Category does not belong to the specified trip' });
      return;
    }

    // Lấy các packing items theo categoryId
    const items = await prisma.packingItem.findMany({
      where: {
        categoryId: categoryId as string,
        OR: [
          { isDefault: true }, // Các item mặc định
          { tripId: tripId as string }, // Các item thuộc tripId
        ],
      },
      include: {
        category: true, // Bao gồm thông tin category
      },
    });

    res.json(items);
  } catch (error) {
    console.error('Get Packing Items By Category Error:', error);
    res.status(500).json({ error: 'Failed to get packing items by category' });
  } finally {
    await prisma.$disconnect();
  }
};

// POST: /createPackingItem
export const createPackingItem = async (req: Request, res: Response) => {
  const { name, quantity, tripId, categoryId, checked } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!name || !quantity || !tripId || !categoryId) {
    res.status(400).json({ error: 'Name, quantity, tripId, and categoryId are required' });
    return;
  }

  try {
    // Kiểm tra category tồn tại và thuộc tripId hoặc là mặc định
    const category = await prisma.packingCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    if (!category.isDefault && category.tripId !== tripId) {
      res.status(403).json({ error: 'Category does not belong to the specified trip' });
      return;
    }

    // Kiểm tra tên trùng trong cùng category và tripId
    const existingItem = await prisma.packingItem.findFirst({
      where: {
        name,
        categoryId,
        OR: [
          { isDefault: true },
          { tripId },
        ],
      },
    });

    if (existingItem) {
      res.status(400).json({ error: `Item with name "${name}" already exists in this category` });
      return;
    }

    // Tạo item mới với isDefault = false
    const newItem = await prisma.packingItem.create({
      data: {
        name,
        quantity,
        checked: checked || false,
        tripId,
        categoryId,
        isDefault: false,
      },
    });
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Create Packing Item Error:', error);
    res.status(500).json({ error: 'Failed to create packing item' });
  } finally {
    await prisma.$disconnect();
  }
};

// PUT: /updatePackingItem/:id
export const updatePackingItem = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, quantity, checked, categoryId, tripId } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!name || !quantity || !categoryId || !tripId) {
    res.status(400).json({ error: 'Name, quantity, categoryId, and tripId are required' });
    return;
  }

  try {
    // Kiểm tra item tồn tại
    const item = await prisma.packingItem.findUnique({
      where: { id },
    });

    if (!item) {
      res.status(404).json({ error: 'Packing item not found' });
      return;
    }

    // Không cho phép sửa item mặc định
    if (item.isDefault) {
      res.status(403).json({ error: 'Cannot update default packing item' });
      return;
    }

    // Kiểm tra item thuộc tripId
    if (item.tripId !== tripId) {
      res.status(403).json({ error: 'Can only update items from the current trip' });
      return;
    }

    // Kiểm tra category tồn tại và thuộc tripId hoặc là mặc định
    const category = await prisma.packingCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    if (!category.isDefault && category.tripId !== tripId) {
      res.status(403).json({ error: 'Category does not belong to the specified trip' });
      return;
    }

    // Kiểm tra tên trùng, ngoại trừ item hiện tại
    const existingItem = await prisma.packingItem.findFirst({
      where: {
        name,
        categoryId,
        id: { not: id },
        OR: [
          { isDefault: true },
          { tripId },
        ],
      },
    });

    if (existingItem) {
      res.status(400).json({ error: `Item with name "${name}" already exists in this category` });
      return;
    }

    // Cập nhật item
    const updatedItem = await prisma.packingItem.update({
      where: { id },
      data: {
        name,
        quantity,
        checked,
        categoryId,
      },
    });
    res.json(updatedItem);
  } catch (error) {
    console.error('Update Packing Item Error:', error);
    res.status(500).json({ error: 'Failed to update packing item' });
  } finally {
    await prisma.$disconnect();
  }
};

// DELETE: /deletePackingItem/:id?tripId=<tripId>
export const deletePackingItem = async (req: Request, res: Response) => {
  const { id } = req.params;
  const tripId = req.query.tripId as string;

  if (!tripId) {
    res.status(400).json({ error: 'tripId is required in query parameters' });
    return;
  }

  try {
    // Kiểm tra item tồn tại
    const item = await prisma.packingItem.findUnique({
      where: { id },
    });

    if (!item) {
      res.status(404).json({ error: 'Packing item not found' });
      return;
    }

    // Không cho phép xóa item mặc định
    if (item.isDefault) {
      res.status(403).json({ error: 'Cannot delete default packing item' });
      return;
    }

    // Kiểm tra item thuộc tripId
    if (item.tripId !== tripId) {
      res.status(403).json({ error: 'Can only delete items from the current trip' });
      return;
    }

    // Xóa item
    await prisma.packingItem.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete Packing Item Error:', error);
    res.status(500).json({ error: 'Failed to delete packing item' });
  } finally {
    await prisma.$disconnect();
  }
};