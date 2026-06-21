# SketchBoard

SketchBoard is a modern, collaborative, real-time whiteboard web application designed for brainstorming, planning, and sketching.

## Features

- **Real-Time Collaboration**: Work simultaneously with multiple users using WebSocket technology. Every stroke, shape, and text is instantly synced across all connected devices.
- **Drawing Tools**: Includes Freehand Brush, Line, Rectangle, Circle, Arrow, Text, and Eraser.
- **Select, Move, and Resize**: Intuitively move elements around the canvas or resize shapes using dynamic control handles.
- **Dynamic Backgrounds**: Change the canvas background to grid, dots, lines, dark mode, or plain white.
- **Infinite Panning**: A draggable, infinite canvas workspace that lets you explore freely.
- **Authentication**: Secure user login and registration to save and access your boards.
- **Access Control**: Share boards securely via email. Only the owner can invite or remove collaborators.
- **Dashboard**: A clean gallery view of all your personal and shared canvases, complete with auto-generated snapshot thumbnails.

## Tech Stack

- **Frontend**: React, Redux Toolkit, React Router, Vite, TailwindCSS
- **Canvas Rendering**: HTML5 Canvas, Rough.js (for a hand-drawn feel), perfect-freehand (for smooth brush strokes)
- **Backend**: Node.js, Express
- **Real-Time Communication**: Socket.io
- **Database**: MongoDB & Mongoose
- **Authentication**: JWT (JSON Web Tokens)

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB (Local or Atlas URI)

### Environment Variables

You need to set up `.env` files for both the frontend and backend.

**Backend (`backend/.env`)**:

```env
PORT=8000
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

**Frontend (`frontend/.env`)**:

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

1. **Start the Backend Server**

   ```bash
   cd backend
   npm run dev
   ```

2. **Start the Frontend Server**

   ```bash
   cd frontend
   npm run dev
   ```
