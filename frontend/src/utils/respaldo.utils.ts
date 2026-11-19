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
    if (typeof compromiso === "object" && compromiso !== null) {
        const rawId =
            (compromiso as any).id_compromiso ??
            (compromiso as any).id ??
            (compromiso as any).compromisoId;
        const num = Number(rawId);
        return isNaN(num) ? null : num;
    }

    if (typeof compromiso !== "string") return null;

    const trimmed = compromiso.trim();
    const match = trimmed.match(/^(\d+)[\.\-\:\s]/);
    if (match) {
        const id = Number(match[1]);
        return isNaN(id) ? null : id;
    }

    const [idPart] = trimmed.split(". ");
    const id = Number(idPart?.trim());
    return isNaN(id) ? null : id;
};

export const getCompromisoTitulo = (compromiso: unknown): string => {
    const DEFAULT_TITULO = "Compromiso sin título";

    if (typeof compromiso === "object" && compromiso !== null) {
        const tit =
            (compromiso as any).titulo ??
            (compromiso as any).descripcion_compromiso ??
            (compromiso as any).descripcion ??
            (compromiso as any).nombre;
        if (typeof tit === "string" && tit.trim().length > 0) {
            return tit.trim();
        }
    }

    if (typeof compromiso !== "string") {
        return DEFAULT_TITULO;
    }

    try {
        const texto = compromiso.trim();
        if (!texto) return DEFAULT_TITULO;

        // Si empieza con prefijo numérico como "1. ", "1 - " o "1: ", extraemos el título sin el ID
        const match = texto.match(/^\d+[\.\-\:]\s*(.+)$/);
        if (match && match[1]?.trim()) {
            return match[1].trim();
        }

        const parts = texto.split(". ");
        if (parts.length > 1 && !isNaN(Number(parts[0]))) {
            return parts.slice(1).join(". ").trim() || DEFAULT_TITULO;
        }

        return texto || DEFAULT_TITULO;
    } catch (error) {
        console.error(error);
        return DEFAULT_TITULO;
    }
};

export const processCompromisos = (compromisos: unknown): string[] => {
  const DEFAULT_COMPROMISO = "Compromiso sin título";

  if (!Array.isArray(compromisos)) {
    return [];
  }

  const newCompromisos: string[] = compromisos.map((compromiso: unknown) => {
    try {
      return getCompromisoTitulo(compromiso);
    } catch (error) {
      console.error(error);
      return DEFAULT_COMPROMISO;
    }
  });

  return newCompromisos;
};
