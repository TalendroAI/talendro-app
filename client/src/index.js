import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import App from './shell/App'

// Wrapper to conditionally render InterviewCoachLanding without App.js structure
function AppWrapper() {
  // All routes now handled in App.js, including /interview-coach
  return <App />;
}

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AppWrapper />
    </BrowserRouter>
  </React.StrictMode>
)
