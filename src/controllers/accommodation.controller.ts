import { Request, Response } from "express";
import prisma from "../db/prisma.js";

export const createAccommodation = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      res.status(400).json({ error: "Request body is required" });
      return;
    }

    const { name, location, tripId, price, startDate, endDate } = req.body;

    // Kiểm tra tất cả các trường bắt buộc, bao gồm price
    if (!name || !location || !tripId || price == null || !startDate || !endDate) {
      res.status(400).json({ error: "Name, location, tripId, price, startDate, and endDate are required" });
      return;
    }

    // Validate tripId exists
    const tripExists = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!tripExists) {
      res.status(400).json({ error: "Invalid tripId" });
      return;
    }

    // Validate startDate và endDate là định dạng ngày hợp lệ
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);
    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      res.status(400).json({ error: "Invalid startDate or endDate format" });
      return;
    }

    // Kiểm tra startDate phải trước endDate
    if (parsedStartDate >= parsedEndDate) {
      res.status(400).json({ error: "startDate must be before endDate" });
      return;
    }

    // Kiểm tra price là số không âm
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      res.status(400).json({ error: "Price must be a non-negative number" });
      return;
    }

    // Kiểm tra chồng lấn thời gian
    const existingAccommodations = await prisma.accommodation.findMany({
      where: { tripId },
      select: { startDate: true, endDate: true },
    });

    const hasOverlap = existingAccommodations.some((acc) => {
      const existingStart = new Date(acc.startDate);
      const existingEnd = new Date(acc.endDate);
      return (
        (parsedStartDate <= existingEnd && parsedStartDate >= existingStart) ||
        (parsedEndDate >= existingStart && parsedEndDate <= existingEnd) ||
        (parsedStartDate <= existingStart && parsedEndDate >= existingEnd)
      );
    });

    if (hasOverlap) {
      res.status(400).json({ error: "Time range overlaps with an existing accommodation" });
      return;
    }

    const accommodation = await prisma.accommodation.create({
      data: {
        name,
        location,
        tripId,
        price: parsedPrice,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
      },
    });

    res.status(201).json({ message: "Accommodation created successfully", data: accommodation });
  } catch (error) {
    console.error("Error creating accommodation:", error);
    res.status(500).json({ error: "Failed to create accommodation" });
  }
};

export const getAccommodations = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.query;
    if (!tripId || typeof tripId !== "string") {
      res.status(400).json({ error: "Valid tripId is required" });
      return;
    }

    const accommodations = await prisma.accommodation.findMany({
      where: { tripId },
      orderBy: {
        startDate: 'asc', // Sắp xếp theo startDate tăng dần
      },
    });

    // Thêm thông báo thành công
    res.status(200).json({ message: "Accommodations fetched successfully", data: accommodations });
  } catch (error) {
    console.error("Error fetching accommodations:", error);
    res.status(500).json({ error: "Failed to fetch accommodations" });
  }
};

export const deleteAccommodation = async (req: Request, res: Response) => {
  try {
    const { id } = req.query;
    if (!id || typeof id !== "string") {
      res.status(400).json({ error: "Valid id is required" });
      return;
    }

    const accommodation = await prisma.accommodation.findUnique({ where: { id } });
    if (!accommodation) {
      res.status(404).json({ error: "Accommodation not found" });
      return;
    }

    await prisma.accommodation.delete({ where: { id } });

    // Trả về thông báo thành công
    res.status(200).json({ message: "Accommodation deleted successfully" });
  } catch (error) {
    console.error("Error deleting accommodation:", error);
    res.status(500).json({ error: "Failed to delete accommodation" });
  }
};

export const updateAccommodation = async (req: Request, res: Response) => {
  try {
    const { id } = req.query;
    if (!id || typeof id !== "string") {
      res.status(400).json({ error: "Valid id is required" });
      return;
    }

    const { name, location, price, startDate, endDate } = req.body;

    const accommodation = await prisma.accommodation.findUnique({ where: { id } });
    if (!accommodation) {
      res.status(404).json({ error: "Accommodation not found" });
      return;
    }

    // Validate price nếu được cung cấp
    let parsedPrice = accommodation.price;
    if (price != null) {
      parsedPrice = parseFloat(price.toString());
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        res.status(400).json({ error: "Price must be a non-negative number" });
        return;
      }
    }

    // Validate startDate và endDate nếu được cung cấp
    let parsedStartDate = accommodation.startDate;
    let parsedEndDate = accommodation.endDate;
    if (startDate || endDate) {
      parsedStartDate = startDate ? new Date(startDate) : accommodation.startDate;
      parsedEndDate = endDate ? new Date(endDate) : accommodation.endDate;

      if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
        res.status(400).json({ error: "Invalid startDate or endDate format" });
        return;
      }

      if (parsedStartDate >= parsedEndDate) {
        res.status(400).json({ error: "startDate must be before endDate" });
        return;
      }

      // Kiểm tra chồng lấn thời gian
      const existingAccommodations = await prisma.accommodation.findMany({
        where: {
          tripId: accommodation.tripId,
          id: { not: id },
        },
        select: { startDate: true, endDate: true },
      });

      const hasOverlap = existingAccommodations.some((acc) => {
        const existingStart = new Date(acc.startDate);
        const existingEnd = new Date(acc.endDate);
        return (
          (parsedStartDate <= existingEnd && parsedStartDate >= existingStart) ||
          (parsedEndDate >= existingStart && parsedEndDate <= existingEnd) ||
          (parsedStartDate <= existingStart && parsedEndDate >= existingEnd)
        );
      });

      if (hasOverlap) {
        res.status(400).json({ error: "Time range overlaps with an existing accommodation" });
        return;
      }
    }

    const updatedAccommodation = await prisma.accommodation.update({
      where: { id },
      data: {
        name: name ?? accommodation.name,
        location: location ?? accommodation.location,
        price: parsedPrice,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
      },
    });

    res.status(200).json({ message: "Accommodation updated successfully", data: updatedAccommodation });
  } catch (error) {
    console.error("Error updating accommodation:", error);
    res.status(500).json({ error: "Failed to update accommodation" });
  }
};