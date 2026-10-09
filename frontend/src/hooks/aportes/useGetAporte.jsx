import { getAportesService } from "../../services/aporte.service.js";

export const useGetAporte = (aporteData, setAporteData) => {
    const fetchAporte = async () => {
        try {
            const data = await getAportesService();
            setAporteData(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error al conseguir los aportes:", error);
            setAporteData([]);
        }
    };

    return [aporteData, fetchAporte];
};

export default useGetAporte;