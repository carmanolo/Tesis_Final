import Swal from "sweetalert2";
import { descargarActaService } from "@services/reunion.service.js";

export const useDescargarActa = () => {
    const handleDescargarActa = async (reunion) => {
        try {
            if (!reunion?.ruta_archivo) {
                await Swal.fire({
                    title: "Sin acta disponible",
                    text: "Esta reunión aún no tiene un acta subida",
                    icon: "info",
                    confirmButtonText: "Aceptar",
                    theme: "light",
                });
                return;
            }

            await descargarActaService(reunion.id_reunion);
        } catch (error) {
            console.error("Error al descargar el acta:", error);
            await Swal.fire({
                title: "Error",
                text: "No se pudo descargar el acta",
                icon: "error",
                confirmButtonText: "Aceptar",
                theme: "light",
            });
        }
    };

    return { handleDescargarActa };
};

export default useDescargarActa;