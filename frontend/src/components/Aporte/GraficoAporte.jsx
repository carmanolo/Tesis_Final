import { useEffect, useMemo, useState } from "react";
import { ResponsiveBar } from "@nivo/bar";
import { formatoCLP, formatoCompacto, agruparPorTexto, agruparPorMes, aMonto, esEgreso } from "../../utils/aporte.utils.js";
import { CRITERIOS, COLOR_BASE, COLOR_DESTACADO } from "../../constants/aporte.constants.jsx";

// El gráfico muestra solo ingresos (aportes recibidos); los egresos se ven en el balance y en el reporte
export const GraficoAportes = ({ aportes = [] }) => {
    const [criterio, setCriterio] = useState("procedencia");
    const [isMobile, setIsMobile] = useState(
        typeof window !== "undefined" ? window.innerWidth < 640 : false
    );

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

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

    // Márgenes dinámicos y adaptativos según el tamaño de la pantalla
    const margins = useMemo(() => {
        if (esPorMes) {
            return isMobile
                ? { top: 15, right: 15, bottom: 65, left: 60 }
                : { top: 20, right: 20, bottom: 70, left: 80 };
        }
        return isMobile
            ? {
                top: 15,
                right: 20,
                bottom: 50,
                left: criterio === "actividad" ? 105 : 75,
            }
            : {
                top: 20,
                right: 30,
                bottom: 50,
                left: criterio === "actividad" ? 250 : 180,
            };
    }, [esPorMes, isMobile, criterio]);

    const formatNumeroCorto = (valor) => {
        if (valor === 0) return "0";
        return `$${formatoCompacto.format(valor).replace(/\s+/g, "")}`;
    };

    return (
        <div className="w-full max-w-full rounded-box border border-base-content/10 bg-base-100 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border-b border-base-content/10">
                <div role="tablist" className="join w-full sm:w-auto">
                    {CRITERIOS.map((c) => (
                        <button
                            key={c.id}
                            role="tab"
                            aria-selected={criterio === c.id}
                            className={`join-item btn btn-xs sm:btn-sm flex-1 sm:flex-initial ${criterio === c.id ? "btn-primary" : ""}`}
                            onClick={() => setCriterio(c.id)}
                        >
                            {isMobile ? (c.corta || c.etiqueta) : c.etiqueta}
                        </button>
                    ))}
                </div>
                <p className="text-xs sm:text-sm text-base-content/70 self-end sm:self-auto">
                    Total aportado: <span className="font-semibold text-base-content">{formatoCLP.format(total)}</span>
                </p>
            </div>

            {lider && (
                <p className="px-4 pt-3 text-xs sm:text-sm">
                    {criterio === "procedencia" ? "Mayor aportante" : "Actividad con más monto"}:{" "}
                    <span className="font-semibold">{lider.categoria}</span> con{" "}
                    <span className="font-semibold text-primary">{formatoCLP.format(lider.monto)}</span>
                </p>
            )}

            <div className="w-full h-[320px] sm:h-96 p-1 sm:p-2 overflow-hidden">
                {datosGrafico.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-base-content/60 text-sm">
                        Aún no hay aportes para mostrar.
                    </div>
                ) : (
                    <ResponsiveBar
                        data={datosGrafico}
                        keys={["monto"]}
                        indexBy="categoria"
                        layout={esPorMes ? "vertical" : "horizontal"}
                        margin={margins}
                        padding={0.3}
                        colors={(barra) => (barra.data.destacado ? COLOR_DESTACADO : COLOR_BASE)}
                        valueFormat={(valor) => formatoCLP.format(valor)}
                        enableLabel={false}
                        axisBottom={
                            esPorMes
                                ? {
                                    tickRotation: isMobile ? -45 : -30,
                                    tickSize: isMobile ? 3 : 5,
                                    tickPadding: 6,
                                }
                                : {
                                    tickValues: isMobile ? 3 : 5,
                                    tickRotation: isMobile ? -30 : 0,
                                    format: formatNumeroCorto,
                                    tickSize: isMobile ? 3 : 5,
                                    tickPadding: 6,
                                }
                        }
                        axisLeft={
                            esPorMes
                                ? {
                                    tickValues: isMobile ? 4 : 5,
                                    format: formatNumeroCorto,
                                    tickSize: isMobile ? 3 : 5,
                                    tickPadding: 6,
                                }
                                : {
                                    tickSize: isMobile ? 3 : 5,
                                    tickPadding: isMobile ? 4 : 8,
                                    tickRotation: 0,
                                    format: (valor) => {
                                        const texto = String(valor ?? "");
                                        const maxChars = isMobile
                                            ? (criterio === "actividad" ? 11 : 8)
                                            : 36;
                                        return texto.length > maxChars + 1
                                            ? `${texto.slice(0, maxChars)}…`
                                            : texto;
                                    },
                                }
                        }
                        enableGridX={!esPorMes}
                        enableGridY={esPorMes}
                        gridXValues={!esPorMes ? (isMobile ? 3 : 5) : undefined}
                        gridYValues={esPorMes ? (isMobile ? 4 : 5) : undefined}
                        animate
                        role="img"
                        ariaLabel="Gráfico de barras de aportes"
                        tooltip={({ indexValue, value }) => (
                            <div className="rounded bg-base-100 border border-base-content/20 px-3 py-2 text-xs sm:text-sm shadow">
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