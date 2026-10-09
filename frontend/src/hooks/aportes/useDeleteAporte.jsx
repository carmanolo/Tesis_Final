import Swal from "sweetalert2";
import { deleteAporteService } from "../../services/aporte.service.js";

async function confirmDeleteAporte() {
    const result = await Swal.fire({
        title: "¿Estás seguro?",
        text: "No podrás deshacer esta acción",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
    });
    return result.isConfirmed;
}

async function confirmAlert() {
    await Swal.fire({
        title: "Aporte eliminado",
        text: "El aporte ha sido eliminado correctamente",
        icon: "success",
        confirmButtonText: "Aceptar",
    });
}

async function confirmError() {
    await Swal.fire({
        title: "Error",
        text: "No se pudo eliminar el aporte",
        icon: "error",
        confirmButtonText: "Aceptar",
    });
}

export const useDeleteAporte = (fetchAportes) => {
    // Devuelve true solo si el aporte se eliminó, para que el modal se cierre
    const handleDeleteAporte = async (aporteId) => {
        try {
            const isConfirmed = await confirmDeleteAporte();
            if (!isConfirmed) return false;

            await deleteAporteService(aporteId);

            if (typeof fetchAportes === "function") {
                await fetchAportes();
            }
            confirmAlert();
            return true;
        } catch (error) {
            console.error("Error al eliminar aporte:", error);
            confirmError();
            return false;
        }
    };

    return { handleDeleteAporte };
};

export default useDeleteAporte;