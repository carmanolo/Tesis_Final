import multer from "multer";
import path from "path";
import fs from "fs";
import { ACTA_UPLOAD_DIR, ACTA_MIME_TYPES, TAMANO_MAXIMO_ACTA_BYTES, FORMATO_NO_PERMITIDO } from "../constants/reunion.constants.js";
import { handleErrorClient } from "../handlers/responseHandlers.js";
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
//Verrifica estandar mime
function fileFilter(_req, file, cb) {
    if (ACTA_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(FORMATO_NO_PERMITIDO));
    }
}
const uploadActa = multer({
    storage,
    fileFilter,
    limits: { fileSize: TAMANO_MAXIMO_ACTA_BYTES }
});
// Middleware "envuelto" para poder responder con el formato de error estándar del proyecto
// en vez de dejar que multer lance el error crudo (tamaño excedido, formato inválido, etc).
export function uploadActaMiddleware(req, res, next) {
    uploadActa.single("archivo")(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return handleErrorClient(res, 400, "El archivo excede el tamaño máximo permitido");
            }
            return handleErrorClient(res, 400, err.message);
        }
        else if (err) {
            return handleErrorClient(res, 400, err.message || "Error al subir el archivo");
        }
        next();
    });
}
