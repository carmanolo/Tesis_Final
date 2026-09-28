import Swal from "sweetalert2";
import { subirActaService } from "@services/reunion.service.js";
import { fireDynamicSwal } from "../utils/dynamicSwal.jsx";
import {
    ACTA_EXTENSIONES_PERMITIDAS,
    ACTA_TAMANO_MAXIMO_BYTES,
    ACTA_TAMANO_MAXIMO_MB,
} from "../../constants/reunion.constants.jsx";

function extensionValida(nombreArchivo) {
    const nombre = (nombreArchivo || "").toLowerCase();
    return ACTA_EXTENSIONES_PERMITIDAS.some((ext) => nombre.endsWith(ext));
}

export const useSubirActa = (fetchReuniones) => {
    const handleSubirActa = async (reunion, archivo) => {
        if (!archivo || !reunion) return;

        if (!extensionValida(archivo.name)) {
            Swal.fire({
                icon: "error",
                title: "Formato no válido",
                text: "Solo se permiten archivos PDF o Word (.pdf, .doc, .docx)",
            });
            return;
        }

        if (archivo.size > ACTA_TAMANO_MAXIMO_BYTES) {
            Swal.fire({
                icon: "error",
                title: "Archivo muy pesado",
                text: `El archivo no puede superar los ${ACTA_TAMANO_MAXIMO_MB}MB`,
            });
            return;
        }

        // Feedback inmediato mientras se realiza la subida
        Swal.fire({
            title: "Subiendo acta...",
            text: "Por favor espere un momento.",
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        let response = null;
        try {
            response = await subirActaService(reunion.id_reunion, archivo);
            if (typeof fetchReuniones === "function") {
                await fetchReuniones();
            }
        } catch (error) {
            console.error("Error al subir el acta:", error);
            response = error?.response || { status: 500, message: "Error desconocido" };
        }
        Swal.close();
        fireDynamicSwal(response?.status, null, response?.data?.message || response?.message);
    };

    return { handleSubirActa };
};

export default useSubirActa;