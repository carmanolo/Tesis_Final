import Swal from "sweetalert2";
import { deleteCompromisoService } from "../../services/compromiso.service.js";

async function confirmDelete() {
    const result = await Swal.fire({
        title: "¿Eliminar el compromiso?",
        text: "Se quitarán también sus aportes asignados. No podrás deshacer esta acción",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
    });
    return result.isConfirmed;
}

export const useDeleteCompromiso = (fetchCompromisos, fetchAportes) => {
    // Devuelve true solo si el compromiso se eliminó, para que el modal se cierre
    const handleDeleteCompromiso = async (compromisoId) => {
        try {
            if (!(await confirmDelete())) return false;

            await deleteCompromisoService(compromisoId);

            if (typeof fetchCompromisos === "function") {
                await fetchCompromisos();
            }
            if (typeof fetchAportes === "function") {
                await fetchAportes();
            }
            Swal.fire({
                title: "Compromiso eliminado",
                icon: "success",
                timer: 2000,
                showConfirmButton: false,
            });
            return true;
        } catch (error) {
            console.error("Error al eliminar compromiso:", error);
            Swal.fire({
                title: "No se pudo eliminar el compromiso",
                text: error?.response?.data?.message,
                icon: "error",
                confirmButtonText: "Aceptar",
            });
            return false;
        }
    };

    return { handleDeleteCompromiso };
};

export default useDeleteCompromiso;