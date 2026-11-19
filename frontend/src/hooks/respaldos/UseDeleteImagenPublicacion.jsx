import Swal from "sweetalert2";
import { deleteImagenPublicacionService } from "../../services/respaldo.service.js";

export function useDeleteImagenPublicacion(onSuccess) {
    // `imagenUrl` debe ser EXACTAMENTE el valor guardado en publicacion.imagenes
    const handleDeleteImagen = async (respaldoId, imagenUrl) => {
        const result = await Swal.fire({
            title: "¿Eliminar imagen?",
            text: "Esta acción no se puede deshacer.",
            icon: "warning",
            showCancelButton: true,
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        });
        if (!result.isConfirmed) return false;

        try {
            await deleteImagenPublicacionService(respaldoId, imagenUrl);
            await Swal.fire({ icon: "success", title: "Imagen eliminada", showConfirmButton: false, timer: 2000});
            if (typeof onSuccess === "function") await onSuccess();
            return true;
        } catch (error) {
            await Swal.fire({ icon: "error", title: "Error", text: error?.response?.data?.message || "Error al eliminar la imagen." });
            return false;
        }
    };
    return { handleDeleteImagen };
}