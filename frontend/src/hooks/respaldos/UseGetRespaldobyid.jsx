import { useState, useCallback } from "react";
import { getRespaldoByIdService } from "../../services/respaldo.service.js";

export function useGetRespaldoById() {
    const [respaldo, setRespaldo] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchRespaldo = useCallback(async (id) => {
        setLoading(true);
        const data = await getRespaldoByIdService(id);
        setRespaldo(data);
        setLoading(false);
        return data;
    }, []);

    return { respaldo, loading, fetchRespaldo };
}