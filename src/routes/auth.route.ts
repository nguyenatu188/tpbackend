import express from "express"
import { login, logout, register, getMe, googleLogin, facebookLogin, forgetPassword, resetPassword } from "../controllers/auth.controller.js"
import protectRoute from "../middleware/protectRoute.js"

const router = express.Router()

router.get("/me", protectRoute ,getMe)

// <url>/api/auth/login
router.post("/login", login)

// <url>/api/auth/logout
router.post("/logout", logout)

// <url>/api/auth/register
router.post("/register", register)

// <url>/api/auth/google
router.post("/google" ,googleLogin)

// <url>/api/auth/facebook
router.post("/facebook", facebookLogin)

// <url>/api/auth/forgot-password
router.post("/forget-password", forgetPassword)

// <url>/api/auth/reset-password
router.post("/reset-password", resetPassword)

export default router