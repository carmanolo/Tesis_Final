import { createAporteService } from "../../services/aporte.service.js";
import { fireDynamicSwal } from "../utils/dynamicSwal.jsx";

// Backend: { status, message, details?, data }. Para errores 400 `details` trae el motivo concreto.
const extraerMensaje = (response) =>
    response?.data?.details || response?.data?.message || response?.message;

// Este hook solo recibe los datos ya validados, los envía y refresca la lista.
export const useCreateAporte = (fetchAportes) => {
    const handleCreateAporte = async (aporteData) => {
        let status;
        let mensaje;

        try {
            const response = await createAporteService(aporteData);
            // Si el service no lanzó error, la creación fue exitosa (el backend responde 201)
            status = response?.status ?? 201;
            mensaje = extraerMensaje(response) || "Aporte registrado exitosamente";

            if (typeof fetchAportes === "function") {
                await fetchAportes();
            }
        } catch (error) {
            console.error("Error al crear aporte:", error);
            status = error?.response?.status ?? 500;
            mensaje = extraerMensaje(error?.response) || "Error desconocido";
        }

        fireDynamicSwal(status, null, mensaje);

        return status >= 200 && status < 300;
    };

    return { handleCreateAporte };
};

export default useCreateAporte;