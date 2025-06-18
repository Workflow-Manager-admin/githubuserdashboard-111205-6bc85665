# Lightweight React Template for KAVIA

This project provides a minimal React template with a clean, modern UI and minimal dependencies.

## Features

- **Lightweight**: No heavy UI frameworks - uses only vanilla CSS and React
- **Modern UI**: Clean, responsive design with KAVIA brand styling
- **Fast**: Minimal dependencies for quick loading times
- **Simple**: Easy to understand and modify

## Important Note: Babel Configuration

This project’s `package.json` includes a `babel` section with a plugin:

```json
"babel": {
"plugins": ["./.ve/babel-plugin-jsx-editor-id.js"]
}
```

This plugin enables **visual editing functionality** in supported tools.

**Warning for AI code agents and contributors:**
**DO NOT** remove or modify this section - it is ESSENTIAL for proper operation.
Removing it will break editor integration and visual editing features.

## Getting Started

### ⚠️ Environment Variable Setup for GitHub OAuth (React + FastAPI/Backend)

To enable secure GitHub OAuth integration and configure backend token exchange, provide your OAuth client information and token endpoint as environment variables in a `.env` file **in the `github_user_dashboard/` folder**:

#### 1. Create `.env` file, example:
```env
# .env in github_user_dashboard/
REACT_APP_GITHUB_CLIENT_ID=Ov23lioFpdZyTjydbxm0

# The endpoint for token exchange (FastAPI, compatible backend):
REACT_APP_TOKEN_EXCHANGE_ENDPOINT=http://localhost:8000/token

# (Optional; for development/demo ONLY, never in production)
REACT_APP_GITHUB_CLIENT_SECRET=<your_client_secret>
```
> **Never commit client secrets to source!** `client_secret` is only for local/internal testing.

---

### 🔧 How OAuth Code Exchange Works

- The React app POSTs the OAuth code, client_id, client_secret (if present), redirect_uri, and state as `application/x-www-form-urlencoded` to the token endpoint defined by `REACT_APP_TOKEN_EXCHANGE_ENDPOINT`.
- Endpoint is compatible with FastAPI or similar; perform server-side code-to-token exchange.

#### Sample `.env`:
```env
REACT_APP_GITHUB_CLIENT_ID=Ov23lioFpdZyTjydbxm0
REACT_APP_TOKEN_EXCHANGE_ENDPOINT=http://localhost:8000/token
# NEVER commit secrets:
REACT_APP_GITHUB_CLIENT_SECRET=demo_value_only_for_backend_testing
```

---

### 💡 OAuth Token Endpoint Integration (Frontend <-> FastAPI or Node.js)

The frontend sends a POST request structured as:

#### Example POST to Token Endpoint:
- **URL:** from `REACT_APP_TOKEN_EXCHANGE_ENDPOINT` (default: `http://localhost:3001/token`)
- **Content-Type:** `application/x-www-form-urlencoded`
- **Body Fields:**  
  - `code` (required) — from GitHub OAuth  
  - `client_id` (required)  
  - `client_secret` (optional, dev only)  
  - `redirect_uri` (always provided)  
  - `state` (if available; optional for some setups)

```
code=abc123&client_id=Ov23lioFpdZyTjydbxm0[&client_secret=demo_val]&redirect_uri=https://yourapp.com/callback[&state=xyz]
```

#### Example (fetch, JavaScript):
```js
fetch(process.env.REACT_APP_TOKEN_EXCHANGE_ENDPOINT, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json'
  },
  body: new URLSearchParams({
    client_id: 'your_client_id',
    client_secret: 'your_client_secret', // (omit unless for dev)
    code: received_code,
    redirect_uri: 'https://yourapp.com/callback',
    state: stored_state
  }),
})
.then(res => res.json())
.then(data => {
  console.log('access_token:', data.access_token);
});
```

#### Example (curl):
```bash
curl -X POST http://localhost:8000/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "code=the_oauth_code_here&client_id=Ov23lioFpdZyTjydbxm0&redirect_uri=http://localhost:3000"
```

#### Expected Backend Response (JSON):
```json
{ "access_token": "<token_value>" }
```
- On error: HTTP non-200, ideally `{ "error": "msg" }` in JSON.

---

### Minimal FastAPI Token Endpoint Example

```python
from fastapi import FastAPI, Form
from fastapi.responses import JSONResponse

app = FastAPI()

# PUBLIC_INTERFACE
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
    # Validate client_id/client_secret, etc. as needed
    return {"access_token": "mock_access_token"}
```

---

#### CORS for local React development

Make sure your FastAPI backend enables CORS for local React:
```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"], allow_headers=["*"],
)
```
- For production, restrict allow_origins appropriately.

---

#### Security Best Practices

- Never commit or expose GitHub `client_secret` in frontend code.
- For tests/mock/demo: use a placeholder secret ONLY in local .env (never in production or source control).
- The React frontend POSTs to the endpoint set in `.env`. Value is for local/dev/test only.

---

### Configurable Token Exchange Endpoint

By default, the dashboard POSTs the OAuth code to:
```
http://localhost:3001/token
```
But you can override via `.env` with:
```
REACT_APP_TOKEN_EXCHANGE_ENDPOINT=http://localhost:8000/token
```
(Or `REACT_APP_TOKEN_ENDPOINT` for backward-compatibility.)

---

#### Restart your dev server after changing .env.

---

## Learn More

To learn React, check out the [React documentation](https://reactjs.org/).

### Other sections (build, deploy, colors, etc.) remain unchanged.

