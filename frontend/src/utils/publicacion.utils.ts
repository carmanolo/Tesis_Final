import { API_URL } from "../config/env.config.js";

const baseUrl = (API_URL || "").replace(/\/api\/?$/, "");

// Construye la URL completa para MOSTRAR una imagen.
export const getImageUrl = (imgPath: any) => {
    if (!imgPath) return "";
    if (/^(https?:|blob:|data:)/i.test(imgPath)) return imgPath;

    const clean = String(imgPath).replace(/\\/g, "/").replace(/^\/+/, "");
    const encoded = clean.split("/").map(encodeURIComponent).join("/");
    return `${baseUrl}/${encoded}`;
};