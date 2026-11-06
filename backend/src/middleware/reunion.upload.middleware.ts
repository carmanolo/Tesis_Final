import multer from "multer";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";
import {
    ACTA_UPLOAD_DIR,
    ACTA_MIME_TYPES,
    TAMANO_MAXIMO_ACTA_BYTES,
    FORMATO_NO_PERMITIDO
} from "../constants/reunion.constants.js";
import { handleErrorClient } from "../handlers/responseHandlers.js";
import { validarFirmaArchivo } from "../utils/fileValidator.utils.js";

// Asegura que el directorio de almacenamiento exista
if (!fs.existsSync(ACTA_UPLOAD_DIR)) {
    fs.mkdirSync(ACTA_UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, ACTA_UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const idReunion = req.params.id_reunion || "sin_id";
        const timestamp = Date.now();
        const extension = path.extname(file.originalname);
        cb(null, `acta_${idReunion}_${timestamp}${extension}`);
    }
});

// Verifica estándar mime preliminar
function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
    if (ACTA_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(FORMATO_NO_PERMITIDO));
    }
}

const uploadActa = multer({
    storage,
    fileFilter,
    limits: { fileSize: TAMANO_MAXIMO_ACTA_BYTES }
});

// Middleware envuelto con validación profunda de integridad y Magic Numbers
export function uploadActaMiddleware(req: Request, res: Response, next: NextFunction) {
    uploadActa.single("archivo")(req, res, (err: any) => {
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return handleErrorClient(res, 400, "El archivo excede el tamaño máximo permitido");
            }
            return handleErrorClient(res, 400, err.message);
        } else if (err) {
            return handleErrorClient(res, 400, err.message || "Error al subir el archivo");
        }

        // Si se subió un archivo, validar su firma binaria (evitar corruptos / 0 bytes / extensiones falsas)
        if (req.file) {
            const validacion = validarFirmaArchivo(req.file.path);
            if (!validacion.valido || !["pdf", "doc", "docx"].includes(validacion.formatoDetectado || "")) {
                // Borrar inmediatamente el archivo corrupto del servidor
                try {
                    if (fs.existsSync(req.file.path)) {
                        fs.unlinkSync(req.file.path);
                    }
                } catch (unlinkErr) {
                    console.error("Error al eliminar archivo corrupto:", unlinkErr);
                }

                return handleErrorClient(
                    res,
                    400,
                    validacion.error || "El archivo subido está corrupto o no corresponde a un documento PDF o Word válido."
                );
            }
        }

        next();
    });
}
