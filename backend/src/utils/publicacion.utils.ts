import fs from "fs";
import path from "path";
import { PUBLICACION_UPLOAD_DIR } from "../constants/publicacion.constants.js";

/**
 * Indica si el rol corresponde a un administrador.
 */
export const isAdminRole = (role?: string): boolean => {
    const r = role?.toLowerCase();
    return r === "admin" || r === "administrador";
};

/**
 * Convierte el arreglo de imágenes a string JSON para guardarlo en la BD.
 */
export function serializeImagenes(value?: string[] | null): string {
    return JSON.stringify(Array.isArray(value) ? value : []);
}

/**
 * Convierte el string JSON de la BD a arreglo de imágenes.
 * Si el valor es inválido, devuelve un arreglo vacío.
 */
export function parseImagenes(value?: string | null): string[] {
    try {
        const parsed = JSON.parse(value ?? "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

/**
 * Transformer de TypeORM para la columna `imagenes`.
 * Uso en la entidad: transformer: imagenesTransformer
 */
export const imagenesTransformer = {
    to: serializeImagenes,
    from: parseImagenes,
};

/**
 * Une las imágenes actuales con las nuevas.
 */
export function mergeImagenes(actuales: string[] = [], nuevas: string[] = []): string[] {
    return [...actuales, ...nuevas];
}

/**
 * Quita una imagen del arreglo. Devuelve el nuevo arreglo y si se encontró.
 */
export function removeImagen(imagenes: string[] = [], imagenUrl: string): { imagenes: string[]; encontrada: boolean } {
    const filtradas = imagenes.filter((img) => img !== imagenUrl);
    return { imagenes: filtradas, encontrada: filtradas.length !== imagenes.length };
}

/**
 * Borra del disco archivos subidos por multer (usa la ruta completa, p. ej. al fallar una validación).
 */
export function deleteUploadedFiles(files?: Express.Multer.File[]): void {
    if (!files) return;
    for (const f of files) {
        fs.unlink(f.path, () => {});
    }
}

/**
 * Borra del disco imágenes ya guardadas en una publicación, a partir de su ruta/URL.
 */
export function deleteImagenesFromDisk(imagenes: string[] = []): void {
    for (const img of imagenes) {
        const filename = path.basename(img);
        fs.unlink(path.join(PUBLICACION_UPLOAD_DIR, filename), () => {});
    }
}