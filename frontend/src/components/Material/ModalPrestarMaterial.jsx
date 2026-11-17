import { useEffect, useRef, useState, useMemo } from "react";
import { getUserCarreraId } from "../../services/user.service.js";

const hoyISO = () => new Date().toLocaleDateString("en-CA");

// Selector de prestatario con buscador integrado.

const PrestatarioSelector = ({ value, onChange, error, usuarios = [], carreraId }) => {
    const [busqueda, setBusqueda] = useState("");
    const [abierto, setAbierto] = useState(false);
    const ref = useRef(null);

    // Normaliza: minúsculas y sin tildes para búsqueda tolerante
    const norm = (v) =>
        String(v ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();

    // Filtra los usuarios para mostrar únicamente los de la respectiva carrera
    const usuariosCandidatos = useMemo(() => {
        if (!carreraId) return usuarios;
        return usuarios.filter((u) => {
            const uCarrera = u.carreraId ?? u.carrera?.id_carrera ?? u.carreras?.id_carrera;
            return Number(uCarrera) === Number(carreraId);
        });
    }, [usuarios, carreraId]);

    const usuariosFiltrados = usuariosCandidatos.filter((u) =>
        norm(u.username).includes(norm(busqueda))
    );

    // Cierra el dropdown al hacer click fuera
    useEffect(() => {
        const handleClickFuera = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setAbierto(false);
            }
        };
        document.addEventListener("mousedown", handleClickFuera);
        return () => document.removeEventListener("mousedown", handleClickFuera);
    }, []);

    const seleccionar = (username) => {
        onChange(username);
        setBusqueda("");
        setAbierto(false);
    };

    // Sin lista de usuarios para la carrera: input de texto libre
    if (!usuariosCandidatos.length) {
        return (
            <input
                type="text"
                placeholder="Nombre y apellido del alumno"
                className={`input input-bordered w-full ${error ? "input-error" : ""}`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                autoFocus
            />
        );
    }

    return (
        <div ref={ref} className="relative w-full">
            {/* Campo que muestra la selección o el buscador */}
            <div
                className={`input input-bordered w-full flex items-center gap-2 cursor-pointer ${error ? "input-error" : ""}`}
                onClick={() => setAbierto((prev) => !prev)}
            >
                {value ? (
                    <span className="flex-1 truncate text-base-content">{value}</span>
                ) : (
                    <span className="flex-1 text-base-content/40">Seleccionar prestatario...</span>
                )}
                <svg
                    className={`w-4 h-4 shrink-0 transition-transform ${abierto ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {/* Dropdown con buscador */}
            {abierto && (
                <div className="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded-xl shadow-lg overflow-hidden">
                    {/* Buscador */}
                    <div className="p-2 border-b border-base-300">
                        <input
                            type="text"
                            className="input input-bordered input-sm w-full"
                            placeholder="Buscar usuario..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                        />
                    </div>

                    {/* Lista filtrada */}
                    <ul className="max-h-48 overflow-y-auto">
                        {usuariosFiltrados.length === 0 ? (
                            <li className="px-4 py-2 text-sm text-base-content/50 italic">
                                Sin resultados
                            </li>
                        ) : (
                            usuariosFiltrados.map((u) => (
                                <li
                                    key={u.id}
                                    className={`px-4 py-2 text-sm cursor-pointer hover:bg-primary/10 transition-colors
                                        ${value === u.username ? "bg-primary/20 font-semibold text-primary" : "text-base-content"}`}
                                    onClick={() => seleccionar(u.username)}
                                >
                                    {u.username}
                                    {u.email && (
                                        <span className="ml-2 text-xs text-base-content/50">{u.email}</span>
                                    )}
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export const ModalPrestarMaterial = ({
    abierto,
    material,
    onPrestar,
    onCerrar,
    usuarios = [],
}) => {
    const [prestatario, setPrestatario] = useState("");
    const [fechaPrestamo, setFechaPrestamo] = useState(hoyISO());
    const [tneEntregada, setTneEntregada] = useState("false");
    const [errores, setErrores] = useState({});
    const [guardando, setGuardando] = useState(false);

    const carreraObjetivo = material?.carreraId ?? material?.carrera?.id_carrera ?? getUserCarreraId();

    useEffect(() => {
        if (abierto) {
            setPrestatario("");
            setFechaPrestamo(hoyISO());
            setTneEntregada("false");
            setErrores({});
            setGuardando(false);
        }
    }, [abierto, material]);

    if (!abierto || !material) return null;

    const handleSubmit = async (e) => {
        e?.preventDefault();
        const err = {};
        const nombre = prestatario.trim();

        if (!nombre) {
            err.prestatario = "El nombre del estudiante es obligatorio";
        } else if (nombre.length < 3 || nombre.length > 60) {
            err.prestatario = "Debe tener entre 3 y 60 caracteres";
        }

        if (!fechaPrestamo) {
            err.fechaPrestamo = "Selecciona la fecha del préstamo";
        }

        // Validación estricta: No se permite registrar el préstamo sin marcar la opción tne_entregada en true
        if (tneEntregada !== "true") {
            err.tneEntregada = "Es obligatorio marcar la entrega de la TNE en garantía para registrar el préstamo.";
        }

        setErrores(err);
        if (Object.keys(err).length > 0) return;

        setGuardando(true);
        const ok = await onPrestar({
            materialId: material.id_material ?? material.id,
            prestatario: nombre,
            fecha_prestamo: fechaPrestamo,
            tne_entregada: true,
        });
        setGuardando(false);

        if (ok) {
            onCerrar();
        }
    };

    const stockDisponible = Number(material.stock ?? 0);

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"
            onClick={onCerrar}
        >
            <div
                className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto border border-base-300"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
                    onClick={onCerrar}
                    aria-label="Cerrar modal"
                >
                    ✕
                </button>

                <h3 className="text-xl font-bold text-center w-full mb-2 text-base-content">
                    Prestar material
                </h3>

                <div className="bg-base-200 rounded-lg p-3 mb-4 text-center">
                    <p className="font-semibold text-primary">{material.nombre_material}</p>
                    <p className="text-xs text-base-content/70">
                        Stock disponible: <span className="font-bold">{stockDisponible}</span> {stockDisponible === 1 ? "unidad" : "unidades"}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-semibold">
                                Nombre del estudiante (Prestatario) <span className="text-error">*</span>
                            </span>
                        </label>
                        <PrestatarioSelector
                            value={prestatario}
                            onChange={(val) => {
                                setPrestatario(val);
                                if (errores.prestatario) setErrores((prev) => ({ ...prev, prestatario: null }));
                            }}
                            error={errores.prestatario}
                            usuarios={usuarios}
                            carreraId={carreraObjetivo}
                        />
                        {errores.prestatario && (
                            <span className="text-xs text-error mt-1">{errores.prestatario}</span>
                        )}
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-semibold">
                                Fecha de préstamo <span className="text-error">*</span>
                            </span>
                        </label>
                        <input
                            type="date"
                            className="input input-bordered w-full"
                            value={fechaPrestamo}
                            onChange={(e) => setFechaPrestamo(e.target.value)}
                        />
                        {errores.fechaPrestamo && (
                            <span className="text-xs text-error mt-1">{errores.fechaPrestamo}</span>
                        )}
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-semibold">
                                ¿TNE entregada en garantía? <span className="text-error">*</span>
                            </span>
                        </label>
                        <select
                            className={`select select-bordered w-full ${errores.tneEntregada ? "select-error" : ""}`}
                            value={tneEntregada}
                            onChange={(e) => {
                                setTneEntregada(e.target.value);
                                if (errores.tneEntregada) setErrores((prev) => ({ ...prev, tneEntregada: null }));
                            }}
                        >
                            <option value="false">No (No permitido)</option>
                            <option value="true">Sí (TNE Entregada)</option>
                        </select>
                        {errores.tneEntregada && (
                            <span className="text-xs text-error mt-1">{errores.tneEntregada}</span>
                        )}
                    </div>

                    <p className="text-xs text-base-content/70 italic">
                        * Al registrar el préstamo, se descontará automáticamente 1 unidad del stock disponible.
                    </p>

                    <div className="flex justify-end gap-3 pt-3 border-t border-base-300">
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={onCerrar}
                            disabled={guardando}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary btn-sm"
                            disabled={guardando || stockDisponible < 1}
                        >
                            {guardando ? (
                                <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                                "Registrar préstamo"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalPrestarMaterial;
