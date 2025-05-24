import { Request, Response } from 'express';
import prisma from '../db/prisma.js';

// GET: /getAllPackingCategories
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
  } finally {
    await prisma.$disconnect();
  }
};

// GET: /getAllPackingCategories?tripId=<tripId>
export const getPackingCategoriesInTripId = async (req: Request, res: Response) => {
  const tripId = req.query.tripId as string; // Lấy tripId từ query parameters

  // Kiểm tra tripId có được cung cấp không
  if (!tripId) {
    res.status(400).json({ error: 'tripId is required in query parameters' });
    return;
  }

  try {
    // Lấy danh mục mặc định (isDefault: true) và danh mục thuộc tripId
    const categories = await prisma.packingCategory.findMany({
      where: {
        OR: [
          { isDefault: true }, // Danh mục mặc định
          { tripId }, // Danh mục thuộc tripId
        ],
      },
      include: {
        items: true, // Bao gồm các items liên quan
      },
    });
    res.json(categories);
  } catch (error) {
    console.error('Get Packing Categories Error:', error);
    res.status(500).json({ error: 'Failed to get packing categories' });
  } finally {
    await prisma.$disconnect();
  }
};

// POST: /createPackingCategory
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
    // Kiểm tra tên trùng: danh mục mặc định hoặc thuộc tripId
    const existingCategory = await prisma.packingCategory.findFirst({
      where: {
        name,
        OR: [
          { isDefault: true }, // Danh mục mặc định
          { tripId: isDefault === false ? tripId : null }, // Danh mục thuộc tripId nếu không mặc định
        ],
      },
    });

    if (existingCategory) {
      res.status(400).json({ error: `Category with name "${name}" already exists` });
      return;
    }

    // Tạo danh mục mới
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
  } finally {
    await prisma.$disconnect();
  }
};

// PUT: /updatePackingCategory/:id
export const updatePackingCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, tripId, isDefault } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!name) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }

  try {
    // Kiểm tra tên trùng: danh mục mặc định hoặc thuộc tripId, ngoại trừ danh mục hiện tại
    const existingCategory = await prisma.packingCategory.findFirst({
      where: {
        name,
        id: { not: id }, // Loại trừ danh mục đang cập nhật
        OR: [
          { isDefault: true }, // Danh mục mặc định
          { tripId: isDefault === false ? tripId : null }, // Danh mục thuộc tripId nếu không mặc định
        ],
      },
    });

    if (existingCategory) {
      res.status(400).json({ error: `Category with name "${name}" already exists` });
      return;
    }

    // Cập nhật danh mục
    const updatedCategory = await prisma.packingCategory.update({
      where: { id },
      data: {
        name,
        tripId: isDefault === false ? tripId : null,
        ...(isDefault !== undefined && { isDefault }), // Chỉ truyền isDefault nếu nó được cung cấp
      },
    });
    res.json(updatedCategory);
  } catch (error) {
    console.error('Update Packing Category Error:', error);
    res.status(500).json({ error: 'Failed to update packing category' });
  } finally {
    await prisma.$disconnect();
  }
};

// DELETE: /deletePackingCategory/:id?tripId=<tripId>
export const deletePackingCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const tripId = req.query.tripId as string; // Ép kiểu tripId thành string từ query params

  // Kiểm tra tripId có được cung cấp không
  if (!tripId) {
    res.status(400).json({ error: 'tripId is required in query parameters' });
    return;
  }

  try {
    // Tìm category cần xóa
    const category = await prisma.packingCategory.findUnique({
      where: { id },
    });

    // Kiểm tra category tồn tại
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    // Kiểm tra điều kiện xóa:
    // 1. Không phải category mặc định (isDefault = false)
    // 2. Thuộc trip hiện tại (tripId khớp)
    if (category.isDefault) {
      res.status(403).json({ error: 'Cannot delete default category' });
      return;
    }

    if (category.tripId !== tripId) {
      res.status(403).json({ error: 'Can only delete categories from the current trip' });
      return;
    }

    // Xóa category
    await prisma.packingCategory.delete({
      where: { id },
    });

    res.status(204).send(); // Trả về 204 No Content khi xóa thành công
  } catch (error) {
    console.error('Delete Packing Category Error:', error);
    res.status(500).json({ error: 'Failed to delete packing category' });
  } finally {
    await prisma.$disconnect();
  }
};