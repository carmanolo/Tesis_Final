// Extensiones y mimetypes aceptados para el acta (deben calzar con el backend)
export const ACTA_EXTENSIONES_PERMITIDAS = [".pdf", ".doc", ".docx"];
export const ACTA_MIME_TYPES_PERMITIDOS = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const ACTA_TAMANO_MAXIMO_MB = 10;
export const ACTA_TAMANO_MAXIMO_BYTES = ACTA_TAMANO_MAXIMO_MB * 1024 * 1024;

// Roles que pueden gestionar/ajustar reuniones y actas.
// NOTA: "administrador" y "jefe de carrera" no deben ver los ajustes de reunión según las reglas del negocio.
export const ACCESO_GESTION_ACTAS = ["presidente cee", "secretario cee", "vicepresidente cee", "tesorero cee", "vocal cee"];
