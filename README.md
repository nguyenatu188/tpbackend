## Hướng Dẫn Cài Đặt & Chạy Dự Án

### Tiên quyết: Tải nodejs về máy tính

### 1. Clone project về máy
```bash
git clone https://github.com/nguyenatu188/tpbackend.git
```

### 2. Tạo file package.json bằng lệnh sau
```bash
npm init -y
```

### sửa package.json như sau:

tìm phần scripts và thay bằng:
```bash
"scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "build": "tsc"
},
```

thêm dòng sau vào file:
```bash
"type": "module",
```

### 3. Cài Dependencies
```bash
npm install typescript tsx nodemon -D
npm install express
npm install prisma @prisma/client
npm install jsonwebtoken cookie-parser bcryptjs
npm install dotenv
npm install @types/express @types/bcryptjs @types/cookie-parser @types/jsonwebtoken @types/node
```

### 4. Initialize typescript
```bash
npx tsc -init
```

### Copy file tsconfig dưới vào file tsconfig mới được tạo
```bash
{
  "compilerOptions": {
    "target": "ES2020",                          
    "module": "NodeNext",                        
    "rootDir": "src",                         
    "outDir": "dist",                            
    "strict": true,                              
    "esModuleInterop": true,
    "skipLibCheck": true,           
    "moduleResolution": "NodeNext",                
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}

```

### Tạo file ".env" ở root folder. Tạo tài khoản và tạo project mới trên neon console. Ở phần connect to your database, nhấn connect, chuyển lựa chọn connection string sang prisma. Nhấn vào ".env" => copy paste vào file ".env" của mình

### 5. Chạy development
```bash
npm run dev
```
