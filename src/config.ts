// Worker URL for production. In development, Vite proxies /api to the local express server.
export const API_BASE = import.meta.env.VITE_WORKER_URL ?? "";
