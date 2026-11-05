import multer from "multer";
import path from "path";
import fs from "fs";
import { PUBLICACION_UPLOAD_DIR, IMAGEN_MIME_TYPES, TAMANO_MAXIMO_IMAGEN_BYTES, FORMATO_NO_PERMITIDO, MAX_IMAGENES, } from "../constants/publicacion.constants.js";
import { handleErrorClient } from "../handlers/responseHandlers.js";
// Asegura que el directorio de almacenamiento exista
if (!fs.existsSync(PUBLICACION_UPLOAD_DIR)) {
    fs.mkdirSync(PUBLICACION_UPLOAD_DIR, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, PUBLICACION_UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `pub_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
        cb(null, filename);
    },
});
// Verifica estándar mime
function fileFilter(_req, file, cb) {
    if (IMAGEN_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(FORMATO_NO_PERMITIDO));
    }
}
const uploadImagen = multer({
    storage,
    fileFilter,
    limits: { fileSize: TAMANO_MAXIMO_IMAGEN_BYTES },
});
// Middleware envuelto para responder con el formato de error estándar del proyecto
export function uploadImagenesMiddleware(req, res, next) {
    uploadImagen.array("imagenes", MAX_IMAGENES)(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return handleErrorClient(res, 400, "El archivo excede el tamaño máximo permitido");
            }
            return handleErrorClient(res, 400, err.message);
        }
        else if (err) {
            return handleErrorClient(res, 400, err.message || "Error al subir las imágenes");
        }
        next();
    });
}
