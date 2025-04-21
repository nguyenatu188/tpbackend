import jwt from 'jsonwebtoken'
import { Response } from 'express'

const generateToken = (userId: string, res: Response) => {
  // jwt sau mã hóa gồm 3 phần, header (metadata, loại token, thuật toán mã hóa), payload (dữ liệu), signature (chữ ký số dùng secret key)
  // dùng jwt để tạo token, userId là thuộc phần payload , JWT_SECRET là secret key để ký
  const token = jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '15d' })
  // tên của cookie đặt là jwt
  res.cookie('jwt', token, {
    httpOnly: true, //prevent xss attack (cross site scripting), ko truy cập được qua js trên trình duyệt.
    maxAge: 15 * 24 * 60 * 60 * 1000, // milliseconds
    secure: process.env.NODE_ENV !== 'development', // dev: cookie được gửi qua http, môi trường kp dev (như prod) : chỉ được gửi qua https.
    sameSite: 'strict' // prevent csrf attack (cross site request forgery), ko gửi cookie nếu request từ miền khác.
  })
  return token
}

export default generateToken