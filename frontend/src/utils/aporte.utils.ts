import { normalizarFechaISO, MESES } from "./calendar.utils.js";
import { OPCIONES_PROCEDENCIA, OPCIONES_DESCRIPCION, TOP_N } from "../constants/aporte.constants.jsx";

// ---------- Formatos ----------
export const formatoCLP = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
});

// Pasar moneda a valor chileno en formato corto (ejes del gráfico)
export const formatoCompacto = new Intl.NumberFormat("es-CL", { notation: "compact" });

export const aMonto = (valor: any) => Number(valor) || 0;

const hoyISO = () => new Date().toLocaleDateString("en-CA");

// Los registros sin tipo se consideran ingresos (igual que el backend)
export const esEgreso = (aporte: any) => aporte?.tipo === "egreso";

// ---------- Formulario (DetalleAporte) ----------
export const obtenerEstadoProcedencia = (procedencia: string) => {
    if (!procedencia) {
        return { procedencia: "", otra_procedencia: "" };
    }
    const opcionExacta = OPCIONES_PROCEDENCIA.find(
        (op) => op.toLowerCase() !== "otro" && op.toLowerCase() === procedencia.toLowerCase()
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
    const opcionExacta = OPCIONES_DESCRIPCION.find(
        (op) => op.toLowerCase() !== "otro" && op.toLowerCase() === descripcion.toLowerCase()
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
    const estadoDescripcion = obtenerEstadoDescripcion(aporte?.descripcion_aporte);
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

// ---------- Balance (misma lógica que calcularResumen del backend) ----------
export const calcularBalance = (aportes: any[]) => {
    let totalIngresos = 0;
    let totalEgresos = 0;
    aportes.forEach((aporte) => {
        if (esEgreso(aporte)) totalEgresos += aMonto(aporte.monto);
        else totalIngresos += aMonto(aporte.monto);
    });
    return { totalIngresos, totalEgresos, balance: totalIngresos - totalEgresos };
};

// ---------- Gráfico (GraficoAporte) ----------
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

