import { normalizarFechaISO, MESES } from "./calendar.utils.js";
import { OPCIONES_PROCEDENCIA, OPCIONES_DESCRIPCION, TOP_N } from "../constants/aporte.constants.jsx";

// Formatos 
export const formatoCLP = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
});

// Pasar moneda a valor chileno en formato corto 
export const formatoCompacto = new Intl.NumberFormat("es-CL", { notation: "compact" });

export const aMonto = (valor: any) => Number(valor) || 0;

const hoyISO = () => new Date().toLocaleDateString("en-CA");

// Los registros sin tipo se consideran ingresos
export const esEgreso = (aporte: any) => aporte?.tipo === "egreso";

const STORAGE_KEY_DESCRIPCIONES = "aporte_descripciones_custom";
const STORAGE_KEY_PROCEDENCIAS = "aporte_procedencias_custom";

export const getOpcionesDescripcionAporte = (): string[] => {
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

export const guardarNuevaDescripcionAporte = (nueva: string) => {
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

export const getOpcionesProcedenciaAporte = (): string[] => {
    try {
        const guardadas = JSON.parse(localStorage.getItem(STORAGE_KEY_PROCEDENCIAS) || "[]");
        const combinadas = [...OPCIONES_PROCEDENCIA.filter((o) => o.toLowerCase() !== "otro")];
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
        return [...OPCIONES_PROCEDENCIA];
    }
};

export const guardarNuevaProcedenciaAporte = (nueva: string) => {
    if (!nueva) return;
    const limpia = nueva.trim();
    if (!limpia || limpia.toLowerCase() === "otro") return;
    try {
        const guardadas = JSON.parse(localStorage.getItem(STORAGE_KEY_PROCEDENCIAS) || "[]");
        const lista = Array.isArray(guardadas) ? guardadas : [];
        if (!lista.some((d: string) => d.toLowerCase() === limpia.toLowerCase())) {
            lista.push(limpia);
            localStorage.setItem(STORAGE_KEY_PROCEDENCIAS, JSON.stringify(lista));
        }
    } catch (e) {
        console.error(e);
    }
};

//Formulario (DetalleAporte)
export const obtenerEstadoProcedencia = (procedencia: string) => {
    if (!procedencia) {
        return { procedencia: "", otra_procedencia: "" };
    }
    const opciones = getOpcionesProcedenciaAporte().filter((op) => op.toLowerCase() !== "otro");
    const opcionExacta = opciones.find(
        (op) => op.toLowerCase() === procedencia.toLowerCase()
    );
    if (opcionExacta) {
        return { procedencia: opcionExacta, otra_procedencia: "" };
    }
    return {
        procedencia: "Otro",
        otra_procedencia: procedencia.toLowerCase() === "otro" ? "" : procedencia,
    };
};

export const obtenerEstadoDescripcion = (descripcion: string) => {
    if (!descripcion) {
        return { descripcion_aporte: "", otra_descripcion: "" };
    }
    const opciones = getOpcionesDescripcionAporte().filter((op) => op.toLowerCase() !== "otro");
    const opcionExacta = opciones.find(
        (op) => op.toLowerCase() === descripcion.toLowerCase()
    );
    if (opcionExacta) {
        return { descripcion_aporte: opcionExacta, otra_descripcion: "" };
    }
    return {
        descripcion_aporte: "Otro",
        otra_descripcion: descripcion.toLowerCase() === "otro" ? "" : descripcion,
    };
};

export const valoresIniciales = (aporte: any) => {
    const estadoProcedencia = obtenerEstadoProcedencia(aporte?.procedencia);
    const estadoDescripcion = obtenerEstadoDescripcion(
        aporte?.tipo === "egreso" ? aporte.descripcion_aporte : ""
    );
    return {
        descripcion_aporte: estadoDescripcion.descripcion_aporte,
        otra_descripcion: estadoDescripcion.otra_descripcion,
        fecha_aporte: aporte ? normalizarFechaISO(aporte.fecha_aporte) : hoyISO(),
        procedencia: estadoProcedencia.procedencia,
        otra_procedencia: estadoProcedencia.otra_procedencia,
        monto: aporte?.monto ?? "",
        tipo: aporte?.tipo === "egreso" ? "egreso" : "ingreso",
    };
};

// Balance
export const calcularBalance = (aportes: any[]) => {
    let totalIngresos = 0;
    let totalEgresos = 0;
    aportes.forEach((aporte) => {
        if (esEgreso(aporte)) totalEgresos += aMonto(aporte.monto);
        else totalIngresos += aMonto(aporte.monto);
    });
    return { totalIngresos, totalEgresos, balance: totalIngresos - totalEgresos };
};

// Gráfico (GraficoAporte)
// Suma los montos por texto y ordena de mayor a menor
export const agruparPorTexto = (aportes: any[], campo: string) => {
    const grupos = new Map();
    aportes.forEach((aporte: any) => {
        const texto = String(aporte[campo] ?? "").trim() || "Sin dato";
        const clave = texto.toLowerCase();
        const actual = grupos.get(clave) || { categoria: texto, monto: 0 };
        actual.monto += aMonto(aporte.monto);
        grupos.set(clave, actual);
    });

    return [...grupos.values()]
        .sort((a, b) => b.monto - a.monto)
        .slice(0, TOP_N)
        .map((grupo, idx) => ({ ...grupo, destacado: idx === 0 }));
};

// Suma los montos por mes, en orden cronológico
export const agruparPorMes = (aportes: any[]) => {
    const grupos = new Map();
    aportes.forEach((aporte: any) => {
        const iso = normalizarFechaISO(aporte.fecha_aporte);
        if (!iso) return;
        const [anio, mes] = iso.split("-");
        const clave = `${anio}-${mes}`;
        const etiqueta = `${MESES[Number(mes) - 1] ?? mes} ${anio}`;
        const actual = grupos.get(clave) || { clave, categoria: etiqueta, monto: 0 };
        actual.monto += aMonto(aporte.monto);
        grupos.set(clave, actual);
    });

    return [...grupos.values()]
        .sort((a, b) => a.clave.localeCompare(b.clave))
        .map(({ categoria, monto }) => ({ categoria, monto, destacado: false }));
};

