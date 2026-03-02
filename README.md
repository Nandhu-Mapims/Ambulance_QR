# Ambulance QR Management System

A full-stack MERN application for managing ambulance fleets with QR code generation, JWT authentication, and role-based access control (RBAC).

---

## Project Structure

```
Ambulance_QR/
├── client/          # Vite + React frontend
│   ├── src/
│   │   ├── api/         # Axios instance with interceptors
│   │   ├── components/  # Navbar, ProtectedRoute
│   │   ├── context/     # AuthContext (JWT state)
│   │   ├── pages/       # Login, Register, Dashboard, Ambulances, AddAmbulance
│   │   └── schemas/     # Zod validation schemas (client-side)
│   ├── .env.example
│   └── package.json
│
└── server/          # Node.js + Express API
    ├── src/
    │   ├── config/      # MongoDB connection
    │   ├── controllers/ # authController, ambulanceController
    │   ├── middleware/  # auth (JWT), rbac, validate (Zod), upload (Multer)
    │   ├── models/      # User, Ambulance (Mongoose)
    │   ├── routes/      # /api/auth, /api/ambulances
    │   ├── schemas/     # Zod schemas (server-side)
    │   └── utils/       # QR code generator
    ├── uploads/         # Multer file uploads
    ├── .env.example
    └── package.json
```

---

## Features

- **JWT Authentication** — Register / Login / protected routes
- **RBAC** — Three roles: `admin`, `dispatcher`, `paramedic`
- **Ambulance CRUD** — Create, read, update, delete ambulances
- **QR Code Generation** — Auto-generated on creation; regenerate on demand
- **File Upload** — Ambulance photos via Multer (max 5 MB)
- **Zod Validation** — Shared schema validation on both client and server
- **Rate Limiting** — 100 requests / 15 min per IP

### Role Permissions

| Action                     | Admin | Dispatcher | Paramedic |
|----------------------------|:-----:|:----------:|:---------:|
| View ambulances            | ✅    | ✅         | ✅        |
| Add / edit ambulance       | ✅    | ✅         | ❌        |
| Delete ambulance           | ✅    | ❌         | ❌        |
| Regenerate QR code         | ✅    | ❌         | ❌        |
| List all users             | ✅    | ❌         | ❌        |
| Toggle user active status  | ✅    | ❌         | ❌        |

---

## Prerequisites

- Node.js >= 18
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

---

## Setup

### 1. Clone / open the project

```bash
cd Ambulance_QR
```

### 2. Server

```bash
cd server
npm install
```

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Start the dev server:

```bash
npm run dev
```

The API will be available at `http://localhost:5000`.

### 3. Client

```bash
cd ../client
npm install
```

Copy the example env file:

```bash
cp .env.example .env
```

Start Vite:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Environment Variables

### `server/.env`

| Variable         | Default                                  | Description                          |
|------------------|------------------------------------------|--------------------------------------|
| `PORT`           | `5000`                                   | Express server port                  |
| `MONGO_URI`      | `mongodb://localhost:27017/ambulance_qr` | MongoDB connection string            |
| `JWT_SECRET`     | —                                        | Secret key for signing JWTs          |
| `JWT_EXPIRES_IN` | `7d`                                     | JWT expiry duration                  |
| `NODE_ENV`       | `development`                            | `development` or `production`        |
| `CLIENT_URL`     | `http://localhost:5173`                  | Allowed CORS origin                  |

### `client/.env`

| Variable        | Default                      | Description               |
|-----------------|------------------------------|---------------------------|
| `VITE_API_URL`  | `http://localhost:5000/api`  | Base URL for API calls    |

---

## API Endpoints

### Auth — `/api/auth`

| Method | Path              | Auth | Role  | Description           |
|--------|-------------------|------|-------|-----------------------|
| POST   | `/register`       | —    | —     | Register new user     |
| POST   | `/login`          | —    | —     | Login, returns JWT    |
| GET    | `/me`             | JWT  | any   | Get current user      |
| GET    | `/users`          | JWT  | admin | List all users        |
| PATCH  | `/users/:id/status` | JWT | admin | Toggle user active   |

### Ambulances — `/api/ambulances`

| Method | Path          | Auth | Role             | Description           |
|--------|---------------|------|------------------|-----------------------|
| GET    | `/`           | JWT  | any              | List ambulances       |
| GET    | `/:id`        | JWT  | any              | Get single ambulance  |
| POST   | `/`           | JWT  | admin/dispatcher | Create ambulance      |
| PUT    | `/:id`        | JWT  | admin/dispatcher | Update ambulance      |
| DELETE | `/:id`        | JWT  | admin            | Delete ambulance      |
| POST   | `/:id/qr`     | JWT  | admin            | Regenerate QR code    |

> `POST /` and `PUT /:id` accept `multipart/form-data` for optional image upload.

---

## Scripts

### Server

| Script      | Command            | Description                     |
|-------------|--------------------|---------------------------------|
| `dev`       | `npm run dev`      | Start with nodemon (hot-reload) |
| `start`     | `npm start`        | Start in production mode        |

### Client

| Script      | Command            | Description                     |
|-------------|--------------------|---------------------------------|
| `dev`       | `npm run dev`      | Vite dev server                 |
| `build`     | `npm run build`    | Production build to `dist/`     |
| `preview`   | `npm run preview`  | Preview production build        |

---

## Tech Stack

| Layer    | Technology                                          |
|----------|-----------------------------------------------------|
| Frontend | Vite, React 18, React Router v6, Bootstrap 5        |
| Forms    | React Hook Form + Zod + @hookform/resolvers          |
| HTTP     | Axios (with JWT interceptor)                        |
| Backend  | Node.js, Express 4                                  |
| Database | MongoDB + Mongoose 8                                |
| Auth     | JWT (jsonwebtoken) + bcryptjs                       |
| Files    | Multer (disk storage, 5 MB limit)                   |
| QR       | qrcode (base64 PNG data URLs)                       |
| Validate | Zod (shared schemas on both sides)                  |
| Security | express-rate-limit, CORS                            |
