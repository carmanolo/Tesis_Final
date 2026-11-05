import Swal from "sweetalert2";
import { deletePublicacionService } from "../../services/publicacion.service.js";

export function useDeletePublicacion(onSuccess) {
    const handleDeletePublicacion = async (id) => {
        const result = await Swal.fire({
            title: "¿Eliminar publicación?",
            text: "Esta acción no se puede deshacer.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        });
        if (result.isConfirmed) {
            try {
                await deletePublicacionService(id);
                await Swal.fire({ icon: "success", title: "Eliminada", text: "La publicación fue eliminada.", confirmButtonColor: "#2F4697" });
                if (typeof onSuccess === "function") onSuccess();
            } catch (error) {
                await Swal.fire({ icon: "error", title: "Error", text: error?.response?.data?.message || "Error al eliminar la publicación.", confirmButtonColor: "#2F4697" });
            }
        }
    };
    return { handleDeletePublicacion };
}
