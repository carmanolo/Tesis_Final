import { useState } from "react";
import { descargarReporteAporteService } from "../../services/aporte.service.js";
import { fireDynamicSwal } from "../utils/dynamicSwal.jsx";

const EXTENSIONES = { pdf: "pdf", excel: "xlsx" };
const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

// Con responseType "blob" los errores del backend también llegan como Blob: hay que leerlos como texto
const extraerMensajeError = async (error) => {
    const data = error?.response?.data;
    try {
        if (data instanceof Blob) {
            const json = JSON.parse(await data.text());
            return json?.details || json?.message;
        }
        return data?.details || data?.message;
    } catch {
        return undefined;
    }
};

const guardarArchivo = (blob, nombre) => {
    const url = window.URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombre;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    window.URL.revokeObjectURL(url);
};

// El backend rechaza fechas que no sean YYYY-MM-DD, así que los filtros vacíos no se envían
const limpiarFiltros = ({ desde, hasta } = {}) => {
    const filtros = {};
    if (desde) filtros.desde = desde;
    if (hasta) filtros.hasta = hasta;
    return filtros;
};

export const useDownloadReporteAporte = () => {
    const [descargando, setDescargando] = useState(false);

    // formato: "pdf" | "excel"; filtros: { desde, hasta } en YYYY-MM-DD (opcionales)
    const handleDownloadReporte = async (formato, filtrosEntrada = {}) => {
        if (!EXTENSIONES[formato]) {
            fireDynamicSwal(400, "Formato inválido", "Selecciona PDF o Excel");
            return false;
        }

        const filtros = limpiarFiltros(filtrosEntrada);

        if ((filtros.desde && !FECHA_ISO.test(filtros.desde)) || (filtros.hasta && !FECHA_ISO.test(filtros.hasta))) {
            fireDynamicSwal(400, "Fecha inválida", "Las fechas deben tener formato AAAA-MM-DD");
            return false;
        }
        if (filtros.desde && filtros.hasta && filtros.desde > filtros.hasta) {
            fireDynamicSwal(400, "Rango de fechas inválido", "La fecha 'desde' no puede ser posterior a 'hasta'");
            return false;
        }

        setDescargando(true);
        try {
            const blob = await descargarReporteAporteService(formato, filtros);
            const hoy = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD en hora local
            guardarArchivo(blob, `contabilidad_${hoy}.${EXTENSIONES[formato]}`);
            fireDynamicSwal(200, "Reporte generado", "La descarga ha comenzado");
            return true;
        } catch (error) {
            const mensaje = await extraerMensajeError(error);
            fireDynamicSwal(error?.response?.status ?? 500, "No se pudo generar el reporte", mensaje);
            return false;
        } finally {
            setDescargando(false);
        }
    };

    return { handleDownloadReporte, descargando };
};

export default useDownloadReporteAporte;