import { Request, Response } from 'express'
import prisma from '../db/prisma.js'
import bcryptjs from "bcryptjs"
import generateToken from '../utils/generateToken.js'
import { OAuth2Client } from 'google-auth-library'
import sendEmail from '../utils/sendEmail.js'
import { generateResetToken } from '../utils/generateToken.js'
import jwt from "jsonwebtoken"

export const login = async (req: Request, res:Response) => {
  try {
    const { username, password } = req.body
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      res.status(400).json({error: "can't find user"})
      return
    }
    const isPasswordCorrect = await bcryptjs.compare(password, user.password)

    if (!isPasswordCorrect) {
      res.status(400).json({error: "Invalid password"})
      return
    }

    generateToken(user.id, res)
    res.status(200).json({
      id: user.id,
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      gender: user.gender,
      avatarUrl: user.avatarUrl,
    })
  } catch (error: any) {
    console.log(error.message)
    res.status(500).json({error: "Internal server error"})
  }
}

export const logout = async (req: Request, res:Response) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 })
    res.status(200).json({message: "Logged out"})
  } catch (error: any) {
    console.log(error.message)
    res.status(500).json({error: "Internal server error"})
  }
}

export const register = async (req: Request, res: Response) => {
  try {
    const { fullname, username, email, gender, password } = req.body
    if (!fullname || !username || !email || !password || !gender) {
      res.status(400).json({error: "All fields are required"})
      return
    }

    const user = await prisma.user.findUnique({ where: { username } })

    if (user) {
      res.status(400).json({error: "User already exists"})
      return
    }

    const salt = await bcryptjs.genSalt(10)
    const hashedPassword = await bcryptjs.hash(password, salt)
    
    const boyProfile = `https://avatar.iran.liara.run/public/boy?username=${username}`
    const girlProfile = `https://avatar.iran.liara.run/public/girl?username=${username}`
    
    const newUser = await prisma.user.create({
      data: {
        fullname,
        username,
        email,
        gender,
        password: hashedPassword,
        avatarUrl: gender === "male" ? boyProfile : girlProfile,
      },
    })

    if (newUser) {
      generateToken(newUser.id, res)
      res.status(201).json({
        id: newUser.id,
        fullname: newUser.fullname,
        username: newUser.username,
        email: newUser.email,
        gender: newUser.gender,
        avatarUrl: newUser.avatarUrl,
      })
    } else {
      res.status(400).json({error: "Invalid user data"})
    }
  } catch (error: any) {
    console.log(error.message)
    res.status(500).json({error: "Internal server error"})
  }
}

//get the current user
export const getMe = async (req: Request, res:Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        _count: {
          select: {
            followers: true,  // Số người theo dõi mình
            following: true   // Số người mình đang theo dõi
          }
        }
      }
    })
    
    if (!user) {
      res.status(404).json({message: "User not found"})
      return
    }

    res.status(200).json({
      id: user.id,
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      gender: user.gender,
      avatarUrl: user.avatarUrl,
      followersCount: user._count?.followers,
      followingCount: user._count?.following
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({message: "Internal server error"})
  }
}

const client = new OAuth2Client(process.env.CLIENT_ID)

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { credential } = req.body
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.CLIENT_ID
    })
    const payload = ticket.getPayload()

    if (!payload) {
      res.status(400).json({ error: "Invalid Google token" })
      return
    }
    
    const { email, name, sub: googleId, picture } = payload

    if (!email || !googleId || !name) {
      res.status(400).json({ error: "Missing Google profile information" })
      return
    }

    let user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      user = await prisma.user.create({
        data: {
          fullname: name || "No name",
          username: (email?.split("@")[0] ?? "unknown") + "_" + googleId.slice(0, 6),
          email: email || "unknown",
          gender: "male",
          password: "",
          avatarUrl: picture,
        }
      })
    }

    generateToken(user.id, res)
    res.status(200).json({
      id: user.id,
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      gender: user.gender,
      avatarUrl: user.avatarUrl,
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Google login failed" })
  }
}

export const facebookLogin = async (req: Request, res: Response) => {
  try {
    const { accessToken, userID } = req.body
    
    const response = await fetch(`https://graph.facebook.com/v13.0/me?fields=id,name,email,gender,picture.type(large)&access_token=${accessToken}`);
    
    if (!response.ok) {
      res.status(400).json({ error: "Invalid Facebook token" })
      return
    }
    
    const fbData = await response.json();
    
    if (fbData.id !== userID) {
      res.status(400).json({ error: "Facebook user ID mismatch" })
      return
    }
    
    console.log("Facebook data:", fbData)
    
    const { name, email, gender, id: facebookId, picture } = fbData
    
    if (!facebookId || !name) {
      res.status(400).json({ error: "Missing Facebook profile information" })
      return
    }
    
    let user = email ? await prisma.user.findUnique({ where: { email } }) : null;
    
    let parsedGender: 'male' | 'female' = 'male'
    if (gender === 'female') {
      parsedGender = 'female'
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          fullname: name || "No name",
          username: (email?.split("@")[0] ?? "fb_user") + "_" + facebookId.slice(0, 3),
          email: email || `fb_${facebookId}@facebook.com`,
          gender: parsedGender,
          password: "",
          avatarUrl: picture?.data?.url || null,
        }
      })
    }
    
    generateToken(user.id, res)
    res.status(200).json({
      id: user.id,
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      gender: user.gender,
      avatarUrl: user.avatarUrl,
    })
    
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Facebook login failed" })
  }
}

export const forgetPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    if (!email) {
      res.status(400).json({ error: "Email is required" })
      return
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      res.status(404).json({ error: "User with this email does not exist" })
      return
    }

    const token = generateResetToken(user.id)
    const resetLink = `${process.env.FE_URL}/reset-password?token=${token}`

    const emailContent = `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="padding: 20px; text-align: center; background-color: #4caf50; color: white;">
            <h2>Trip Planner</h2>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px;">Hi <strong>${user.fullname}</strong>,</p>
            <p style="font-size: 15px;">Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu của bạn.</p>
            <p style="font-size: 15px;">Nhấn vào nút bên dưới để tiến hành:</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #4caf50; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 16px;">Đặt lại mật khẩu</a>
            </div>

            <p style="font-size: 14px; color: #888;">Liên kết sẽ hết hạn sau 15 phút. Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
            <p style="font-size: 14px;">Cảm ơn bạn,</p>
            <p style="font-size: 14px; font-weight: bold;">Trip Planner Team</p>
          </div>
        </div>
      </div>`

    await sendEmail(email, 'Reset Your Password', emailContent)

    res.status(200).json({ message: "Reset link sent to your email" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to send reset email" })
  }
}

export const resetPassword = async (req: Request, res: Response) => {
  const { token, password } = req.body

  if (!token || !password) {
    res.status(400).json({ error: "Token và mật khẩu mới là bắt buộc." })
    return
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_RESET_SECRET!) as { id: string }
    const userId = decoded.id

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      res.status(404).json({ error: "Người dùng không tồn tại." })
      return
    }

    const hashedPassword = await bcryptjs.hash(password, 10)

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })

    res.status(200).json({ message: "Đặt lại mật khẩu thành công." })
  } catch (err: any) {
    console.error("Reset password error:", err)

    if (err.name === "TokenExpiredError") {
      res.status(400).json({ error: "Token đã hết hạn. Vui lòng yêu cầu lại." })
      return
    }
    if (err.name === "JsonWebTokenError") {
      res.status(400).json({ error: "Token không hợp lệ." })
      return
    }

    res.status(500).json({ error: "Có lỗi xảy ra khi đặt lại mật khẩu." })
  }
}
