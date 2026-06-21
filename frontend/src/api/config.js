import store from "../store/store";
import { authActions } from "../store/store";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

let refreshPromise = null;

async function attemptRefresh() {
  const storedRefresh = localStorage.getItem("wbRefreshToken");
  if (!storedRefresh) throw new Error("No refresh token available");

  if (refreshPromise) return refreshPromise;

  refreshPromise = fetch(`${API_BASE_URL}/user/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: storedRefresh }),
  })
    .then(async (res) => {
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Refresh failed");

      store.dispatch(
        authActions.setCredentials({ accessToken: body.accessToken }),
      );
      return body.accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export async function apiFetch(path, options = {}) {
  const makeHeaders = () => {
    const token = localStorage.getItem("wbToken");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    };
  };

  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: makeHeaders(),
  });

  if (response.status === 401 && path !== "/user/refresh") {
    try {
      await attemptRefresh();

      response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: makeHeaders(),
      });
    } catch {
      store.dispatch(authActions.clearCredentials());
      const err = new Error("Session expired. Please sign in again.");
      err.status = 401;
      err.sessionExpired = true;
      throw err;
    }
  }

  const data = await response.json();

  if (!response.ok) {
    const err = new Error(data.message ?? "Request failed");
    err.data = data;
    err.status = response.status;
    throw err;
  }

  return data;
}
