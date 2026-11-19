import Swal from "sweetalert2";
import { patchRespaldoService } from "../../services/respaldo.service.js";

const isOk = (res) => res?.status >= 200 && res?.status < 300;

export function useEditRespaldo(onSuccess) {
    // Devuelve true si se editó correctamente, false en caso contrario.
    const handleEditRespaldo = async (id, { compromisoId, titulo, descripcion, nuevasImagenes = [] }) => {
        try {
            const formData = new FormData();
            if (compromisoId) formData.append("compromisoId", compromisoId);
            if (titulo) formData.append("titulo", titulo);
            if (descripcion) formData.append("descripcion", descripcion);
            nuevasImagenes.forEach((img) => formData.append("imagenes", img));

            const response = await patchRespaldoService(id, formData);
            if (!isOk(response)) return false;

            await Swal.fire({ icon: "success", title: "Respaldo actualizado", confirmButtonColor: "#2F4697", timer: 2000 });
            if (typeof onSuccess === "function") onSuccess();
            return true;
        } catch (error) {
            await Swal.fire({ icon: "error", title: "Error", text: error?.response?.data?.message || "Error al editar el respaldo.", confirmButtonColor: "#2F4697" });
            return false;
        }
    };
    return { handleEditRespaldo };
}
