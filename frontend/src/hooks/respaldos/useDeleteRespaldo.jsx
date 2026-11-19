import Swal from "sweetalert2";
import { deleteRespaldoService } from "../../services/respaldo.service.js";

export function useDeleteRespaldo(onSuccess) {
    const handleDeleteRespaldo = async (id) => {
        const result = await Swal.fire({
            title: "¿Eliminar respaldo?",
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
                await deleteRespaldoService(id);
                await Swal.fire({ icon: "success", title: "Eliminado", text: "El Respaldo fue eliminado.", confirmButtonColor: "#2F4697" });
                if (typeof onSuccess === "function") onSuccess();
            } catch (error) {
                await Swal.fire({ icon: "error", title: "Error", text: error?.response?.data?.message || "Error al eliminar el respaldo.", confirmButtonColor: "#2F4697" });
            }
        }
    };
    return { handleDeleteRespaldo };
}
