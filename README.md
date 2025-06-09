## Hướng Dẫn Cài Đặt & Chạy Dự Án

### Tiên quyết: Tải nodejs về máy tính

### 1. Clone project về máy
```bash
git clone https://github.com/nguyenatu188/tpbackend.git
```

### 2. Cài Dependencies
```bash
npm i
```

### Tạo file ".env" ở root folder. Tạo tài khoản và tạo project mới trên neon console. Ở phần connect to your database, nhấn connect, chuyển lựa chọn connection string sang prisma. Nhấn vào ".env" => copy paste vào file ".env" của mình

### 3. Set up các biến môi trường
```bash
.env file:
DATABASE_URL="set up neon console để lấy url"

PORT=5001
JWT_SECRET=mysecretkey
NODE_ENV=development

CLIENT_ID= người dùng set up Oath2 authentication và tạo credentials để lấy clientID
CLIENT_SECRET=làm như trên để lấy client secret

EMAIL_USER= “email muốn dùng để làm nguồn gửi email reset mật khẩu”
EMAIL_PASS=kích hoạt bảo mật 2 lớp rồi copy app password vô đây.
JWT_RESET_SECRET=matmasieubimat
FE_URL=http://localhost:"port của Frontend"

//đăng ký tài khoản cloudinary rồi copy 3 giá trị sau vào đây.
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 4. Migrate database
```bash
Chạy lệnh: npx prisma generate && npx prisma migrate
```

### 5. Chạy development
```bash
npm run dev
```
