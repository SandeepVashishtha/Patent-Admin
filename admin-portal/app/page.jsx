"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "patent_admin_portal";
const LEGACY_REMOTE_BASE_URL = "https://patent-ipr-backend-express.onrender.com";
const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/backend";

function normalizeResponse(payload) {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (payload.data && Array.isArray(payload.data.content)) {
    return payload.data.content;
  }

  if (payload.data !== undefined) {
    return payload.data;
  }

  return payload;
}

function extractList(value, preferredKeys = []) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  for (const key of preferredKeys) {
    if (Array.isArray(value[key])) {
      return value[key];
    }
  }

  const commonArrayKeys = ["content", "items", "results", "rows", "users", "patents", "filings"];
  for (const key of commonArrayKeys) {
    if (Array.isArray(value[key])) {
      return value[key];
    }
  }

  for (const candidate of Object.values(value)) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function isExpectedListFailure(status) {
  return [400, 404, 405].includes(Number(status || 0));
}

export default function HomePage() {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [patents, setPatents] = useState([]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState({ show: false, kind: "ok", message: "" });

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [agentForm, setAgentForm] = useState({ name: "", email: "", password: "" });
  const [clientForm, setClientForm] = useState({ name: "", email: "", password: "" });
  const [assignForm, setAssignForm] = useState({ patentId: "", agentId: "" });

  const authHeaders = useMemo(() => {
    if (!token) {
      return { "Content-Type": "application/json" };
    }
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  function showToast(message, kind = "ok") {
    setToast({ show: true, kind, message });
    window.setTimeout(() => {
      setToast({ show: false, kind: "ok", message: "" });
    }, 3200);
  }

  async function apiCall(path, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        ...authHeaders,
        ...(options.headers || {}),
      },
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch (_error) {
      payload = null;
    }

    if (!response.ok) {
      const message =
        payload?.message || payload?.error || `${response.status} ${response.statusText}`;
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

    return payload;
  }

  async function fetchUsers() {
    const API_URL = baseUrl;
    const requestUrl = `${API_URL}/api/admin/users`;

    console.log("[Admin Users] Request URL:", requestUrl);

    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch (_error) {
      payload = null;
    }

    console.log("[Admin Users] Response status:", response.status);
    console.log("[Admin Users] Response body:", payload);

    if (response.status === 200) {
      const rows = Array.isArray(payload?.data) ? payload.data : [];
      setUsers(rows);
      return;
    }

    if (response.status === 401) {
      const error = new Error("Session expired. Please login again.");
      error.status = 401;
      throw error;
    }

    if (response.status === 403) {
      const error = new Error("Admin access required");
      error.status = 403;
      throw error;
    }

    if (response.status === 404) {
      const error = new Error("Users endpoint not found (backend issue)");
      error.status = 404;
      throw error;
    }

    if (response.status === 500) {
      const error = new Error("Server error");
      error.status = 500;
      throw error;
    }

    const error = new Error(payload?.message || `Unexpected error (${response.status})`);
    error.status = response.status;
    throw error;
  }

  async function fetchPatents() {
    const patentEndpoints = [
      "/api/v1/patents/user/filings",
      "/api/admin/patents",
      "/api/client/patents",
      "/api/agent/patents",
    ];

    let lastError = null;

    for (const path of patentEndpoints) {
      try {
        const payload = await apiCall(path, { method: "GET" });
        const data = normalizeResponse(payload);
        const rows = extractList(data, ["patents", "filings"]);

        if (!Array.isArray(rows)) {
          continue;
        }

        setPatents(rows);
        return;
      } catch (error) {
        const status = Number(error?.status || 0);

        // Continue trying fallback endpoints when one route is unavailable.
        if (isExpectedListFailure(status)) {
          continue;
        }

        if (status === 401 || status === 403) {
          throw error;
        }

        lastError = error;
      }
    }

    if (lastError) {
      throw lastError;
    }

    setPatents([]);
  }

  async function handleLogin(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = await apiCall("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(loginForm),
      });

      const loginData = normalizeResponse(payload) || {};
      const token = payload?.token || loginData?.token;
      const user = payload?.user || loginData?.user;

      if (!token || !user) {
        throw new Error("Login did not return token or user");
      }

      if (String(user.role || "").toUpperCase() !== "ADMIN") {
        throw new Error("Only ADMIN users can access this portal");
      }

      setToken(token);
      setUser(user);
      showToast("Login successful", "ok");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  function handleLogout() {
    setToken("");
    setUser(null);
    setUsers([]);
    setPatents([]);
    setLoginForm((prev) => ({ ...prev, password: "" }));
    showToast("Logged out", "ok");
  }

  async function createUser(path, form, setForm, successMessage) {
    setBusy(true);
    try {
      await apiCall(path, {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm({ name: "", email: "", password: "" });
      await fetchUsers();
      showToast(successMessage, "ok");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleAssignPatent(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await apiCall("/api/admin/assign-patent", {
        method: "POST",
        body: JSON.stringify(assignForm),
      });
      setAssignForm({ patentId: "", agentId: "" });
      showToast("Patent assigned", "ok");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteUser(id) {
    const confirmed = window.confirm("Delete this user?");
    if (!confirmed) {
      return;
    }

    setBusy(true);
    try {
      await apiCall(`/api/admin/user/${id}`, { method: "DELETE" });
      await fetchUsers();
      showToast("User deleted", "ok");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleRefreshUsers() {
    setBusy(true);
    try {
      await fetchUsers();
      showToast("Users refreshed", "ok");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleRefreshPatents() {
    setBusy(true);
    try {
      await fetchPatents();
      showToast("Patents refreshed", "ok");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const saved = JSON.parse(raw);
      if (saved.baseUrl) {
        // Migrate old direct backend URL to same-origin proxy to avoid browser CORS failures.
        if (saved.baseUrl === LEGACY_REMOTE_BASE_URL) {
          setBaseUrl(DEFAULT_BASE_URL);
        } else {
          setBaseUrl(saved.baseUrl);
        }
      }
      if (saved.token) {
        setToken(saved.token);
      }
      if (saved.user?.role === "ADMIN") {
        setUser(saved.user);
      }
    } catch (_error) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        baseUrl,
        token,
        user,
      })
    );
  }, [baseUrl, token, user]);

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    fetchUsers().catch((error) => {
      const status = Number(error?.status || 0);
      if (status === 401) {
        showToast("Session expired. Please login again.", "error");
        setToken("");
        setUser(null);
        setUsers([]);
        setPatents([]);
        return;
      }

      if (status === 403) {
        showToast("Admin access required", "error");
        setUsers([]);
        return;
      }

      showToast(error.message || "Users list unavailable", "error");
      setUsers([]);
    });

    fetchPatents().catch((error) => {
      const status = Number(error?.status || 0);
      if (status === 401 || status === 403) {
        showToast("Session expired. Please login again.", "error");
        setToken("");
        setUser(null);
        setUsers([]);
        setPatents([]);
        return;
      }

      showToast(`Patents list unavailable: ${error.message}`, "error");
      setPatents([]);
    });
  }, [token, user]);

  const stats = useMemo(() => {
    return {
      totalUsers: users.length,
      totalAgents: users.filter((item) => String(item.role || "").toUpperCase() === "AGENT").length,
      totalClients: users.filter((item) => String(item.role || "").toUpperCase() === "CLIENT").length,
      totalPatents: patents.length,
    };
  }, [users, patents]);

  return (
    <>
      <div className="noise"></div>
      <main className="page">
        <header className="hero">
          <p className="eyebrow">Patent IPR Suite</p>
          <h1>Admin Control Deck</h1>
          <p className="subtitle">Manage users, assign patents, and keep workflows moving.</p>
        </header>

        {!token || !user ? (
          <section className="panel">
            <h2>Admin Login</h2>
            <form className="grid-form" onSubmit={handleLogin}>
              <label>
                Email
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(event) =>
                    setLoginForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  placeholder="admin@example.com"
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                  placeholder="********"
                  required
                />
              </label>
              <label>
                API Base URL
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(event) => setBaseUrl(event.target.value.replace(/\/$/, ""))}
                  required
                />
              </label>
              <button type="submit" disabled={busy}>
                Sign In as Admin
              </button>
            </form>
            <p className="hint">Uses: POST /api/auth/login</p>
          </section>
        ) : (
          <section className="panel">
            <div className="toolbar">
              <div>
                <h2>Admin Workspace</h2>
                <p className="subtitle">Signed in as {user.name} ({user.email})</p>
              </div>
              <button className="danger" onClick={handleLogout} disabled={busy}>
                Logout
              </button>
            </div>

            <section className="cards">
              <article className="stat-card">
                <h3>Total Users</h3>
                <p>{stats.totalUsers}</p>
              </article>
              <article className="stat-card">
                <h3>Total Agents</h3>
                <p>{stats.totalAgents}</p>
              </article>
              <article className="stat-card">
                <h3>Total Clients</h3>
                <p>{stats.totalClients}</p>
              </article>
              <article className="stat-card">
                <h3>Total Patents</h3>
                <p>{stats.totalPatents}</p>
              </article>
            </section>

            <section className="split">
              <article className="panel nested">
                <h3>Create Agent</h3>
                <form
                  className="grid-form compact"
                  onSubmit={(event) => {
                    event.preventDefault();
                    createUser("/api/admin/create-agent", agentForm, setAgentForm, "Agent created");
                  }}
                >
                  <label>
                    Name
                    <input
                      type="text"
                      value={agentForm.name}
                      onChange={(event) =>
                        setAgentForm((prev) => ({ ...prev, name: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      value={agentForm.email}
                      onChange={(event) =>
                        setAgentForm((prev) => ({ ...prev, email: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <label>
                    Password
                    <input
                      type="password"
                      minLength={6}
                      value={agentForm.password}
                      onChange={(event) =>
                        setAgentForm((prev) => ({ ...prev, password: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <button type="submit" disabled={busy}>Create Agent</button>
                </form>
                <p className="hint">POST /api/admin/create-agent</p>
              </article>

              <article className="panel nested">
                <h3>Create Client</h3>
                <form
                  className="grid-form compact"
                  onSubmit={(event) => {
                    event.preventDefault();
                    createUser(
                      "/api/admin/create-client",
                      clientForm,
                      setClientForm,
                      "Client created"
                    );
                  }}
                >
                  <label>
                    Name
                    <input
                      type="text"
                      value={clientForm.name}
                      onChange={(event) =>
                        setClientForm((prev) => ({ ...prev, name: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      value={clientForm.email}
                      onChange={(event) =>
                        setClientForm((prev) => ({ ...prev, email: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <label>
                    Password
                    <input
                      type="password"
                      minLength={6}
                      value={clientForm.password}
                      onChange={(event) =>
                        setClientForm((prev) => ({ ...prev, password: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <button type="submit" disabled={busy}>Create Client</button>
                </form>
                <p className="hint">POST /api/admin/create-client</p>
              </article>
            </section>

            <article className="panel nested">
              <h3>Assign Patent to Agent</h3>
              <form className="grid-form compact two-columns" onSubmit={handleAssignPatent}>
                <label>
                  Patent ID
                  <input
                    type="text"
                    value={assignForm.patentId}
                    onChange={(event) =>
                      setAssignForm((prev) => ({ ...prev, patentId: event.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Agent ID
                  <input
                    type="text"
                    value={assignForm.agentId}
                    onChange={(event) =>
                      setAssignForm((prev) => ({ ...prev, agentId: event.target.value }))
                    }
                    required
                  />
                </label>
                <button type="submit" disabled={busy}>Assign</button>
              </form>
              <p className="hint">POST /api/admin/assign-patent</p>
            </article>

            <article className="panel nested">
              <div className="toolbar">
                <h3>User Directory</h3>
                <button onClick={handleRefreshUsers} disabled={busy}>Refresh</button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={5}>No users found.</td>
                      </tr>
                    ) : (
                      users.map((item, index) => {
                        const userId = item.id || item._id || item.userId || "";
                        return (
                        <tr key={userId || index}>
                          <td>{item.name || "-"}</td>
                          <td>{item.email || "-"}</td>
                          <td>{item.role || "-"}</td>
                          <td>{item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}</td>
                          <td>
                            <button disabled={busy || !userId} onClick={() => handleDeleteUser(userId)}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <p className="hint">GET /api/admin/users, DELETE /api/admin/user/:id</p>
            </article>

            <article className="panel nested">
              <div className="toolbar">
                <h3>Patent Directory</h3>
                <button onClick={handleRefreshPatents} disabled={busy}>Refresh</button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Patent ID</th>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patents.length === 0 ? (
                      <tr>
                        <td colSpan={5}>No patents found.</td>
                      </tr>
                    ) : (
                      patents.map((item, index) => (
                        <tr key={item.id || item._id || item.patentId || item.referenceNumber || index}>
                          <td>{item.referenceNumber || item.refNo || "-"}</td>
                          <td>{item.patentId || item.id || item._id || "-"}</td>
                          <td>{item.title || item.inventionTitle || "-"}</td>
                          <td>{item.status || "-"}</td>
                          <td>
                            {item.updatedAt || item.submittedAt || item.createdAt
                              ? new Date(
                                  item.updatedAt || item.submittedAt || item.createdAt
                                ).toLocaleString()
                              : "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <p className="hint">
                GET /api/v1/patents/user/filings (fallback: /api/admin/patents, /api/client/patents, /api/agent/patents)
              </p>
            </article>
          </section>
        )}

        {toast.show ? <section className={`toast ${toast.kind}`}>{toast.message}</section> : null}
      </main>
    </>
  );
}
