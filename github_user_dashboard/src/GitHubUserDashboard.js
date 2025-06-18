import React, { useState, useEffect } from "react";

// Placeholder for chart library. Recommend installing a minimal charting lib like 'react-chartjs-2' or 'recharts'.
const ChartPlaceholder = ({ title }) => (
  <div style={{
    background: "#fff", color: "#222", borderRadius: 8, padding: 16,
    marginBottom: 16, boxShadow: "0 2px 8px rgba(36,41,46,0.07)"
  }}>
    <h3 style={{ margin: 0 }}>{title}</h3>
    <div style={{height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "#0366d6"}}>
      {/* Replace with actual chart component */}
      <span>Chart Visualization</span>
    </div>
  </div>
);

// Simple Navbar for multi-page navigation
const Navbar = ({ user, onLogout, onPageChange, currentPage }) => (
  <nav style={{
    background: "#24292e", color: "#fff", padding: 12, display: "flex", justifyContent: "space-between",
    alignItems: "center", borderBottom: "1px solid #e1e4e8", marginBottom: 24
  }}>
    <div style={{ fontWeight: 700, letterSpacing: 1, fontSize: "1.23rem" }}>
      <span style={{ color: "#28a745", fontWeight: 600, marginRight: 6 }}>*</span>
      GitHubUserDashboard
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      {user && (
        <>
          <img src={user.avatar_url} alt="avatar" style={{ width: 32, height: 32, borderRadius: "50%" }}/>
          <span style={{ fontWeight: 500 }}>{user.login}</span>
          <button className="btn" style={{ background: "#e36209", color: "#fff" }} onClick={onLogout}>Logout</button>
        </>
      )}
      {!user && (
        <button className="btn" style={{ background: "#0366d6", color: "#fff" }} onClick={() => onPageChange("login")}>Login with GitHub</button>
      )}
    </div>
  </nav>
);

console.log("GitHubUserDashboard.js loaded");

