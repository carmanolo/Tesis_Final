import { useEffect, useMemo, useState } from "react";
import { formatearFechaDDMMAAAA } from "../../utils/calendar.utils.js";
import { formatoCLP } from "../../utils/aporte.utils.js";
import { aportesAsignables, resumenDe } from "../../utils/compromiso.utils.js";

// Sección del detalle: cuánto está financiado, qué aportes lo financian y cómo asignar más.
export const FinanciamientoCompromiso = ({ compromiso, compromisos, aportes, puedeGestionar, onAsignar, onQuitar, onDescargar, descargando}) => {
    const resumen = resumenDe(compromiso);
    const requiereSolicitud = resumen.saldoPorFinanciar > 0;
    const [aporteId, setAporteId] = useState("");
    const [monto, setMonto] = useState("");
    const [error, setError] = useState("");
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        setAporteId("");
        setMonto("");
        setError("");
    }, [compromiso.id_compromiso]);

    const asignables = useMemo(
        () => aportesAsignables(aportes, compromisos, compromiso),
        [aportes, compromisos, compromiso]
    );
    const aportesPorId = useMemo(() => new Map(aportes.map((a) => [a.id_aporte, a])), [aportes]);

    // Lo máximo que se puede asignar: el saldo del compromiso o lo que le queda al aporte
    const maximoPara = (item) =>
        item ? Math.min(resumen.saldoPorFinanciar + item.asignadoAqui, item.disponible) : 0;
    const seleccionado = asignables.find((x) => String(x.aporte.id_aporte) === String(aporteId));
    const maximo = maximoPara(seleccionado);

    const elegirAporte = (id) => {
        setAporteId(id);
        setError("");
        const item = asignables.find((x) => String(x.aporte.id_aporte) === String(id));
        setMonto(item ? String(maximoPara(item)) : "");
    };

    const handleAsignar = async () => {
        if (!seleccionado) return setError("Selecciona un aporte");
        const valor = Number(monto);
        if (!Number.isInteger(valor) || valor <= 0) return setError("El monto debe ser un entero mayor a 0");
        if (valor > maximo) return setError(`El monto no puede superar ${formatoCLP.format(maximo)}`);

        setGuardando(true);
        const ok = await onAsignar(compromiso.id_compromiso, {
            aporteId: seleccionado.aporte.id_aporte,
            monto_asignado: valor,
        });
        setGuardando(false);

        if (ok) {
            setAporteId("");
            setMonto("");
            setError("");
        }
    };

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
                                <div className="flex gap-1 ml-auto">
                                    <button
                                        className="btn btn-ghost btn-xs"
                                        onClick={() => elegirAporte(String(asignacion.aporteId))}
                                    >
                                        Cambiar monto
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-xs text-error"
                                        onClick={() => onQuitar(compromiso.id_compromiso, asignacion.aporteId)}
                                    >
                                        Quitar
                                    </button>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>

            {puedeGestionar && (
                <div className="mt-5 rounded-lg bg-base-200/60 p-4">
                    <h5 className="font-semibold mb-3">Asignar un aporte</h5>
                    {asignables.length === 0 ? (
                        <p className="text-base-content/60">
                            No hay aportes con saldo disponible en esta carrera. Registra uno en la sección Aportes.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            <select
                                className="select select-bordered w-full"
                                value={aporteId}
                                onChange={(e) => elegirAporte(e.target.value)}
                                aria-label="Aporte"
                            >
                                <option value="" disabled>
                                    Selecciona un aporte
                                </option>
                                {asignables.map(({ aporte, disponible }) => (
                                    <option key={aporte.id_aporte} value={aporte.id_aporte}>
                                        {aporte.descripcion_aporte} ({aporte.procedencia}), disponible{" "}
                                        {formatoCLP.format(disponible)}
                                    </option>
                                ))}
                            </select>

                            <div>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    className={`input input-bordered w-full ${error ? "input-error" : ""}`}
                                    placeholder="Monto a asignar"
                                    value={monto}
                                    onChange={(e) => {
                                        setMonto(e.target.value);
                                        setError("");
                                    }}
                                    disabled={!seleccionado}
                                    aria-label="Monto a asignar"
                                />
                                {seleccionado && !error && (
                                    <p className="text-xs text-base-content/60 mt-1">
                                        Máximo {formatoCLP.format(maximo)}
                                    </p>
                                )}
                                {error && <p className="text-xs text-error mt-1">{error}</p>}
                            </div>

                            <button className="btn btn-primary btn-sm" onClick={handleAsignar} disabled={guardando}>
                                Asignar aporte
                            </button>
                        </div>
                    )}
                </div>
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