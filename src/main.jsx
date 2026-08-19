import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";
import { ReferenceProvider } from "./api/ReferenceContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ReferenceProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </ReferenceProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
