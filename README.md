# 🚗 AutoCare AI

> AI-powered vehicle maintenance and care platform built on the MERN stack.

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS v3     |
| Backend   | Node.js, Express 4                  |
| Database  | MongoDB Atlas (Mongoose ODM)        |
| Auth      | JWT (Access + Refresh token pattern)|

---

## Project Structure

```
AutoCare-AI/
├── client/    # React + Vite frontend (port 5173)
└── server/    # Node.js + Express API  (port 5000)
```

---

## Quick Start

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9
- A free [MongoDB Atlas](https://cloud.mongodb.com) cluster

### 1. Clone & configure environment

```bash
# Backend
cd server
cp .env.example .env
# Fill in MONGO_URI and JWT_SECRET in server/.env

# Frontend
cd ../client
cp .env.example .env
```

### 2. Install dependencies

```bash
# From project root — run both installs
cd server && npm install
cd ../client && npm install
```

### 3. Run in development

Open **two terminals**:

```bash
# Terminal 1 – API server
cd server && npm run dev

# Terminal 2 – Vite dev server
cd client && npm run dev
```

- Frontend → http://localhost:5173  
- Backend  → http://localhost:5000  
- Health   → http://localhost:5000/api/health

---

## API Endpoints

| Method | Path                   | Auth   | Description          |
|--------|------------------------|--------|----------------------|
| GET    | /api/health            | ✗      | Health check         |
| POST   | /api/auth/register     | ✗      | Register new user    |
| POST   | /api/auth/login        | ✗      | Login, get JWT       |
| GET    | /api/auth/me           | ✓ JWT  | Get current user     |
| POST   | /api/auth/logout       | ✓ JWT  | Logout               |

---

## Environment Variables

### `server/.env`

```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/autocare-ai
JWT_SECRET=your_super_secret_key_change_me
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### `client/.env`

```
VITE_API_BASE_URL=http://localhost:5000
```

---

## License

MIT
