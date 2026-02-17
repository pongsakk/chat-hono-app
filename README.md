# chat-hono-app

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.9. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

Dockerfile - ใช้ oven/bun:1 image, install dependencies แล้วรัน app ที่ port 3000

docker-compose.yml

app - Hono app (port 3000) เชื่อมต่อ MongoDB ผ่าน MONGO_URI
mongo - MongoDB 7 (port 27017) พร้อม volume mongo-data เก็บข้อมูลถาวร
.dockerignore - ไม่ copy node_modules, dist, .git เข้า image

วิธีใช้:


docker compose up -d        # รันทั้ง app + mongo
docker compose down          # หยุด
docker compose up -d --build # build ใหม่หลังแก้โค้ด