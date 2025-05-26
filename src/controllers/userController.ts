import { Request, Response } from 'express'
import prisma from '../db/prisma.js'
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// Hàm tìm kiếm người dùng theo username
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { query } = req.query

    if (!query) {
      res.status(400).json({ error: "Cần nhập từ khóa tìm kiếm" })
      return 
    }

    const searchQuery = query as string

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
    })

    const suggestions = await prisma.user.findMany({
      where: {
        username: { startsWith: searchQuery, mode: 'insensitive' }
      },
      select: {
        username: true,
      },
      take: 5,
      orderBy: { username: 'asc' }
    })

    const completions = suggestions.map(user => user.username)
      .filter((username, index, self) => self.indexOf(username) === index)

    res.status(200).json({
      message: "Tìm kiếm thành công",
      data: {
        users,
        suggestions: completions
      }
    })
  } catch (err) {
    console.error("Lỗi khi tìm kiếm người dùng:", err)
    res.status(500).json({ error: "Lỗi hệ thống" })
  }
}

export const getUserProfile = async (req: Request, res: Response) => {
  const currentUserId = req.user?.id
  const { username } = req.params

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        _count: {
          select: {
            followers: true,
            following: true
          }
        },
        // Thêm phần này để lấy danh sách followers
        followers: {
          select: {
            follower: {
              select: {
                id: true,
                username: true,
                fullname: true,
                avatarUrl: true
              }
            },
            createdAt: true
          },
          take: 10 // Giới hạn số lượng
        },
        // Thêm phần này để lấy danh sách following
        following: {
          select: {
            following: {
              select: {
                id: true,
                username: true,
                fullname: true,
                avatarUrl: true
              }
            },
            createdAt: true
          },
          take: 10 // Giới hạn số lượng
        },
        trips: {
          where: { 
            privacy: 'PUBLIC', 
            isActive: true 
          },
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
      }
    })

    // Chỉ check follow nếu có người dùng đang đăng nhập
    const isFollowing = currentUserId && user
      ? await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUserId,
              followingId: user.id
            }
          }
        })
      : null

    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    // Format lại dữ liệu followers và following
    const formattedUser = {
      ...user,
      followers: user.followers.map(f => ({
        ...f.follower,
        followedAt: f.createdAt
      })),
      following: user.following.map(f => ({
        ...f.following,
        followedAt: f.createdAt
      }))
    }

    // Tách các trường không cần thiết
    const { _count, trips, ...userData } = formattedUser

    res.json({
      ...userData,
      trips,
      isFollowing: !!isFollowing,
      followersCount: _count?.followers || 0,
      followingCount: _count?.following || 0
    })
    
  } catch (error) {
    console.error('Error fetching user profile:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

const extractPublicId = (url: string) => {
  // Regex xử lý cả version và định dạng file
  const regex = /\/upload\/(?:v\d+\/)?([^\.]+)/
  const match = url.match(regex)
  return match ? match[1] : null
}

export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Vui lòng chọn ảnh đại diện" })
      return
    }

    // Tạo luồng upload từ buffer
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'avatars',
          format: 'webp',
          transformation: [{ width: 200, height: 200, crop: 'thumb' }],
          overwrite: true, // Ghi đè nếu trùng tên
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result!)
        }
      )
      
      uploadStream.end(req.file!.buffer) // Sử dụng stream thay vì base64 để tối ưu hiệu năng
    })

    // Xóa avatar cũ song song với việc upload mới để tối ưu tốc độ
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { avatarUrl: true }
    })

    let deletePromise = Promise.resolve()
    if (user?.avatarUrl && user.avatarUrl.includes('res.cloudinary.com')) {
      const publicId = extractPublicId(user.avatarUrl)
      if (publicId) {
        deletePromise = cloudinary.uploader.destroy(publicId, {
          invalidate: true // Xóa cache CDN
        }).catch(error => {
          console.error("Lỗi khi xóa avatar cũ:", error)
        })
      }
    }
    
    // Cập nhật avatar mới và đợi xóa avatar cũ hoàn tất
    const [updatedUser] = await Promise.all([
      prisma.user.update({
        where: { id: req.user.id },
        data: { avatarUrl: result.secure_url },
        select: { avatarUrl: true }
      }),
      deletePromise
    ])

    res.status(200).json({
      message: "Cập nhật ảnh đại diện thành công",
      avatarUrl: updatedUser.avatarUrl
    })

  } catch (err) {
    console.error("Lỗi khi cập nhật ảnh đại diện:", err)
    res.status(500).json({ 
      error: err instanceof Error ? err.message : "Lỗi hệ thống"
    })
  }
}

