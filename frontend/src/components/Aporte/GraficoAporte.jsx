import { useMemo, useState } from "react";
import { ResponsiveBar } from "@nivo/bar";
import { MESES, normalizarFechaISO } from "../../utils/calendar.utils.js";

const COLOR_BASE = "#014898";
const COLOR_DESTACADO = "#EE820F";
const TOP_N = 10;

const CRITERIOS = [
    { id: "procedencia", etiqueta: "Procedencia con más aportes" },
    { id: "actividad", etiqueta: "Actividad con mayor monto" },
    { id: "mes", etiqueta: "Aportes por mes" },
];

const formatoCLP = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
});
const formatoCompacto = new Intl.NumberFormat("es-CL", { notation: "compact" });

const aMonto = (valor) => Number(valor) || 0;

// Suma los montos por texto (ignora mayúsculas y espacios extra) y ordena de mayor a menor
const agruparPorTexto = (aportes, campo) => {
    const grupos = new Map();
    aportes.forEach((aporte) => {
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
const agruparPorMes = (aportes) => {
    const grupos = new Map();
    aportes.forEach((aporte) => {
        const iso = normalizarFechaISO(aporte.fecha_aporte); // AAAA-MM-DD
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

export const GraficoAportes = ({ aportes = [] }) => {
    const [criterio, setCriterio] = useState("procedencia");

    const datos = useMemo(() => {
        if (criterio === "procedencia") return agruparPorTexto(aportes, "procedencia");
        if (criterio === "actividad") return agruparPorTexto(aportes, "descripcion_aporte");
        return agruparPorMes(aportes);
    }, [aportes, criterio]);

    const total = useMemo(
        () => aportes.reduce((suma, aporte) => suma + aMonto(aporte.monto), 0),
        [aportes]
    );

    const esPorMes = criterio === "mes";
    // En barras horizontales nivo dibuja el primer dato abajo; se invierte para que el mayor quede arriba
    const datosGrafico = esPorMes ? datos : [...datos].reverse();
    const lider = !esPorMes ? datos[0] : null;

    return (
        <div className="rounded-box border border-base-content/10 bg-base-100 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-b border-base-content/10">
                <div role="tablist" className="join">
                    {CRITERIOS.map((c) => (
                        <button
                            key={c.id}
                            role="tab"
                            aria-selected={criterio === c.id}
                            className={`join-item btn btn-sm ${criterio === c.id ? "btn-primary" : ""}`}
                            onClick={() => setCriterio(c.id)}
                        >
                            {c.etiqueta}
                        </button>
                    ))}
                </div>
                <p className="text-sm text-base-content/70">
                    Total aportado: <span className="font-semibold text-base-content">{formatoCLP.format(total)}</span>
                </p>
            </div>

            {lider && (
                <p className="px-4 pt-3 text-sm">
                    {criterio === "procedencia" ? "Mayor aportante" : "Actividad con más monto"}:{" "}
                    <span className="font-semibold">{lider.categoria}</span> con{" "}
                    <span className="font-semibold">{formatoCLP.format(lider.monto)}</span>
                </p>
            )}

            <div className="h-96 p-2">
                {datosGrafico.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-base-content/60">
                        Aún no hay aportes para mostrar.
                    </div>
                ) : (
                    <ResponsiveBar
                        data={datosGrafico}
                        keys={["monto"]}
                        indexBy="categoria"
                        layout={esPorMes ? "vertical" : "horizontal"}
                        margin={esPorMes ? { top: 20, right: 20, bottom: 70, left: 80 } : { top: 20, right: 30, bottom: 50, left: 170 }}
                        padding={0.3}
                        colors={(barra) => (barra.data.destacado ? COLOR_DESTACADO : COLOR_BASE)}
                        valueFormat={(valor) => formatoCLP.format(valor)}
                        enableLabel={false}
                        axisBottom={
                            esPorMes
                                ? { tickRotation: -30 }
                                : { format: (valor) => formatoCompacto.format(valor) }
                        }
                        axisLeft={
                            esPorMes
                                ? { format: (valor) => formatoCompacto.format(valor) }
                                : null
                        }
                        enableGridX={!esPorMes}
                        enableGridY={esPorMes}
                        animate
                        role="img"
                        ariaLabel="Gráfico de barras de aportes"
                        tooltip={({ indexValue, value }) => (
                            <div className="rounded bg-base-100 border border-base-content/20 px-3 py-2 text-sm shadow">
                                <span className="font-semibold">{indexValue}</span>: {formatoCLP.format(value)}
                            </div>
                        )}
                    />
                )}
            </div>
        </div>
    );
};

export default GraficoAportes;