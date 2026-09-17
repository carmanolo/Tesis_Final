import { MESES, DIAS_SEMANA, generalDiasDelMes, obtenerFechaKey, esMismodia } from "../../utils/calendar.utils.js"
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";

export const CalendarioReuniones = ({ anio, mes, onCambiarMes, onIrHoy, reunionesPorFecha, onClickReunion }) => {
    const celdas = generalDiasDelMes(anio, mes);
    const hoy = new Date();

    return (
        <div className="rounded-box border border-base-content/10 bg-base-100 overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-base-content/10">
                <button className="btn btn-sm" onClick={onIrHoy}>Hoy</button>
                <div className="flex items-center gap-2">
                    <div className="join">
                        <button className="join-item btn btn-sm" onClick={() => onCambiarMes(-1)}>
                            <HiChevronLeft className="text-base" />
                        </button>
                        <span className="join-item btn btn-sm btn-disabled font-semibold !text-base-content">
                            {MESES[mes]} {anio}
                        </span>
                        <button className="join-item btn btn-sm" onClick={() => onCambiarMes(1)}>
                            <HiChevronRight className="text-base" />
                        </button>
                    </div>
                </div>
                <div className="w-16" />
            </div>

            <section className="grid grid-cols-7 text-center text-xs font-semibold text-base-content/60 border-b border-base-content/10">
                {DIAS_SEMANA.map((d) => (
                    <div key={d} className="py-2">{d}</div>
                ))}
            </section>

            <div className="grid grid-cols-7">
                {celdas.map(({ dia, fecha, delMesActual }, idx) => {
                    const key = obtenerFechaKey(fecha);
                    const reuniones = reunionesPorFecha[key] || [];
                    const esHoy = esMismodia(fecha, hoy);

                    return (
                        <div
                            key={idx}
                            className={`min-h-24 border-b border-r border-base-content/10 p-1 ${delMesActual ? "" : "bg-base-200/40"}`}
                        >
                            <div className={`text-xs mb-1 ${esHoy ? "badge badge-primary" : delMesActual ? "" : "text-base-content/40"}`}>
                                {dia}
                            </div>
                            <div className="flex flex-col gap-1">
                                {reuniones.map((reunion) => (
                                    <button
                                        key={reunion.id_reunion}
                                        onClick={() => onClickReunion(reunion)}
                                        // Verde = ya tiene acta subida, amarillo = pendiente
                                       className={`text-left text-xs truncate rounded px-1 py-0.5 text-white ${
                                            reunion.ruta_archivo
                                            ? "bg-[#014898]"
                                            : "bg-[#EE820F]"
                                        }`}
                                        title={reunion.descripcion}
                                    >
                                        📋 {reunion.descripcion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarioReuniones;