import { patchCompromisoService } from "../../services/compromiso.service.js";
import { fireDynamicSwal } from "../utils/dynamicSwal.jsx";

export const usePatchCompromiso = (fetchCompromisos) => {
    const handleEditCompromiso = async (compromisoId, compromisoData) => {
        let response = null;

        try {
            response = await patchCompromisoService(compromisoId, compromisoData);

            if (typeof fetchCompromisos === "function") {
                await fetchCompromisos();
            }
        } catch (error) {
            console.error("Error al editar compromiso:", error);
            response = error?.response || { status: 500, message: "Error desconocido" };
        }

        const status = response?.status || 400;
        fireDynamicSwal(status, null, response?.data?.message || response?.message);

        return status >= 200 && status < 300;
    };

    return { handleEditCompromiso };
};

export default usePatchCompromiso;