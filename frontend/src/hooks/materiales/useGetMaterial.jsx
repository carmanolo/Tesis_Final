import { getMaterialesService } from "@services/material.service.js";
export const useGetMateriales = (materialData, setMaterialData) => {
    const fetchMateriales = async () => {
        try {
            const data = await getMaterialesService();
            setMaterialData(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error al obtener los materiales:", error);
        }
    };

    return [materialData, fetchMateriales];
};

export default useGetMateriales;