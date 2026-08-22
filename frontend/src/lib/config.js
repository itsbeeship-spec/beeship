/**
 * lib/config.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for all environment-driven configuration.
 *
 * HOW TO USE:
 *   import { BACKEND_URL, APP_NAME } from "@/lib/config";
 *
 * DEPLOYMENT:
 *   Set NEXT_PUBLIC_BACKEND_URL in your host's environment variables panel.
 *   Development fallback keeps things working out of the box.
 */

/** Base URL of the BeeShip Express API. Never includes a trailing slash. */
export const BACKEND_URL =
  (process.env.NEXT_PUBLIC_BACKEND_URL || (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/$/, "");

/** Application display name — change once here, reflected everywhere. */
export const APP_NAME = "BeeShip";

/** API version prefix — bump here when the backend ships v2. */
export const API_PREFIX = "/api";

/** Full API base: e.g. "https://api.beeship.com/api" */
export const API_BASE = `${BACKEND_URL}${API_PREFIX}`;
