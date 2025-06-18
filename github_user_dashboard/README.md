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

To enable secure GitHub OAuth integration and configure backend token exchange, you must provide your OAuth client information and token endpoint as environment variables in a `.env` file **in the `github_user_dashboard/` folder**.

#### 1. Create `.env` file if not already present
```env
# .env in github_user_dashboard/
REACT_APP_GITHUB_CLIENT_ID=Ov23lioFpdZyTjydbxm0

# Where your FastAPI (or compatible) backend for code->token exchange lives:
REACT_APP_TOKEN_ENDPOINT=http://localhost:8000/token

# [OPTIONAL - For demo/testing only, never in production!]
REACT_APP_GITHUB_CLIENT_SECRET=<your_client_secret>
```
> **Do NOT commit client secrets to source!** `client_secret` is used ONLY for isolated, internal backend testing. Production systems MUST NOT expose it to the frontend.

---

### 🔧 How the OAuth token exchange works

- The React app POSTs the OAuth code, client_id, and, if present, client_secret, as `application/x-www-form-urlencoded` to the endpoint defined by `REACT_APP_TOKEN_ENDPOINT` (default: `http://localhost:3001/token`).
- The endpoint is designed for use with a secure FastAPI (or Node.js/other) backend that performs server-to-server GitHub token exchange.

#### Example `.env`

```env
REACT_APP_GITHUB_CLIENT_ID=Ov23lioFpdZyTjydbxm0
REACT_APP_TOKEN_ENDPOINT=http://localhost:8000/token
# NEVER commit secrets:
REACT_APP_GITHUB_CLIENT_SECRET=demo_value_only_for_backend_testing
```

---

### 💡 Integration Contract for Token Exchange Endpoint (Backend Service)

The frontend will:
- **POST** to the endpoint as configured, sending `code`, `client_id`, and (rarely, if set), `client_secret` as form data (`x-www-form-urlencoded`):

**POST body example**
```
code=abc123&client_id=Ov23lioFpdZyTjydbxm0[&client_secret=demo_val]
```

**Backend HTTP Response (FastAPI/compatible)**
- Must return JSON:
```json
{ "access_token": "<token_value>" }
```
- If error: HTTP non-200, ideally `{ "error": "msg" }` in JSON.

#### Sample curl for developers
```bash
curl -X POST http://localhost:8000/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "code=the_oauth_code_here&client_id=Ov23lioFpdZyTjydbxm0"
```

#### Minimal FastAPI endpoint

```python
from fastapi import FastAPI, Form
from fastapi.responses import JSONResponse

app = FastAPI()

# PUBLIC_INTERFACE
@app.post("/token")
async def exchange_token(
    code: str = Form(...),
    client_id: str = Form(None),
    client_secret: str = Form(None)  # Accept/ignore in backend as policy allows
):
    if not code:
        return JSONResponse({"error": "Missing code"}, status_code=400)
    # Optionally validate client_id/client_secret
    return {"access_token": "mock_access_token"}
```

---

#### CORS for local React development

Make sure your FastAPI backend enables CORS for the React development server:

```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"], allow_headers=["*"],
)
```
> For prod, restrict allowed origins appropriately.

---

#### Security best practices

- Never commit or expose your GitHub `client_secret` in any frontend code.
- For automated tests or mock/demo: set a placeholder secret ONLY in local .env never in production or in source control.
- The React frontend always POSTs to an endpoint defined in `.env`. Any value in a sample repo/demo is for developer testing only.

### 💡 Configurable Token Exchange Endpoint for OAuth (FastAPI or Node)

By default, the dashboard POSTs the OAuth code to:
```
http://localhost:3001/token
```

#### 🔧 To use your own FastAPI backend for code exchange:
Set the environment variable in your `github_user_dashboard/.env` file as:
```
REACT_APP_TOKEN_ENDPOINT=http://localhost:8000/token
```
- You can use any backend that accepts the documented contract.  
- The React dashboard will POST the user's OAuth code to whichever endpoint you set.

---

## 🚦 Integration Contract for the Token Exchange Endpoint (FastAPI or compatible)

**Frontend POST request**
- The React app POSTs to your configured endpoint for the OAuth code exchange:
  - **Endpoint URL:** from `REACT_APP_TOKEN_ENDPOINT` or defaults to `http://localhost:3001/token`
- **Request format:** `x-www-form-urlencoded`
- **Required fields:** `code=<OAUTH_CODE>` (optionally `client_id=<client_id>`)  
  - :warning: **NEVER send `client_secret` from client code!** Only backend should hold secrets.

**Sample POST request (for user/backends to test):**
```http
POST /token
Host: localhost:8000
Content-Type: application/x-www-form-urlencoded

code=<OAUTH_CODE>&client_id=<OPTIONAL_CLIENT_ID>
```
- Example using `curl`:
  ```bash
  curl -X POST http://localhost:8000/token \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "code=the_oauth_code_here&client_id=Ov23lioFpdZyTjydbxm0"
  ```

**Backend (FastAPI) Response**
- JSON body, status 200, on success (example):
  ```json
  { "access_token": "<mock_or_real_access_token>" }
  ```
- On error: return non-200 status and ideally include an `error` field in the JSON body.

| Frontend sends (POST, x-www-form-urlencoded)     | Backend replies (JSON 200-ok)         |
|--------------------------------------------------|----------------------------------------|
| code=<string> [& client_id=<string>]             | { "access_token": "<string>" }         |

---

#### Example: Minimal FastAPI token endpoint (accepting form data, matches contract)

```python
from fastapi import FastAPI, Form
from fastapi.responses import JSONResponse

app = FastAPI()

# PUBLIC_INTERFACE
@app.post("/token")
async def exchange_token(
    code: str = Form(...),
    client_id: str = Form(None),
    client_secret: str = Form(None)
):
    if not code:
        return JSONResponse({"error": "Missing code"}, status_code=400)
    # Optionally check client_id/client_secret as needed (server-side only!)
    return {"access_token": "mock_access_token"}
```

- Run with: `uvicorn main:app --reload --port 8000`
- Set your React dashboard `.env` to point to this endpoint as shown above.

**CORS Notice:**  
Make sure CORS is enabled on your FastAPI backend to allow requests from your frontend (e.g., React dev server at `http://localhost:3000`).  
In FastAPI, use:
```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev
    allow_methods=["*"], allow_headers=["*"],
)
```
- For production, set more restrictive origins.

> **Security Note:** Never expose your GitHub OAuth **client_secret** in frontend code. Your backend should be the only code handling secrets!

3. Restart your development server if it's running.

**Do NOT commit client secrets to source control.** Never expose your Client Secret in frontend code.

In the project directory, you can run:

### `npm start`

Runs the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm test`

Launches the test runner in interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

## Customization

### Colors

The main brand colors are defined as CSS variables in `src/App.css`:

```css
:root {
  --kavia-orange: #E87A41;
  --kavia-dark: #1A1A1A;
  --text-color: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --border-color: rgba(255, 255, 255, 0.1);
}
```

### Components

This template uses pure HTML/CSS components instead of a UI framework. You can find component styles in `src/App.css`. 

Common components include:
- Buttons (`.btn`, `.btn-large`)
- Container (`.container`)
- Navigation (`.navbar`)
- Typography (`.title`, `.subtitle`, `.description`)

## Learn More

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
