import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { authActions } from "../store/store";
import { apiFetch } from "../api/config";

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
function validatePassword(pw) {
  return pw.length >= 6;
}

function PencilMotif() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-56 h-56 opacity-30"
      aria-hidden="true"
    >
      {}
      <rect
        x="20"
        y="30"
        width="160"
        height="120"
        rx="4"
        fill="none"
        stroke="#7c3aed"
        strokeWidth="2"
        strokeDasharray="6 4"
        className="animate-[dash_3s_linear_infinite]"
      />
      {}
      <polygon points="100,50 115,130 85,130" fill="#7c3aed" opacity="0.7" />
      {}
      <polygon points="100,140 107,130 93,130" fill="#f5c518" />
      {}
      <rect x="88" y="46" width="24" height="10" rx="2" fill="#f87171" />
      {}
      <line
        x1="40"
        y1="170"
        x2="160"
        y2="170"
        stroke="#7c3aed"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <line
        x1="40"
        y1="180"
        x2="130"
        y2="180"
        stroke="#7c3aed"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
    </svg>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);

  const isRegister = location.pathname === "/register";

  const [activeTab, setActiveTab] = useState(isRegister ? "register" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [successBanner, setSuccessBanner] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) navigate("/dashboard", { replace: true });
  }, [token, navigate]);

  useEffect(() => {
    setTimeout(() => {
      setActiveTab(isRegister ? "register" : "login");
      setFieldErrors({});
      setServerError("");
      setSuccessBanner("");
    }, 0);
  }, [isRegister]);

  function switchTab(tab) {
    setActiveTab(tab);
    setFieldErrors({});
    setServerError("");
    setSuccessBanner("");
    navigate(tab === "login" ? "/login" : "/register", { replace: true });
  }

  function validate() {
    const errors = {};
    if (!validateEmail(email)) errors.email = "Enter a valid email address.";
    if (!validatePassword(password))
      errors.password = "Password must be at least 6 characters.";
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");
    setSuccessBanner("");

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    try {
      if (activeTab === "register") {
        await apiFetch("/user/register", {
          method: "POST",
          body: JSON.stringify({ email: email.trim(), password }),
        });
      }

      const data = await apiFetch("/user/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      dispatch(
        authActions.setCredentials({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        }),
      );
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setServerError(err.message ?? "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[#0f0f11] font-sans">
      {}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden">
        {}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#7c3aed 1px, transparent 1px), linear-gradient(90deg, #7c3aed 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {}
        <div className="relative z-10 flex items-center gap-3">
          <span className="text-2xl font-black tracking-tight text-white">
            Sketch<span className="text-violet-500">Board</span>
          </span>
        </div>

        {}
        <div className="relative z-10 flex flex-col items-center gap-6">
          <PencilMotif />
          <p className="text-3xl font-bold text-white text-center leading-tight max-w-xs">
            Draw ideas.
            <br />
            <span className="text-violet-400">Share them instantly.</span>
          </p>
          <p className="text-zinc-500 text-sm text-center max-w-xs">
            A collaborative infinite canvas for teams who think visually.
          </p>
        </div>

        {}
        <p className="relative z-10 text-zinc-700 text-xs">
          © {new Date().getFullYear()} SketchBoard
        </p>
      </div>

      {}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16 bg-[#111113]">
        <div className="w-full max-w-md">
          {}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <span className="text-xl font-black text-white">
              Sketch<span className="text-violet-500">Board</span>
            </span>
          </div>

          {}
          <div className="relative flex bg-zinc-900 rounded-xl p-1 mb-8">
            {}
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-violet-600 transition-transform duration-300 ease-out ${
                activeTab === "register"
                  ? "translate-x-[calc(100%+4px)]"
                  : "translate-x-0"
              }`}
            />
            <button
              id="auth-tab-login"
              onClick={() => switchTab("login")}
              className={`relative z-10 flex-1 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 ${
                activeTab === "login"
                  ? "text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Sign in
            </button>
            <button
              id="auth-tab-register"
              onClick={() => switchTab("register")}
              className={`relative z-10 flex-1 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 ${
                activeTab === "register"
                  ? "text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Create account
            </button>
          </div>

          {}
          <h1 className="text-2xl font-bold text-white mb-1">
            {activeTab === "login" ? "Welcome back" : "Get started free"}
          </h1>
          <p className="text-zinc-500 text-sm mb-8">
            {activeTab === "login"
              ? "Sign in to your SketchBoard account."
              : "Create your account — no credit card required."}
          </p>

          {}
          {successBanner && (
            <div
              role="status"
              className="mb-5 flex items-center gap-2 bg-emerald-950 border border-emerald-800 text-emerald-300 text-sm px-4 py-3 rounded-lg"
            >
              <span className="text-emerald-400">✓</span>
              {successBanner}
            </div>
          )}

          {}
          {serverError && (
            <div
              role="alert"
              className="mb-5 flex items-center gap-2 bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-lg"
            >
              <span className="text-red-400">✕</span>
              {serverError}
            </div>
          )}

          {}
          <form
            id="auth-form"
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-5"
          >
            {}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="auth-email"
                className="text-sm font-medium text-zinc-300"
              >
                Email address
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email)
                    setFieldErrors((f) => ({ ...f, email: "" }));
                }}
                placeholder="you@example.com"
                className={`bg-zinc-900 text-white placeholder-zinc-600 text-sm px-4 py-3 rounded-lg border outline-none transition-all duration-200
                  focus:ring-2 focus:ring-violet-500 focus:border-violet-500
                  ${fieldErrors.email ? "border-red-500 ring-1 ring-red-500" : "border-zinc-800 hover:border-zinc-700"}`}
              />
              {fieldErrors.email && (
                <p role="alert" className="text-xs text-red-400">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="auth-password"
                className="text-sm font-medium text-zinc-300"
              >
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete={
                  activeTab === "login" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password)
                    setFieldErrors((f) => ({ ...f, password: "" }));
                }}
                placeholder={
                  activeTab === "register"
                    ? "At least 6 characters"
                    : "••••••••"
                }
                className={`bg-zinc-900 text-white placeholder-zinc-600 text-sm px-4 py-3 rounded-lg border outline-none transition-all duration-200
                  focus:ring-2 focus:ring-violet-500 focus:border-violet-500
                  ${fieldErrors.password ? "border-red-500 ring-1 ring-red-500" : "border-zinc-800 hover:border-zinc-700"}`}
              />
              {fieldErrors.password && (
                <p role="alert" className="text-xs text-red-400">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="mt-1 w-full py-3 rounded-lg bg-violet-600 hover:bg-violet-500 active:bg-violet-700
                text-white text-sm font-semibold transition-all duration-200
                disabled:opacity-60 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-[#111113]
                flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  {}
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
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
                  {activeTab === "login" ? "Signing in…" : "Creating account…"}
                </>
              ) : activeTab === "login" ? (
                "Sign in →"
              ) : (
                "Create account →"
              )}
            </button>
          </form>

          {}
          <p className="mt-6 text-center text-sm text-zinc-600">
            {activeTab === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => switchTab("register")}
                  className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
                >
                  Sign up free
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => switchTab("login")}
                  className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
