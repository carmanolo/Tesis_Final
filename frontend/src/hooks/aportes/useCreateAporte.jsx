import { createAporteService } from "../../services/aporte.service.js";
import { fireDynamicSwal } from "../utils/dynamicSwal.jsx";

// este hook solo recibe los datos ya validados, los envía y refresca la lista.
export const useCreateAporte = (fetchAportes) => {
    const handleCreateAporte = async (aporteData) => {
        let response = null;

        try {
            response = await createAporteService(aporteData);

            if (typeof fetchAportes === "function") {
                await fetchAportes();
            }
        } catch (error) {
            console.error("Error al crear aporte:", error);
            response = error?.response || { status: 500, message: "Error desconocido" };
        }

        const status = response?.status || 400;
        fireDynamicSwal(status, null, response?.data?.message || response?.message);

        return status >= 200 && status < 300;
    };

    return { handleCreateAporte };
};

export default useCreateAporte;