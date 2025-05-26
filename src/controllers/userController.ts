import { Request, Response } from 'express';
import prisma from '../db/prisma.js';

// Hàm tìm kiếm người dùng theo username
// Hàm tìm kiếm người dùng theo username hoặc fullname
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    if (!query) {
      res.status(400).json({ error: "Cần nhập từ khóa tìm kiếm" });
      return;
    }

    const searchQuery = query as string;

    // Tìm kiếm người dùng theo username hoặc fullname
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: searchQuery, mode: 'insensitive' } },
          { fullname: { contains: searchQuery, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        username: true,
        fullname: true,
        avatarUrl: true,
      },
      take: 10,
    });

    // Gợi ý tìm kiếm dựa trên username hoặc fullname
    const suggestions = await prisma.user.findMany({
      where: {
        OR: [
          { username: { startsWith: searchQuery, mode: 'insensitive' } },
          { fullname: { startsWith: searchQuery, mode: 'insensitive' } },
        ],
      },
      select: {
        username: true,
        fullname: true,
      },
      take: 5,
      orderBy: { username: 'asc' },
    });

    // Tạo danh sách gợi ý duy nhất (kết hợp username và fullname)
    const completions = Array.from(
      new Set(
        suggestions.flatMap(user => [user.username, user.fullname]).filter(Boolean)
      )
    ).slice(0, 5);

    res.status(200).json({
      message: "Tìm kiếm thành công",
      data: {
        users,
        suggestions: completions,
      },
    });
  } catch (err) {
    console.error("Lỗi khi tìm kiếm người dùng:", err);
    res.status(500).json({ error: "Lỗi hệ thống" });
  }
};


export const getUserProfile = async (req: Request, res: Response) => {
  const { username } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        fullname: true,
        username: true,
        email: true,
        gender: true,
        avatarUrl: true,
        createdAt: true,
        trips: {
          where: { privacy: 'PUBLIC', isActive: true },
          select: {
            id: true,
            title: true,
            country: true,
            city: true,
            startDate: true,
            endDate: true,
            privacy: true,
            lat: true,
            lng: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return
    }

    res.json(user);
    return 
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
    return 
  }
};