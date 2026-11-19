import Swal from "sweetalert2";
import { createRespaldoService } from "../../services/respaldo.service.js";

const isOk = (res) => res?.status >= 200 && res?.status < 300;

export function useCreateRespaldo(onSuccess) {
    // Devuelve true si se creó correctamente
    const handleCreateRespaldo = async ({ compromisoId, titulo, descripcion, imagenes = [] }) => {
        try {
            const formData = new FormData();
            if (compromisoId) formData.append("compromisoId", compromisoId);
            if (titulo) formData.append("titulo", titulo);
            formData.append("descripcion", descripcion);
            imagenes.forEach((img) => formData.append("imagenes", img));

            const response = await createRespaldoService(formData);
            if (!isOk(response)) return false;

            await Swal.fire({ icon: "success", title: "Respaldo creado", text: "El respaldo fue creado exitosamente.", confirmButtonColor: false, timer: 2000 });
            if (typeof onSuccess === "function") onSuccess();
            return true;
        } catch (error) {
            await Swal.fire({ icon: "error", title: "Error", text: error?.response?.data?.message || "Error al crear la publicación.", confirmButtonColor: false, timer: 2000});
            return false;
        }
    };
    return { handleCreateRespaldo };
}
