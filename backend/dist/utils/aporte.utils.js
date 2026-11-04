import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
// Helpers de formato
const ZONA_HORARIA = "America/Santiago";
const formatoMoneda = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
});
export function formatearMonto(valor) {
    return formatoMoneda.format(valor);
}
// Devuelve dd-mm-aaaa. Las fechas tipo "date" (string YYYY-MM-DD) no se convierten por zona horaria. 
export function formatearFecha(valor) {
    if (!valor)
        return "-";
    if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}/.test(valor)) {
        const [y, m, d] = valor.slice(0, 10).split("-");
        return `${d}-${m}-${y}`;
    }
    const fecha = valor instanceof Date ? valor : new Date(valor);
    if (isNaN(fecha.getTime()))
        return "-";
    return new Intl.DateTimeFormat("es-CL", {
        timeZone: ZONA_HORARIA,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    })
        .format(fecha)
        .replace(/\//g, "-");
}
/* Cálculo de resumen / saldo


/**
 * Saldo total = suma de todos los aportes (ingresos).
 * Además separa lo ya recibido (fecha_recepcion informada) de lo pendiente.
 */
export function calcularResumen(aportes) {
    let totalAportes = 0;
    let totalRecibido = 0;
    const mapa = new Map();
    for (const a of aportes) {
        const monto = Number(a.monto) || 0;
        totalAportes += monto;
        if (a.fecha_recepcion)
            totalRecibido += monto;
        const clave = a.procedencia?.trim() || "Sin procedencia";
        const actual = mapa.get(clave) ?? { procedencia: clave, cantidad: 0, total: 0 };
        actual.cantidad += 1;
        actual.total += monto;
        mapa.set(clave, actual);
    }
    return {
        cantidad: aportes.length,
        totalAportes,
        totalRecibido,
        totalPendiente: totalAportes - totalRecibido,
        saldoTotal: totalAportes,
        porProcedencia: [...mapa.values()].sort((a, b) => b.total - a.total),
    };
}
// EXCEL                                                             
const COLOR_PRIMARIO = "FF1F3864";
const COLOR_TOTAL = "FFE8EEF9";
const FORMATO_PESOS = '"$"#,##0';
const bordeFino = {
    top: { style: "thin", color: { argb: "FFBFBFBF" } },
    left: { style: "thin", color: { argb: "FFBFBFBF" } },
    bottom: { style: "thin", color: { argb: "FFBFBFBF" } },
    right: { style: "thin", color: { argb: "FFBFBFBF" } },
};
export async function generarExcelAportes(aportes, opciones = {}) {
    const resumen = calcularResumen(aportes);
    const wb = new ExcelJS.Workbook();
    wb.creator = "Sistema de gestión CEE";
    wb.created = new Date();
    /* ---------- Hoja 1: detalle ---------- */
    const ws = wb.addWorksheet("Detalle de ingresos", {
        views: [{ state: "frozen", ySplit: 4 }],
    });
    ws.columns = [
        { key: "id", width: 8 },
        { key: "fecha", width: 16 },
        { key: "descripcion", width: 50 },
        { key: "procedencia", width: 28 },
        { key: "recepcion", width: 18 },
        { key: "monto", width: 18 },
    ];
    ws.mergeCells("A1:F1");
    const titulo = ws.getCell("A1");
    titulo.value = "Reporte de ingresos por aportes";
    titulo.font = { bold: true, size: 16, color: { argb: COLOR_PRIMARIO } };
    titulo.alignment = { horizontal: "center" };
    ws.mergeCells("A2:F2");
    const subtitulo = ws.getCell("A2");
    subtitulo.value = `Generado el ${formatearFecha(new Date())}${opciones.periodo ? "  |  " + opciones.periodo : ""}`;
    subtitulo.font = { italic: true, size: 10, color: { argb: "FF595959" } };
    subtitulo.alignment = { horizontal: "center" };
    const cabecera = ws.getRow(4);
    cabecera.values = ["N°", "Fecha del aporte", "Descripción", "Procedencia", "Fecha de recepción", "Monto (CLP)"];
    cabecera.height = 22;
    cabecera.eachCell((celda) => {
        celda.font = { bold: true, color: { argb: "FFFFFFFF" } };
        celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_PRIMARIO } };
        celda.alignment = { vertical: "middle", horizontal: "center" };
        celda.border = bordeFino;
    });
    aportes.forEach((a) => {
        const fila = ws.addRow({
            id: a.id_aporte,
            fecha: formatearFecha(a.fecha_aporte),
            descripcion: a.descripcion_aporte,
            procedencia: a.procedencia,
            recepcion: a.fecha_recepcion ? formatearFecha(a.fecha_recepcion) : "Pendiente",
            monto: Number(a.monto) || 0,
        });
        fila.eachCell((celda) => {
            celda.border = bordeFino;
            celda.alignment = { vertical: "top", wrapText: true };
        });
        fila.getCell("monto").numFmt = FORMATO_PESOS;
        fila.getCell("id").alignment = { horizontal: "center", vertical: "top" };
        fila.getCell("fecha").alignment = { horizontal: "center", vertical: "top" };
        fila.getCell("recepcion").alignment = { horizontal: "center", vertical: "top" };
    });
    const primeraFila = 5;
    const ultimaFila = 4 + aportes.length;
    const filaTotal = ws.addRow({ recepcion: "SALDO TOTAL" });
    const celdaTotal = filaTotal.getCell("monto");
    celdaTotal.value =
        aportes.length > 0
            ? { formula: `SUM(F${primeraFila}:F${ultimaFila})`, result: resumen.totalAportes }
            : 0;
    celdaTotal.numFmt = FORMATO_PESOS;
    filaTotal.eachCell({ includeEmpty: true }, (celda) => {
        celda.font = { bold: true };
        celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_TOTAL } };
        celda.border = bordeFino;
    });
    filaTotal.getCell("recepcion").alignment = { horizontal: "right" };
    /* ---------- Hoja 2: resumen ---------- */
    const wr = wb.addWorksheet("Resumen y saldo");
    wr.columns = [
        { key: "concepto", width: 36 },
        { key: "valor", width: 20 },
        { key: "extra", width: 14 },
    ];
    wr.mergeCells("A1:C1");
    wr.getCell("A1").value = "Resumen de ingresos y saldo";
    wr.getCell("A1").font = { bold: true, size: 14, color: { argb: COLOR_PRIMARIO } };
    wr.getCell("A1").alignment = { horizontal: "center" };
    const filasResumen = [
        ["Cantidad de aportes", resumen.cantidad, false],
        ["Total recibido", resumen.totalRecibido, true],
        ["Total pendiente de recepción", resumen.totalPendiente, true],
        ["SALDO TOTAL", resumen.saldoTotal, true],
    ];
    filasResumen.forEach(([concepto, valor, esMonto], i) => {
        const fila = wr.getRow(3 + i);
        fila.getCell(1).value = concepto;
        fila.getCell(2).value = valor;
        if (esMonto)
            fila.getCell(2).numFmt = FORMATO_PESOS;
        fila.getCell(1).border = bordeFino;
        fila.getCell(2).border = bordeFino;
        if (concepto === "SALDO TOTAL") {
            [1, 2].forEach((c) => {
                fila.getCell(c).font = { bold: true };
                fila.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_TOTAL } };
            });
        }
    });
    const filaProc = 9;
    const cabProc = wr.getRow(filaProc);
    cabProc.values = ["Procedencia", "Total aportado", "N° aportes"];
    cabProc.eachCell((celda) => {
        celda.font = { bold: true, color: { argb: "FFFFFFFF" } };
        celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_PRIMARIO } };
        celda.border = bordeFino;
        celda.alignment = { horizontal: "center" };
    });
    resumen.porProcedencia.forEach((p, i) => {
        const fila = wr.getRow(filaProc + 1 + i);
        fila.values = [p.procedencia, p.total, p.cantidad];
        fila.getCell(2).numFmt = FORMATO_PESOS;
        fila.eachCell((celda) => (celda.border = bordeFino));
    });
    return Buffer.from(await wb.xlsx.writeBuffer());
}
const COLUMNAS_PDF = [
    { title: "N°", w: 32, align: "left" },
    { title: "Fecha", w: 62, align: "left" },
    { title: "Descripción", w: 168, align: "left" },
    { title: "Procedencia", w: 100, align: "left" },
    { title: "Recepción", w: 62, align: "left" },
    { title: "Monto", w: 91, align: "right" },
];
export function generarPdfAportes(aportes, opciones = {}) {
    return new Promise((resolve, reject) => {
        try {
            const resumen = calcularResumen(aportes);
            const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });
            const chunks = [];
            doc.on("data", (c) => chunks.push(c));
            doc.on("end", () => resolve(Buffer.concat(chunks)));
            doc.on("error", reject);
            const left = doc.page.margins.left;
            const ancho = doc.page.width - left - doc.page.margins.right;
            const pad = 4;
            const limiteY = () => doc.page.height - doc.page.margins.bottom - 30;
            /* ----- Encabezado ----- */
            doc.font("Helvetica-Bold").fontSize(16).fillColor("#1F3864")
                .text("Reporte de ingresos por aportes", { align: "center" });
            doc.moveDown(0.3).font("Helvetica").fontSize(9).fillColor("#555555")
                .text(`Generado el ${formatearFecha(new Date())}${opciones.periodo ? "  |  " + opciones.periodo : ""}`, { align: "center" });
            /* ----- Tarjetas de resumen ----- */
            const yCaja = doc.y + 14;
            const altoCaja = 54;
            doc.rect(left, yCaja, ancho, altoCaja).fill("#F2F5FA");
            const tarjetas = [
                ["Cantidad de aportes", String(resumen.cantidad)],
                ["Total recibido", formatearMonto(resumen.totalRecibido)],
                ["Pendiente de recepción", formatearMonto(resumen.totalPendiente)],
                ["SALDO TOTAL", formatearMonto(resumen.saldoTotal)],
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
            const dibujarCabecera = (y) => {
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
                .text("Detalle de ingresos", left, doc.y);
            let y = doc.y + 6;
            if (aportes.length === 0) {
                doc.font("Helvetica-Oblique").fontSize(10).fillColor("#555555")
                    .text("No existen aportes registrados para los filtros seleccionados.", left, y);
                y = doc.y + 10;
            }
            else {
                y = dibujarCabecera(y);
                aportes.forEach((a, i) => {
                    const celdas = [
                        String(a.id_aporte),
                        formatearFecha(a.fecha_aporte),
                        a.descripcion_aporte ?? "",
                        a.procedencia ?? "",
                        a.fecha_recepcion ? formatearFecha(a.fecha_recepcion) : "Pendiente",
                        formatearMonto(Number(a.monto) || 0),
                    ];
                    doc.font("Helvetica").fontSize(9);
                    const alto = Math.max(...celdas.map((t, idx) => doc.heightOfString(t, { width: COLUMNAS_PDF[idx].w - pad * 2 }))) +
                        pad * 2;
                    if (y + alto > limiteY()) {
                        doc.addPage();
                        y = dibujarCabecera(doc.page.margins.top);
                    }
                    if (i % 2 === 0)
                        doc.rect(left, y, ancho, alto).fill("#F7F9FC");
                    doc.fillColor("#222222").font("Helvetica").fontSize(9);
                    let x = left;
                    celdas.forEach((texto, idx) => {
                        const col = COLUMNAS_PDF[idx];
                        doc.text(texto, x + pad, y + pad, { width: col.w - pad * 2, align: col.align });
                        x += col.w;
                    });
                    y += alto;
                });
                /* ----- Fila de saldo total ----- */
                if (y + 28 > limiteY()) {
                    doc.addPage();
                    y = doc.page.margins.top;
                }
                doc.rect(left, y, ancho, 24).fill("#E8EEF9");
                doc.fillColor("#1F3864").font("Helvetica-Bold").fontSize(10)
                    .text("SALDO TOTAL", left + pad, y + 8, { width: ancho - 91 - pad * 2, align: "right", lineBreak: false })
                    .text(formatearMonto(resumen.saldoTotal), left + ancho - 91 + pad, y + 8, {
                    width: 91 - pad * 2,
                    align: "right",
                    lineBreak: false,
                });
                y += 24;
            }
            /* ----- Resumen por procedencia ----- */
            if (resumen.porProcedencia.length > 0) {
                y += 22;
                if (y + 40 > limiteY()) {
                    doc.addPage();
                    y = doc.page.margins.top;
                }
                doc.font("Helvetica-Bold").fontSize(11).fillColor("#222222")
                    .text("Resumen por procedencia", left, y, { lineBreak: false });
                y += 18;
                resumen.porProcedencia.forEach((p) => {
                    if (y + 16 > limiteY()) {
                        doc.addPage();
                        y = doc.page.margins.top;
                    }
                    doc.font("Helvetica").fontSize(9).fillColor("#222222")
                        .text(`${p.procedencia} (${p.cantidad})`, left + pad, y, { width: ancho - 120, lineBreak: false })
                        .text(formatearMonto(p.total), left + ancho - 120, y, {
                        width: 120 - pad,
                        align: "right",
                        lineBreak: false,
                    });
                    y += 14;
                });
            }
            //Pie de página con numeración 
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
        }
        catch (error) {
            reject(error);
        }
    });
}
