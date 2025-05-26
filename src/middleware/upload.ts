import multer from "multer"

const upload = multer({
  storage: multer.memoryStorage(), // Sử dụng bộ nhớ tạm thời để lưu trữ file
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true)
    else cb(new Error("Chỉ chấp nhận file ảnh!"))
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 5MB
})

export default upload