// PUBLIC_INTERFACE
export default function GitHubUserDashboard() {
  /**
   * A modular container for GitHubUserDashboard: handles OAuth logic,
   * user session, navigation, data fetching, and dashboard display.
   */
  const [user, setUser] = useState(null); // Contains authenticated GitHub user profile
  const [accessToken, setAccessToken] = useState(null); // Github OAuth access token
  const [page, setPage] = useState("dashboard"); // dashboard | repos | followers | login

  // Example: store fetched user data (removed all frontend/dev-mode mocking logic)
  const [repos, setRepos] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [fetchError, setFetchError] = useState("");

  // GitHub OAuth client settings
  let GITHUB_CLIENT_ID;
  if (typeof process !== "undefined" &&
      process.env &&
      (process.env.REACT_APP_GITHUB_CLIENT_ID || 'Ov23lioFpdZyTjydbxm0')) {
    GITHUB_CLIENT_ID = process.env.REACT_APP_GITHUB_CLIENT_ID || 'Ov23lioFpdZyTjydbxm0';
  } else if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_GITHUB_CLIENT_ID) {
    GITHUB_CLIENT_ID = 'Ov23lioFpdZyTjydbxm0';
  } else {
    GITHUB_CLIENT_ID = 'Ov23lioFpdZyTjydbxm0';
  }
  if (!GITHUB_CLIENT_ID) {
    if (typeof window !== "undefined" && window.console && window.console.warn) {
      window.console.warn(
        "[GitHubUserDashboard] GitHub OAuth Client ID is NOT set. " +
        "Please set REACT_APP_GITHUB_CLIENT_ID in your .env file if using CRA, " +
        "or VITE_GITHUB_CLIENT_ID for Vite, then restart your dev server."
      );
    }
  }
  const REDIRECT_URI = window.location.origin;
  const scope = "read:user repo";

  // PUBLIC_INTERFACE
  function loginWithGitHub() {
    // Triggers GitHub OAuth flow using Authorization Code Grant
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}&allow_signup=true`;
    window.location.href = githubAuthUrl;
  }
  // PUBLIC_INTERFACE
  function logout() {
    setUser(null);
    setAccessToken(null);
    setRepos([]);
    setFollowers([]);
    window.localStorage.removeItem("gh_access_token");
    window.localStorage.removeItem("gh_user");
  }

  // Handle OAuth code in URL (exchange for access_token via backend only)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    async function exchangeCodeForToken(authCode) {
      // POST code to local mock backend, get { access_token }
      try {
        const resp = await fetch("http://localhost:4000/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: authCode }),
        });
        if (!resp.ok) {
          let err = null;
          try { err = await resp.json(); } catch (_) {}
          throw new Error(err && err.error ? err.error : "Token exchange failed");
        }
        return await resp.json();
      } catch (err) {
        throw err;
      }
    }
    async function handleOAuthFlow() {
      if (code && !accessToken) {
        setFetchError("");
        try {
          const response = await exchangeCodeForToken(code);
          setAccessToken(response.access_token);
          window.localStorage.setItem("gh_access_token", response.access_token);
        } catch (e) {
          setFetchError(`Failed to exchange OAuth code: ${e.message}`);
        }
        // Remove code from URL bar
        params.delete("code");
        window.history.replaceState({}, "", window.location.pathname);
      }
      // Check localStorage for previous session
      const storedToken = window.localStorage.getItem("gh_access_token");
      const storedUser = window.localStorage.getItem("gh_user");
      if (storedToken && storedUser) {
        setAccessToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    }
    handleOAuthFlow();
  }, []);

  // Fetch user, repos, followers via GitHub API using real access_token (provided by backend)
  useEffect(() => {
    if (!accessToken) return;
    // PUBLIC_INTERFACE
    async function getUserData() {
      try {
        setFetchError("");
        // Only real API, no frontend stubbing allowed!
        const resUser = await fetch("https://api.github.com/user", {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!resUser.ok) throw new Error("Failed to fetch user profile. (Check if token is accepted by GitHub API)");
        const userJson = await resUser.json();
        setUser(userJson);
        window.localStorage.setItem("gh_user", JSON.stringify(userJson));

        const resRepos = await fetch(userJson.repos_url, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!resRepos.ok) throw new Error("Failed to fetch user repositories");
        setRepos(await resRepos.json());

        const resFollowers = await fetch(userJson.followers_url, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!resFollowers.ok) throw new Error("Failed to fetch user followers");
        setFollowers(await resFollowers.json());
      } catch (err) {
        setFetchError(err.message);
      }
    }
    getUserData();
  }, [accessToken]);

  // --- UI Page Routing ---
  function renderContent() {
    if (!accessToken || !user) {
      return (
        <div style={{
          margin: "64px auto", maxWidth: 330, background: "#fff", color: "#222",
          borderRadius: 12, boxShadow: "0 2px 16px rgba(36,41,46,0.07)", padding: 30, textAlign: "center"
        }}>
          <h2 style={{ color: "#24292e" }}>Sign in to GitHub</h2>
          <button className="btn btn-large" style={{ background: "#0366d6", color: "#fff", marginTop: 20 }} onClick={loginWithGitHub}>
            Sign in with GitHub
          </button>
          <div style={{ color: "#e36209", marginTop: 16 }}>{fetchError ? fetchError : null}</div>
          <div style={{ color: "#767676", marginTop: 24, fontSize: "0.87em" }}>
            <b>Note:</b> OAuth code exchange is now handled by the <b>mock backend</b> at <code>http://localhost:4000/token</code>.<br/>
            No frontend-only stubbing or demo user data remains. The returned access_token will be used for GitHub API calls.
          </div>
        </div>
      );
    }

    // Dashboard switch
    switch (page) {
      case "dashboard":
        return (
          <DashboardHome user={user} repos={repos} followers={followers}/>
        );
      case "repos":
        return (
          <RepoList repos={repos}/>
        );
      case "followers":
        return (
          <FollowerList followers={followers}/>
        );
      default:
        return null;
    }
  }

  // --- Dashboard Home: presents data visualizations ---
  function DashboardHome({ user, repos, followers }) {
    return (
      <div style={{ maxWidth: 880, margin: "0 auto", padding: 24 }}>
        <div style={{
          display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 28
        }}>
          <div style={{ flex: 1, minWidth: 235, background: "#0366d6", color: "#fff", borderRadius: 8, padding: 18 }}>
            <h2 style={{ margin: 0 }}>👤 {user.name || user.login}</h2>
            <div style={{ fontSize: "1.1em" }}>
              {user.bio}
              <div style={{ marginTop: 8 }}>
                <strong>Repos:</strong> {repos.length} &nbsp;&nbsp;
                <strong>Followers:</strong> {followers.length}
              </div>
              <div style={{ marginTop: 8 }}>
                <a href={user.html_url} rel="noopener noreferrer" style={{ color: "#fff", textDecoration: "underline" }}>View GitHub Profile</a>
              </div>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 235, background: "#28a745", color: "#fff", borderRadius: 8, padding: 18 }}>
            <h3 style={{marginTop: 0}}>Repos</h3>
            <div style={{fontWeight: 700, fontSize: 32, marginBottom: 0}}>{repos.length}</div>
            <div style={{marginTop: 5, fontSize: "1em"}}>
              <a onClick={() => setPage("repos")} style={{cursor: "pointer", color: "#fff", textDecoration: "underline"}}>View Repos</a>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 235, background: "#24292e", color: "#fff", borderRadius: 8, padding: 18 }}>
            <h3 style={{marginTop: 0}}>Followers</h3>
            <div style={{fontWeight: 700, fontSize: 32, marginBottom: 0}}>{followers.length}</div>
            <div style={{marginTop: 5, fontSize: "1em"}}>
              <a onClick={() => setPage("followers")} style={{cursor: "pointer", color: "#fff", textDecoration: "underline"}}>View Followers</a>
            </div>
          </div>
        </div>
        {/* Chart areas */}
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <ChartPlaceholder title="Repositories by Language"/>
          <ChartPlaceholder title="Recent Contributions (commits)"/>
        </div>
      </div>
    );
  }

  // --- Repo List Page ---
  function RepoList({ repos }) {
    if (!repos.length) return <div>No repositories found.</div>;
    return (
      <div style={{ maxWidth: 880, margin: "0 auto", padding: 24 }}>
        <h2>Your Repositories</h2>
        <button className="btn" onClick={() => setPage("dashboard")} style={{ marginBottom: 18 }}>← Back to Dashboard</button>
        <div>
          {repos.map(repo => (
            <div key={repo.id} style={{
              background: "#fff", color: "#222", borderRadius: 6,
              padding: 15, marginBottom: 18, boxShadow: "0 2px 8px rgba(36,41,46,0.06)"
            }}>
              <div style={{fontSize: "1.1em", fontWeight: 700}}>
                <a href={repo.html_url} target="_blank" rel="noopener noreferrer" style={{color:"#0366d6"}}>{repo.name}</a>
              </div>
              <div style={{color: "#666", marginTop: 4, fontSize: "0.97em"}}>{repo.description}</div>
              <div style={{marginTop: 6, fontSize: "0.89em", color: "#999"}}>{repo.language} | ★{repo.stargazers_count}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- Followers List Page ---
  function FollowerList({ followers }) {
    if (!followers.length) return <div>No followers found.</div>;
    return (
      <div style={{ maxWidth: 880, margin: "0 auto", padding: 24 }}>
        <h2>Your Followers</h2>
        <button className="btn" onClick={() => setPage("dashboard")} style={{ marginBottom: 18 }}>← Back to Dashboard</button>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
          {followers.map(f => (
            <div key={f.id} style={{
              background: "#fff", color: "#222", borderRadius: 6, padding: 15,
              boxShadow: "0 2px 8px rgba(36,41,46,0.07)", display: "flex", alignItems: "center", gap: 11
            }}>
              <img src={f.avatar_url} alt={f.login} style={{ width: 36, height: 36, borderRadius: "50%" }}/>
              <div>
                <a href={f.html_url} target="_blank" rel="noopener noreferrer" style={{ color:"#0366d6", fontWeight: 600 }}>{f.login}</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- Main render ---
  return (
    <div>
      <Navbar user={user} onLogout={logout} onPageChange={(p) => { if (p==="login") loginWithGitHub(); else setPage(p); }} currentPage={page}/>
      <div>{renderContent()}</div>
    </div>
  );
}
