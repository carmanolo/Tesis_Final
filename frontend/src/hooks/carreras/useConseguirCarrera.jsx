
import { getCarrerasService } from "@services/carrera.service.js";


export const useGetCarrera = (carreraData, setCarreraData) => {
    const fetchCarrera = async () => {
        try {
            const data = await getCarrerasService();
            // data ya es directamente el arreglo de carrera (o un arreglo vacío)
            setCarreraData(data || []);
        } catch (error) {
            console.error("Error al conseguir la carrera data:", error);
        }
    };


    return [carreraData, fetchCarrera];
};

export default useGetCarrera;