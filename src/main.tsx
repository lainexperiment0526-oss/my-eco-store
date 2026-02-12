
// Console filtering must be imported first to suppress errors early
import './lib/console-filter';

// Production security layer - ONLY enabled on actual production domain
// NOT enabled on localhost (development)
import { enableProductionSecurity, validateProductionSecurity } from './utils/productionSecurity';

// Only enable on actual production domain (droplink.space with HTTPS)
const isProductionDomain = typeof window !== 'undefined' ? 
  window.location.hostname === 'droplink.space' || window.location.hostname === 'www.droplink.space'
  : false;
const isHTTPS = typeof window !== 'undefined' ? window.location.protocol === 'https:' : false;

if (isProductionDomain && isHTTPS) {
  enableProductionSecurity();
  validateProductionSecurity();
}

// Polyfill global for browser compatibility (stellar-sdk fix)
if (typeof global === "undefined") {
  // @ts-ignore
  window.global = window;
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { PiProvider } from "./contexts/PiContext";
import { UserPreferencesProvider } from "./contexts/UserPreferencesContext";
import ErrorBoundary from "./components/ErrorBoundary";

// Improved Pi Browser detection: checks for PiBrowser in userAgent and window.Pi object
function isPiBrowser() {
  if (typeof window === 'undefined' || !window.navigator) return false;
  const ua = window.navigator.userAgent || '';
  const isPiUA = /PiBrowser/i.test(ua);
  const hasPiObj = typeof window.Pi !== 'undefined';
  return isPiUA || hasPiObj;
}


// PRODUCTION ONLY - No environment validation or mock objects

// Run app immediately in production
(async () => {
  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
      <PiProvider>
        <UserPreferencesProvider>
          <App />
        </UserPreferencesProvider>
      </PiProvider>
    </ErrorBoundary>
  );
})();

// Register service worker for PWA installability
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('[PWA] Service worker registration failed:', error);
    });
  });
}
