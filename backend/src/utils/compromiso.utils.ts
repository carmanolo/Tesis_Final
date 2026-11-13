import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { formatearFecha, formatearMonto } from "./aporte.utils.js";

// Tipos

export interface Compromiso {
  id_compromiso?: string | number;
  descripcion_compromiso?: string;
}


export interface AporteAsignado {
    id_aporte: number;
    descripcion_aporte: string;
    fecha_aporte: Date | string;
    procedencia: string;
    fecha_recepcion?: Date | string | null;
    monto_aporte: number;      // monto original del aporte
    monto_asignado: number;    // parte del aporte que financia este compromiso
}

export interface CompromisoReporte {
    id_compromiso: number;
    descripcion_compromiso: string;
    fecha_compromiso: Date | string;
    monto_total: number;
    carrera: { nombre_carrera: string; sigla: string };
    aportes: AporteAsignado[];
}

export interface ResumenCompromiso {
    montoTotal: number;
    totalFinanciado: number;
    saldoPorFinanciar: number;
    porcentajeFinanciado: number;
}

// Cálculo de financiamiento
export function calcularResumenCompromiso(montoTotal: number, montosAsignados: number[]): ResumenCompromiso {
    const total = Number(montoTotal) || 0;
    const totalFinanciado = montosAsignados.reduce((suma, m) => suma + (Number(m) || 0), 0);
    const saldoPorFinanciar = Math.max(total - totalFinanciado, 0);
    const porcentajeFinanciado =
        total > 0 ? Math.min(Math.round((totalFinanciado / total) * 100), 100) : 0;

    return { montoTotal: total, totalFinanciado, saldoPorFinanciar, porcentajeFinanciado };
}

function resumenDe(c: CompromisoReporte): ResumenCompromiso {
    return calcularResumenCompromiso(c.monto_total, c.aportes.map((a) => a.monto_asignado));
}

function nombreCarrera(c: CompromisoReporte): string {
    return `${c.carrera.nombre_carrera} (${c.carrera.sigla})`;
}

function datosCompromiso(c: CompromisoReporte): [string, string][] {
    return [
        ["Carrera", nombreCarrera(c)],
        ["N° de compromiso", String(c.id_compromiso)],
        ["Fecha del compromiso", formatearFecha(c.fecha_compromiso)],
        ["Descripción", c.descripcion_compromiso ?? ""],
    ];
}

// EXCEL

const COLOR_PRIMARIO = "FF1F3864";
const COLOR_TOTAL = "FFE8EEF9";
const FORMATO_PESOS = '"$"#,##0';

const bordeFino: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FFBFBFBF" } },
    left: { style: "thin", color: { argb: "FFBFBFBF" } },
    bottom: { style: "thin", color: { argb: "FFBFBFBF" } },
    right: { style: "thin", color: { argb: "FFBFBFBF" } },
};

export async function generarExcelSolicitud(compromiso: CompromisoReporte): Promise<Buffer> {
    const resumen = resumenDe(compromiso);
    const n = compromiso.aportes.length;

    const wb = new ExcelJS.Workbook();
    wb.creator = "Sistema de gestión CEE";
    wb.created = new Date();

    const ws = wb.addWorksheet("Solicitud de fondos", {
        pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });

    ws.columns = [
        { key: "a", width: 8 },
        { key: "b", width: 16 },
        { key: "c", width: 50 },
        { key: "d", width: 28 },
        { key: "e", width: 18 },
        { key: "f", width: 20 },
    ];

    /* ---------- Título ---------- */
    ws.mergeCells("A1:F1");
    const titulo = ws.getCell("A1");
    titulo.value = "Solicitud de fondos";
    titulo.font = { bold: true, size: 16, color: { argb: COLOR_PRIMARIO } };
    titulo.alignment = { horizontal: "center" };

    ws.mergeCells("A2:F2");
    const subtitulo = ws.getCell("A2");
    subtitulo.value = `Generado el ${formatearFecha(new Date())}`;
    subtitulo.font = { italic: true, size: 10, color: { argb: "FF595959" } };
    subtitulo.alignment = { horizontal: "center" };

    /* ---------- Datos del compromiso (filas 4 a 7) ---------- */
    datosCompromiso(compromiso).forEach(([etiqueta, valor], i) => {
        const fila = 4 + i;
        ws.mergeCells(`A${fila}:B${fila}`);
        ws.mergeCells(`C${fila}:F${fila}`);

        const celdaEtiqueta = ws.getCell(`A${fila}`);
        celdaEtiqueta.value = etiqueta;
        celdaEtiqueta.font = { bold: true };
        celdaEtiqueta.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_TOTAL } };
        celdaEtiqueta.border = bordeFino;
        celdaEtiqueta.alignment = { vertical: "top" };

        const celdaValor = ws.getCell(`C${fila}`);
        celdaValor.value = valor;
        celdaValor.border = bordeFino;
        celdaValor.alignment = { vertical: "top", wrapText: true, horizontal: "left" };

        if (etiqueta === "Descripción") {
            ws.getRow(fila).height = Math.max(18, Math.ceil(valor.length / 95) * 15);
        }
    });

    /* ---------- Solicitud pendiente (filas 9 a 11) ---------- */
    const FILA_MONTO = 9;
    const FILA_FINANCIADO = 10;
    const FILA_SALDO = 11;

    const filasResumen: [number, string, ExcelJS.CellValue, boolean][] = [
        [FILA_MONTO, "Monto total del compromiso", resumen.montoTotal, false],
        [FILA_FINANCIADO, `Aportes asignados (${n})`, resumen.totalFinanciado, false],
        [
            FILA_SALDO,
            "SALDO POR FINANCIAR (MONTO A SOLICITAR)",
            { formula: `MAX(F${FILA_MONTO}-F${FILA_FINANCIADO},0)`, result: resumen.saldoPorFinanciar },
            true,
        ],
    ];

    filasResumen.forEach(([fila, etiqueta, valor, destacado]) => {
        ws.mergeCells(`A${fila}:E${fila}`);
        ws.getRow(fila).height = destacado ? 26 : 18;

        const celdaEtiqueta = ws.getCell(`A${fila}`);
        celdaEtiqueta.value = etiqueta;
        celdaEtiqueta.alignment = { horizontal: "right", vertical: "middle" };

        const celdaValor = ws.getCell(`F${fila}`);
        celdaValor.value = valor;
        celdaValor.numFmt = FORMATO_PESOS;
        celdaValor.alignment = { vertical: "middle" };

        [celdaEtiqueta, celdaValor].forEach((celda) => {
            celda.border = bordeFino;
            celda.font = destacado
                ? { bold: true, size: 12, color: { argb: "FFFFFFFF" } }
                : { bold: true };
            if (destacado) {
                celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_PRIMARIO } };
            }
        });
    });

    return Buffer.from(await wb.xlsx.writeBuffer());
}

