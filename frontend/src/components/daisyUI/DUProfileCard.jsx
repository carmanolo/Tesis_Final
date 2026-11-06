import profilePic from "@assets/profilePic.jpg";
import college from "@assets/college.jpg";
import { AiFillStar } from "react-icons/ai";
import { FaUserShield, FaUserTie, FaGraduationCap } from "react-icons/fa";

export const DUProfileCard = ({ user }) => {
  const roleLower = String(user?.role || "").trim().toLowerCase();

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
            
            <div className="badge badge-secondary">
                <div className="flex flex-row align-middle items-center">
                    <span><AiFillStar className="mr-2"/></span>
                    <span>{String(user.role).toUpperCase()}</span>
                </div>
            </div>

            <div className={`badge ${etiqueta.badgeClass}`}>
                <div className="flex flex-row align-middle items-center">
                    <span>{etiqueta.icono}</span>
                    <span>{etiqueta.texto}</span>
                </div>
            </div>
        </div>

        <p className="text-sm text-base-content/70 mt-1">
            {"@" + String(user.email).split("@")[0]}
        </p>
    </div>
  );
};

export default DUProfileCard;
