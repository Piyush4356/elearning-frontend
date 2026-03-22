import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { UserContextProvider } from './context/UserContext.jsx'
import { CourseContextProvider } from './context/CourseContext.jsx';

// Uses VITE_SERVER_URL env var if set (local dev), otherwise falls back to production
export const server = import.meta.env.VITE_SERVER_URL || "https://elearning-server-gqgx.onrender.com";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <UserContextProvider><CourseContextProvider>
      <App />
    </CourseContextProvider>
    </UserContextProvider>
  </StrictMode>,
)
