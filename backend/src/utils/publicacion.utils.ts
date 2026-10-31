import fs from "fs";
import path from "path";
import { PUBLICACION_UPLOAD_DIR } from "../constants/publicacion.constants.js";

/**
 * Normaliza las barras invertidas '\' de Windows a '/' para URLs web.
 */
export const normalizePath = (filePath: string): string => {
    return filePath ? filePath.replace(/\\/g, "/") : "";
};

/**
 * Indica si el rol corresponde a un administrador.
 */
export const isAdminRole = (role?: string): boolean => {
    const r = role?.toLowerCase();
    return r === "admin" || r === "administrador";
};

/**
 * Convierte el arreglo de imágenes a string JSON para guardarlo en la BD
 * asegurando que todas las rutas usen '/'.
 */
export function serializeImagenes(value?: string[] | null): string {
    if (!Array.isArray(value)) return "[]";
    const normalized = value.map(normalizePath);
    return JSON.stringify(normalized);
}

/**
 * Convierte el string JSON de la BD a arreglo de imágenes.
 * Soporta casos donde TypeORM ya parseó el valor a Array.
 */
export function parseImagenes(value?: string | string[] | null): string[] {
    if (!value) return [];
    
    // Si TypeORM ya lo convirtió a Array, solo normalizamos las rutas
    if (Array.isArray(value)) {
        return value.map(normalizePath);
    }

    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.map(normalizePath) : [];
    } catch {
        return [];
    }
}

/**
 * Transformer listo para usar en EntitySchema de TypeORM.
 */
export const imagenesTransformer = {
    to: serializeImagenes,
    from: parseImagenes,
};

/**
 * Une las imágenes actuales con las nuevas normalizando separadores.
 */
export function mergeImagenes(actuales: string[] = [], nuevas: string[] = []): string[] {
    return [...actuales, ...nuevas].map(normalizePath);
}

/**
 * Quita una imagen del arreglo comparando rutas normalizadas.
 */
export function removeImagen(imagenes: string[] = [], imagenUrl: string): { imagenes: string[]; encontrada: boolean } {
    const target = normalizePath(imagenUrl);
    const filtradas = imagenes
        .map(normalizePath)
        .filter((img) => img !== target);

    return { 
        imagenes: filtradas, 
        encontrada: filtradas.length !== imagenes.length 
    };
}

/**
 * Borra del disco archivos subidos por multer.
 */
export function deleteUploadedFiles(files?: Express.Multer.File[]): void {
    if (!files) return;
    for (const f of files) {
        fs.unlink(f.path, () => {});
    }
}

/**
 * Borra del disco imágenes ya guardadas a partir de su ruta o filename.
 */
export function deleteImagenesFromDisk(imagenes: string[] = []): void {
    for (const img of imagenes) {
        if (!img) continue;
        const filename = path.basename(img);
        const fullPath = path.join(PUBLICACION_UPLOAD_DIR, filename);
        
        fs.access(fullPath, fs.constants.F_OK, (err) => {
            if (!err) {
                fs.unlink(fullPath, () => {});
            }
        });
    }
}