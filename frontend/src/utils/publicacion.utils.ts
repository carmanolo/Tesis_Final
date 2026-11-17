import { API_URL } from "../config/env.config.js";

const baseUrl = (API_URL || "").replace(/\/api\/?$/, "");

// Construye la URL completa para MOSTRAR una imagen.
export const getImageUrl = (imgPath: any) => {
    if (!imgPath) {
        return "";
    }
    if (/^(https?:|blob:|data:)/i.test(imgPath)) {
        return imgPath;
    } 

    const clean = String(imgPath).replace(/\\/g, "/").replace(/^\/+/, "");
    const encoded = clean.split("/").map(encodeURIComponent).join("/");
    return `${baseUrl}/${encoded}`;
};

export const getCompromisoId = (compromiso: unknown): number | null => {
    if (typeof compromiso !== "string") return null;
    const [idPart] = compromiso.split(". ");
    const id = Number(idPart?.trim());
    return isNaN(id) ? null : id;
};

export const getCompromisoTitulo = (compromiso: unknown): string => {
    const DEFAULT_TITULO = "No hay noticias";
    if (typeof compromiso !== "string") {
        return DEFAULT_TITULO;
    }

    try {
        const splitCompromiso = compromiso.split("(")[0];
        const nameCompromiso = splitCompromiso ? splitCompromiso.trim() : "";
        const parts = nameCompromiso.split(". ");
        const nameCompromisoWithoutId = parts.length > 1 ? parts.slice(1).join(". ") : parts[0];

        return nameCompromisoWithoutId?.trim() || DEFAULT_TITULO;
    } catch (error) {
        console.error(error);
        return DEFAULT_TITULO;
    }
};

export const processCompromisos = (compromisos: unknown): string[] => {
  const DEFAULT_COMPROMISO = "NO EXISTE COMPROMISOS";

  if (!Array.isArray(compromisos)) {
    return [];
  }

  const newCompromisos: string[] = compromisos.map((compromiso: unknown) => {
    try {
      if (typeof compromiso !== "string") {
        console.error("El compromiso debe ser un string: ", compromiso);
        return DEFAULT_COMPROMISO;
      }

      return getCompromisoTitulo(compromiso);
    } catch (error) {
      console.error(error);
      return DEFAULT_COMPROMISO;
    }
  });

  return newCompromisos;
};
