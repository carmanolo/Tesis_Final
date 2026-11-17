import { useMemo } from "react";
import { formatearFechaDDMMAAAA } from "../../utils/calendar.utils.js";
import { formatoCLP } from "../../utils/aporte.utils.js";
import { resumenDe } from "../../utils/compromiso.utils.js";

// Sección del detalle: cuánto está financiado y qué aportes lo financian (vista de lectura).
// La asignación de aportes se gestiona desde la sección Aportes.
export const FinanciamientoCompromiso = ({ compromiso, aportes, puedeGestionar, onQuitar, onDescargar, descargando}) => {
    const resumen = resumenDe(compromiso);
    const requiereSolicitud = resumen.saldoPorFinanciar > 0;

    const aportesPorId = useMemo(() => new Map(aportes.map((a) => [a.id_aporte, a])), [aportes]);

    const asignaciones = compromiso.aportes ?? [];

    return (
        <div className="border-t border-base-content/10 pt-6 mt-6">
            <h4 className="text-lg font-semibold mb-4">Financiamiento</h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 mb-3">
                <div>
                    <p className="text-sm text-base-content/60">Monto total</p>
                    <p className="font-medium">{formatoCLP.format(resumen.montoTotal)}</p>
                </div>
                <div>
                    <p className="text-sm text-base-content/60">Aportes asignados</p>
                    <p className="font-medium">{formatoCLP.format(resumen.totalFinanciado)}</p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                    <p className="text-sm text-base-content/60">Falta financiar</p>
                    <p className="text-xl font-bold">{formatoCLP.format(resumen.saldoPorFinanciar)}</p>
                </div>
            </div>
            <progress
                className={`progress w-full ${resumen.saldoPorFinanciar === 0 ? "progress-success" : "progress-primary"}`}
                value={resumen.totalFinanciado}
                max={resumen.montoTotal || 1}
                aria-label="Porcentaje financiado"
            />

            <ul className="mt-5 divide-y divide-base-content/10">
                {asignaciones.length === 0 && (
                    <li className="py-3 text-base-content/60">Este compromiso aún no tiene aportes asignados.</li>
                )}
                {asignaciones.map((asignacion) => {
                    const aporte = aportesPorId.get(asignacion.aporteId);
                    return (
                        <li key={asignacion.aporteId} className="py-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <div className="min-w-0 flex-1 basis-full sm:basis-0">
                                <p className="font-medium break-words">
                                    {aporte?.descripcion_aporte ?? `Aporte #${asignacion.aporteId}`}
                                </p>
                                {aporte && (
                                    <p className="text-sm text-base-content/60">
                                        {aporte.procedencia}, {formatearFechaDDMMAAAA(aporte.fecha_aporte)}
                                    </p>
                                )}
                            </div>
                            <p className="font-semibold">{formatoCLP.format(Number(asignacion.monto_asignado) || 0)}</p>
                            {puedeGestionar && (
                                <button
                                    className="btn btn-ghost btn-xs text-error ml-auto"
                                    onClick={() => onQuitar(compromiso.id_compromiso, asignacion.aporteId)}
                                >
                                    Quitar
                                </button>
                            )}
                        </li>
                    );
                })}
            </ul>

            {puedeGestionar && (
                <p className="mt-4 text-xs text-base-content/50">
                    Para asignar aportes a este compromiso, ve a la sección <strong>Aportes</strong> y selecciona un ingreso.
                </p>
            )}

            {puedeGestionar && !requiereSolicitud && (
                <p className="mt-6 text-sm text-base-content/60">
                    Compromiso totalmente financiado: no requiere solicitud de fondos.
                </p>
            )}
            {puedeGestionar && requiereSolicitud &&(
                <div className="mt-6 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-base-content/60 mr-1">Solicitud de fondos</span>
                    <button
                        className="btn btn-outline btn-sm"
                        onClick={() => onDescargar(compromiso.id_compromiso, "pdf")}
                        disabled={descargando}
                    >
                        {descargando ? "Generando..." : "Descargar PDF"}
                    </button>
                    <button
                        className="btn btn-outline btn-sm"
                        onClick={() => onDescargar(compromiso.id_compromiso, "excel")}
                        disabled={descargando}
                    >
                        Descargar Excel
                    </button>
                </div>
            )}
        </div>
    );
};

export default FinanciamientoCompromiso;