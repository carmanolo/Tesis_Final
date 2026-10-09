import { patchAporteService } from "../../services/aporte.service.js";
import { fireDynamicSwal } from "../utils/dynamicSwal.jsx";

// El formulario y sus validaciones ahora están en DetalleAporte.
// Este hook recibe (id, datos), hace el PATCH y refresca la lista.
export const usePatchAporte = (fetchAportes) => {
    const handleEditAporte = async (aporteId, aporteData) => {
        let response = null;

        try {
            response = await patchAporteService(aporteId, aporteData);

            if (typeof fetchAportes === "function") {
                await fetchAportes();
            }
        } catch (error) {
            console.error("Error al editar aporte:", error);
            response = error?.response || { status: 500, message: "Error desconocido" };
        }

        const status = response?.status || 400;
        fireDynamicSwal(status, null, response?.data?.message || response?.message);

        return status >= 200 && status < 300;
    };

    return { handleEditAporte };
};

export default usePatchAporte;