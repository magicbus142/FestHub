import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import { SupabaseAuthProvider } from "./contexts/SupabaseAuthContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LanguageProvider>
      <SupabaseAuthProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </SupabaseAuthProvider>
    </LanguageProvider>
  </StrictMode>,
);
