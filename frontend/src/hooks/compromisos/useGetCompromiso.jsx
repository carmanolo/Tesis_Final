import { getCompromisosService } from "../../services/compromiso.service.js";

export const useGetCompromiso = (compromisoData, setCompromisoData) => {
    const fetchCompromiso = async () => {
        try {
            const data = await getCompromisosService();
            setCompromisoData(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error al conseguir los compromisos:", error);
            setCompromisoData([]);
        }
    };

    return [compromisoData, fetchCompromiso];
};

export default useGetCompromiso;