import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function OAuth2CallbackPage() {
  const [searchParams] = useSearchParams();
  const { loginWithToken, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  // Track whether we already processed the token to avoid double-runs in StrictMode
  const processed = useRef(false);

  // Step 1: Process the token from the URL (runs once on mount)
  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const token = searchParams.get("token");
    if (token) {
      loginWithToken(token);
      // Do NOT navigate here — React state update is async.
      // Navigation is handled in Step 2 once isAuthenticated flips to true.
    } else {
      // No token — something went wrong, send back to login
      navigate("/login", { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step 2: Navigate home only after auth state has actually updated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="bg-surface-50 dark:bg-surface-900 min-h-screen flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="inline-block w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 text-sm">Completing sign-in...</p>
      </div>
    </div>
  );
}