// Thêm hàm này vào userController.js
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { fullname, username, email, gender } = req.body

    // Kiểm tra dữ liệu bắt buộc
    if (!fullname || !username || !email || !gender) {
      res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin" })
      return
    }

    // Kiểm tra định dạng gender
    if (!['male', 'female'].includes(gender.toLowerCase())) {
      res.status(400).json({ error: "Giới tính không hợp lệ" })
      return
    }

    // Cập nhật thông tin
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fullname,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        gender: gender.toLowerCase() as 'male' | 'female',
      },
      select: {
        id: true,
        fullname: true,
        username: true,
        email: true,
        gender: true,
        avatarUrl: true,
      }
    })

    res.status(200).json({
      message: "Cập nhật thông tin thành công",
      user: updatedUser
    })

  } catch (error: any) {
    console.error("Lỗi khi cập nhật thông tin:", error);

    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      res.status(400).json({
        error: field 
          ? `${field.charAt(0).toUpperCase() + field.slice(1)} đã tồn tại`
          : "Thông tin đã tồn tại"
      });
      return
    }

    res.status(500).json({
      error: error.message || "Lỗi hệ thống"
    })
    return
  }
}

// Follow user
export const followUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const followerId = req.user.id

    if (followerId === userId) {
      res.status(400).json({ error: "Không thể tự theo dõi bản thân" })
      return
    }

    // Kiểm tra user tồn tại
    const userToFollow = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!userToFollow) {
      res.status(404).json({ error: "Người dùng không tồn tại" })
      return
    }

    const newFollow = await prisma.follow.create({
      data: {
        followerId,
        followingId: userId
      }
    })

    res.status(201).json({
      message: "Theo dõi thành công",
      data: newFollow
    })
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ error: "Đã theo dõi người dùng này" })
      return
    }
    console.error("Lỗi khi theo dõi:", error)
    res.status(500).json({ error: "Lỗi hệ thống" })
    return
  }
}

// Unfollow user
export const unfollowUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const followerId = req.user.id

    const deletedFollow = await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userId
        }
      }
    })

    res.status(200).json({
      message: "Hủy theo dõi thành công",
      data: deletedFollow
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: "Chưa theo dõi người dùng này" })
      return
    }
    console.error("Lỗi khi hủy theo dõi:", error)
    res.status(500).json({ error: "Lỗi hệ thống" })
  }
}

// Get followers
export const getFollowers = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id

    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: { follower: true }
    })

    res.status(200).json({
      data: followers.map(f => ({
        id: f.follower.id,
        username: f.follower.username,
        fullname: f.follower.fullname,
        avatarUrl: f.follower.avatarUrl,
        followedAt: f.createdAt
      }))
    })
  } catch (error) {
    console.error("Lỗi khi lấy danh sách followers:", error)
    res.status(500).json({ error: "Lỗi hệ thống" })
  }
}

// Get following
export const getFollowing = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id

    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: { following: true }
    })

    res.status(200).json({
      data: following.map(f => ({
        id: f.following.id,
        username: f.following.username,
        fullname: f.following.fullname,
        avatarUrl: f.following.avatarUrl,
        followedAt: f.createdAt
      }))
    })
  } catch (error) {
    console.error("Lỗi khi lấy danh sách following:", error)
    res.status(500).json({ error: "Lỗi hệ thống" })
  }
}
