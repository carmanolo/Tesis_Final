import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";


// Tipos

export type TipoMovimiento = "ingreso" | "egreso";

export interface AporteReporte {
    id_aporte: number;
    descripcion_aporte: string;
    fecha_aporte: Date | string;
    procedencia: string;
    monto: number;
    tipo?: TipoMovimiento | string | null;
    comprobante?: string | null;
    fecha_recepcion?: Date | string | null;
}

export interface ResumenProcedencia {
    procedencia: string;
    cantidad: number;
    ingresos: number;
    egresos: number;
    neto: number;
}

export interface ResumenMes {
    mes: string; // formato YYYY-MM (ordenable, ideal para el eje X de un gráfico)
    cantidad: number;
    ingresos: number;
    egresos: number;
    balance: number; // ingresos - egresos del mes
    acumulado: number; // balance acumulado hasta ese mes (inclusive)
}

export interface ResumenAportes {
    cantidad: number;
    cantidadIngresos: number;
    cantidadEgresos: number;
    totalIngresos: number;
    totalEgresos: number;
    balance: number; // totalIngresos - totalEgresos
    porMes: ResumenMes[];
    porProcedencia: ResumenProcedencia[];
}

export interface OpcionesReporte {
    // Texto que describe el período/filtros aplicados (aparece bajo el título).
    periodo?: string;
}


// Helpers de formato

const ZONA_HORARIA = "America/Santiago";

const formatoMoneda = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
});

export function formatearMonto(valor: number): string {
    return formatoMoneda.format(valor);
}

// Devuelve dd-mm-aaaa. Las fechas tipo "date" (string YYYY-MM-DD) no se convierten por zona horaria.
export function formatearFecha(valor?: Date | string | null): string {
    if (!valor) return "-";

    if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}/.test(valor)) {
        const [y, m, d] = valor.slice(0, 10).split("-");
        return `${d}-${m}-${y}`;
    }

    const fecha = valor instanceof Date ? valor : new Date(valor);
    if (isNaN(fecha.getTime())) return "-";

    return new Intl.DateTimeFormat("es-CL", {
        timeZone: ZONA_HORARIA,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    })
        .format(fecha)
        .replace(/\//g, "-");
}

// Los registros sin tipo (anteriores al cambio) se consideran ingresos.
const esEgreso = (a: AporteReporte): boolean => a.tipo === "egreso";
const etiquetaTipo = (a: AporteReporte): string => (esEgreso(a) ? "Egreso" : "Ingreso");

// Devuelve el mes (YYYY-MM) de una fecha. Las fechas tipo "date" no se convierten por zona horaria.
function mesDe(valor?: Date | string | null): string {
    if (!valor) return "Sin fecha";

    if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}/.test(valor)) {
        return valor.slice(0, 7);
    }

    const fecha = valor instanceof Date ? valor : new Date(valor);
    if (isNaN(fecha.getTime())) return "Sin fecha";

    return new Intl.DateTimeFormat("en-CA", {
        timeZone: ZONA_HORARIA,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    })
        .format(fecha)
        .slice(0, 7);
}

const NOMBRES_MES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// "2026-11" -> "Noviembre 2026"
export function etiquetaMes(mes: string): string {
    const m = /^(\d{4})-(\d{2})$/.exec(mes);
    if (!m) return mes;
    return `${NOMBRES_MES[Number(m[2]) - 1] ?? m[2]} ${m[1]}`;
}


/* Cálculo de resumen / balance */

/**
 * Balance = suma de ingresos - suma de egresos.
 * Los montos siempre se guardan positivos; el campo `tipo` define si suman o restan.
 */
