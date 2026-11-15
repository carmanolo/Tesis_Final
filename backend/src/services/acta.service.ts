import fs from "fs";
import path from "path";
import sanitizeHtml from "sanitize-html";
import puppeteer from "puppeteer";
import HTMLtoDOCX from "@turbodocx/html-to-docx";
import { AppDataSource } from "../config/configDb.js";
import { ReunionEntity } from "../entity/reunion.entity.js";
import { ACTA_UPLOAD_DIR } from "../constants/reunion.constants.js";
import { resolverRutaActa } from "./reunion.service.js"; // exporta esta función en reunion.service.ts

const repo = () => AppDataSource.getRepository(ReunionEntity as any);

// ---------------------------------------------------------------------------
// Sanitización: solo se permite el HTML que produce el editor
// ---------------------------------------------------------------------------
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
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

export function sanitizarContenido(html: string): string {
    return sanitizeHtml(html || "", SANITIZE_OPTIONS);
}

// ---------------------------------------------------------------------------
// Helpers de plantilla
// ---------------------------------------------------------------------------
function escapeHtml(s: any): string {
    return String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function fechaDDMMAAAA(f: any): string {
    const m = String(f).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : String(f ?? "");
}

function encabezadoHtml(reunion: any): string {
    const carrera = reunion.carrera?.nombre_carrera;
    return `
        <h1 style="text-align:center">ACTA DE REUNIÓN</h1>
        ${carrera ? `<p style="text-align:center">${escapeHtml(carrera)}</p>` : ""}
        <p><strong>Fecha:</strong> ${escapeHtml(fechaDDMMAAAA(reunion.fecha_reunion))}</p>
        <p><strong>Asunto:</strong> ${escapeHtml(reunion.descripcion)}</p>
        <hr />
    `;
}

const ESTILOS_PDF = `
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

function documentoHtml(reunion: any, contenido: string): string {
    return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8" /><style>${ESTILOS_PDF}</style></head>
        <body>${encabezadoHtml(reunion)}${contenido}</body></html>`;
}

// ---------------------------------------------------------------------------
// Generadores
// ---------------------------------------------------------------------------
export async function generarActaPdf(reunion: any, contenido: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    try {
        const page = await browser.newPage();
        await page.setJavaScriptEnabled(false);
        await page.setContent(documentoHtml(reunion, contenido), { waitUntil: "load" });
        const pdf = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "25mm", bottom: "25mm", left: "22mm", right: "22mm" },
            displayHeaderFooter: true,
            headerTemplate: "<span></span>",
            footerTemplate:
                '<div style="font-size:9px;width:100%;text-align:center;color:#666"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
        });
        return Buffer.from(pdf);
    } finally {
        await browser.close();
    }
}

export async function generarActaDocx(reunion: any, contenido: string): Promise<Buffer> {
    // html-to-docx respeta mejor estilos en línea que <style>, por eso aquí va sin hoja de estilos
    const html = `<!DOCTYPE html><html><body>${encabezadoHtml(reunion)}${contenido}</body></html>`;
    const out: any = await HTMLtoDOCX(html, null, {
        table: { row: { cantSplit: true } },
        footer: true,
        pageNumber: true,
        font: "Times New Roman",
        fontSize: 24, // half-points => 12pt
    });
    // Según el entorno la librería devuelve Buffer, ArrayBuffer o Blob
    if (Buffer.isBuffer(out)) return out;
    if (out instanceof ArrayBuffer) return Buffer.from(out);
    return Buffer.from(await out.arrayBuffer());
}

// ---------------------------------------------------------------------------
// Persistencia
// ---------------------------------------------------------------------------

// contenido_acta es select:false, por eso se pide explícitamente
export async function obtenerContenidoActaSer(id_reunion: number): Promise<any | null> {
    return repo()
        .createQueryBuilder("r")
        .leftJoinAndSelect("r.carrera", "carrera")
        .addSelect("r.contenido_acta")
        .where("r.id_reunion = :id", { id: id_reunion })
        .getOne();
}

export async function guardarContenidoActaSer(id_reunion: number, html: string) {
    try {
        const reunion: any = await repo().findOne({ where: { id_reunion } });
        if (!reunion) return { data: null, message: "Reunión no encontrada" };

        reunion.contenido_acta = sanitizarContenido(html);
        reunion.acta_estado = "borrador";
        await repo().save(reunion);

        return { data: { acta_estado: reunion.acta_estado }, message: "Borrador guardado" };
    } catch (error) {
        console.error("Error al guardar el contenido del acta", error);
        return { data: null, message: "Error interno del servidor" };
    }
}

// Genera el PDF oficial y lo deja registrado como el acta de la reunión
export async function finalizarActaSer(id_reunion: number) {
    try {
        const reunion: any = await obtenerContenidoActaSer(id_reunion);
        if (!reunion) return { data: null, message: "Reunión no encontrada" };
        if (!reunion.contenido_acta || !reunion.contenido_acta.trim()) {
            return { data: null, message: "El acta está vacía" };
        }

        const pdf = await generarActaPdf(reunion, reunion.contenido_acta);

        fs.mkdirSync(ACTA_UPLOAD_DIR, { recursive: true });
        const nombreArchivo = `acta_${id_reunion}_${Date.now()}.pdf`;
        const ruta = path.join(ACTA_UPLOAD_DIR, nombreArchivo);
        fs.writeFileSync(ruta, pdf);

        // Reemplaza el acta anterior (subida a mano o generada antes)
        if (reunion.ruta_archivo) {
            const anterior = resolverRutaActa(reunion.ruta_archivo);
            if (anterior && anterior !== ruta) fs.unlinkSync(anterior);
        }

        reunion.nombre_archivo = nombreArchivo;
        reunion.nombre_original = `Acta_reunion_${fechaDDMMAAAA(reunion.fecha_reunion)}.pdf`;
        reunion.tipo_archivo = "application/pdf";
        reunion.ruta_archivo = ruta;
        reunion.fecha_subida = new Date();
        reunion.acta_estado = "finalizada";

        const saved = await repo().save(reunion);
        return { data: saved, message: "Acta finalizada y publicada" };
    } catch (error) {
        console.error("Error al finalizar el acta", error);
        return { data: null, message: "Error interno al generar el acta" };
    }
}