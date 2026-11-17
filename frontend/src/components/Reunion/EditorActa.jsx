import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import Swal from "sweetalert2";
import {
    getContenidoActaService,
    guardarContenidoActaService,
    finalizarActaService,
    exportarActaService,
} from "@services/reunion.service.js";
import { formatearFechaDDMMAAAA } from "../../utils/calendar.utils.js";
import "./editorActa.css";

const PLANTILLA_ACTA = `
<h2>Asistentes</h2>
<ul><li></li></ul>
<h2>Tabla</h2>
<ol><li></li></ol>
<h2>Desarrollo</h2>
<p></p>
<h2>Acuerdos</h2>
<ol><li></li></ol>
`;

function descargarBlob(blob, nombre) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

const Btn = ({ onClick, activo, disabled, title, children }) => (
    <button
        type="button"
        title={title}
        disabled={disabled}
        // evita que el botón le quite el foco al editor
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        className={`btn btn-xs ${activo ? "btn-primary" : "btn-ghost"}`}
    >
        {children}
    </button>
);

const Sep = () => <span className="w-px h-5 bg-base-content/20 mx-1" />;

export const EditorActa = ({ reunion, onCerrar, onActualizado }) => {
    const [cargando, setCargando] = useState(true);
    const [dirty, setDirty] = useState(false);
    const [ocupado, setOcupado] = useState(null); // "guardando" | "previa" | "pdf" | "docx" | "finalizando"
    const [previewUrl, setPreviewUrl] = useState(null);

    const editor = useEditor({
        // En v3, StarterKit ya incluye Underline (no se agrega aparte) y Link
        extensions: [
            StarterKit,
            TextAlign.configure({ types: ["heading", "paragraph"] }),
            Table,
            TableRow,
            TableHeader,
            TableCell,
        ],
        content: "",
        // En v3 es false por defecto: sin esto la barra no refleja negrita/lista activa, etc.
        shouldRerenderOnTransaction: true,
        onUpdate: () => setDirty(true),
    });

    // Carga el borrador guardado (o una plantilla si el acta aún no se redacta)
    useEffect(() => {
        if (!editor) return;
        let cancelado = false;
        (async () => {
            try {
                const data = await getContenidoActaService(reunion.id_reunion);
                if (cancelado) return;
                editor.commands.setContent(data?.contenido || PLANTILLA_ACTA, { emitUpdate: false });
                setDirty(false);
            } catch (error) {
                console.error(error);
                Swal.fire({ icon: "error", title: "Error", text: "No se pudo cargar el acta" });
            } finally {
                if (!cancelado) setCargando(false);
            }
        })();
        return () => {
            cancelado = true;
        };
    }, [editor, reunion.id_reunion]);

    // Libera la URL de la vista previa
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const nombreBase = `Acta_reunion_${formatearFechaDDMMAAAA(reunion.fecha_reunion)}`;

    const guardar = async ({ silencioso = false } = {}) => {
        setOcupado("guardando");
        try {
            await guardarContenidoActaService(reunion.id_reunion, editor.getHTML());
            setDirty(false);
            if (typeof onActualizado === "function") await onActualizado();
            if (!silencioso) {
                Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "success",
                    title: "Borrador guardado",
                    timer: 1500,
                    showConfirmButton: false,
                });
            }
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: error?.response?.data?.message || "No se pudo guardar el borrador",
            });
            throw error;
        } finally {
            setOcupado(null);
        }
    };

    const verVistaPrevia = async () => {
        if (editor.isEmpty) return;
        try {
            if (dirty) await guardar({ silencioso: true });
            setOcupado("previa");
            const blob = await exportarActaService(reunion.id_reunion, "pdf");
            setPreviewUrl(URL.createObjectURL(blob));
        } catch (error) {
            console.error(error);
            Swal.fire({ icon: "error", title: "Error", text: "No se pudo generar la vista previa" });
        } finally {
            setOcupado(null);
        }
    };

    const descargar = async (formato) => {
        if (editor.isEmpty) return;
        try {
            if (dirty) await guardar({ silencioso: true });
            setOcupado(formato);
            const blob = await exportarActaService(reunion.id_reunion, formato);
            descargarBlob(blob, `${nombreBase}.${formato}`);
        } catch (error) {
            console.error(error);
            Swal.fire({ icon: "error", title: "Error", text: "No se pudo generar el archivo" });
        } finally {
            setOcupado(null);
        }
    };

    const finalizar = async () => {
        if (editor.isEmpty) return;
        const { isConfirmed } = await Swal.fire({
            title: "¿Finalizar y publicar acta?",
            text: "El acta quedará publicada inmediatamente en la plataforma para todos los estudiantes.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sí, publicar",
            cancelButtonText: "Cancelar",
            theme: "light",
        });
        if (!isConfirmed) return;

        try {
            await guardar({ silencioso: true });
            setOcupado("finalizando");
            await finalizarActaService(reunion.id_reunion);
            if (typeof onActualizado === "function") await onActualizado();
            await Swal.fire({
                icon: "success",
                title: "Acta publicada",
                timer: 1800,
                showConfirmButton: false,
                theme: "light",
            });
            onCerrar();
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: error?.response?.data?.message || "No se pudo finalizar el acta",
            });
        } finally {
            setOcupado(null);
        }
    };

    const cerrar = async () => {
        if (dirty) {
            const { isConfirmed } = await Swal.fire({
                title: "Cambios sin guardar",
                text: "Si cierras ahora perderás los cambios no guardados.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Cerrar sin guardar",
                cancelButtonText: "Seguir editando",
                theme: "light",
            });
            if (!isConfirmed) return;
        }
        onCerrar();
    };

    const c = () => editor.chain().focus();
    const bloqueado = Boolean(ocupado) || cargando;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden">
                {/* Encabezado */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-base-content/10">
                    <div className="min-w-0">
                        <h3 className="text-lg font-bold">Redactar acta</h3>
                        <p className="text-xs text-base-content/60 truncate">
                            {formatearFechaDDMMAAAA(reunion.fecha_reunion)} · {reunion.descripcion}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {dirty && <span className="text-xs text-warning">Cambios sin guardar</span>}
                        <button className="btn btn-sm btn-circle btn-ghost" onClick={cerrar}>
                            ✕
                        </button>
                    </div>
                </div>

                {previewUrl ? (
                    <>
                        <iframe title="Vista previa del acta" src={previewUrl} className="flex-1 w-full" />
                        <div className="flex justify-end gap-2 px-6 py-3 border-t border-base-content/10">
                            <button
                                className="btn btn-neutral"
                                onClick={() => {
                                    URL.revokeObjectURL(previewUrl);
                                    setPreviewUrl(null);
                                }}
                            >
                                Volver a editar
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Barra de herramientas */}
                        {editor && (
                            <div className="flex flex-wrap items-center gap-1 px-4 py-2 border-b border-base-content/10 bg-base-200/50">
                                <Btn title="Deshacer" onClick={() => c().undo().run()}>↶</Btn>
                                <Btn title="Rehacer" onClick={() => c().redo().run()}>↷</Btn>
                                <Sep />
                                <Btn title="Párrafo" activo={editor.isActive("paragraph")} onClick={() => c().setParagraph().run()}>P</Btn>
                                <Btn title="Título 1" activo={editor.isActive("heading", { level: 1 })} onClick={() => c().toggleHeading({ level: 1 }).run()}>H1</Btn>
                                <Btn title="Título 2" activo={editor.isActive("heading", { level: 2 })} onClick={() => c().toggleHeading({ level: 2 }).run()}>H2</Btn>
                                <Btn title="Título 3" activo={editor.isActive("heading", { level: 3 })} onClick={() => c().toggleHeading({ level: 3 }).run()}>H3</Btn>
                                <Sep />
                                <Btn title="Negrita" activo={editor.isActive("bold")} onClick={() => c().toggleBold().run()}><b>B</b></Btn>
                                <Btn title="Cursiva" activo={editor.isActive("italic")} onClick={() => c().toggleItalic().run()}><i>I</i></Btn>
                                <Btn title="Subrayado" activo={editor.isActive("underline")} onClick={() => c().toggleUnderline().run()}><u>U</u></Btn>
                                <Btn title="Tachado" activo={editor.isActive("strike")} onClick={() => c().toggleStrike().run()}><s>S</s></Btn>
                                <Sep />
                                <Btn title="Lista con viñetas" activo={editor.isActive("bulletList")} onClick={() => c().toggleBulletList().run()}>• Lista</Btn>
                                <Btn title="Lista numerada" activo={editor.isActive("orderedList")} onClick={() => c().toggleOrderedList().run()}>1. Lista</Btn>
                                <Btn title="Cita" activo={editor.isActive("blockquote")} onClick={() => c().toggleBlockquote().run()}>❝</Btn>
                                <Btn title="Línea separadora" onClick={() => c().setHorizontalRule().run()}>―</Btn>
                                <Sep />
                                <Btn title="Alinear a la izquierda" activo={editor.isActive({ textAlign: "left" })} onClick={() => c().setTextAlign("left").run()}>⇤</Btn>
                                <Btn title="Centrar" activo={editor.isActive({ textAlign: "center" })} onClick={() => c().setTextAlign("center").run()}>↔</Btn>
                                <Btn title="Alinear a la derecha" activo={editor.isActive({ textAlign: "right" })} onClick={() => c().setTextAlign("right").run()}>⇥</Btn>
                                <Btn title="Justificar" activo={editor.isActive({ textAlign: "justify" })} onClick={() => c().setTextAlign("justify").run()}>☰</Btn>
                                <Sep />
                                <Btn title="Insertar tabla 3x3" onClick={() => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>Tabla</Btn>
                                {editor.isActive("table") && (
                                    <>
                                        <Btn title="Agregar fila abajo" onClick={() => c().addRowAfter().run()}>+Fila</Btn>
                                        <Btn title="Agregar columna a la derecha" onClick={() => c().addColumnAfter().run()}>+Col</Btn>
                                        <Btn title="Eliminar fila" onClick={() => c().deleteRow().run()}>−Fila</Btn>
                                        <Btn title="Eliminar columna" onClick={() => c().deleteColumn().run()}>−Col</Btn>
                                        <Btn title="Eliminar tabla" onClick={() => c().deleteTable().run()}>✕ Tabla</Btn>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Área de edición */}
                        <div className="acta-editor flex-1 overflow-y-auto">
                            {cargando ? (
                                <div className="flex justify-center py-16">
                                    <span className="loading loading-spinner loading-lg" />
                                </div>
                            ) : (
                                <EditorContent editor={editor} />
                            )}
                        </div>

                        {/* Acciones */}
                        <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 border-t border-base-content/10">
                            <div className="flex flex-wrap gap-2">
                                <button className="btn btn-sm btn-outline" disabled={bloqueado} onClick={verVistaPrevia}>
                                    {ocupado === "previa" ? "Generando..." : "Vista previa"}
                                </button>
                                <button className="btn btn-sm btn-outline" disabled={bloqueado} onClick={() => descargar("pdf")}>
                                    {ocupado === "pdf" ? "Generando..." : "Descargar PDF"}
                                </button>
                                <button className="btn btn-sm btn-outline" disabled={bloqueado} onClick={() => descargar("docx")}>
                                    {ocupado === "docx" ? "Generando..." : "Descargar Word"}
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    className="btn btn-sm btn-neutral"
                                    disabled={bloqueado || !dirty}
                                    onClick={() => guardar().catch(() => {})}
                                >
                                    {ocupado === "guardando" ? "Guardando..." : "Guardar borrador"}
                                </button>
                                <button className="btn btn-sm btn-primary" disabled={bloqueado} onClick={finalizar}>
                                    {ocupado === "finalizando" ? "Publicando..." : "Finalizar y publicar"}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default EditorActa;