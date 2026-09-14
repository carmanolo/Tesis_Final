import { useMemo } from "react";
import { obtenerFechaKey } from "../../utils/calendarUtils.js";

export function useCalendarioReuniones(reuniones) {
    const reunionesPorFecha = useMemo(() => {
        const agrupado = {};
        if (!Array.isArray(reuniones)) return agrupado;

        for (const reunion of reuniones) {
            const key = obtenerFechaKey(reunion.fecha_reunion);
            if (!key) continue;

            if (!agrupado[key]) agrupado[key] = [];
            agrupado[key].push(reunion);
        }

        return agrupado;
    }, [reuniones]);

    return { reunionesPorFecha };
}

export default useCalendarioReuniones;