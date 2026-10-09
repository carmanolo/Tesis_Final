import { createAporteService } from "../../services/aporte.service.js";
import { fireDynamicSwal } from "../utils/dynamicSwal.jsx";

// Ahora el formulario vive en el componente DetalleAporte:
// este hook solo recibe los datos ya validados, los envía y refresca la lista.
export const useCreateAporte = (fetchAportes) => {
    const handleCreateAporte = async (aporteData) => {
        let response = null;

        try {
            response = await createAporteService(aporteData);

            // Antes se comprobaba `fetchCarreras` (que no existe aquí), por eso la lista no se actualizaba
            if (typeof fetchAportes === "function") {
                await fetchAportes();
            }
        } catch (error) {
            console.error("Error al crear aporte:", error);
            response = error?.response || { status: 500, message: "Error desconocido" };
        }

        const status = response?.status || 400;
        fireDynamicSwal(status, null, response?.data?.message || response?.message);

        // true si salió bien, para que el modal sepa si debe cerrarse
        return status >= 200 && status < 300;
    };

    return { handleCreateAporte };
};

export default useCreateAporte;