// PDF

export function generarPdfSolicitud(compromiso: CompromisoReporte): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        try {
            const resumen = resumenDe(compromiso);
            const n = compromiso.aportes.length;
            const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });

            const chunks: Buffer[] = [];
            doc.on("data", (c: Buffer) => chunks.push(c));
            doc.on("end", () => resolve(Buffer.concat(chunks)));
            doc.on("error", reject);

            const left = doc.page.margins.left;
            const ancho = doc.page.width - left - doc.page.margins.right;
            const pad = 8;

            /* ----- Encabezado ----- */
            doc.font("Helvetica-Bold").fontSize(16).fillColor("#1F3864")
                .text("Solicitud de fondos", { align: "center" });
            doc.moveDown(0.3).font("Helvetica").fontSize(9).fillColor("#555555")
                .text(`Generado el ${formatearFecha(new Date())}`, { align: "center" });

            /* ----- Datos del compromiso ----- */
            let y = doc.y + 18;
            doc.font("Helvetica-Bold").fontSize(11).fillColor("#222222")
                .text("Datos del compromiso", left, y, { lineBreak: false });
            y += 18;

            const anchoEtiqueta = 130;
            const anchoValor = ancho - anchoEtiqueta;

            datosCompromiso(compromiso).forEach(([etiqueta, valor]) => {
                doc.font("Helvetica-Bold").fontSize(9).fillColor("#555555")
                    .text(etiqueta, left, y, { width: anchoEtiqueta, lineBreak: false });
                doc.font("Helvetica").fontSize(9).fillColor("#222222");
                const alto = doc.heightOfString(valor, { width: anchoValor });
                doc.text(valor, left + anchoEtiqueta, y, { width: anchoValor });
                y += Math.max(alto, 12) + 6;
            });

            /* ----- Solicitud pendiente ----- */
            y += 14;
            doc.font("Helvetica-Bold").fontSize(11).fillColor("#222222")
                .text("Solicitud de fondos", left, y, { lineBreak: false });
            y += 18;

            const filaResumen = (
                yy: number,
                etiqueta: string,
                valor: string,
                fondo: string,
                color: string,
                alto: number,
                tamano: number,
            ): number => {
                doc.rect(left, yy, ancho, alto).fill(fondo);
                const yTexto = yy + (alto - tamano) / 2 - 1;
                doc.fillColor(color).font("Helvetica-Bold").fontSize(tamano)
                    .text(etiqueta, left + pad, yTexto, { width: ancho * 0.65, lineBreak: false })
                    .text(valor, left + ancho * 0.65, yTexto, {
                        width: ancho * 0.35 - pad,
                        align: "right",
                        lineBreak: false,
                    });
                return yy + alto;
            };

            y = filaResumen(y, "Monto total del compromiso", formatearMonto(resumen.montoTotal), "#F2F5FA", "#222222", 28, 10);
            y = filaResumen(
                y,
                `Aportes asignados (${n})`,
                `- ${formatearMonto(resumen.totalFinanciado)}`,
                "#E8EEF9",
                "#222222",
                28,
                10,
            );
            filaResumen(
                y,
                "SALDO POR FINANCIAR (MONTO A SOLICITAR)",
                formatearMonto(resumen.saldoPorFinanciar),
                "#1F3864",
                "#FFFFFF",
                38,
                12,
            );

            /* ----- Pie de página ----- */
            const rango = doc.bufferedPageRange();
            for (let i = 0; i < rango.count; i++) {
                doc.switchToPage(rango.start + i);
                doc.page.margins.bottom = 0; // evita que el pie genere una página nueva
                doc.font("Helvetica").fontSize(8).fillColor("#888888")
                    .text(`Página ${i + 1} de ${rango.count}`, left, doc.page.height - 30, {
                        width: ancho,
                        align: "center",
                        lineBreak: false,
                    });
            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

export const processCompromisos = (compromisos: Compromiso[] | unknown): string[] => {
    const DEFAULT_COMPROMISOS: string[] = [];

    if(!Array.isArray(compromisos)){
        console.error("Los compromisos deben ser un arreglo!");
        return DEFAULT_COMPROMISOS;
    }

    const processedCompromisos = compromisos.map((compromiso: Compromiso) => {
        const id_compromiso = compromiso?.id_compromiso ?? "0";
        const descripcion_compromiso = compromiso?.descripcion_compromiso || "Donar a la teletón";

        return `${id_compromiso}. ${descripcion_compromiso}`;
    });

    return processedCompromisos;
}