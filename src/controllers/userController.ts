import { Request, Response } from 'express';
import prisma from '../db/prisma.js';

// Hàm tìm kiếm người dùng theo username
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    if (!query) {
      res.status(400).json({ error: "Cần nhập từ khóa tìm kiếm" });
      return 
    }

    const searchQuery = query as string;

    const users = await prisma.user.findMany({
      where: {
        username: { contains: searchQuery, mode: 'insensitive' },
      },
      select: {
        id: true,
        username: true,
        fullname: true,
        avatarUrl: true,
      },
      take: 10,
    });

    const suggestions = await prisma.user.findMany({
      where: {
        username: { startsWith: searchQuery, mode: 'insensitive' }
      },
      select: {
        username: true,
      },
      take: 5,
      orderBy: { username: 'asc' }
    });

    const completions = suggestions.map(user => user.username)
      .filter((username, index, self) => self.indexOf(username) === index);

    res.status(200).json({
      message: "Tìm kiếm thành công",
      data: {
        users,
        suggestions: completions
      }
    });
  } catch (err) {
    console.error("Lỗi khi tìm kiếm người dùng:", err);
    res.status(500).json({ error: "Lỗi hệ thống" });
  }
};
