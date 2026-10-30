import { useState, useCallback } from "react";
import { getPublicacionByIdService } from "../../services/publicacion.service.js";

export function useGetPublicacionById() {
    const [publicacion, setPublicacion] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchPublicacion = useCallback(async (id) => {
        setLoading(true);
        // El service devuelve null si falla o no existe.
        const data = await getPublicacionByIdService(id);
        setPublicacion(data);
        setLoading(false);
        return data;
    }, []);

    return { publicacion, loading, fetchPublicacion };
}