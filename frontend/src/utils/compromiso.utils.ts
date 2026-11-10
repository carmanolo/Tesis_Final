import { normalizarFechaISO } from "./calendar.utils.js";


export const hoyISO = () => new Date().toLocaleDateString("en-CA");

// "YYYY-MM-DD" -> Date en hora local (evita el desfase de un día por zona horaria)
const aFechaLocal = (iso: string) => {
    const [anio, mes, dia] = iso.split("-").map(Number);
    return new Date(anio, mes - 1, dia);
};

// Días que faltan para la fecha (negativo si ya pasó, null si la fecha no es válida)
export const diasHasta = (fecha: any): number | null => {
    const iso = normalizarFechaISO(fecha);
    if (!iso) return null;
    return Math.round((aFechaLocal(iso).getTime() - aFechaLocal(hoyISO()).getTime()) / 86400000);
};

export const textoPlazo = (dias: number | null) => {
    if (dias === null) return "";
    if (dias < 0) return `Venció hace ${Math.abs(dias)} ${Math.abs(dias) === 1 ? "día" : "días"}`;
    if (dias === 0) return "Es hoy";
    if (dias === 1) return "Es mañana";
    return `Faltan ${dias} días`;
};

// El backend ya envía `resumen`; este respaldo evita errores si faltara
export const resumenDe = (compromiso: any) =>
    compromiso?.resumen ?? {
        montoTotal: Number(compromiso?.monto_total) || 0,
        totalFinanciado: 0,
        saldoPorFinanciar: Number(compromiso?.monto_total) || 0,
        porcentajeFinanciado: 0,
    };

export const estadoFinanciamiento = (compromiso: any) => {
    const { montoTotal, totalFinanciado, saldoPorFinanciar } = resumenDe(compromiso);
    if (montoTotal > 0 && saldoPorFinanciar === 0) return { id: "financiado", etiqueta: "Financiado", clase: "badge-success" };
    if (totalFinanciado > 0) return { id: "parcial", etiqueta: "Parcial", clase: "badge-info" };
    return { id: "sin-financiar", etiqueta: "Sin financiar", clase: "badge-ghost" };
};

export const valoresIniciales = (compromiso: any) => ({
    descripcion_compromiso: compromiso?.descripcion_compromiso ?? "",
    fecha_compromiso: compromiso ? normalizarFechaISO(compromiso.fecha_compromiso) : hoyISO(),
    monto_total: compromiso?.monto_total ?? "",
});

//ProximoCompromiso

// Compromiso con la fecha más cercana a hoy
export const obtenerProximoCompromiso = (compromisos: any[]) => {
    const futuros = compromisos
        .map((compromiso: any) => ({ compromiso, dias: diasHasta(compromiso.fecha_compromiso) }))
        .filter((x) => x.dias !== null && x.dias >= 0)
        .sort(
            (a, b) =>
                (a.dias as number) - (b.dias as number) || a.compromiso.id_compromiso - b.compromiso.id_compromiso
        );
    return futuros[0]?.compromiso ?? null;
};

//FinanciamientoCompromiso

// Aportes que se pueden asignar a este compromiso, con lo que le queda disponible a cada uno.
export const aportesAsignables = (aportes: any[], compromisos: any[], compromiso: any) => {
    const asignadoTotal = new Map<number, number>();
    compromisos.forEach((c: any) =>
        (c.aportes ?? []).forEach((a: any) =>
            asignadoTotal.set(a.aporteId, (asignadoTotal.get(a.aporteId) || 0) + (Number(a.monto_asignado) || 0))
        )
    );
    const propios = new Map<number, number>(
        (compromiso.aportes ?? []).map((a: any) => [a.aporteId, Number(a.monto_asignado) || 0])
    );

    return aportes
        .filter((a: any) => a.tipo !== "egreso" && a.carreraId === compromiso.carreraId)
        .map((aporte: any) => {
            const asignadoAqui = propios.get(aporte.id_aporte) ?? 0;
            const asignadoOtros = (asignadoTotal.get(aporte.id_aporte) ?? 0) - asignadoAqui;
            return { aporte, asignadoAqui, disponible: Math.max((Number(aporte.monto) || 0) - asignadoOtros, 0) };
        })
        .filter((x) => x.disponible > 0)
        .sort((a, b) => String(b.aporte.fecha_aporte).localeCompare(String(a.aporte.fecha_aporte)));
};