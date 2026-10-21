import { createMaterialService } from "@services/material.service.js";
import { fireDynamicSwal } from "../utils/dynamicSwal.jsx";

export const useCreateMaterial = (fetchMateriales) => {
    const handleCreateMaterial = async (materialData) => {
        let response = null;
        try {
            response = await createMaterialService(materialData);
            if (typeof fetchMateriales === "function") {
                await fetchMateriales();
            }
        } catch (error) {
            console.error("Error al registrar material:", error);
            response = error?.response || { status: 500, message: "Error desconocido" };
        }

        const status = response?.status || 400;
        fireDynamicSwal(status, null, response?.data?.message || response?.message);

        // Retorna true si fue exitoso para que el modal sepa que debe cerrarse
        return status >= 200 && status < 300;
    };

    return { handleCreateMaterial };
};

export default useCreateMaterial;