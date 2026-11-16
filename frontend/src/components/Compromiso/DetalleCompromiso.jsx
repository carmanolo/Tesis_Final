import { useEffect, useState } from "react";
import { formatearFechaDDMMAAAA } from "../../utils/calendar.utils.js";
import { formatoCLP } from "../../utils/aporte.utils.js";
import { COMPROMISO_DESCRIPCION_MIN, COMPROMISO_DESCRIPCION_MAX } from "../../constants/compromiso.constants.jsx";
import { valoresIniciales, resumenDe } from "../../utils/compromiso.utils.js";
import { FinanciamientoCompromiso } from "./FinanciamientoCompromiso.jsx";

const validar = ({ descripcion_compromiso, fecha_compromiso, monto_total }, financiado = 0) => {
    const errores = {};
    const descripcion = (descripcion_compromiso || "").trim();

    if (!descripcion) {
        errores.descripcion_compromiso = "Escribe una descripción";
    } else if (descripcion.length < COMPROMISO_DESCRIPCION_MIN || descripcion.length > COMPROMISO_DESCRIPCION_MAX) {
        errores.descripcion_compromiso = `La descripción debe tener entre ${COMPROMISO_DESCRIPCION_MIN} y ${COMPROMISO_DESCRIPCION_MAX} caracteres`;
    }

    if (!fecha_compromiso) errores.fecha_compromiso = "Selecciona una fecha";

    const monto = Number(monto_total);
    if (!Number.isInteger(monto) || monto <= 0) {
        errores.monto_total = "El monto debe ser un entero mayor a 0";
    } else if (monto < financiado) {
        errores.monto_total = `No puede ser menor a lo ya financiado (${formatoCLP.format(financiado)})`;
    }

    return errores;
};


export const DetalleCompromiso = ({ abierto, compromiso, compromisos, aportes, puedeGestionar, onCrear, 
    onEditar,  onEliminar, onAsignarAporte, onQuitarAporte, onDescargar, descargando, onCerrar,}) => {
    const esNuevo = !compromiso;
    const [editando, setEditando] = useState(false);
    const [form, setForm] = useState(valoresIniciales(null));
    const [errores, setErrores] = useState({});
    const [guardando, setGuardando] = useState(false);

    // Reinicia el formulario cada vez que se abre o cambia el compromiso seleccionado
    useEffect(() => {
        setForm(valoresIniciales(compromiso));
        setErrores({});
        setEditando(!compromiso);
    }, [compromiso?.id_compromiso, abierto]);

    if (!abierto) return null;

    const cambiar = (campo) => (e) => {
        const valor = e.target.value;
        setForm((prev) => ({ ...prev, [campo]: valor }));
        if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: undefined }));
    };

    const handleGuardar = async () => {
        const financiado = compromiso ? resumenDe(compromiso).totalFinanciado : 0;
        const erroresForm = validar(form, financiado);
        setErrores(erroresForm);
        if (Object.keys(erroresForm).length > 0) return;

        const datos = {
            descripcion_compromiso: form.descripcion_compromiso.trim(),
            fecha_compromiso: form.fecha_compromiso,
            monto_total: Number(form.monto_total),
        };

        setGuardando(true);
        const ok = esNuevo ? await onCrear(datos) : await onEditar(compromiso.id_compromiso, datos);
        setGuardando(false);

        if (!ok) return;
        if (esNuevo) onCerrar();
        else setEditando(false);
    };

    const handleCancelar = () => {
        if (esNuevo) {
            onCerrar();
            return;
        }
        setForm(valoresIniciales(compromiso));
        setErrores({});
        setEditando(false);
    };

    const handleEliminar = async () => {
        const ok = await onEliminar(compromiso.id_compromiso);
        if (ok) onCerrar();
    };

    const campo = (etiqueta, nombre, contenidoLectura, entrada) => (
        <div className="border border-base-content/20 rounded-lg px-4 py-3">
            <label className="text-sm text-base-content/60 block mb-1">{etiqueta}</label>
            {editando ? entrada : <p className="font-medium break-words">{contenidoLectura}</p>}
            {errores[nombre] && <p className="text-xs text-error mt-1">{errores[nombre]}</p>}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onCerrar}>
            <div
                className={`bg-white rounded-2xl shadow-xl w-full p-5 sm:p-8 relative max-h-full overflow-y-auto ${esNuevo ? "max-w-md" : "max-w-2xl"}`}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3 sm:right-6 sm:top-6"
                    onClick={onCerrar}
                    aria-label="Cerrar"
                >
                    ✕
                </button>

                <h3 className="text-2xl font-bold text-center w-full mb-6 px-8">
                    {esNuevo ? "Crear compromiso" : editando ? "Editar compromiso" : "Detalle del compromiso"}
                </h3>

                <div className="space-y-4 mb-6">
                    {campo(
                        "Descripción:",
                        "descripcion_compromiso",
                        compromiso?.descripcion_compromiso,
                        <textarea
                            className={`textarea textarea-bordered w-full ${errores.descripcion_compromiso ? "textarea-error" : ""}`}
                            rows={3}
                            maxLength={COMPROMISO_DESCRIPCION_MAX}
                            placeholder="¿Qué se va a pagar o realizar?"
                            value={form.descripcion_compromiso}
                            onChange={cambiar("descripcion_compromiso")}
                            autoFocus={esNuevo}
                        />
                    )}
                    {campo(
                        "Fecha:",
                        "fecha_compromiso",
                        compromiso && formatearFechaDDMMAAAA(compromiso.fecha_compromiso),
                        <input
                            type="date"
                            className="input input-bordered w-full"
                            value={form.fecha_compromiso}
                            onChange={cambiar("fecha_compromiso")}
                        />
                    )}
                    {campo(
                        "Monto total:",
                        "monto_total",
                        compromiso && formatoCLP.format(Number(compromiso.monto_total) || 0),
                        <input
                            type="number"
                            min="1"
                            step="1"
                            className={`input input-bordered w-full ${errores.monto_total ? "input-error" : ""}`}
                            value={form.monto_total}
                            onChange={cambiar("monto_total")}
                        />
                    )}
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                    {editando ? (
                        <>
                            <button className="btn btn-primary" onClick={handleGuardar} disabled={guardando}>
                                {esNuevo ? "Crear compromiso" : "Guardar cambios"}
                            </button>
                            <button className="btn btn-neutral" onClick={handleCancelar} disabled={guardando}>
                                Cancelar
                            </button>
                        </>
                    ) : (
                        <>
                            {puedeGestionar && (
                                <>
                                    <button className="btn btn-primary" onClick={() => setEditando(true)}>
                                        Editar
                                    </button>
                                    <button className="btn btn-error" onClick={handleEliminar}>
                                        Eliminar
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>

                {!esNuevo && !editando && (
                    <FinanciamientoCompromiso
                        compromiso={compromiso}
                        compromisos={compromisos}
                        aportes={aportes}
                        puedeGestionar={puedeGestionar}
                        onAsignar={onAsignarAporte}
                        onQuitar={onQuitarAporte}
                        onDescargar={onDescargar}
                        descargando={descargando}
                    />
                )}
            </div>
        </div>
    );
};

export default DetalleCompromiso;