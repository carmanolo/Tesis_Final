import multer from "multer";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";
import {
    PUBLICACION_UPLOAD_DIR,
    IMAGEN_MIME_TYPES,
    TAMANO_MAXIMO_IMAGEN_BYTES,
    FORMATO_NO_PERMITIDO,
    MAX_IMAGENES,
} from "../constants/publicacion.constants.js";
import { handleErrorClient } from "../handlers/responseHandlers.js";
import { validarFirmaArchivo } from "../utils/fileValidator.utils.js";

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

// Verifica estándar mime preliminar
function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
    if (IMAGEN_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(FORMATO_NO_PERMITIDO));
    }
}

const uploadImagen = multer({
    storage,
    fileFilter,
    limits: { fileSize: TAMANO_MAXIMO_IMAGEN_BYTES },
});

// Middleware envuelto con validación profunda de integridad y Magic Numbers para imágenes JPEG y PNG
export function uploadImagenesMiddleware(req: Request, res: Response, next: NextFunction) {
    uploadImagen.array("imagenes", MAX_IMAGENES)(req, res, (err: any) => {
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return handleErrorClient(res, 400, "El archivo excede el tamaño máximo permitido");
            }
            return handleErrorClient(res, 400, err.message);
        } else if (err) {
            return handleErrorClient(res, 400, err.message || "Error al subir las imágenes");
        }

        // Validar la firma binaria de cada uno de los archivos subidos
        const files = req.files as Express.Multer.File[] | undefined;
        if (files && Array.isArray(files) && files.length > 0) {
            for (const file of files) {
                const validacion = validarFirmaArchivo(file.path);
                if (!validacion.valido || !["jpeg", "png"].includes(validacion.formatoDetectado || "")) {
                    // Borrar todos los archivos subidos en esta petición para no dejar basura en el disco
                    for (const f of files) {
                        try {
                            if (fs.existsSync(f.path)) {
                                fs.unlinkSync(f.path);
                            }
                        } catch (unlinkErr) {
                            console.error("Error al limpiar imagen corrupta:", unlinkErr);
                        }
                    }

                    return handleErrorClient(
                        res,
                        400,
                        `El archivo "${file.originalname}" está corrupto, vacío o no corresponde a una imagen PNG o JPEG válida.`
                    );
                }
            }
        }

        next();
    });
}
