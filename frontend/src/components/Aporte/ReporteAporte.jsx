import { useState } from "react";
import { useDownloadReporteAporte } from "../../hooks/aportes/useDownloadReporteAporte.jsx";

const FORMATOS = [
    { id: "pdf", etiqueta: "PDF" },
    { id: "excel", etiqueta: "Excel (.xlsx)" },
];

export const ReporteAporte = () => {
    const [formato, setFormato] = useState("pdf");
    const [desde, setDesde] = useState("");
    const [hasta, setHasta] = useState("");
    const { handleDownloadReporte, descargando } = useDownloadReporteAporte();

    const descargar = () => handleDownloadReporte(formato, { desde, hasta });

    return (
        <div className="flex flex-wrap items-end gap-3 rounded-box border border-base-content/10 bg-base-100 p-3 mb-4">
            <div>
                <label className="text-sm text-base-content/60 block mb-1">Formato</label>
                <select
                    className="select select-bordered select-sm"
                    value={formato}
                    onChange={(e) => setFormato(e.target.value)}
                    disabled={descargando}
                >
                    {FORMATOS.map((f) => (
                        <option key={f.id} value={f.id}>
                            {f.etiqueta}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="text-sm text-base-content/60 block mb-1">Desde (opcional)</label>
                <input
                    type="date"
                    className="input input-bordered input-sm"
                    value={desde}
                    max={hasta || undefined}
                    onChange={(e) => setDesde(e.target.value)}
                    disabled={descargando}
                />
            </div>

            <div>
                <label className="text-sm text-base-content/60 block mb-1">Hasta (opcional)</label>
                <input
                    type="date"
                    className="input input-bordered input-sm"
                    value={hasta}
                    min={desde || undefined}
                    onChange={(e) => setHasta(e.target.value)}
                    disabled={descargando}
                />
            </div>

            <button className="btn btn-primary btn-sm" onClick={descargar} disabled={descargando}>
                {descargando ? "Generando..." : "Descargar reporte"}
            </button>
        </div>
    );
};

export default ReporteAporte;