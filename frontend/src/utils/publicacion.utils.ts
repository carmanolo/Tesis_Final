import { API_URL } from "../config/env.config.js";

const baseUrl = (API_URL || "").replace(/\/api\/?$/, "");
// console.log("BASEURL: " + (baseUrl || "(vacío)"));

// Construye la URL completa para MOSTRAR una imagen.
export const getImageUrl = (imgPath: any) => {
    if (!imgPath) {
        // console.log("IMGPATH: (vacío)");
        return "";
    }
    if (/^(https?:|blob:|data:)/i.test(imgPath)) {
        // console.log(`IMGPATH: ${imgPath}`);
        return imgPath;
    } 

    const clean = String(imgPath).replace(/\\/g, "/").replace(/^\/+/, "");
    const encoded = clean.split("/").map(encodeURIComponent).join("/");
    // console.log(`IMGPATH: ` + `${baseUrl}/${encoded}`);
    return `${baseUrl}/${encoded}`;
};

export const getCompromisoTitulo = (compromiso: unknown): string => {
    const DEFAULT_TITULO = "No hay noticias";
    if(typeof compromiso !== "string"){
        return DEFAULT_TITULO;
    }

    try {
        const splitCompromiso = compromiso.split("(")[0];
        const nameCompromiso = splitCompromiso ? splitCompromiso.trim() : "";
        const nameCompromisoWithouthId = nameCompromiso.split(". ")[1];

        return nameCompromisoWithouthId?.trim() || DEFAULT_TITULO;
    } catch (error) {
        console.error(error);
        return DEFAULT_TITULO;
    }
}

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

      return compromiso.split(". ")[1]?.trim() || DEFAULT_COMPROMISO;
    } catch (error) {
      console.error(error);
      return DEFAULT_COMPROMISO;
    }
  });

  return newCompromisos;
};

