import { useState } from "react";
import profilePic from "@assets/profilePic.jpg";
import college from "@assets/college.jpg";
import { AiFillStar } from "react-icons/ai";
import { FaUserShield, FaUserTie, FaGraduationCap, FaEdit, FaCheck, FaTimes } from "react-icons/fa";

export const DUProfileCard = ({ user }) => {
  const roleLower = String(user?.role || "").trim().toLowerCase();
  const esVocal = roleLower.includes("vocal");

  // Clave única por usuario en localStorage (NO se envía ni registra en el backend)
  const storageKey = `vocalia_desc_${user?.id || user?.rut || user?.email || "vocal"}`;
  const [vocalia, setVocalia] = useState(() => {
    return localStorage.getItem(storageKey) || "";
  });
  const [editando, setEditando] = useState(false);
  const [tempVocalia, setTempVocalia] = useState("");

  const handleGuardarVocalia = () => {
    const val = tempVocalia.trim();
    if (val) {
      localStorage.setItem(storageKey, val);
      setVocalia(val);
    } else {
      localStorage.removeItem(storageKey);
      setVocalia("");
    }
    setEditando(false);
  };

  // Función para determinar la etiqueta institucional correcta según el rol del usuario
  const getEtiquetaInstitucional = () => {
    if (roleLower === "administrador") {
      return {
        texto: "ADMINISTRACIÓN UBB",
        icono: <FaUserShield className="mr-2" />,
        badgeClass: "badge-error text-white",
      };
    }
    if (roleLower === "jefe de carrera") {
      return {
        texto: "JEFE DE CARRERA UBB",
        icono: <FaUserTie className="mr-2" />,
        badgeClass: "badge-accent text-white",
      };
    }
    if (String(user?.email || "").includes("@ubiobio.cl")) {
      return {
        texto: "DOCENTE UBB",
        icono: <FaUserTie className="mr-2" />,
        badgeClass: "badge-primary text-white",
      };
    }
    return {
      texto: "ESTUDIANTE UBB",
      icono: <FaGraduationCap className="mr-2" />,
      badgeClass: "badge-primary text-white",
    };
  };

  const etiqueta = getEtiquetaInstitucional();

  return (
    <div>
        <div className="h-32 rounded-2xl" style={{backgroundImage: "url(" + college + ")", backgroundSize: "cover"}}>
        </div>
        <div className="avatar avatar-online -mt-16">
            <div className="w-24 h-24 rounded-full border-base-100 border-4">
                <img src={profilePic} alt="Foto de perfil" />
            </div>
        </div>

        <div className="flex-row flex flex-wrap gap-2 align-middle items-center mt-2">
            <h2 className="text-2xl font-bold">{user.username}</h2>
            
            {/* Rol institucional */}
            <div className="badge badge-secondary font-semibold">
                <div className="flex flex-row align-middle items-center">
                    <span><AiFillStar className="mr-2"/></span>
                    <span>{String(user.role).toUpperCase()}</span>
                </div>
            </div>

            {/* Vocalía en su propia etiqueta junto al rol */}
            {esVocal && vocalia && (
                <div className="badge badge-secondary badge-outline font-semibold gap-1">
                    <span>{vocalia}</span>
                </div>
            )}

            <div className={`badge ${etiqueta.badgeClass}`}>
                <div className="flex flex-row align-middle items-center">
                    <span>{etiqueta.icono}</span>
                    <span>{etiqueta.texto}</span>
                </div>
            </div>

            {/* Botón para editar descripción en caso de ser vocal */}
            {esVocal && !editando && (
                <button
                    className="btn btn-xs btn-outline btn-secondary gap-1"
                    onClick={() => {
                        setTempVocalia(vocalia);
                        setEditando(true);
                    }}
                    title="Editar descripción de tu vocalía"
                >
                    <FaEdit />
                    {vocalia ? "Editar vocalía" : "Añadir vocalía"}
                </button>
            )}
        </div>

        <p className="text-sm text-base-content/70 mt-1">
            {"@" + String(user.email).split("@")[0]}
        </p>

        {/* Panel para editar la vocalía exclusivo para vocales (almacenado solo en el frontend) */}
        {esVocal && editando && (
            <div className="mt-4 p-4 rounded-xl border border-secondary/30 bg-base-100 shadow-sm max-w-md">
                <h4 className="font-semibold text-sm text-base-content mb-1 flex items-center gap-1.5">
                    <FaEdit className="text-secondary" />
                    Descripción de tu Vocalía
                </h4>
                <p className="text-xs text-base-content/60 mb-3">
                    Ingresa el área o labor específica de tu vocalía (ej: Deportes, Comunicaciones, Asuntos Estudiantiles).
                </p>
                <div className="space-y-3">
                    <input
                        type="text"
                        maxLength={50}
                        className="input input-bordered input-sm w-full"
                        placeholder="Ej: Vocalía de Deportes"
                        value={tempVocalia}
                        onChange={(e) => setTempVocalia(e.target.value)}
                        autoFocus
                    />
                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            className="btn btn-ghost btn-xs gap-1"
                            onClick={() => setEditando(false)}
                        >
                            <FaTimes /> Cancelar
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary btn-xs text-white gap-1"
                            onClick={handleGuardarVocalia}
                        >
                            <FaCheck /> Guardar
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default DUProfileCard;
