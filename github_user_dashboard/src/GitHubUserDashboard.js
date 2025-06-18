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

  // --- Configurable Token Endpoint for OAuth Code Exchange ---
  /**
   * Determines the backend token exchange URL.
   * Checks environment variable REACT_APP_TOKEN_ENDPOINT, otherwise defaults to a reasonable value.
   * You can set this in your .env file or via process env in deployment.
   * The URL should be the FastAPI or other backend POST endpoint to exchange code for access_token.
   */
  function getTokenEndpointUrl() {
    // 1. CRA env variable (recommended): REACT_APP_TOKEN_ENDPOINT, e.g., http://localhost:3001/token or FastAPI URL
    if (typeof process !== "undefined" && process.env && process.env.REACT_APP_TOKEN_ENDPOINT) {
      return process.env.REACT_APP_TOKEN_ENDPOINT;
    }
    // 2. Vite env support (for completeness)
    if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_TOKEN_ENDPOINT) {
      return import.meta.env.VITE_TOKEN_ENDPOINT;
    }
    // 3. Fallback: common dev, or cloud mock or FastAPI address as example
    return "http://localhost:3001/token";
  }

  // Handle OAuth code in URL (exchange for access_token via backend only)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    // PUBLIC_INTERFACE
    /** 
     * Exchanges the provided OAuth code for an access_token at the configured backend endpoint.
     * POSTs x-www-form-urlencoded ({ code, client_id, client_secret }) as per backend contract (FastAPI, etc).
     * Reads access_token from the returned JSON; expects { "access_token": ... } in response.
     * The endpoint defaults to http://localhost:3001/token but can be configured via .env (.env: REACT_APP_TOKEN_ENDPOINT).
     *
     * SECURITY: client_secret must only be handled server-side, not in frontend. Only send code and client_id from client.
     * 
     * @param {string} authCode
     * @returns {Promise<{ access_token: string }>} Access token on success
     */
    /**
     * PUBLIC_INTERFACE
     * Exchanges the OAuth code for an access token by posting code, client_id, and (if set) client_secret as x-www-form-urlencoded
     * to the configured FastAPI (or compatible) backend endpoint specified in the environment variable.
     * Reads access_token from JSON response per documented contract.
     * 
     * @param {string} authCode - The authorization code received from GitHub OAuth redirect.
     * @returns {Promise<{ access_token: string }>} The JSON object containing the access token.
     */
    async function exchangeCodeForToken(authCode) {
      const backendUrl = getTokenEndpointUrl();

      // Build the form body for x-www-form-urlencoded as required by FastAPI contract
      const formParams = [];
      formParams.push("code=" + encodeURIComponent(authCode));
      if (GITHUB_CLIENT_ID) formParams.push("client_id=" + encodeURIComponent(GITHUB_CLIENT_ID));
      // ONLY include client_secret if provided via env for test/dev lab (never commit to source, never expose to prod)
      if (
        typeof process !== "undefined" &&
        process.env &&
        process.env.REACT_APP_GITHUB_CLIENT_SECRET
      ) {
        formParams.push("client_secret=" + encodeURIComponent(process.env.REACT_APP_GITHUB_CLIENT_SECRET));
      }
      const body = formParams.join("&");

      try {
        const resp = await fetch(backendUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });
        if (!resp.ok) {
          let err = null;
          try { err = await resp.json(); } catch (_) {}
          throw new Error(
            (err && err.error)
              ? err.error
              : `Token exchange failed (HTTP ${resp.status}): ${resp.statusText}`
          );
        }
        // Expect FastAPI (or compatible) to return JSON: { "access_token": "<string>" }
        const json = await resp.json();
        if (!json || typeof json.access_token !== "string" || !json.access_token) {
          throw new Error("Token endpoint did not provide access_token");
        }
        return json;
      } catch (err) {
        throw err;
      }
    }

    async function handleOAuthFlow() {
      if (code && !accessToken) {
        setFetchError("");
        try {
          // POST to FastAPI token endpoint and extract the returned token.
          const response = await exchangeCodeForToken(code);
          setAccessToken(response.access_token);
          window.localStorage.setItem("gh_access_token", response.access_token);
        } catch (e) {
          setFetchError(`Failed to exchange OAuth code: ${e.message}`);
        }
        // Remove code from URL bar (for user privacy/clean UX)
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
    // eslint-disable-next-line
  }, []);

  // Fetch user, repos, followers via GitHub API using real access_token (provided by backend)
  useEffect(() => {
    if (!accessToken) return;

    // Demo/mock mode: supply hardcoded data and short-circuit all API calls
    if (accessToken === "mock_access_token") {
      const mockUser = {
        login: "mock-demo-user",
        id: 42424242,
        avatar_url: "https://avatars.githubusercontent.com/u/583231", // classic Octocat
        html_url: "https://github.com/mock-demo-user",
        name: "Demo User (Mock)",
        bio: "🙌 Welcome! This dashboard is in DEMO/MOCK MODE. These are illustrative sample values, not real GitHub data.",
        repos_url: "https://api.github.com/users/mock-demo-user/repos",
        followers_url: "https://api.github.com/users/mock-demo-user/followers"
      };
      const mockRepos = [
        {
          id: 401,
          name: "mock-github-dashboard",
          html_url: "https://github.com/mock-demo-user/mock-github-dashboard",
          description: "Sample dashboard project (for demo purposes).",
          language: "JavaScript",
          stargazers_count: 88
        },
        {
          id: 402,
          name: "hello-world",
          html_url: "https://github.com/mock-demo-user/hello-world",
          description: "Hello world example repository.",
          language: "Markdown",
          stargazers_count: 1
        },
        {
          id: 403,
          name: "css-tricks",
          html_url: "https://github.com/mock-demo-user/css-tricks",
          description: "CSS tricks and snippets.",
          language: "CSS",
          stargazers_count: 12
        }
      ];
      const mockFollowers = [
        {
          login: "alice-demo",
          id: 9101,
          avatar_url: "https://avatars.githubusercontent.com/u/94817",
          html_url: "https://github.com/alice-demo"
        },
        {
          login: "bob-example",
          id: 1337,
          avatar_url: "https://avatars.githubusercontent.com/u/39657",
          html_url: "https://github.com/bob-example"
        }
      ];
      setUser(mockUser);
      setRepos(mockRepos);
      setFollowers(mockFollowers);
      setFetchError(""); // clear any prior errors
      window.localStorage.setItem("gh_user", JSON.stringify(mockUser));
      return;
    }

    // PUBLIC_INTERFACE
    async function getUserData() {
      try {
        setFetchError("");
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
    // Helper: show demo/mock mode info banner
    function DemoModeNotice() {
      return (
        <div style={{
          background: "#e36209",
          color: "#fff",
          borderRadius: 6,
          margin: "18px 0",
          padding: "12px 20px",
          fontWeight: 600,
          letterSpacing: "0.04em",
          textAlign: "center"
        }}>
          <span style={{marginRight: 10}}>DEMO / MOCK MODE:</span>
          You are viewing demo/mock dashboard data. This is not real GitHub data. No API calls were made.
        </div>
      );
    }

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
            <b>Note:</b> OAuth code exchange is handled by the <b>mock backend</b> at <code>http://localhost:3001/token</code>
            <br/>
            If running remotely, the endpoint is <code>https://vscode-internal-5194-beta.beta01.cloud.kavia.ai:3001/token</code>.
            <br/>
            No frontend-only stubbing or demo user data remains. The returned access_token will be used for GitHub API calls.
          </div>
        </div>
      );
    }

    // If in demo/mock mode, show orange warning banner above dashboard
    const isDemoMode = accessToken === "mock_access_token";

    // Dashboard switch
    switch (page) {
      case "dashboard":
        return (
          <div>
            {isDemoMode && <DemoModeNotice />}
            <DashboardHome user={user} repos={repos} followers={followers}/>
          </div>
        );
      case "repos":
        return (
          <div>
            {isDemoMode && <DemoModeNotice />}
            <RepoList repos={repos}/>
          </div>
        );
      case "followers":
        return (
          <div>
            {isDemoMode && <DemoModeNotice />}
            <FollowerList followers={followers}/>
          </div>
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
