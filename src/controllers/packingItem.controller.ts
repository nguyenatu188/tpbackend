import { Request, Response } from 'express';
import prisma from '../db/prisma.js';

// Add a new PackingItem
export async function addPackingItem(req: Request, res: Response) {
  try {
    const { name, quantity, tripId, categoryId } = req.body;

    // Validate input
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Name is required and must be a string' });
      return;
    }
    if (!quantity || typeof quantity !== 'number' || quantity < 0) {
      res.status(400).json({ error: 'Quantity is required and must be a non-negative number' });
      return;
    }
    if (!tripId || typeof tripId !== 'string') {
      res.status(400).json({ error: 'tripId is required and must be a string' });
      return;
    }
    if (!categoryId || typeof categoryId !== 'string') {
      res.status(400).json({ error: 'categoryId is required and must be a string' });
      return;
    }

    // Check if trip exists
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true, title: true },
    });
    if (!trip) {
      res.status(404).json({ error: 'Trip not found' });
      return;
    }

    // Check if category exists
    const category = await prisma.packingCategory.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true },
    });
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    // Check for existing item with the same name, tripId, and categoryId
    const existingItem = await prisma.packingItem.findFirst({
      where: {
        name,
        tripId,
        categoryId,
      },
    });

    if (existingItem) {
      res.status(409).json({ error: 'An item with this name already exists for the specified trip and category' });
      return;
    }

    // Create new PackingItem
    const packingItem = await prisma.packingItem.create({
      data: {
        name,
        quantity,
        tripId,
        categoryId,
      },
      select: {
        id: true,
        name: true,
        quantity: true,
        tripId: true,
        trip: {
          select: {
            id: true,
            title: true,
          },
        },
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Packing item created successfully',
      data: packingItem,
    });
    return;
  } catch (error) {
    console.error('Error adding packing item:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
}

// Delete a PackingItem by ID
export async function deletePackingItem(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Valid ID is required' });
      return;
    }

    // Check if PackingItem exists
    const packingItem = await prisma.packingItem.findUnique({
      where: { id },
    });

    if (!packingItem) {
      res.status(404).json({ error: 'Packing item not found' });
      return;
    }

    // Delete PackingItem
    await prisma.packingItem.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Packing item deleted successfully' });
    return;
  } catch (error) {
    console.error('Error deleting packing item:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
}

// Get PackingItems by tripId
export async function getItemsByTripId(req: Request, res: Response) {
  try {
    const { tripId } = req.params;

    // Validate tripId
    if (!tripId || typeof tripId !== 'string') {
      res.status(400).json({ error: 'Valid tripId is required' });
      return;
    }

    // Fetch PackingItems by tripId
    const packingItems = await prisma.packingItem.findMany({
      where: {
        tripId,
      },
      select: {
        id: true,
        name: true,
        quantity: true,
        tripId: true,
        trip: {
          select: {
            id: true,
            title: true,
          },
        },
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Check if any items were found
    if (packingItems.length === 0) {
      res.status(404).json({ message: 'No packing items found for this trip' });
      return;
    }

    res.status(200).json({
      message: 'Packing items retrieved successfully',
      data: packingItems,
    });
    return;
  } catch (error) {
    console.error('Error fetching packing items:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
}

// Get PackingItems by categoryId
export async function getItemsByCategory(req: Request, res: Response) {
  try {
    const { categoryId } = req.params;

    // Validate categoryId
    if (!categoryId || typeof categoryId !== 'string') {
      res.status(400).json({ error: 'Valid categoryId is required' });
      return;
    }

    // Check if category exists
    const category = await prisma.packingCategory.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true },
    });
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    // Fetch PackingItems by categoryId
    const packingItems = await prisma.packingItem.findMany({
      where: {
        categoryId,
      },
      select: {
        id: true,
        name: true,
        quantity: true,
        tripId: true,
        trip: {
          select: {
            id: true,
            title: true,
          },
        },
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Check if any items were found
    if (packingItems.length === 0) {
      res.status(404).json({ message: 'No packing items found for this category' });
      return;
    }

    res.status(200).json({
      message: 'Packing items retrieved successfully',
      data: packingItems,
    });
    return;
  } catch (error) {
    console.error('Error fetching packing items by category:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
}