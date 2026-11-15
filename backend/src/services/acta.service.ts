import fs from "fs";
import path from "path";
import sanitizeHtml from "sanitize-html";
import puppeteer from "puppeteer";
import HTMLtoDOCX from "@turbodocx/html-to-docx";
import { AppDataSource } from "../config/configDb.js";
import { ReunionEntity } from "../entity/reunion.entity.js";
import { ACTA_UPLOAD_DIR, SANITIZE_OPTIONS, ESTILOS_PDF } from "../constants/reunion.constants.js";
import { resolverRutaActa } from "./reunion.service.js";

const repo = () => AppDataSource.getRepository(ReunionEntity as any);


export function sanitizarContenido(html: string): string {
    return sanitizeHtml(html || "", SANITIZE_OPTIONS);
}

// Helpers de plantilla
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


function documentoHtml(reunion: any, contenido: string): string {
    return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8" /><style>${ESTILOS_PDF}</style></head>
        <body>${encabezadoHtml(reunion)}${contenido}</body></html>`;
}

// Generadores
export async function generarActaPdf(reunion: any, contenido: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--no-first-run",
            "--no-zygote",
            "--single-process",
            "--disable-extensions",
        ],
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
    // html-to-docx respeta mejor estilos en línea que <style>
    const html = `<!DOCTYPE html><html><body>${encabezadoHtml(reunion)}${contenido}</body></html>`;
    const out: any = await HTMLtoDOCX(html, null, {
        table: { row: { cantSplit: true } },
        footer: true,
        pageNumber: true,
        font: "Times New Roman",
        fontSize: 24, 
    });
    // Según el entorno la librería devuelve Buffer, ArrayBuffer o Blob
    if (Buffer.isBuffer(out)) return out;
    if (out instanceof ArrayBuffer) return Buffer.from(out);
    return Buffer.from(await out.arrayBuffer());
}

// Persistencia

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

        // Marcar inmediatamente como finalizada en la BD para respuesta instantánea
        reunion.acta_estado = "finalizada";
        reunion.fecha_subida = new Date();
        const saved = await repo().save(reunion);

        // Generar y archivar el PDF en segundo plano (asíncrono) sin demorar al usuario
        generarYGuardarPdfAsync(reunion, reunion.contenido_acta).catch((err) => {
            console.error("Error al generar PDF en segundo plano:", err);
        });

        return { data: saved, message: "Acta finalizada y publicada" };
    } catch (error) {
        console.error("Error al finalizar el acta", error);
        return { data: null, message: "Error interno al generar el acta" };
    }
}

async function generarYGuardarPdfAsync(reunion: any, contenido: string) {
    try {
        const id_reunion = reunion.id_reunion;
        const pdf = await generarActaPdf(reunion, contenido);

        fs.mkdirSync(ACTA_UPLOAD_DIR, { recursive: true });
        const nombreArchivo = `acta_${id_reunion}_${Date.now()}.pdf`;
        const ruta = path.join(ACTA_UPLOAD_DIR, nombreArchivo);
        fs.writeFileSync(ruta, pdf);

        // Reemplaza el acta anterior si existía
        if (reunion.ruta_archivo) {
            const anterior = resolverRutaActa(reunion.ruta_archivo);
            if (anterior && anterior !== ruta && fs.existsSync(anterior)) {
                try {
                    fs.unlinkSync(anterior);
                } catch {
                }
            }
        }

        await repo().update(
            { id_reunion },
            {
                nombre_archivo: nombreArchivo,
                nombre_original: `Acta_reunion_${fechaDDMMAAAA(reunion.fecha_reunion)}.pdf`,
                tipo_archivo: "application/pdf",
                ruta_archivo: ruta,
            }
        );
    } catch (err) {
        console.error("Error en generarYGuardarPdfAsync:", err);
    }
}