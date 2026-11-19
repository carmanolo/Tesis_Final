import { useState, useCallback } from "react";
import { getRespaldosService } from "../../services/respaldo.service.js";

export function useGetRespaldos() {
    const [respaldos, setRespaldos] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchRespaldos = useCallback(async (carreraId) => {
        setLoading(true);
        // El service ya maneja errores y siempre devuelve un array.
        const lista = await getRespaldosService(carreraId);
        setRespaldos(Array.isArray(lista) ? lista : []);
        setLoading(false);
    }, []);

    return { respaldos, loading, fetchRespaldos };
}