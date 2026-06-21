import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { authActions } from "../store/store";
import { useEffect, useState } from "react";
import { apiFetch } from "../api/config";
import { FaTrash, FaEdit, FaCheck, FaTimes } from "react-icons/fa";

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [canvases, setCanvases] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingCanvasId, setEditingCanvasId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    Promise.all([apiFetch("/canvas"), apiFetch("/user/profile")])
      .then(([canvasData, userData]) => {
        setCanvases(canvasData);
        setCurrentUser(userData);
      })
      .catch((error) => console.error("Failed to load dashboard data", error))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(e, canvasId) {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this canvas?")) return;
    try {
      await apiFetch(`/canvas/${canvasId}`, { method: "DELETE" });
      setCanvases((prev) => prev.filter((c) => c.canvasId !== canvasId));
    } catch (error) {
      console.error("Failed to delete", error);
    }
  }

  function handleStartRename(e, canvasId, currentTitle) {
    e.stopPropagation();
    setEditingCanvasId(canvasId);
    setRenameValue(currentTitle || "Untitled Canvas");
  }

  async function handleSaveRename(e, canvasId) {
    e.stopPropagation();
    try {
      await apiFetch(`/canvas/${canvasId}`, {
        method: "PUT",
        body: JSON.stringify({ title: renameValue }),
      });
      setCanvases((prev) =>
        prev.map((c) =>
          c.canvasId === canvasId ? { ...c, title: renameValue } : c,
        ),
      );
      setEditingCanvasId(null);
    } catch (error) {
      console.error("Failed to rename", error);
    }
  }

  function handleCancelRename(e) {
    e.stopPropagation();
    setEditingCanvasId(null);
  }

  function handleSignOut() {
    dispatch(authActions.clearCredentials());
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white font-sans flex flex-col">
      {}
      <nav className="border-b border-zinc-800 bg-[#111113] px-6 py-4 flex items-center justify-between">
        <span className="text-lg font-black tracking-tight">
          Sketch<span className="text-violet-500">Board</span>
        </span>
        <div className="flex items-center gap-4">
          <Link
            to="/profile"
            id="nav-profile-link"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Profile
          </Link>
          <button
            id="nav-signout-btn"
            onClick={handleSignOut}
            className="text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-4 py-1.5 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      {}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold text-white">My Canvases</h1>
            <p className="text-zinc-500 text-sm mt-1">
              All your whiteboards in one place.
            </p>
          </div>
          <Link
            to="/canvas/new"
            id="create-canvas-btn"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 active:bg-violet-700
              text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            <span aria-hidden="true">✦</span>
            New canvas
          </Link>
        </div>

        {}
        {loading ? (
          <div className="flex justify-center py-24 text-zinc-500">
            <p>Loading your canvases...</p>
          </div>
        ) : canvases.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-24 gap-5
            rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30"
          >
            <div className="text-4xl opacity-30" aria-hidden="true">
              🎨
            </div>
            <p className="text-zinc-400 font-medium">No canvases yet</p>
            <p className="text-zinc-600 text-sm text-center max-w-xs">
              Create your first whiteboard to get started. Canvases you create
              will appear here.
            </p>
            <Link
              to="/canvas/new"
              className="mt-2 inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500
                text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              Create a canvas
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {canvases.map((canvas) => (
              <div
                key={canvas.canvasId}
                onClick={() => navigate(`/canvas/${canvas.canvasId}`)}
                className="group relative flex flex-col bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden hover:border-violet-500/50 transition-colors cursor-pointer"
              >
                {}
                <button
                  onClick={(e) => handleDelete(e, canvas.canvasId)}
                  className="absolute top-3 right-3 p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  aria-label="Delete canvas"
                >
                  <FaTrash className="text-xs" />
                </button>

                {}
                {canvas.snapshot ? (
                  <img
                    src={canvas.snapshot}
                    alt={canvas.title}
                    className="h-32 w-full object-cover border-b border-zinc-800 transition-colors"
                  />
                ) : (
                  <div
                    className="h-32 w-full border-b border-zinc-800 transition-colors"
                    style={{
                      backgroundColor:
                        canvas.bgStyle === "dark"
                          ? "#0f0f11"
                          : canvas.bgStyle === "white"
                            ? "#ffffff"
                            : "#f8f7f4",
                    }}
                  />
                )}

                {}
                {currentUser && canvas.userId !== currentUser._id && (
                  <div className="absolute top-3 left-3 bg-violet-600/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shadow-sm pointer-events-none z-10 flex items-center gap-1.5">
                    <FaCheck className="text-[8px]" /> Shared
                  </div>
                )}
                <div className="p-4 flex flex-col justify-center min-h-20">
                  {editingCanvasId === canvas.canvasId ? (
                    <div
                      className="flex items-center gap-2 mb-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            handleSaveRename(e, canvas.canvasId);
                          if (e.key === "Escape") handleCancelRename(e);
                        }}
                        className="flex-1 bg-zinc-800 text-white text-sm px-2 py-1 rounded outline-none border border-violet-500/50"
                      />
                      <button
                        onClick={(e) => handleSaveRename(e, canvas.canvasId)}
                        className="text-emerald-400 hover:text-emerald-300"
                      >
                        <FaCheck />
                      </button>
                      <button
                        onClick={handleCancelRename}
                        className="text-zinc-500 hover:text-zinc-300"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-white font-medium truncate group-hover:text-violet-400 transition-colors">
                        {canvas.title || "Untitled Canvas"}
                      </h3>
                      <button
                        onClick={(e) =>
                          handleStartRename(e, canvas.canvasId, canvas.title)
                        }
                        className="text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        aria-label="Rename canvas"
                      >
                        <FaEdit />
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-zinc-500">
                    Last edited:{" "}
                    {new Date(canvas.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