export function calcularResumen(aportes: AporteReporte[]): ResumenAportes {
    let totalIngresos = 0;
    let totalEgresos = 0;
    let cantidadIngresos = 0;
    let cantidadEgresos = 0;
    const mapa = new Map<string, ResumenProcedencia>();
    const mapaMes = new Map<string, ResumenMes>();

    for (const a of aportes) {
        const monto = Number(a.monto) || 0;
        const clave = a.procedencia?.trim() || "Sin procedencia";
        const actual = mapa.get(clave) ?? { procedencia: clave, cantidad: 0, ingresos: 0, egresos: 0, neto: 0 };

        const mes = mesDe(a.fecha_aporte);
        const delMes = mapaMes.get(mes) ?? { mes, cantidad: 0, ingresos: 0, egresos: 0, balance: 0, acumulado: 0 };
        if (esEgreso(a)) {
            delMes.egresos += monto;
            delMes.balance -= monto;
        } else {
            delMes.ingresos += monto;
            delMes.balance += monto;
        }
        delMes.cantidad += 1;
        mapaMes.set(mes, delMes);

        if (esEgreso(a)) {
            totalEgresos += monto;
            cantidadEgresos += 1;
            actual.egresos += monto;
            actual.neto -= monto;
        } else {
            totalIngresos += monto;
            cantidadIngresos += 1;
            actual.ingresos += monto;
            actual.neto += monto;
        }
        actual.cantidad += 1;
        mapa.set(clave, actual);
    }

    // Meses en orden cronológico con el balance acumulado
    let acumulado = 0;
    const porMes = [...mapaMes.values()]
        .sort((a, b) => a.mes.localeCompare(b.mes))
        .map((m) => {
            acumulado += m.balance;
            return { ...m, acumulado };
        });

    return {
        cantidad: aportes.length,
        cantidadIngresos,
        cantidadEgresos,
        totalIngresos,
        totalEgresos,
        balance: totalIngresos - totalEgresos,
        porMes,
        porProcedencia: [...mapa.values()].sort((a, b) => b.ingresos + b.egresos - (a.ingresos + a.egresos)),
    };
}

// EXCEL

const COLOR_PRIMARIO = "FF1F3864";
const COLOR_TOTAL = "FFE8EEF9";
const COLOR_EGRESO = "FFC00000";
const FORMATO_PESOS = '"$"#,##0';

const bordeFino: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FFBFBFBF" } },
    left: { style: "thin", color: { argb: "FFBFBFBF" } },
    bottom: { style: "thin", color: { argb: "FFBFBFBF" } },
    right: { style: "thin", color: { argb: "FFBFBFBF" } },
};

