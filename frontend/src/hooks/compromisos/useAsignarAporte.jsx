import Swal from "sweetalert2";
import { asignarAporteService, quitarAporteService } from "../../services/compromiso.service.js";
import { fireDynamicSwal } from "../utils/dynamicSwal.jsx";

export const useAsignarAporte = (fetchCompromisos, fetchAportes) => {
    const refrescar = async () => {
        if (typeof fetchCompromisos === "function") await fetchCompromisos();
        if (typeof fetchAportes === "function") await fetchAportes();
    };

    // datos: { aporteId, monto_asignado }
    const handleAsignarAporte = async (compromisoId, datos) => {
        let response = null;

        try {
            response = await asignarAporteService(compromisoId, datos);
            await refrescar();
        } catch (error) {
            console.error("Error al asignar aporte:", error);
            response = error?.response || { status: 500, message: "Error desconocido" };
        }

        const status = response?.status || 400;
        fireDynamicSwal(status, null, response?.data?.message || response?.message);

        return status >= 200 && status < 300;
    };

    const handleQuitarAporte = async (compromisoId, aporteId) => {
        const { isConfirmed } = await Swal.fire({
            title: "¿Quitar este aporte del compromiso?",
            text: "El aporte seguirá existiendo y quedará disponible para otros compromisos",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, quitar",
            cancelButtonText: "Cancelar",
        });
        if (!isConfirmed) return false;

        let response = null;
        try {
            response = await quitarAporteService(compromisoId, aporteId);
            await refrescar();
        } catch (error) {
            console.error("Error al quitar aporte:", error);
            response = error?.response || { status: 500, message: "Error desconocido" };
        }

        const status = response?.status || 400;
        fireDynamicSwal(status, null, response?.data?.message || response?.message);

        return status >= 200 && status < 300;
    };

    return { handleAsignarAporte, handleQuitarAporte };
};

export default useAsignarAporte;