import { getCarreraList } from "../../services/carrera.service.js"

export const useGetCarreraList = (carreraList, setCarreraList) => {
    const fetchCarreraList = async () => {
        try {
            const data = await getCarreraList();
            setCarreraList(data);
        } catch (error) {
            console.error("Error al obtener lista de carreras:", error);
            setCarreraList([]);
        }
    };

    return [carreraList, fetchCarreraList];
};