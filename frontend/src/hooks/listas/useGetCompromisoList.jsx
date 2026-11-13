import { getCompromisoList } from "../../services/compromiso.service.js";

export const useGetCompromisoList = (compromisoList, setCompromisoList) => {
    const fetchCompromisoList = async () => {
        try {
            const data = await getCompromisoList();
            setCompromisoList(data);
        } catch (error) {
            console.error("Error al obtener lista de compromisos:", error)
            setCompromisoList([]);
        }
    };

    return [compromisoList, fetchCompromisoList];
}