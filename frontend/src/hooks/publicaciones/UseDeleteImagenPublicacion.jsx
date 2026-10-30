import Swal from "sweetalert2";
import { deleteImagenPublicacionService } from "../../services/publicacion.service.js";

export function useDeleteImagenPublicacion(onSuccess) {
    // `imagenUrl` debe ser EXACTAMENTE el valor guardado en publicacion.imagenes
    // (el backend compara por igualdad exacta). No normalizar ni construir URL completa.
    const handleDeleteImagen = async (publicacionId, imagenUrl) => {
        const result = await Swal.fire({
            title: "¿Eliminar imagen?",
            text: "Esta acción no se puede deshacer.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        });
        if (!result.isConfirmed) return false;

        try {
            await deleteImagenPublicacionService(publicacionId, imagenUrl);
            await Swal.fire({ icon: "success", title: "Imagen eliminada", confirmButtonColor: "#2F4697" });
            if (typeof onSuccess === "function") await onSuccess();
            return true;
        } catch (error) {
            await Swal.fire({ icon: "error", title: "Error", text: error?.response?.data?.message || "Error al eliminar la imagen.", confirmButtonColor: "#2F4697" });
            return false;
        }
    };
    return { handleDeleteImagen };
}