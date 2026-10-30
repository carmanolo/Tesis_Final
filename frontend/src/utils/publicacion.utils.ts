import { API_URL } from "../config/env.config.js";

// API_URL suele ser http://localhost:3000/api; las imágenes se sirven desde la raíz del backend.
const baseUrl = (API_URL || "").replace(/\/api\/?$/, "");

/**
 * Construye la URL completa para MOSTRAR una imagen.
 * Normaliza barras invertidas (Windows) solo para la URL de visualización.
 * ⚠️ Para ELIMINAR una imagen se debe enviar el valor original de
 * `publicacion.imagenes`, sin pasar por esta función.
 */
export const getImageUrl = (imgPath:any) => {
    if (!imgPath) return "";
    if (imgPath.startsWith("http")) return imgPath;
    const clean = imgPath.replace(/\\/g, "/");
    return `${baseUrl}/${clean}`;
};