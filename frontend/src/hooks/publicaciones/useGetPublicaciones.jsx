import { useState, useCallback } from "react";
import { getPublicacionesService } from "../../services/publicacion.service.js";

export function useGetPublicaciones() {
    const [publicaciones, setPublicaciones] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchPublicaciones = useCallback(async (carreraId) => {
        setLoading(true);
        // El service ya maneja errores y siempre devuelve un array.
        const lista = await getPublicacionesService(carreraId);
        setPublicaciones(Array.isArray(lista) ? lista : []);
        setLoading(false);
    }, []);

    return { publicaciones, loading, fetchPublicaciones };
}