export async function generarExcelAportes(
    aportes: AporteReporte[],
    opciones: OpcionesReporte = {},
): Promise<Buffer> {
    const resumen = calcularResumen(aportes);

    const wb = new ExcelJS.Workbook();
    wb.creator = "Sistema de gestión CEE";
    wb.created = new Date();

    /* ---------- Hoja 1: detalle ---------- */
    const ws = wb.addWorksheet("Detalle de movimientos", {
        views: [{ state: "frozen", ySplit: 4 }],
    });

    ws.columns = [
        { key: "id", width: 8 },
        { key: "fecha", width: 16 },
        { key: "tipo", width: 12 },
        { key: "descripcion", width: 46 },
        { key: "procedencia", width: 28 },
        { key: "recepcion", width: 20 },
        { key: "monto", width: 18 },
    ];

    ws.mergeCells("A1:G1");
    const titulo = ws.getCell("A1");
    titulo.value = "Reporte de ingresos y egresos";
    titulo.font = { bold: true, size: 16, color: { argb: COLOR_PRIMARIO } };
    titulo.alignment = { horizontal: "center" };

    ws.mergeCells("A2:G2");
    const subtitulo = ws.getCell("A2");
    subtitulo.value = `Generado el ${formatearFecha(new Date())}${opciones.periodo ? "  |  " + opciones.periodo : ""}`;
    subtitulo.font = { italic: true, size: 10, color: { argb: "FF595959" } };
    subtitulo.alignment = { horizontal: "center" };

    const cabecera = ws.getRow(4);
    cabecera.values = ["N°", "Fecha", "Tipo", "Descripción", "Procedencia", "Fecha de recepción", "Monto (CLP)"];
    cabecera.height = 22;
    cabecera.eachCell((celda) => {
        celda.font = { bold: true, color: { argb: "FFFFFFFF" } };
        celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_PRIMARIO } };
        celda.alignment = { vertical: "middle", horizontal: "center" };
        celda.border = bordeFino;
    });

    aportes.forEach((a) => {
        const egreso = esEgreso(a);
        const fila = ws.addRow({
            id: a.id_aporte,
            fecha: formatearFecha(a.fecha_aporte),
            tipo: etiquetaTipo(a),
            descripcion: a.descripcion_aporte,
            procedencia: a.procedencia,
            recepcion: egreso ? "-" : a.fecha_recepcion ? formatearFecha(a.fecha_recepcion) : "Pendiente",
            monto: Number(a.monto) || 0,
        });
        fila.eachCell((celda) => {
            celda.border = bordeFino;
            celda.alignment = { vertical: "top", wrapText: true };
        });
        fila.getCell("monto").numFmt = FORMATO_PESOS;
        fila.getCell("id").alignment = { horizontal: "center", vertical: "top" };
        fila.getCell("fecha").alignment = { horizontal: "center", vertical: "top" };
        fila.getCell("tipo").alignment = { horizontal: "center", vertical: "top" };
        fila.getCell("recepcion").alignment = { horizontal: "center", vertical: "top" };
        if (egreso) {
            fila.getCell("tipo").font = { color: { argb: COLOR_EGRESO } };
            fila.getCell("monto").font = { color: { argb: COLOR_EGRESO } };
        }
    });

    const primeraFila = 5;
    const ultimaFila = 4 + aportes.length;
    const hayDatos = aportes.length > 0;

    const agregarFilaTotal = (
        etiqueta: string,
        formula: string,
        resultado: number,
    ): ExcelJS.Row => {
        const fila = ws.addRow({ recepcion: etiqueta });
        const celda = fila.getCell("monto");
        celda.value = hayDatos ? { formula, result: resultado } : 0;
        celda.numFmt = FORMATO_PESOS;
        fila.eachCell({ includeEmpty: true }, (c) => {
            c.font = { bold: true };
            c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_TOTAL } };
            c.border = bordeFino;
        });
        fila.getCell("recepcion").alignment = { horizontal: "right" };
        return fila;
    };

    const filaIng = agregarFilaTotal(
        "TOTAL INGRESOS",
        `SUMIF(C${primeraFila}:C${ultimaFila},"Ingreso",G${primeraFila}:G${ultimaFila})`,
        resumen.totalIngresos,
    );
    const filaEgr = agregarFilaTotal(
        "TOTAL EGRESOS",
        `SUMIF(C${primeraFila}:C${ultimaFila},"Egreso",G${primeraFila}:G${ultimaFila})`,
        resumen.totalEgresos,
    );
    agregarFilaTotal(
        "BALANCE",
        `G${filaIng.number}-G${filaEgr.number}`,
        resumen.balance,
    );

    /* ---------- Hoja 2: resumen ---------- */
    const wr = wb.addWorksheet("Resumen y balance");
    wr.columns = [
        { key: "concepto", width: 36 },
        { key: "valor", width: 20 },
        { key: "extra1", width: 20 },
        { key: "extra2", width: 20 },
        { key: "extra3", width: 16 },
    ];

    wr.mergeCells("A1:E1");
    wr.getCell("A1").value = "Resumen de ingresos, egresos y balance";
    wr.getCell("A1").font = { bold: true, size: 14, color: { argb: COLOR_PRIMARIO } };
    wr.getCell("A1").alignment = { horizontal: "center" };

    const filasResumen: [string, number, boolean][] = [
        ["Cantidad de movimientos", resumen.cantidad, false],
        ["Total ingresos", resumen.totalIngresos, true],
        ["Total egresos", resumen.totalEgresos, true],
        ["BALANCE", resumen.balance, true],
    ];

    filasResumen.forEach(([concepto, valor, esMonto], i) => {
        const fila = wr.getRow(3 + i);
        fila.getCell(1).value = concepto;
        fila.getCell(2).value = valor;
        if (esMonto) fila.getCell(2).numFmt = FORMATO_PESOS;
        fila.getCell(1).border = bordeFino;
        fila.getCell(2).border = bordeFino;
        if (concepto === "BALANCE") {
            [1, 2].forEach((c) => {
                fila.getCell(c).font = { bold: true };
                fila.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_TOTAL } };
            });
        }
    });

    const filaProc = 9;
    const cabProc = wr.getRow(filaProc);
    cabProc.values = ["Procedencia", "Ingresos", "Egresos", "Neto", "N° movimientos"];
    cabProc.eachCell((celda) => {
        celda.font = { bold: true, color: { argb: "FFFFFFFF" } };
        celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_PRIMARIO } };
        celda.border = bordeFino;
        celda.alignment = { horizontal: "center" };
    });

    resumen.porProcedencia.forEach((p, i) => {
        const fila = wr.getRow(filaProc + 1 + i);
        fila.values = [p.procedencia, p.ingresos, p.egresos, p.neto, p.cantidad];
        [2, 3, 4].forEach((c) => (fila.getCell(c).numFmt = FORMATO_PESOS));
        fila.eachCell((celda) => (celda.border = bordeFino));
    });

    /* ---------- Hoja 3: balance mensual ---------- */
    const wm = wb.addWorksheet("Balance mensual");
    wm.columns = [
        { key: "mes", width: 22 },
        { key: "ingresos", width: 18 },
        { key: "egresos", width: 18 },
        { key: "balance", width: 18 },
        { key: "acumulado", width: 20 },
    ];

    wm.mergeCells("A1:E1");
    wm.getCell("A1").value = "Balance mensual (ingresos - egresos)";
    wm.getCell("A1").font = { bold: true, size: 14, color: { argb: COLOR_PRIMARIO } };
    wm.getCell("A1").alignment = { horizontal: "center" };

    const cabMes = wm.getRow(3);
    cabMes.values = ["Mes", "Ingresos", "Egresos", "Balance del mes", "Balance acumulado"];
    cabMes.eachCell((celda) => {
        celda.font = { bold: true, color: { argb: "FFFFFFFF" } };
        celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_PRIMARIO } };
        celda.border = bordeFino;
        celda.alignment = { horizontal: "center" };
    });

    resumen.porMes.forEach((m, i) => {
        const fila = wm.getRow(4 + i);
        fila.values = [etiquetaMes(m.mes), m.ingresos, m.egresos, m.balance, m.acumulado];
        [2, 3, 4, 5].forEach((c) => (fila.getCell(c).numFmt = FORMATO_PESOS));
        fila.eachCell((celda) => (celda.border = bordeFino));
        if (m.balance < 0) fila.getCell(4).font = { color: { argb: COLOR_EGRESO } };
        if (m.acumulado < 0) fila.getCell(5).font = { color: { argb: COLOR_EGRESO } };
    });

    return Buffer.from(await wb.xlsx.writeBuffer());
}

