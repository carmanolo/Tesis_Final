import Swal from "sweetalert2";
import { deleteReunionService } from "@services/reunion.service.js";

async function confirmDeleteReunion() {
    const result = await Swal.fire({
        title: "¿Estás seguro?",
        text: "No podrás deshacer esta acción",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        theme: "light",
    });
    return result.isConfirmed;
}

async function confirmAlert() {
    await Swal.fire({
        title: "Reunión eliminada",
        text: "La reunión ha sido eliminada correctamente",
        icon: "success",
        confirmButtonText: "Aceptar",
        theme: "light",
    });
}

async function confirmError() {
    await Swal.fire({
        title: "Error",
        text: "No se pudo eliminar la reunión",
        icon: "error",
        confirmButtonText: "Aceptar",
        theme: "light",
    });
}

export const useDeleteReunion = (fetchReuniones) => {
    const handleDeleteReunion = async (idReunion) => {
        try {
            const isConfirmed = await confirmDeleteReunion();
            if (!isConfirmed) return;

            const response = await deleteReunionService(idReunion);
            if (response) {
                await confirmAlert();
                if (typeof fetchReuniones === "function") {
                    await fetchReuniones();
                }
            } else {
                await confirmError();
            }
        } catch (error) {
            console.error("Error al eliminar la reunión:", error);
            await confirmError();
        }
    };

    return { handleDeleteReunion };
};

export default useDeleteReunion;