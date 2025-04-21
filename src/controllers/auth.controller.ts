import { Request, Response } from 'express'
import prisma from '../db/prisma.js'
import bcryptjs from "bcryptjs"
import generateToken from '../utils/generateToken.js'
import { OAuth2Client } from 'google-auth-library'

export const login = async (req: Request, res:Response) => {
  try {
    const { username, password } = req.body //destructuring
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      res.status(400).json({error: "Invalid credentials"})
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
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    
    if (!user) {
      res.status(404).json({message: "User not found"})
      return
    }

    res.status(200).json({
      id: user.id,
      fullname: user.fullname,
      username: user.username,
      avatarUrl: user.avatarUrl
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
          username: (email?.split("@")[0] ?? "fb_user") + "_" + facebookId.slice(0, 6),
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
