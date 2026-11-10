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