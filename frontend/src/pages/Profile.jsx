import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { authActions } from "../store/store";
import { apiFetch } from "../api/config";

export default function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/user/profile")
      .then(setUser)
      .catch((err) => setError(err.message ?? "Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

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
            to="/dashboard"
            id="nav-dashboard-link"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            ← Dashboard
          </Link>
          <button
            id="profile-signout-btn"
            onClick={handleSignOut}
            className="text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-4 py-1.5 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      {}
      <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-8">Your Profile</h1>

        {loading && (
          <div className="flex items-center gap-3 text-zinc-500 text-sm">
            <svg
              className="animate-spin h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Loading…
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-lg"
          >
            {error}
          </div>
        )}

        {user && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col gap-6">
            {}
            <div className="w-16 h-16 rounded-full bg-violet-700 flex items-center justify-center text-2xl font-bold text-white select-none">
              {user.email?.[0]?.toUpperCase() ?? "?"}
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                  Email
                </p>
                <p className="text-white font-medium">{user.email}</p>
              </div>
              {user.createdAt && (
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                    Member since
                  </p>
                  <p className="text-white font-medium">
                    {new Date(user.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
