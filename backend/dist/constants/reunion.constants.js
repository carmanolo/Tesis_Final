// Validaciones de texto
export const MIN_DESCRIPCION = 5;
export const MAX_DESCRIPCION = 500;
// Mensajes generales
export const REUNION_NO_ENCONTRADA = "Reunión no encontrada";
export const REUNION_OBLIGATORIA = "La fecha de la reunión es obligatoria";
export const DESCRIPCION_OBLIGATORIA = "La descripción es obligatoria";
export const CAMPOS_ADICIONALES = "Se enviaron campos adicionales no permitidos";
// Mensajes relacionados al acta (archivo PDF/Word)
export const ACTA_NO_ENCONTRADA = "El acta no fue encontrada";
export const ACTA_NO_PROPORCIONADA = "No se proporcionó ningún archivo";
export const FORMATO_NO_PERMITIDO = "Formato de archivo no permitido. Solo se aceptan PDF y Word (.pdf, .doc, .docx)";
// Límites y configuración de subida
export const TAMANO_MAXIMO_ACTA_MB = 10;
export const TAMANO_MAXIMO_ACTA_BYTES = TAMANO_MAXIMO_ACTA_MB * 1024 * 1024;
export const ACTA_MIME_TYPES = [
    "application/pdf",
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // .docx
];
export const ACTA_UPLOAD_DIR = "uploads/actas";
