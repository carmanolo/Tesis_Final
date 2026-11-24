import { normalizarFechaISO } from "./calendar.utils.js";
import { OPCIONES_DESCRIPCION } from "../constants/compromiso.constants.jsx";

const STORAGE_KEY_DESCRIPCIONES = "compromiso_descripciones_custom";

const compromisoVigenteDeAporte = (aporteId: number, compromisos: any[], excluirId?: number) =>
    compromisos.find(
        (c: any) =>
            c.id_compromiso !== excluirId &&
            (diasHasta(c.fecha_compromiso) ?? -1) >= 0 &&
            (c.aportes ?? []).some(
                (a: any) => Number(a.aporteId) === aporteId && (Number(a.monto_asignado) || 0) > 0,
            ),
    ) ?? null;

export const getOpcionesDescripcionCompromiso = (): string[] => {
    try {
        const guardadas = JSON.parse(localStorage.getItem(STORAGE_KEY_DESCRIPCIONES) || "[]");
        const combinadas = [...OPCIONES_DESCRIPCION.filter((o) => o.toLowerCase() !== "otro")];
        if (Array.isArray(guardadas)) {
            guardadas.forEach((d: string) => {
                if (d && !combinadas.some((c) => c.toLowerCase() === d.toLowerCase())) {
                    combinadas.push(d);
                }
            });
        }
        combinadas.push("Otro");
        return combinadas;
    } catch {
        return [...OPCIONES_DESCRIPCION];
    }
};

export const guardarNuevaDescripcionCompromiso = (nueva: string) => {
    if (!nueva) return;
    const limpia = nueva.trim();
    if (!limpia || limpia.toLowerCase() === "otro") return;
    try {
        const guardadas = JSON.parse(localStorage.getItem(STORAGE_KEY_DESCRIPCIONES) || "[]");
        const lista = Array.isArray(guardadas) ? guardadas : [];
        if (!lista.some((d: string) => d.toLowerCase() === limpia.toLowerCase())) {
            lista.push(limpia);
            localStorage.setItem(STORAGE_KEY_DESCRIPCIONES, JSON.stringify(lista));
        }
    } catch (e) {
        console.error(e);
    }
};

export const obtenerEstadoDescripcionCompromiso = (descripcion: string) => {
    if (!descripcion) {
        return { descripcion_compromiso: "", otra_descripcion: "" };
    }
    const opciones = getOpcionesDescripcionCompromiso().filter((op) => op.toLowerCase() !== "otro");
    const opcionExacta = opciones.find(
        (op) => op.toLowerCase() === descripcion.toLowerCase()
    );
    if (opcionExacta) {
        return { descripcion_compromiso: opcionExacta, otra_descripcion: "" };
    }
    return {
        descripcion_compromiso: "Otro",
        otra_descripcion: descripcion.toLowerCase() === "otro" ? "" : descripcion,
    };
};

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

export const valoresIniciales = (compromiso: any) => {
    const estado = obtenerEstadoDescripcionCompromiso(compromiso?.descripcion_compromiso);
    return {
        descripcion_compromiso: estado.descripcion_compromiso,
        otra_descripcion: estado.otra_descripcion,
        fecha_compromiso: compromiso ? normalizarFechaISO(compromiso.fecha_compromiso) : hoyISO(),
        monto_total: compromiso?.monto_total ?? "",
    };
};

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

// Calcula el monto ya asignado de un aporte en TODOS los compromisos
const totalAsignadoAporte = (aporteId: number, compromisos: any[]): number => {
    let total = 0;
    for (const c of compromisos) {
        for (const asig of c.aportes ?? []) {
            if (Number(asig.aporteId) === aporteId) {
                total += Number(asig.monto_asignado) || 0;
            }
        }
    }
    return total;
};

// Aportes que se pueden asignar a este compromiso, con lo que le queda disponible a cada uno.
export const aportesAsignables = (aportes: any[], compromisos: any[], compromiso: any) => {
    const propios = new Map<number, number>(
        (compromiso?.aportes ?? []).map((a: any) => [a.aporteId, Number(a.monto_asignado) || 0])
    );

    return aportes
        .filter((a: any) => a.tipo !== "egreso" && a.carreraId === compromiso?.carreraId)
        .filter((a: any) => !compromisoVigenteDeAporte(a.id_aporte, compromisos, compromiso?.id_compromiso))
        .map((aporte: any) => {
            const asignadoAqui = propios.get(aporte.id_aporte) ?? 0;
            // Disponible = monto original - todo lo asignado en otros compromisos
            const totalAsignado = totalAsignadoAporte(aporte.id_aporte, compromisos);
            const disponible = Math.max((Number(aporte.monto) || 0) - totalAsignado + asignadoAqui, 0);
            return { aporte, asignadoAqui, disponible };
        })
        .filter((x) => x.disponible > 0)
        .sort((a, b) => String(b.aporte.fecha_aporte).localeCompare(String(a.aporte.fecha_aporte)));
};

// Compromisos a los que se puede asignar un ingreso, con cuánto le queda por financiar
export const compromisosAsignables = (compromisos: any[], aporte: any) => {
    if (!aporte || aporte.tipo === "egreso") return [];

    // Monto total comprometido del aporte en todos los compromisos
    let totalAsignado = 0;
    for (const c of compromisos) {
        for (const asig of c.aportes ?? []) {
            if (Number(asig.aporteId) === aporte.id_aporte) {
                totalAsignado += Number(asig.monto_asignado) || 0;
            }
        }
    }
    const disponibleAporte = Math.max((Number(aporte.monto) || 0) - totalAsignado, 0);

    const bloqueo = compromisoVigenteDeAporte(aporte.id_aporte, compromisos);

    return compromisos
        .filter((c: any) => c.carreraId === aporte.carreraId &&
        (!bloqueo || c.id_compromiso === bloqueo.id_compromiso))
        .map((c: any) => {
            const asignadoAqui = (c.aportes ?? []).find((a: any) => Number(a.aporteId) === aporte.id_aporte);
            const montoAqui = asignadoAqui ? Number(asignadoAqui.monto_asignado) || 0 : 0;
            const saldoCompromiso = Math.max(
                (Number(c.monto_total) || 0) - ((c.resumen?.totalFinanciado ?? 0) - montoAqui),
                0
            );
            const maximo = Math.min(saldoCompromiso + montoAqui, disponibleAporte + montoAqui);
            return { compromiso: c, montoAqui, saldoCompromiso, maximo };
        })
        .filter((x) => x.maximo > 0 || x.montoAqui > 0)
        .sort((a, b) => String(a.compromiso.fecha_compromiso).localeCompare(String(b.compromiso.fecha_compromiso)));
};
