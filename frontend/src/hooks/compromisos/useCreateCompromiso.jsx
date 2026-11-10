import { createCompromisoService } from "../../services/compromiso.service.js";
import { fireDynamicSwal } from "../utils/dynamicSwal.jsx";

export const useCreateCompromiso = (fetchCompromisos) => {
    const handleCreateCompromiso = async (compromisoData) => {
        let response = null;

        try {
            response = await createCompromisoService(compromisoData);

            if (typeof fetchCompromisos === "function") {
                await fetchCompromisos();
            }
        } catch (error) {
            console.error("Error al crear compromiso:", error);
            response = error?.response || { status: 500, message: "Error desconocido" };
        }

        const status = response?.status || 400;
        fireDynamicSwal(status, null, response?.data?.message || response?.message);

        return status >= 200 && status < 300;
    };

    return { handleCreateCompromiso };
};

export default useCreateCompromiso;