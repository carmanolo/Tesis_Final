import { useCallback } from "react";
import { getCompromisoList } from "../../services/compromiso.service.js";

export const useGetCompromisoList = (compromisoList, setCompromisoList) => {
    const fetchCompromisoList = useCallback(async () => {
        try {
            const data = await getCompromisoList();
            setCompromisoList(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error al obtener lista de compromisos:", error);
            setCompromisoList([]);
        }
    }, [setCompromisoList]);

    return [compromisoList, fetchCompromisoList];
};