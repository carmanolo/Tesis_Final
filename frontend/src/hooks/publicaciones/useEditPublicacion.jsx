import Swal from "sweetalert2";
import { patchPublicacionService } from "../../services/publicacion.service.js";

const isOk = (res) => res?.status >= 200 && res?.status < 300;

export function useEditPublicacion(onSuccess) {
    // Devuelve true si se editó correctamente, false en caso contrario.
    const handleEditPublicacion = async (id, { compromisoId, titulo, descripcion, nuevasImagenes = [] }) => {
        try {
            const formData = new FormData();
            if (compromisoId) formData.append("compromisoId", compromisoId);
            if (titulo) formData.append("titulo", titulo);
            if (descripcion) formData.append("descripcion", descripcion);
            nuevasImagenes.forEach((img) => formData.append("imagenes", img));

            const response = await patchPublicacionService(id, formData);
            if (!isOk(response)) return false;

            await Swal.fire({ icon: "success", title: "Publicación actualizada", confirmButtonColor: "#2F4697" });
            if (typeof onSuccess === "function") onSuccess();
            return true;
        } catch (error) {
            await Swal.fire({ icon: "error", title: "Error", text: error?.response?.data?.message || "Error al editar la publicación.", confirmButtonColor: "#2F4697" });
            return false;
        }
    };
    return { handleEditPublicacion };
}
