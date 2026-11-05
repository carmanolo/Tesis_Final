import { useState, useEffect, useRef } from "react";
import { FORMATOS_ACEPTADOS, MAX_IMAGENES, TAMANO_MAX_MB } from "../../constants/publicacion.constants.jsx";
import { getImageUrl } from "../../utils/publicacion.utils.js";

const TIPOS_VALIDOS = ["image/jpeg", "image/png", "image/jpg"];

export function ModalPublicacion({ abierto, publicacion, onCrear, onEditar, onEliminarImagen, onCerrar }) {
    const [titulo, setTitulo] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [nuevasImagenes, setNuevasImagenes] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [errores, setErrores] = useState({});
    const [guardando, setGuardando] = useState(false);
    const fileInputRef = useRef(null);
    const previewsRef = useRef([]);

    // Imágenes ya guardadas en el backend (rutas tal cual vienen en la respuesta)
    const existentes = Array.isArray(publicacion?.imagenes) ? publicacion.imagenes : [];
    const maxNuevas = Math.max(MAX_IMAGENES - existentes.length, 0);

    useEffect(() => {
        previewsRef.current = previews;
    }, [previews]);

    // Libera object URLs al desmontar
    useEffect(() => () => previewsRef.current.forEach(URL.revokeObjectURL), []);

    // Al abrir (o cambiar de publicación) reinicia el formulario.
    // Depende solo del id para no borrar lo escrito cuando la publicación se refresca
    // (por ejemplo, tras eliminar una imagen).
    useEffect(() => {
        if (abierto) {
            previewsRef.current.forEach(URL.revokeObjectURL);
            setTitulo(publicacion?.titulo || "");
            setDescripcion(publicacion?.descripcion || "");
            setNuevasImagenes([]);
            setPreviews([]);
            setErrores({});
            setGuardando(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [abierto, publicacion?.id_publicacion]);

    const validar = () => {
        const errs = {};
        if (!titulo.trim() || titulo.trim().length < 3) errs.titulo = "El título debe tener al menos 3 caracteres";
        if (!descripcion.trim() || descripcion.trim().length < 5) errs.descripcion = "La descripción debe tener al menos 5 caracteres";
        if (existentes.length + nuevasImagenes.length === 0) errs.imagenes = "Debes subir al menos una imagen";
        setErrores(errs);
        return Object.keys(errs).length === 0;
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        e.target.value = ""; // permite volver a elegir el mismo archivo

        const validos = files.filter(f => TIPOS_VALIDOS.includes(f.type) && f.size <= TAMANO_MAX_MB * 1024 * 1024);
        const cupo = Math.max(maxNuevas - nuevasImagenes.length, 0);
        const aceptados = validos.slice(0, cupo);

        setNuevasImagenes(prev => [...prev, ...aceptados]);
        setPreviews(prev => [...prev, ...aceptados.map(f => URL.createObjectURL(f))]);

        const descartadosFormato = files.length - validos.length;
        const descartadosCupo = validos.length - aceptados.length;
        setErrores(prev => {
            const { imagenes, ...resto } = prev;
            if (descartadosFormato > 0) return { ...resto, imagenes: `Se omitieron ${descartadosFormato} archivo(s): solo JPEG/PNG de hasta ${TAMANO_MAX_MB}MB` };
            if (descartadosCupo > 0) return { ...resto, imagenes: `Máximo ${MAX_IMAGENES} imágenes por publicación` };
            return resto;
        });
    };

    const eliminarPreview = (idx) => {
        URL.revokeObjectURL(previews[idx]);
        setNuevasImagenes(prev => prev.filter((_, i) => i !== idx));
        setPreviews(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (guardando || !validar()) return;
        setGuardando(true);
        try {
            const ok = publicacion
                ? await onEditar(publicacion.id_publicacion, { titulo, descripcion, nuevasImagenes })
                : await onCrear({ titulo, descripcion, imagenes: nuevasImagenes });
            if (ok) onCerrar();
        } finally {
            setGuardando(false);
        }
    };

    if (!abierto) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-2xl w-full">
                <h3 className="font-bold text-lg mb-4">
                    {publicacion ? "Editar publicación" : "Nueva publicación"}
                </h3>
                <form onSubmit={handleSubmit} encType="multipart/form-data">
                    {/* Título */}
                    <div className="form-control mb-3">
                        <label className="label"><span className="label-text font-medium">Título *</span></label>
                        <input
                            type="text"
                            className={`input input-bordered input-sm w-full ${errores.titulo ? "input-error" : ""}`}
                            value={titulo}
                            onChange={e => setTitulo(e.target.value)}
                            maxLength={200}
                            placeholder="Título de la publicación"
                        />
                        {errores.titulo && <span className="text-error text-xs mt-1">{errores.titulo}</span>}
                    </div>

                    {/* Descripción */}
                    <div className="form-control mb-3">
                        <label className="label"><span className="label-text font-medium">Descripción *</span></label>
                        <textarea
                            className={`textarea textarea-bordered w-full text-sm ${errores.descripcion ? "textarea-error" : ""}`}
                            rows={4}
                            value={descripcion}
                            onChange={e => setDescripcion(e.target.value)}
                            maxLength={1000}
                            placeholder="Describe la actividad realizada..."
                        />
                        {errores.descripcion && <span className="text-error text-xs mt-1">{errores.descripcion}</span>}
                    </div>

                    {/* Imágenes actuales (solo edición) */}
                    {publicacion && existentes.length > 0 && (
                        <div className="form-control mb-3">
                            <label className="label">
                                <span className="label-text font-medium">
                                    Imágenes actuales
                                    <span className="text-xs text-base-content/60 ml-1">({existentes.length}/{MAX_IMAGENES})</span>
                                </span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {existentes.map((img) => (
                                    <div key={img} className="relative w-20 h-20">
                                        <img
                                            src={getImageUrl(img)}
                                            alt="imagen actual"
                                            className="w-full h-full object-cover rounded-md border"
                                        />
                                        {/* Se envía `img` tal cual: el backend compara por igualdad exacta */}
                                        <button
                                            type="button"
                                            className="absolute -top-1.5 -right-1.5 btn btn-circle btn-xs btn-error text-white"
                                            onClick={() => onEliminarImagen(publicacion.id_publicacion, img)}
                                        >✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Upload de imágenes */}
                    <div className="form-control mb-4">
                        <label className="label">
                            <span className="label-text font-medium">
                                {publicacion ? "Agregar imágenes" : "Imágenes *"}
                                <span className="text-xs text-base-content/60 ml-1">(JPEG/PNG, máx. {TAMANO_MAX_MB}MB c/u, máx. {MAX_IMAGENES} en total)</span>
                            </span>
                        </label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={FORMATOS_ACEPTADOS}
                            multiple
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <button
                            type="button"
                            className="btn btn-outline btn-sm w-fit"
                            disabled={nuevasImagenes.length >= maxNuevas}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Seleccionar imágenes
                        </button>
                        {errores.imagenes && <span className="text-error text-xs mt-1">{errores.imagenes}</span>}

                        {/* Previews de nuevas imágenes */}
                        {previews.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {previews.map((src, idx) => (
                                    <div key={src} className="relative w-20 h-20">
                                        <img src={src} alt={`preview-${idx}`} className="w-full h-full object-cover rounded-md border" />
                                        <button
                                            type="button"
                                            className="absolute -top-1.5 -right-1.5 btn btn-circle btn-xs btn-error text-white"
                                            onClick={() => eliminarPreview(idx)}
                                        >✕</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="modal-action">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={onCerrar}>Cancelar</button>
                        <button type="submit" className="btn btn-primary btn-sm" disabled={guardando}>
                            {guardando ? <span className="loading loading-spinner loading-xs"></span> : publicacion ? "Guardar cambios" : "Publicar"}
                        </button>
                    </div>
                </form>
            </div>
            <div className="modal-backdrop" onClick={onCerrar}></div>
        </div>
    );
}