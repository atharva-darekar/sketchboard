# SketchBoard

A real-time collaborative whiteboard application where teams can draw, sketch, and brainstorm together on an infinite canvas with a hand-drawn aesthetic.

**Live Demo**: ([SketchBoard](https://sketchboardapp.vercel.app/))

## Features

- **Real-Time Collaboration** — Work simultaneously with multiple users using Socket.io WebSockets. Strokes, shapes, text, and background changes sync instantly across all connected devices.
- **Drawing Tools** — Freehand Brush (powered by perfect-freehand for natural pressure simulation), Line, Rectangle, Circle, Arrow, Text (with the Caveat handwriting font), and Eraser with a visual trail effect.
- **Hand-Drawn Aesthetic** — All shapes are rendered using Rough.js, giving a sketched/hand-drawn feel. Seeded randomness ensures shapes render consistently across re-draws.
- **Select, Move & Resize** — Select any element, drag to reposition, or resize using corner/endpoint handles. Lines and arrows have start/end handles; rectangles and circles have four corner handles; text has a font-size handle.
- **Undo / Redo** — Full undo/redo history that persists to the database. Close the browser, reopen, and your undo stack is still there. Keyboard shortcuts: `Ctrl+Z` / `Ctrl+Y`.
- **Dynamic Backgrounds** — Switch between 6 canvas backgrounds: Grid, Dots, Lines, Dark mode, White, and Plain.
- **Infinite Panning** — Drag the canvas freely in any direction with the Pan tool.
- **Canvas Export** — Download the current canvas view as a PNG image.
- **Authentication** — JWT-based login and registration with access token (1h) and refresh token (7d) rotation. Silent token refresh on 401 responses.
- **Access Control** — Canvas owners can share boards via email. Only the owner can invite or remove collaborators. Collaborators can view and edit, but not delete or share.
- **Dashboard** — Gallery view of all owned and shared canvases with auto-generated JPEG snapshot thumbnails, inline rename, and delete.
- **Profile Page** — View account details and membership date.

## Architecture

```
┌──────────────────────┐         ┌──────────────────────────────┐
│    Vercel CDN        │         │    Azure VM                  │
│  (Frontend - React)  │◄───────►│  ┌──────────┐  ┌──────────┐ │
│                      │  HTTPS  │  │  Caddy   │──│ Node.js  │ │
│  React 19 + Redux    │   +     │  │  (TLS)   │  │ Express  │ │
│  Vite + TailwindCSS  │  WSS   │  └──────────┘  │ Socket.io│ │
└──────────────────────┘         │                └──────┬───┘ │
                                 └───────────────────────┼─────┘
                                                         │
                                              ┌──────────▼───────────┐
                                              │   MongoDB Atlas      │
                                              │   (Managed Cloud)    │
                                              └──────────────────────┘
```

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Redux Toolkit, React Router v7, Vite, TailwindCSS v4 |
| **Canvas Rendering** | HTML5 Canvas API, Rough.js (hand-drawn shapes), perfect-freehand (brush strokes) |
| **Backend** | Node.js, Express v5, Socket.io |
| **Database** | MongoDB Atlas, Mongoose v9 |
| **Authentication** | JWT (access + refresh tokens), bcrypt |
| **Deployment** | Docker, Caddy (auto HTTPS), Vercel (frontend), Azure VM (backend) |
| **CI/CD** | GitHub Actions → SSH → deploy.sh |

## Project Structure

```
whiteboard/
├── .github/workflows/
│   └── deploy.yml              # GitHub Actions CI/CD pipeline
├── backend/
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── controllers/
│   │   ├── canvasController.js  # CRUD + sharing logic (7 endpoints)
│   │   └── userController.js    # Auth + profile (4 endpoints)
│   ├── middlewares/
│   │   └── authMiddleware.js    # JWT verification
│   ├── models/
│   │   ├── canvasModel.js       # Canvas schema (elements, history, ACL)
│   │   └── userModel.js         # User schema (bcrypt pre-save hook)
│   ├── routes/
│   │   ├── canvasRoute.js       # RESTful canvas routes (all protected)
│   │   └── userRoute.js         # Auth routes (public + protected)
│   ├── Dockerfile               # Alpine Node.js image, non-root user
│   ├── package.json
│   └── server.js                # Express + Socket.io entry point
├── frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── api/
│   │   │   ├── config.js        # apiFetch wrapper with auto token refresh
│   │   │   └── socket.js        # Socket.io client singleton
│   │   ├── components/
│   │   │   ├── Board/           # HTML5 Canvas renderer (530 lines)
│   │   │   ├── ShareModal/      # Collaborator invite/remove modal
│   │   │   ├── Toolbar/         # Floating tool selection bar
│   │   │   ├── Toolbox/         # Context-sensitive color/size panel
│   │   │   └── PrivateRoute.jsx # Auth guard (layout route)
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx     # Login/Register with animated tabs
│   │   │   ├── CanvasPage.jsx   # Main drawing page (orchestrator)
│   │   │   ├── Dashboard.jsx    # Canvas gallery with thumbnails
│   │   │   └── Profile.jsx      # User profile page
│   │   ├── store/
│   │   │   └── store.js         # Redux store (4 slices, 530 lines)
│   │   ├── utils/
│   │   │   ├── createFreeHandPath.js  # perfect-freehand → Path2D
│   │   │   ├── createRoughElement.js  # Rough.js element factory
│   │   │   └── math.js               # Geometry engine (hit-testing)
│   │   ├── constants.js         # Tool, color, and style enums
│   │   ├── App.jsx              # Router configuration
│   │   ├── main.jsx             # React entry point
│   │   └── index.css            # Caveat font + Tailwind import
│   ├── index.html
│   ├── vite.config.js
│   ├── vercel.json              # SPA rewrite rule
│   └── package.json
├── Caddyfile                    # Reverse proxy config
├── docker-compose.yml           # Backend + Caddy containers
├── deploy.sh                    # VM deployment script
└── README.md
```

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local instance or [MongoDB Atlas](https://www.mongodb.com/atlas) URI)

### Environment Variables

**Backend** (`backend/.env`):
```env
PORT=8000
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:8000
```

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/atharva-darekar/sketchboard.git
   cd whiteboard
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Running Locally

1. **Start the backend server** (runs on port 8000)
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend dev server** (runs on port 5173)
   ```bash
   cd frontend
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Deployment

### Frontend (Vercel)

The frontend is deployed to Vercel. The `vercel.json` rewrite rule ensures client-side routing works correctly.

### Backend (Docker + Azure VM)

The backend runs in Docker on an Azure VM with Caddy for automatic HTTPS.

```bash
# On the VM
bash deploy.sh
```

### CI/CD

Every push to `main` triggers the GitHub Actions workflow, which SSHs into the Azure VM and runs `deploy.sh`. Required GitHub secrets:
- `VM_HOST` — VM IP address or hostname
- `VM_USERNAME` — SSH username
- `VM_SSH_KEY` — Private SSH key

## API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/user/register` | Public | Create account |
| POST | `/user/login` | Public | Login, receive access + refresh tokens |
| POST | `/user/refresh` | Public | Exchange refresh token for new access token |
| GET | `/user/profile` | Bearer | Get current user profile |

### Canvases
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/canvas` | Bearer | Create new canvas |
| GET | `/canvas` | Bearer | List all owned + shared canvases |
| GET | `/canvas/:canvasId` | Bearer | Get canvas by ID |
| PUT | `/canvas/:canvasId` | Bearer | Update canvas (partial) |
| DELETE | `/canvas/:canvasId` | Bearer | Delete canvas (owner only) |
| POST | `/canvas/:canvasId/share` | Bearer | Invite collaborator by email |
| DELETE | `/canvas/:canvasId/share/:userId` | Bearer | Remove collaborator |

### WebSocket Events
| Event | Direction | Payload |
|---|---|---|
| `join-canvas` | Client → Server | `canvasId` |
| `canvas-update` | Client → Server | `{ canvasId, elements, bgStyle }` |
| `canvas-updated` | Server → Client | `{ elements, bgStyle }` |

## License

MIT
