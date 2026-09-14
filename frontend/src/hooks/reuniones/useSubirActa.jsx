import Swal from "sweetalert2";
import { subirActaService } from "@services/reunion.service.js";
import { fireDynamicSwal } from "../utils/dynamicSwal.jsx";
import {
    ACTA_EXTENSIONES_PERMITIDAS,
    ACTA_TAMANO_MAXIMO_BYTES,
    ACTA_TAMANO_MAXIMO_MB,
} from "../../constants/reunion.constants.jsx";

function extensionValida(nombreArchivo) {
    const nombre = nombreArchivo.toLowerCase();
    return ACTA_EXTENSIONES_PERMITIDAS.some((ext) => nombre.endsWith(ext));
}

async function pedirArchivoActa(reunion) {
    const { value: archivo } = await Swal.fire({
        title: reunion?.ruta_archivo ? "Reemplazar acta" : "Subir acta",
        text: `Reunión del ${reunion?.fecha_reunion ?? ""}: ${reunion?.descripcion || ""}`,
        input: "file",
        inputAttributes: {
            accept: ".pdf,.doc,.docx",
            "aria-label": "Selecciona el acta en PDF o Word",
        },
        showCancelButton: true,
        confirmButtonText: "Subir",
        cancelButtonText: "Cancelar",
        theme: "light",
        preConfirm: (file) => {
            if (!file) {
                Swal.showValidationMessage("Debes seleccionar un archivo");
                return false;
            }
            if (!extensionValida(file.name)) {
                Swal.showValidationMessage("Solo se permiten archivos PDF o Word (.pdf, .doc, .docx)");
                return false;
            }
            if (file.size > ACTA_TAMANO_MAXIMO_BYTES) {
                Swal.showValidationMessage(`El archivo no puede superar los ${ACTA_TAMANO_MAXIMO_MB}MB`);
                return false;
            }
            return file;
        },
    });

    return archivo;
}

export const useSubirActa = (fetchReuniones) => {
    const handleSubirActa = async (reunion) => {
        let response = null;
        try {
            const archivo = await pedirArchivoActa(reunion);
            if (!archivo) return;

            response = await subirActaService(reunion.id_reunion, archivo);
            if (typeof fetchReuniones === "function") {
                await fetchReuniones();
            }
        } catch (error) {
            console.error("Error al subir el acta:", error);
            response = error?.response || { status: 500, message: "Error desconocido" };
        }
        fireDynamicSwal(response?.status, null, response?.data?.message || response?.message);
    };

    return { handleSubirActa };
};

export default useSubirActa;