import { formatearFechaDDMMAAAA } from "../../utils/calendar.utils.js";
import { formatoCLP } from "../../utils/aporte.utils.js";
import { DIAS_URGENTE } from "../../constants/compromiso.constants.jsx";
import { diasHasta, textoPlazo, resumenDe } from "../../utils/compromiso.utils.js";

// Destaca el compromiso más cercano
export const ProximoCompromiso = ({ compromiso, onVer }) => {
    if (!compromiso) {
        return (
            <section className="rounded-box border border-base-content/10 bg-base-100 p-6 mb-6">
                <h3 className="text-lg font-semibold mb-1">Próximo compromiso</h3>
                <p className="text-base-content/60">No hay compromisos con fecha por venir.</p>
            </section>
        );
    }

    const resumen = resumenDe(compromiso);
    const dias = diasHasta(compromiso.fecha_compromiso);
    const financiado = resumen.montoTotal > 0 && resumen.saldoPorFinanciar === 0;
    const urgente = !financiado && dias !== null && dias <= DIAS_URGENTE;

    // El estado se comunica con texto, no solo con color
    const claseInsignia = financiado ? "badge-success" : urgente ? "badge-warning" : "badge-ghost";
    const textoInsignia = financiado ? "Financiado" : textoPlazo(dias);

    return (
        <section className="rounded-box border border-base-content/10 bg-base-100 p-4 sm:p-6 mb-6">
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <h3 className="text-lg font-semibold">Próximo compromiso</h3>
                <span className={`badge badge-lg ${claseInsignia}`}>{textoInsignia}</span>
                <button className="btn btn-primary btn-sm ml-auto" onClick={() => onVer(compromiso.id_compromiso)}>
                    Ver detalle
                </button>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
                <div className="flex-1 min-w-64 max-w-prose">
                    <p className="text-xl font-semibold break-words">{compromiso.descripcion_compromiso}</p>
                    <p className="text-base-content/60 mt-1">
                        {formatearFechaDDMMAAAA(compromiso.fecha_compromiso)}
                        {compromiso.carrera?.sigla ? `, ${compromiso.carrera.sigla}` : ""}
                    </p>
                </div>

                <div className="text-left sm:text-right">
                    <p className="text-sm text-base-content/60">Falta financiar</p>
                    <p className="text-4xl font-bold leading-tight">{formatoCLP.format(resumen.saldoPorFinanciar)}</p>
                </div>
            </div>

            <progress
                className={`progress w-full mt-5 ${financiado ? "progress-success" : "progress-primary"}`}
                value={resumen.totalFinanciado}
                max={resumen.montoTotal || 1}
                aria-label="Porcentaje financiado"
            />
            <p className="text-sm text-base-content/60 mt-2">
                {formatoCLP.format(resumen.totalFinanciado)} de {formatoCLP.format(resumen.montoTotal)} financiado
                ({resumen.porcentajeFinanciado}%)
            </p>
        </section>
    );
};

export default ProximoCompromiso;