import { Request, Response } from "express";
import prisma from "../db/prisma.js";

export const getBudget = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.query;
    
    // Kiểm tra tripId hợp lệ
    if (!tripId || typeof tripId !== "string") {
      res.status(400).json({ error: "Valid tripId is required" });
      return;
    }

    // Kiểm tra tripId tồn tại
    const tripExists = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!tripExists) {
      res.status(400).json({ error: "Invalid tripId" });
      return;
    }

    // Lấy dữ liệu từ accommodation
    const accommodations = await prisma.accommodation.findMany({
      where: { tripId },
      select: { name: true, price: true },
    });

    // Lấy dữ liệu từ transport
    const transports = await prisma.transport.findMany({
      where: { tripId },
      select: { type: true, price: true },
    });

    // Tạo danh sách budget
    const budgetItems = [
      ...accommodations.map((acc) => ({
        name: acc.name,
        price: acc.price,
        type: "accommodation",
      })),
      ...transports.map((trans) => ({
        name: trans.type,
        price: trans.price,
        type: "transport",
      })),
    ];

    // Tính tổng chi phí
    const totalPrice = budgetItems.reduce((sum, item) => sum + item.price, 0);

    // Trả về kết quả
    res.status(200).json({
      message: "Budget fetched successfully",
      data: {
        items: budgetItems,
        totalPrice,
      },
    });
  } catch (error) {
    console.error("Error fetching budget:", error);
    res.status(500).json({ error: "Failed to fetch budget" });
  } finally {
    await prisma.$disconnect();
  }
};