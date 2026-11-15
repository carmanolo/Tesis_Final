import path from "path";
import { fileURLToPath } from "url";
import sanitizeHtml from "sanitize-html";

// Raíz del proyecto (backend/) – funciona tanto en src/ (dev) como en dist/ (prod)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "../../");

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
export const FORMATO_NO_PERMITIDO =
    "Formato de archivo no permitido. Solo se aceptan PDF y Word (.pdf, .doc, .docx)";

// Límites y configuración de subida
export const TAMANO_MAXIMO_ACTA_MB = 10;
export const TAMANO_MAXIMO_ACTA_BYTES = TAMANO_MAXIMO_ACTA_MB * 1024 * 1024;

export const ACTA_MIME_TYPES = [
    "application/pdf",
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // .docx
];

// Ruta ABSOLUTA al directorio de actas (evita problemas con cwd al reiniciar el servicio)
export const ACTA_UPLOAD_DIR = path.join(PROJECT_ROOT, "uploads", "actas");


export const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
    allowedTags: [
        "p", "br", "hr", "h1", "h2", "h3",
        "strong", "em", "u", "s", "code", "pre", "blockquote",
        "ul", "ol", "li",
        "table", "thead", "tbody", "tr", "th", "td",
        "a",
    ],
    allowedAttributes: {
        a: ["href", "target", "rel"],
        th: ["colspan", "rowspan"],
        td: ["colspan", "rowspan"],
        p: ["style"],
        h1: ["style"],
        h2: ["style"],
        h3: ["style"],
    },
    allowedStyles: {
        "*": { "text-align": [/^(left|right|center|justify)$/] },
    },
    allowedSchemes: ["http", "https", "mailto"],
};

export const ESTILOS_PDF = `
    body { font-family: "Times New Roman", Georgia, serif; font-size: 12pt; line-height: 1.5; color: #111; }
    h1 { font-size: 20pt; margin: 0 0 8pt; }
    h2 { font-size: 15pt; margin: 14pt 0 6pt; }
    h3 { font-size: 13pt; margin: 12pt 0 4pt; }
    p { margin: 0 0 8pt; }
    ul, ol { margin: 0 0 8pt 18pt; padding: 0; }
    blockquote { border-left: 3px solid #bbb; margin: 8pt 0; padding-left: 10pt; color: #444; }
    table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
    th, td { border: 1px solid #777; padding: 4pt 6pt; vertical-align: top; }
    th { background: #eee; }
    hr { border: 0; border-top: 1px solid #999; margin: 10pt 0; }
`;