/**
 * lib/api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized HTTP API client for BeeShip.
 *
 * Features:
 *  • Single BACKEND_URL source (from lib/config)
 *  • Automatic JSON headers
 *  • Cookie credentials included on every request
 *  • Normalised error shape: always throws an Error with a human-readable message
 *  • Typed helpers: api.get / api.post / api.put / api.patch / api.delete
 *  • Raw multipart helper: api.upload (for FormData / file uploads)
 *
 * HOW TO USE:
 *   import api from "@/lib/api";
 *
 *   // GET
 *   const data = await api.get("/orders");
 *
 *   // POST with JSON body
 *   const result = await api.post("/auth/login", { email, password });
 *
 *   // File upload (FormData)
 *   const res = await api.upload("/kyc/upload", formData);
 *
 *   // Access full response (status, headers)
 *   const { data, response } = await api.get("/health", { raw: true });
 */

import { API_BASE } from "@/lib/config";

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Core fetch wrapper. All public methods delegate here.
 * @param {string} endpoint  - Path relative to API_BASE, e.g. "/orders"
 * @param {RequestInit} init - Standard fetch init (merged with defaults)
 * @param {object} options
 * @param {boolean} [options.raw] - If true, returns { data, response } instead of data
 * @returns {Promise<any>}
 */
async function request(endpoint, init = {}, { raw = false } = {}) {
  const url = `${API_BASE}${endpoint}`;

  const defaults = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  };

  // FormData must NOT set Content-Type (browser sets boundary automatically)
  if (init.body instanceof FormData) {
    delete defaults.headers["Content-Type"];
  }

  const response = await fetch(url, { ...defaults, ...init });

  // Parse response body
  let data;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  // Throw on non-2xx with a normalised error message
  if (!response.ok) {
    const message =
      (typeof data === "object" && (data?.error?.message || data?.message)) ||
      `Request failed with status ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  if (raw) return { data, response };
  return data;
}

// ─── Public API client ────────────────────────────────────────────────────────

const api = {
  /**
   * GET  /api/<endpoint>
   * @param {string} endpoint
   * @param {object} [options]   - { raw: true } to get { data, response }
   */
  get(endpoint, options) {
    return request(endpoint, { method: "GET" }, options);
  },

  /**
   * POST /api/<endpoint>  with JSON body
   * @param {string} endpoint
   * @param {object} [body]
   * @param {object} [options]
   */
  post(endpoint, body, options) {
    return request(
      endpoint,
      {
        method: "POST",
        body: body !== undefined ? JSON.stringify(body) : undefined,
      },
      options
    );
  },

  /**
   * PUT  /api/<endpoint>  with JSON body
   */
  put(endpoint, body, options) {
    return request(
      endpoint,
      {
        method: "PUT",
        body: body !== undefined ? JSON.stringify(body) : undefined,
      },
      options
    );
  },

  /**
   * PATCH /api/<endpoint>  with JSON body
   */
  patch(endpoint, body, options) {
    return request(
      endpoint,
      {
        method: "PATCH",
        body: body !== undefined ? JSON.stringify(body) : undefined,
      },
      options
    );
  },

  /**
   * DELETE /api/<endpoint>
   */
  delete(endpoint, options) {
    return request(endpoint, { method: "DELETE" }, options);
  },

  /**
   * Multipart / file upload — pass a FormData instance as `body`.
   * Content-Type header is intentionally omitted so the browser sets the boundary.
   * @param {string} endpoint
   * @param {FormData} formData
   * @param {object} [options]
   */
  upload(endpoint, formData, options) {
    return request(
      endpoint,
      {
        method: "POST",
        body: formData,
        headers: {}, // No Content-Type — cleared internally when body is FormData
      },
      options
    );
  },

  /**
   * Expose the raw request function for edge cases.
   */
  request,

  /**
   * Base URL — useful for displaying in UI (e.g. SystemHealth panel).
   */
  get baseUrl() {
    return API_BASE.replace(/\/api$/, "");
  },
};

export default api;
