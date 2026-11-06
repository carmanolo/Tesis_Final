import Swal from "sweetalert2";
import { createPublicacionService } from "../../services/publicacion.service.js";

const isOk = (res) => res?.status >= 200 && res?.status < 300;

export function useCreatePublicacion(onSuccess) {
    // Devuelve true si se creó correctamente, false en caso contrario.
    const handleCreatePublicacion = async ({ titulo, descripcion, imagenes = [] }) => {
        try {
            const formData = new FormData();
            formData.append("titulo", titulo);
            formData.append("descripcion", descripcion);
            imagenes.forEach((img) => formData.append("imagenes", img));

            const response = await createPublicacionService(formData);
            if (!isOk(response)) return false;

            await Swal.fire({ icon: "success", title: "Publicación creada", text: "La publicación fue creada exitosamente.", confirmButtonColor: "#2F4697" });
            if (typeof onSuccess === "function") onSuccess();
            return true;
        } catch (error) {
            await Swal.fire({ icon: "error", title: "Error", text: error?.response?.data?.message || "Error al crear la publicación.", confirmButtonColor: "#2F4697" });
            return false;
        }
    };
    return { handleCreatePublicacion };
}