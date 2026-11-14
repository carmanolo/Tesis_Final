import { useState } from "react";
import { HiChevronDown, HiChevronUp } from "react-icons/hi2";
import { formatearFechaDDMMAAAA } from "../../utils/calendar.utils.js";

const EstadoActa = ({ reunion }) => (
    <span
        className={`badge badge-sm text-white border-none ${
            reunion.ruta_archivo ? "bg-[#014898]" : "bg-[#EE820F]"
        }`}
    >
        {reunion.ruta_archivo ? "Acta subida" : "Acta pendiente"}
    </span>
);

const ItemReunion = ({ reunion, onClickReunion }) => (
    <li>
        <button
            className="w-full flex items-center justify-between gap-3 px-4 py-2 text-left hover:bg-base-200 transition-colors"
            onClick={() => onClickReunion(reunion)}
        >
            <div className="min-w-0">
                <p className="text-xs text-base-content/60">
                    {formatearFechaDDMMAAAA(reunion.fecha_reunion)}
                </p>
                <p className="text-sm font-medium truncate">{reunion.descripcion}</p>
            </div>
            <EstadoActa reunion={reunion} />
        </button>
    </li>
);

export const ReunionesLista = ({ proxima, otrasProximas, anteriores, onClickReunion }) => {
    const [abierto, setAbierto] = useState(false);
    const totalOtras = otrasProximas.length + anteriores.length;

    return (
        <div className="space-y-4">
            {/* Reunión más próxima */}
            <section className="rounded-box border border-base-content/10 bg-base-100 p-5">
                <h3 className="text-sm font-semibold text-base-content/60 mb-3">
                    Próxima reunión
                </h3>

                {proxima ? (
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-lg font-bold">
                                {formatearFechaDDMMAAAA(proxima.fecha_reunion)}
                            </p>
                            <p className="text-base-content/80 break-words">{proxima.descripcion}</p>
                            <div className="mt-2">
                                <EstadoActa reunion={proxima} />
                            </div>
                        </div>
                        <button className="btn btn-primary" onClick={() => onClickReunion(proxima)}>
                            Ver detalle
                        </button>
                    </div>
                ) : (
                    <p className="text-base-content/60">No hay reuniones próximas programadas.</p>
                )}
            </section>

            {/* Lista desplegable con el resto */}
            <section className="rounded-box border border-base-content/10 bg-base-100 overflow-hidden">
                <button
                    className="w-full flex items-center justify-between px-4 py-3 font-semibold hover:bg-base-200 transition-colors"
                    onClick={() => setAbierto((v) => !v)}
                    aria-expanded={abierto}
                >
                    <span>Otras reuniones ({totalOtras})</span>
                    {abierto ? <HiChevronUp /> : <HiChevronDown />}
                </button>

                {abierto && (
                    <div className="border-t border-base-content/10 max-h-96 overflow-y-auto">
                        {totalOtras === 0 && (
                            <p className="p-4 text-sm text-base-content/60">
                                No hay otras reuniones registradas.
                            </p>
                        )}

                        {otrasProximas.length > 0 && (
                            <>
                                <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase text-base-content/50">
                                    Próximas
                                </p>
                                <ul className="divide-y divide-base-content/10">
                                    {otrasProximas.map((r) => (
                                        <ItemReunion key={r.id_reunion} reunion={r} onClickReunion={onClickReunion} />
                                    ))}
                                </ul>
                            </>
                        )}

                        {anteriores.length > 0 && (
                            <>
                                <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase text-base-content/50">
                                    Anteriores
                                </p>
                                <ul className="divide-y divide-base-content/10">
                                    {anteriores.map((r) => (
                                        <ItemReunion key={r.id_reunion} reunion={r} onClickReunion={onClickReunion} />
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
};

export default ReunionesLista;