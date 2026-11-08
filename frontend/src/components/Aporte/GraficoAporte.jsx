import { useMemo, useState } from "react";
import { ResponsiveBar } from "@nivo/bar";
import { formatoCLP, formatoCompacto, agruparPorTexto, agruparPorMes, aMonto, esEgreso } from "../../utils/aporte.utils.js";
import { CRITERIOS, COLOR_BASE, COLOR_DESTACADO } from "../../constants/aporte.constants.jsx";

// El gráfico muestra solo ingresos (aportes recibidos); los egresos se ven en el balance y en el reporte
export const GraficoAportes = ({ aportes = [] }) => {
    const [criterio, setCriterio] = useState("procedencia");

    const ingresos = useMemo(() => aportes.filter((aporte) => !esEgreso(aporte)), [aportes]);

    const datos = useMemo(() => {
        if (criterio === "procedencia") return agruparPorTexto(ingresos, "procedencia");
        if (criterio === "actividad") return agruparPorTexto(ingresos, "descripcion_aporte");
        return agruparPorMes(ingresos);
    }, [ingresos, criterio]);

    const total = useMemo(
        () => ingresos.reduce((suma, aporte) => suma + aMonto(aporte.monto), 0),
        [ingresos]
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
                        margin={
                            esPorMes
                                ? { top: 20, right: 20, bottom: 70, left: 80 }
                                : {
                                    top: 20,
                                    right: 30,
                                    bottom: 50,
                                    left: criterio === "actividad" ? 250 : 180,
                                }
                        }
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
                                : {
                                    tickSize: 5,
                                    tickPadding: 8,
                                    tickRotation: 0,
                                    format: (valor) => {
                                        const texto = String(valor ?? "");
                                        return texto.length > 38 ? `${texto.slice(0, 36)}…` : texto;
                                    },
                                }
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