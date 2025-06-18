import React from 'react';
import './App.css';
import GitHubUserDashboard from "./GitHubUserDashboard";

// PUBLIC_INTERFACE
function App() {
  // Primary entrypoint. Renders GitHubUserDashboard container.
  // Debug: Check if rendering debug is reached
  console.log("App component rendering...");
  return (
    <div className="app" style={{ backgroundColor: "#f8fafd", minHeight: "100vh" }}>
      <GitHubUserDashboard />
    </div>
  );
}

export default App;