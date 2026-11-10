import { useState } from "react";
import { descargarSolicitudService } from "../../services/compromiso.service.js";
import { fireDynamicSwal } from "../utils/dynamicSwal.jsx";

const EXTENSIONES = { pdf: "pdf", excel: "xlsx" };

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

export const useDownloadSolicitud = () => {
    const [descargando, setDescargando] = useState(false);

    // formato: "pdf" | "excel"
    const handleDownloadSolicitud = async (compromisoId, formato) => {
        if (!EXTENSIONES[formato]) {
            fireDynamicSwal(400, "Formato inválido", "Selecciona PDF o Excel");
            return false;
        }

        setDescargando(true);
        try {
            const blob = await descargarSolicitudService(compromisoId, formato);
            const hoy = new Date().toLocaleDateString("en-CA");
            guardarArchivo(blob, `solicitud_fondos_compromiso_${compromisoId}_${hoy}.${EXTENSIONES[formato]}`);
            fireDynamicSwal(200, "Solicitud generada", "La descarga ha comenzado");
            return true;
        } catch (error) {
            const mensaje = await extraerMensajeError(error);
            fireDynamicSwal(error?.response?.status ?? 500, "No se pudo generar la solicitud", mensaje);
            return false;
        } finally {
            setDescargando(false);
        }
    };

    return { handleDownloadSolicitud, descargando };
};

export default useDownloadSolicitud;