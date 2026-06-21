import { useState } from "react";
import { FaTimes, FaUserPlus, FaUsers } from "react-icons/fa";
import { apiFetch } from "../../api/config";
import classNames from "classnames";

export default function ShareModal({
  canvasId,
  sharedWith,
  onClose,
  onShareSuccess,
}) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const updatedCanvas = await apiFetch(`/canvas/${canvasId}/share`, {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      setSuccessMsg("User invited successfully!");
      setEmail("");
      onShareSuccess(updatedCanvas.sharedWith);
    } catch (err) {
      setError(err.message || "Failed to share canvas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (userId) => {
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const updatedCanvas = await apiFetch(
        `/canvas/${canvasId}/share/${userId}`,
        {
          method: "DELETE",
        },
      );
      setSuccessMsg("User removed successfully!");
      onShareSuccess(updatedCanvas.sharedWith);
    } catch (err) {
      setError(err.message || "Failed to remove collaborator");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#111113] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/2">
          <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <FaUserPlus className="text-violet-500" />
            Share Canvas
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {}
        <div className="p-5 flex flex-col gap-6">
          <form onSubmit={handleShare} className="flex flex-col gap-3">
            <label className="text-sm font-medium text-zinc-400">
              Invite collaborator by email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                required
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-200 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all placeholder:text-zinc-600"
              />
              <button
                type="submit"
                disabled={isLoading}
                className={classNames(
                  "px-4 py-2 rounded-xl text-sm font-semibold transition-all text-white shadow-sm",
                  isLoading
                    ? "bg-violet-600/50 cursor-not-allowed"
                    : "bg-violet-600 hover:bg-violet-500 hover:shadow-[0_0_15px_rgba(124,58,237,0.4)]",
                )}
              >
                {isLoading ? "Inviting..." : "Invite"}
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-400 font-medium">{error}</p>
            )}
            {successMsg && (
              <p className="text-xs text-emerald-400 font-medium">
                {successMsg}
              </p>
            )}
          </form>

          {}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-1.5">
              <FaUsers /> Collaborators ({sharedWith?.length || 0})
            </h3>
            {sharedWith && sharedWith.length > 0 ? (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {sharedWith.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between bg-white/3 border border-white/5 rounded-lg px-3 py-2"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-zinc-200">
                        {user.name}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {user.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-violet-400/80 bg-violet-500/10 px-2 py-0.5 rounded">
                        Editor
                      </span>
                      <button
                        onClick={() => handleRemove(user._id)}
                        disabled={isLoading}
                        className="text-zinc-500 hover:text-red-400 transition-colors text-xs font-semibold uppercase tracking-wider"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-zinc-600 italic bg-white/2 border border-white/5 rounded-lg px-4 py-6 text-center">
                This canvas is currently private.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