// PDF

interface ColumnaPdf {
    title: string;
    w: number;
    align: "left" | "right" | "center";
}

// El ancho total suma 515 (A4 con márgenes de 40)
const COLUMNAS_PDF: ColumnaPdf[] = [
    { title: "N°", w: 28, align: "left" },
    { title: "Fecha", w: 58, align: "left" },
    { title: "Tipo", w: 48, align: "left" },
    { title: "Descripción", w: 140, align: "left" },
    { title: "Procedencia", w: 85, align: "left" },
    { title: "Recepción", w: 58, align: "left" },
    { title: "Monto", w: 98, align: "right" },
];
const IDX_MONTO = COLUMNAS_PDF.length - 1;
const ANCHO_MONTO = COLUMNAS_PDF[IDX_MONTO].w;

export function generarPdfAportes(
    aportes: AporteReporte[],
    opciones: OpcionesReporte = {},
): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        try {
            const resumen = calcularResumen(aportes);
            const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });

            const chunks: Buffer[] = [];
            doc.on("data", (c: Buffer) => chunks.push(c));
            doc.on("end", () => resolve(Buffer.concat(chunks)));
            doc.on("error", reject);

            const left = doc.page.margins.left;
            const ancho = doc.page.width - left - doc.page.margins.right;
            const pad = 4;
            const limiteY = () => doc.page.height - doc.page.margins.bottom - 30;

            /* ----- Encabezado ----- */
            doc.font("Helvetica-Bold").fontSize(16).fillColor("#1F3864")
                .text("Reporte de ingresos y egresos", { align: "center" });
            doc.moveDown(0.3).font("Helvetica").fontSize(9).fillColor("#555555")
                .text(
                    `Generado el ${formatearFecha(new Date())}${opciones.periodo ? "  |  " + opciones.periodo : ""}`,
                    { align: "center" },
                );

            /* ----- Tarjetas de resumen ----- */
            const yCaja = doc.y + 14;
            const altoCaja = 54;
            doc.rect(left, yCaja, ancho, altoCaja).fill("#F2F5FA");

            const tarjetas: [string, string][] = [
                ["Cantidad de movimientos", String(resumen.cantidad)],
                ["Total ingresos", formatearMonto(resumen.totalIngresos)],
                ["Total egresos", formatearMonto(resumen.totalEgresos)],
                ["BALANCE", formatearMonto(resumen.balance)],
            ];
            const anchoTarjeta = ancho / tarjetas.length;
            tarjetas.forEach(([etiqueta, valor], i) => {
                const x = left + i * anchoTarjeta;
                doc.font("Helvetica").fontSize(8).fillColor("#555555")
                    .text(etiqueta, x + 8, yCaja + 10, { width: anchoTarjeta - 16, lineBreak: false });
                doc.font("Helvetica-Bold").fontSize(i === 3 ? 13 : 11)
                    .fillColor(i === 3 ? "#1F3864" : "#222222")
                    .text(valor, x + 8, yCaja + 26, { width: anchoTarjeta - 16, lineBreak: false });
            });

            doc.x = left;
            doc.y = yCaja + altoCaja + 18;

            /* ----- Tabla de detalle ----- */
            const dibujarCabecera = (y: number): number => {
                doc.rect(left, y, ancho, 20).fill("#1F3864");
                doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(9);
                let x = left;
                COLUMNAS_PDF.forEach((c) => {
                    doc.text(c.title, x + pad, y + 6, { width: c.w - pad * 2, align: c.align, lineBreak: false });
                    x += c.w;
                });
                return y + 20;
            };

            doc.font("Helvetica-Bold").fontSize(11).fillColor("#222222")
                .text("Detalle de movimientos", left, doc.y);
            let y = doc.y + 6;

            if (aportes.length === 0) {
                doc.font("Helvetica-Oblique").fontSize(10).fillColor("#555555")
                    .text("No existen movimientos registrados para los filtros seleccionados.", left, y);
                y = doc.y + 10;
            } else {
                y = dibujarCabecera(y);

                aportes.forEach((a, i) => {
                    const egreso = esEgreso(a);
                    const celdas = [
                        String(a.id_aporte),
                        formatearFecha(a.fecha_aporte),
                        etiquetaTipo(a),
                        a.descripcion_aporte ?? "",
                        a.procedencia ?? "",
                        egreso ? "-" : a.fecha_recepcion ? formatearFecha(a.fecha_recepcion) : "Pendiente",
                        formatearMonto(Number(a.monto) || 0),
                    ];

                    doc.font("Helvetica").fontSize(9);
                    const alto =
                        Math.max(...celdas.map((t, idx) => doc.heightOfString(t, { width: COLUMNAS_PDF[idx].w - pad * 2 }))) +
                        pad * 2;

                    if (y + alto > limiteY()) {
                        doc.addPage();
                        y = dibujarCabecera(doc.page.margins.top);
                    }

                    if (i % 2 === 0) doc.rect(left, y, ancho, alto).fill("#F7F9FC");

                    doc.font("Helvetica").fontSize(9);
                    let x = left;
                    celdas.forEach((texto, idx) => {
                        const col = COLUMNAS_PDF[idx];
                        // Los egresos se resaltan en rojo (tipo y monto)
                        const rojo = egreso && (idx === 2 || idx === IDX_MONTO);
                        doc.fillColor(rojo ? "#C00000" : "#222222")
                            .text(texto, x + pad, y + pad, { width: col.w - pad * 2, align: col.align });
                        x += col.w;
                    });
                    y += alto;
                });

                /* ----- Filas de totales ----- */
                const filasTotales: [string, number, boolean][] = [
                    ["TOTAL INGRESOS", resumen.totalIngresos, false],
                    ["TOTAL EGRESOS", resumen.totalEgresos, false],
                    ["BALANCE", resumen.balance, true],
                ];
                const altoFila = 22;

                if (y + altoFila * filasTotales.length + 4 > limiteY()) {
                    doc.addPage();
                    y = doc.page.margins.top;
                }

                filasTotales.forEach(([etiqueta, valor, destacada]) => {
                    doc.rect(left, y, ancho, altoFila).fill(destacada ? "#D6E0F2" : "#E8EEF9");
                    doc.fillColor("#1F3864").font("Helvetica-Bold").fontSize(10)
                        .text(etiqueta, left + pad, y + 7, { width: ancho - ANCHO_MONTO - pad * 2, align: "right", lineBreak: false })
                        .text(formatearMonto(valor), left + ancho - ANCHO_MONTO + pad, y + 7, {
                            width: ANCHO_MONTO - pad * 2,
                            align: "right",
                            lineBreak: false,
                        });
                    y += altoFila;
                });
            }

            /* ----- Balance mensual ----- */
            if (resumen.porMes.length > 0) {
                const colsMes: ColumnaPdf[] = [
                    { title: "Mes", w: 135, align: "left" },
                    { title: "Ingresos", w: 95, align: "right" },
                    { title: "Egresos", w: 95, align: "right" },
                    { title: "Balance del mes", w: 95, align: "right" },
                    { title: "Acumulado", w: 95, align: "right" },
                ];

                const dibujarCabeceraMes = (yy: number): number => {
                    doc.rect(left, yy, ancho, 20).fill("#1F3864");
                    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(9);
                    let x = left;
                    colsMes.forEach((c) => {
                        doc.text(c.title, x + pad, yy + 6, { width: c.w - pad * 2, align: c.align, lineBreak: false });
                        x += c.w;
                    });
                    return yy + 20;
                };

                y += 22;
                if (y + 70 > limiteY()) {
                    doc.addPage();
                    y = doc.page.margins.top;
                }
                doc.font("Helvetica-Bold").fontSize(11).fillColor("#222222")
                    .text("Balance mensual", left, y, { lineBreak: false });
                y = dibujarCabeceraMes(y + 18);

                resumen.porMes.forEach((m, i) => {
                    if (y + 18 > limiteY()) {
                        doc.addPage();
                        y = dibujarCabeceraMes(doc.page.margins.top);
                    }
                    if (i % 2 === 0) doc.rect(left, y, ancho, 18).fill("#F7F9FC");

                    const valores = [
                        etiquetaMes(m.mes),
                        formatearMonto(m.ingresos),
                        formatearMonto(m.egresos),
                        formatearMonto(m.balance),
                        formatearMonto(m.acumulado),
                    ];
                    let x = left;
                    valores.forEach((texto, idx) => {
                        const negativo = (idx === 3 && m.balance < 0) || (idx === 4 && m.acumulado < 0);
                        doc.font(idx === 3 ? "Helvetica-Bold" : "Helvetica").fontSize(9)
                            .fillColor(negativo ? "#C00000" : "#222222")
                            .text(texto, x + pad, y + 5, { width: colsMes[idx].w - pad * 2, align: colsMes[idx].align, lineBreak: false });
                        x += colsMes[idx].w;
                    });
                    y += 18;
                });
            }

            /* ----- Resumen por procedencia ----- */
            if (resumen.porProcedencia.length > 0) {
                y += 22;
                if (y + 40 > limiteY()) {
                    doc.addPage();
                    y = doc.page.margins.top;
                }
                doc.font("Helvetica-Bold").fontSize(11).fillColor("#222222")
                    .text("Resumen por procedencia (neto)", left, y, { lineBreak: false });
                y += 18;

                resumen.porProcedencia.forEach((p) => {
                    if (y + 16 > limiteY()) {
                        doc.addPage();
                        y = doc.page.margins.top;
                    }
                    doc.font("Helvetica").fontSize(9).fillColor("#222222")
                        .text(`${p.procedencia} (${p.cantidad})`, left + pad, y, { width: ancho - 120, lineBreak: false })
                        .text(formatearMonto(p.neto), left + ancho - 120, y, {
                            width: 120 - pad,
                            align: "right",
                            lineBreak: false,
                        });
                    y += 14;
                });
            }

            // Pie de página con numeración
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