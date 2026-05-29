// Configuración centralizada de la aplicación
const rawUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
export const API_BASE_URL = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
