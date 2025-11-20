import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import App from './shell/App'
import InterviewCoachLanding from './components/InterviewCoachLanding'

// Wrapper to conditionally render InterviewCoachLanding without App.js structure
function AppWrapper() {
  const location = useLocation();
  
  // If Interview Coach route, render standalone without Header/Footer
  if (location.pathname === '/interview-coach') {
    return (
      <Routes>
        <Route path="/interview-coach" element={<InterviewCoachLanding />} />
      </Routes>
    );
  }
  
  // Otherwise render normal App with Header/Footer
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
