import { getReunionesService } from "@services/reunion.service.js";

export const useGetReuniones = (reunionData, setReunionData) => {
    const fetchReuniones = async () => {
        try {
            const data = await getReunionesService();
            setReunionData(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error al obtener las reuniones:", error);
        }
    };

    return [reunionData, fetchReuniones];
};

export default useGetReuniones;