import { patchAporteService } from "../../services/aporte.service.js";
import { fireDynamicSwal } from "../utils/dynamicSwal.jsx";

// Backend: { status, message, details?, data }. Para errores 400 `details` trae el motivo concreto.
const extraerMensaje = (response) =>
    response?.data?.details || response?.data?.message || response?.message;

// El formulario y sus validaciones están en DetalleAporte.
export const usePatchAporte = (fetchAportes) => {
    const handleEditAporte = async (aporteId, aporteData) => {
        let status;
        let mensaje;

        try {
            const response = await patchAporteService(aporteId, aporteData);
            // Si el service no lanzó error, la edición fue exitosa (el backend responde 200)
            status = response?.status ?? 200;
            mensaje = extraerMensaje(response) || "Aporte actualizado con éxito";

            if (typeof fetchAportes === "function") {
                await fetchAportes();
            }
        } catch (error) {
            console.error("Error al editar aporte:", error);
            status = error?.response?.status ?? 500;
            mensaje = extraerMensaje(error?.response) || "Error desconocido";
        }

        fireDynamicSwal(status, null, mensaje);

        return status >= 200 && status < 300;
    };

    return { handleEditAporte };
};

export default usePatchAporte;