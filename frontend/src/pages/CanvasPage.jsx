import Board from "../components/Board/Board";
import Toolbar from "../components/Toolbar/Toolbar";
import Toolbox from "../components/Toolbox/Toolbox";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { authActions, boardActions } from "../store/store";
import { useEffect, useState, useRef } from "react";
import { apiFetch } from "../api/config";
import { socket } from "../api/socket";
import { FaSave, FaUserPlus } from "react-icons/fa";
import ShareModal from "../components/ShareModal/ShareModal";

export default function CanvasPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const boardState = useSelector((s) => s.board);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const isRemoteUpdate = useRef(false);

  function handleSignOut() {
    dispatch(authActions.clearCredentials());
    navigate("/login", { replace: true });
  }

  useEffect(() => {
    async function loadOrCreateCanvas() {
      try {
        const userData = await apiFetch("/user/profile");
        setCurrentUser(userData);

        if (!id || id === "new") {
          const data = await apiFetch("/canvas", {
            method: "POST",
            body: JSON.stringify({}),
          });
          navigate(`/canvas/${data.canvasId}`, { replace: true });
        } else {
          const data = await apiFetch(`/canvas/${id}`);
          dispatch(
            boardActions.hydrateBoard({
              ...data,
              userId: data.userId,
              sharedWith: data.sharedWith,
            }),
          );
          setIsLoaded(true);
        }
      } catch (error) {
        console.error("Failed to load/create canvas:", error);
      }
    }
    loadOrCreateCanvas();
  }, [id, dispatch, navigate]);

  useEffect(() => {
    if (id && id !== "new") {
      socket.connect();
      socket.emit("join-canvas", id);

      const handleRemoteUpdate = (data) => {
        isRemoteUpdate.current = true;
        dispatch(boardActions.syncBoard(data));
      };

      socket.on("canvas-updated", handleRemoteUpdate);

      return () => {
        socket.off("canvas-updated", handleRemoteUpdate);
        socket.disconnect();
      };
    }
  }, [id, dispatch]);

  useEffect(() => {
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }
    if (id && id !== "new" && isLoaded) {
      socket.emit("canvas-update", {
        canvasId: id,
        elements: boardState.elements,
        bgStyle: boardState.bgStyle,
      });
    }
  }, [boardState.elements, boardState.bgStyle, id, isLoaded]);

  async function handleSave() {
    if (!id || id === "new") return;
    setIsSaving(true);
    try {
      const { title, elements, history, historyIndex, panOffset, bgStyle } =
        boardState;

      let snapshot = "";
      const mainCanvas = document.getElementById("canvas");
      if (mainCanvas) {
        const offscreen = document.createElement("canvas");
        offscreen.width = 400;
        offscreen.height = (mainCanvas.height / mainCanvas.width) * 400 || 300;
        const ctx = offscreen.getContext("2d");
        ctx.drawImage(mainCanvas, 0, 0, offscreen.width, offscreen.height);
        snapshot = offscreen.toDataURL("image/jpeg", 0.6);
      }

      await apiFetch(`/canvas/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          title,
          elements,
          history,
          historyIndex,
          panOffset,
          bgStyle,
          snapshot,
        }),
      });
    } catch (error) {
      console.error("Failed to save canvas:", error);
    } finally {
      setIsSaving(false);
    }
  }

  if (id && id !== "new" && !isLoaded) {
    return (
      <div className="min-h-screen bg-[#0f0f11] flex items-center justify-center text-zinc-400">
        Loading canvas...
      </div>
    );
  }

  return (
    <div
      className="relative w-screen h-screen overflow-hidden select-none"
      style={{ backgroundColor: "#f8f7f4" }}
    >
      {}
      <div
        className="
          absolute top-0 left-0 right-0 z-20 h-12
          flex items-center justify-between px-4
          pointer-events-none
        "
      >
        {}
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white/70 backdrop-blur-sm border border-black/6 px-3 py-1.5 rounded-xl shadow-sm">
            <span className="text-sm font-black tracking-tight text-zinc-800">
              Sketch<span className="text-violet-600">Board</span>
            </span>
          </div>
          {}
          <input
            type="text"
            value={boardState.title}
            onChange={(e) => dispatch(boardActions.setTitle(e.target.value))}
            className="bg-white/70 backdrop-blur-sm border border-black/6 px-3 py-1.5 rounded-xl shadow-sm text-sm font-medium text-zinc-700 outline-none focus:ring-2 focus:ring-violet-500 transition-all w-48"
            placeholder="Untitled Canvas"
          />
        </div>

        {}
        <div className="pointer-events-auto flex items-center gap-2">
          {currentUser && boardState.userId === currentUser._id && (
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="
                flex items-center gap-1.5 text-xs font-semibold
                bg-white/70 hover:bg-white text-violet-600 border border-violet-500/20
                px-3 py-1.5 rounded-xl shadow-sm transition-all duration-150
              "
            >
              <FaUserPlus />
              Share
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="
              flex items-center gap-1.5 text-xs font-semibold
              bg-violet-600 hover:bg-violet-500 text-white
              px-3 py-1.5 rounded-xl shadow-sm transition-all duration-150
              disabled:opacity-50
            "
          >
            <FaSave />
            {isSaving ? "Saving..." : "Save"}
          </button>
          <Link
            to="/dashboard"
            className="
              text-xs text-zinc-500 font-medium
              bg-white/70 backdrop-blur-sm border border-black/6
              hover:bg-white hover:text-zinc-700 hover:border-black/10
              px-3 py-1.5 rounded-xl shadow-sm transition-all duration-150
            "
          >
            ← Dashboard
          </Link>
          <button
            onClick={handleSignOut}
            className="
              text-xs text-zinc-400 font-medium
              bg-white/50 backdrop-blur-sm border border-black/6
              hover:bg-red-50 hover:text-red-500 hover:border-red-200
              px-3 py-1.5 rounded-xl shadow-sm transition-all duration-150
            "
          >
            Sign out
          </button>
        </div>
      </div>

      {}
      <Toolbar />
      <Board />
      <Toolbox />

      {}
      {isShareModalOpen &&
        currentUser &&
        boardState.userId === currentUser._id && (
          <ShareModal
            canvasId={boardState.canvasId}
            sharedWith={boardState.sharedWith}
            onClose={() => setIsShareModalOpen(false)}
            onShareSuccess={(newSharedWith) => {
              dispatch(boardActions.setSharedWith(newSharedWith));
            }}
          />
        )}
    </div>
  );
}
