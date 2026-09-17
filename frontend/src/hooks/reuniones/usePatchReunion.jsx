import { patchReunionService } from "@services/reunion.service.js";
import { fireDynamicSwal } from "../utils/dynamicSwal.jsx";

export const usePatchReunion = (fetchReuniones) => {
    const handleEditReunion = async (idReunion, formValues) => {
        let response = null;
        try {
            response = await patchReunionService(idReunion, formValues);
            if (typeof fetchReuniones === "function") {
                await fetchReuniones();
            }
        } catch (error) {
            console.error(error);
            response = error?.response || { status: 500, message: "Error desconocido" };
        }
        fireDynamicSwal(response?.status, null, response?.data?.message || response?.message);
        return response;
    };

    return { handleEditReunion };
};

export default usePatchReunion;