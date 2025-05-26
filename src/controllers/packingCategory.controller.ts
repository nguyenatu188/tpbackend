import { Request, Response } from 'express';
import prisma from '../db/prisma.js';


// Add a new PackingCategory
export async function addPackingCategory(req: Request, res: Response) {
  try {
    const { name, tripId } = req.body;

    // Validate input
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Name is required and must be a string' });
      return
    }
    if (!tripId || typeof tripId !== 'string') {
      res.status(400).json({ error: 'tripId is required and must be a string' });
      return
    }

    // Check for existing category with the same name and tripId
    const existingCategory = await prisma.packingCategory.findFirst({
      where: {
        name,
        tripId,
      },
    });

    if (existingCategory) {
      res.status(409).json({ error: 'A category with this name already exists for the specified trip' });
      return 
    }

    // Create new PackingCategory
    const packingCategory = await prisma.packingCategory.create({
      data: {
        name,
        tripId, // tripId is required
      },
      select: {
        id: true,
        name: true,
        tripId: true,
        trip: {
          select: {
            id: true,
            title: true,
          },
        },
        items: {
          select: {
            id: true,
            name: true,
            quantity: true,
          },
        },
      },
    });

    res.status(201).json({
     message: 'Packing category created successfully',
     data: packingCategory,
   });
    return
  } catch (error) {
    console.error('Error adding packing category:', error);
    res.status(500).json({ error: 'Internal server error' });
    return 
  }
}

// Delete a PackingCategory by ID
export async function deletePackingCategory(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Valid ID is required' });
      return;
    }

    // Check if PackingCategory exists
    const packingCategory = await prisma.packingCategory.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!packingCategory) {
      res.status(404).json({ error: 'Packing category not found' });
      return;
    }

    // Delete all associated PackingItems and the PackingCategory in a transaction
    await prisma.$transaction([
      prisma.packingItem.deleteMany({
        where: { categoryId: id }, // Ensure this matches the schema field
      }),
      prisma.packingCategory.delete({
        where: { id },
      }),
    ]);

    res.status(200).json({ message: 'Packing category and associated items deleted successfully' });
    return;
  } catch (error) {
    console.error('Error deleting packing category:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
}
// Get PackingCategories by tripId
export async function getCategoriesByTripId(req: Request, res: Response) {
  try {
    const { tripId } = req.params;

    // Validate tripId
    if (!tripId || typeof tripId !== 'string') {
      res.status(400).json({ error: 'Valid tripId is required' });
      return 
    }

    // Fetch PackingCategories by tripId
    const packingCategories = await prisma.packingCategory.findMany({
      where: {
        tripId,
      },
      select: {
        id: true,
        name: true,
        tripId: true,
        trip: {
          select: {
            id: true,
            title: true,
          },
        },
        items: {
          select: {
            id: true,
            name: true,
            quantity: true,
          },
        },
      },
    });

    // Check if any categories were found
    if (packingCategories.length === 0) {
      res.status(404).json({ message: 'No packing categories found for this trip' });
      return
    }

    res.status(200).json({
     message: 'Packing categories retrieved successfully',
     data: packingCategories,
   });
    return
  } catch (error) {
    console.error('Error fetching packing categories:', error);
    res.status(500).json({ error: 'Internal server error' });
    return 
  }
}