# Lightweight React Template for KAVIA

This project provides a minimal React template for developing a secure GitHub OAuth dashboard, including best practices, backend contract, and developer setup.

## Features

- **Lightweight**: No heavy UI frameworks; only vanilla CSS and React
- **Modern UI**: Clean, responsive design
- **OAuth-Ready**: Out-of-the-box support for GitHub OAuth with robust backend handoff

---

## ⚡ GitHub OAuth Backend and Configuration

### Required: Environment Variables (`.env`)

Place a `.env` file in the `github_user_dashboard/` folder to configure your OAuth credentials and backend token endpoint.

Example `.env`:
```env
# OAuth Client ID provided by GitHub
REACT_APP_GITHUB_CLIENT_ID=YOUR_CLIENT_ID_HERE

# Your backend's POST endpoint for exchanging code for token (FastAPI/Node/other)
REACT_APP_TOKEN_EXCHANGE_ENDPOINT=http://localhost:8000/token

# (Optional, for development/demo ONLY; never in production or committed to source)
REACT_APP_GITHUB_CLIENT_SECRET=your_dev_secret
```
> Do NOT commit real client secrets. For local/internal dev/demo only.

You may also use `REACT_APP_TOKEN_ENDPOINT` as a fallback for legacy setups (but `REACT_APP_TOKEN_EXCHANGE_ENDPOINT` is preferred).

---

### 🔒 OAuth Code Exchange Flow

When the GitHub authorization code (from login) is present in the URL, the dashboard code performs these steps:

1. **POST** to the backend endpoint (from `.env`, using `REACT_APP_TOKEN_EXCHANGE_ENDPOINT`).
2. Format: `Content-Type: application/x-www-form-urlencoded`
3. Body fields:
   - `code` (required)          — from GitHub after redirect
   - `client_id` (required)     — from `.env`
   - `redirect_uri` (required)  — always, set to `window.location.origin`
   - `client_secret` (optional)— if `REACT_APP_GITHUB_CLIENT_SECRET` is set (dev/demo only)
   - `state` (optional)         — if present in localStorage as `gh_oauth_state`

#### Example fetch (JS/React):
```js
const payload = {
  code: receivedCode,
  client_id: process.env.REACT_APP_GITHUB_CLIENT_ID,
  redirect_uri: window.location.origin
};
if (process.env.REACT_APP_GITHUB_CLIENT_SECRET) {
  payload.client_secret = process.env.REACT_APP_GITHUB_CLIENT_SECRET;
}
const state = window.localStorage.getItem("gh_oauth_state");
if (state) payload.state = state;

fetch(process.env.REACT_APP_TOKEN_EXCHANGE_ENDPOINT, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    "Accept": "application/json"
  },
  body: new URLSearchParams(payload).toString(),
})
  .then(res => {
    if (!res.ok) throw new Error("Token exchange failed");
    return res.json();
  })
  .then(data => {
    // data.access_token is now usable for subsequent API calls
    console.log("access_token:", data.access_token);
  });
```

#### Example using curl:
```bash
curl -X POST http://localhost:8000/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "code=abc123&client_id=Ov23lioFpdZyTjydbxm0&redirect_uri=http://localhost:3000"
```

#### FastAPI-compliant Response (expected by frontend)
- Success:  
  ```json
  { "access_token": "<token_value>" }
  ```
- Error (HTTP 400+):  
  ```json
  { "error": "error message" }
  ```

---

### 🎯 Backend Contract and CORS

**Token Endpoint Contract:**
- Accepts POST with fields above (`application/x-www-form-urlencoded`)
- Returns JSON `{ "access_token": ... }` or error as `{ "error": ... }`
- CORS: Must allow `http://localhost:3000` (dev) and restrict in production
  - Example for FastAPI:
    ```python
    from fastapi.middleware.cors import CORSMiddleware
    app.add_middleware(
      CORSMiddleware,
      allow_origins=["http://localhost:3000"],
      allow_methods=["*"],
      allow_headers=["*"],
    )
    ```

**Minimal FastAPI example:**
```python
from fastapi import FastAPI, Form
from fastapi.responses import JSONResponse

app = FastAPI()
@app.post("/token")
async def exchange_token(
    code: str = Form(...),
    client_id: str = Form(None),
    client_secret: str = Form(None),
    redirect_uri: str = Form(None),
    state: str = Form(None)
):
    if not code:
        return JSONResponse({"error": "Missing code"}, status_code=400)
    return {"access_token": "mock_access_token"}
```

---

### 🔑 Security & Setup Notes

- **NEVER** expose or commit `client_secret` from your `.env` or JS bundle! Only use for mock/dev scenarios.
- The frontend **never** POSTs production secrets.
- Restart the dev server after changes to `.env`.
- If running in cloud, set CORS and endpoint settings accordingly.

---

## 💻 Developer Handoff - What You Need to Know

- All configuration for GitHub OAuth is via `.env` in the main dashboard folder.
- The dashboard POSTs auth codes to the backend endpoint you specify.
- Backend contract expects and returns exactly as described above.
- CORS must be set backend-side. Frontend code assumes proper CORS policy.
- Consult this README for full contract details for integration.

---

## Learn More

Check [React documentation](https://reactjs.org/) for more, or read the main dashboard code for further details.

Other build/deploy sections are unchanged.
