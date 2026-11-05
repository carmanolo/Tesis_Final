import { API_URL } from "../config/env.config.js";

const baseUrl = (API_URL || "").replace(/\/api\/?$/, "");

/**
 * Construye la URL completa para MOSTRAR una imagen.
 * - Normaliza barras invertidas (Windows) solo para la URL de visualización.
 * - Codifica cada segmento de la ruta para que espacios, paréntesis, tildes, etc. no rompan la URL.
 * ⚠️ Para ELIMINAR una imagen se debe enviar el valor original de
 * `publicacion.imagenes`, sin pasar por esta función.
 */
export const getImageUrl = (imgPath: any) => {
    if (!imgPath) return "";
    if (/^(https?:|blob:|data:)/i.test(imgPath)) return imgPath;

    const clean = String(imgPath).replace(/\\/g, "/").replace(/^\/+/, "");
    const encoded = clean.split("/").map(encodeURIComponent).join("/");
    return `${baseUrl}/${encoded}`;
};