import { useEffect, useMemo, useState } from "react";
import { formatearFechaDDMMAAAA } from "../../utils/calendar.utils.js";
import { formatoCLP } from "../../utils/aporte.utils.js";
import { COMPROMISO_DESCRIPCION_MIN, COMPROMISO_DESCRIPCION_MAX, PUEDE_CREAR_OTRO_COMPROMISO } from "../../constants/compromiso.constants.jsx";
import { valoresIniciales, resumenDe, getOpcionesDescripcionCompromiso, guardarNuevaDescripcionCompromiso } from "../../utils/compromiso.utils.js";
import { getUserRole } from "../../services/user.service.js";
import { FinanciamientoCompromiso } from "./FinanciamientoCompromiso.jsx";

function parseFechaLocal(fechaStr) {
    if (!fechaStr) return new Date();
    const [year, month, day] = fechaStr.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function esFechaAnteriorAHoy(fechaStr) {
    if (!fechaStr) return false;
    const fecha = parseFechaLocal(fechaStr);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return fecha < hoy;
}

const validar = ({ descripcion_compromiso, otra_descripcion, fecha_compromiso, monto_total }, financiado = 0, esNuevo = false) => {
    const errores = {};

    if (!descripcion_compromiso) {
        errores.descripcion_compromiso = "Selecciona una descripción";
    } else if (descripcion_compromiso.toLowerCase() === "otro") {
        const descripcionTrim = (otra_descripcion || "").trim();
        if (!descripcionTrim) {
            errores.descripcion_compromiso = "Debes ingresar la nueva descripción";
        } else if (descripcionTrim.length < COMPROMISO_DESCRIPCION_MIN || descripcionTrim.length > COMPROMISO_DESCRIPCION_MAX) {
            errores.descripcion_compromiso = `La descripción debe tener entre ${COMPROMISO_DESCRIPCION_MIN} y ${COMPROMISO_DESCRIPCION_MAX} caracteres`;
        }
    }

    if (!fecha_compromiso) {
        errores.fecha_compromiso = "Selecciona una fecha";
    } else if (esNuevo && esFechaAnteriorAHoy(fecha_compromiso)) {
        errores.fecha_compromiso = "La fecha no puede ser anterior a hoy";
    }

    const monto = Number(monto_total);
    if (!Number.isInteger(monto) || monto <= 10) {
        errores.monto_total = "El monto debe ser un entero mayor a 10";
    } else if (monto < financiado) {
        errores.monto_total = `No puede ser menor a lo ya financiado (${formatoCLP.format(financiado)})`;
    }

    return errores;
};


export const DetalleCompromiso = ({ abierto, compromiso, compromisos, aportes, puedeGestionar, onCrear, 
    onEditar,  onEliminar, onDescargar, descargando, onCerrar,}) => {
    const userRole = String(getUserRole() ?? "").toLowerCase();
    const puedeCrearOtro = PUEDE_CREAR_OTRO_COMPROMISO.includes(userRole);

    const esNuevo = !compromiso;
    const [editando, setEditando] = useState(false);
    const [form, setForm] = useState(valoresIniciales(null));
    const [errores, setErrores] = useState({});
    const [guardando, setGuardando] = useState(false);

    // Opciones del selector cerrado (incluye las custom registradas en localStorage)
    const [opcionesDescripcion, setOpcionesDescripcion] = useState(getOpcionesDescripcionCompromiso);

    const actualizarOpciones = () => {
        setOpcionesDescripcion(getOpcionesDescripcionCompromiso());
    };

    // Reinicia el formulario cada vez que se abre o cambia el compromiso seleccionado
    useEffect(() => {
        actualizarOpciones();
        setForm(valoresIniciales(compromiso));
        setErrores({});
        setEditando(!compromiso);
    }, [compromiso?.id_compromiso, abierto]);

    // Opciones visibles según el rol del usuario (solo presidente y tesorero ven la opción "Otro")
    const opcionesVisibles = useMemo(() => {
        if (puedeCrearOtro) return opcionesDescripcion;
        return opcionesDescripcion.filter((op) => op.toLowerCase() !== "otro");
    }, [opcionesDescripcion, puedeCrearOtro]);

    if (!abierto) return null;

    const cambiar = (campo) => (e) => {
        const valor = e.target.value;
        setForm((prev) => ({ ...prev, [campo]: valor }));
        if (campo === "descripcion_compromiso" || campo === "otra_descripcion") {
            setErrores((prev) => ({ ...prev, descripcion_compromiso: undefined }));
        } else if (errores[campo]) {
            setErrores((prev) => ({ ...prev, [campo]: undefined }));
        }
    };

    const handleGuardar = async () => {
        const financiado = compromiso ? resumenDe(compromiso).totalFinanciado : 0;
        const erroresForm = validar(form, financiado, esNuevo);
        setErrores(erroresForm);
        if (Object.keys(erroresForm).length > 0) return;

        const descripcionFinal =
            form.descripcion_compromiso.toLowerCase() === "otro"
                ? form.otra_descripcion.trim()
                : form.descripcion_compromiso.trim();

        // Si fue una descripción nueva con "Otro", guardarla para que quede registrada en el selector
        if (form.descripcion_compromiso.toLowerCase() === "otro") {
            guardarNuevaDescripcionCompromiso(descripcionFinal);
            actualizarOpciones();
        }

        const datos = {
            descripcion_compromiso: descripcionFinal,
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
                        <div className="space-y-2">
                            <select
                                className={`select select-bordered w-full ${errores.descripcion_compromiso && !form.descripcion_compromiso ? "select-error" : ""}`}
                                value={form.descripcion_compromiso}
                                onChange={cambiar("descripcion_compromiso")}
                            >
                                <option value="" disabled>
                                    Selecciona una descripción
                                </option>
                                {opcionesVisibles.map((opcion) => (
                                    <option key={opcion} value={opcion}>
                                        {opcion}
                                    </option>
                                ))}
                            </select>
                            {form.descripcion_compromiso?.toLowerCase() === "otro" && puedeCrearOtro && (
                                <input
                                    type="text"
                                    maxLength={COMPROMISO_DESCRIPCION_MAX}
                                    className={`input input-bordered w-full ${errores.descripcion_compromiso && (!form.otra_descripcion?.trim() || form.otra_descripcion.trim().length < COMPROMISO_DESCRIPCION_MIN) ? "input-error" : ""}`}
                                    placeholder="Ingresa la nueva descripción del compromiso *"
                                    value={form.otra_descripcion}
                                    onChange={cambiar("otra_descripcion")}
                                    autoFocus
                                />
                            )}
                        </div>
                    )}
                    {campo(
                        "Fecha:",
                        "fecha_compromiso",
                        compromiso && formatearFechaDDMMAAAA(compromiso.fecha_compromiso),
                        <input
                            type="date"
                            className={`input input-bordered w-full ${errores.fecha_compromiso ? "input-error" : ""}`}
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
                        onDescargar={onDescargar}
                        descargando={descargando}
                    />
                )}
            </div>
        </div>
    );
};

export default DetalleCompromiso;