import { fireDynamicSwal } from "../utils/dynamicSwal.jsx";
import { patchRespaldoService } from "../../services/respaldo.service.js";

const isOk = (res) => res?.status >= 200 && res?.status < 300;
const extraerMensaje = (res) =>
    res?.data?.details || res?.data?.message || res?.message;

export function useEditRespaldo(onSuccess) {
    const handleEditRespaldo = async (id, { compromisoId, titulo, descripcion, nuevasImagenes = [] }) => {
        let status;
        let mensaje;
        try {
            const formData = new FormData();
            if (compromisoId) formData.append("compromisoId", compromisoId);
            if (titulo) formData.append("titulo", titulo);
            if (descripcion) formData.append("descripcion", descripcion);
            nuevasImagenes.forEach((img) => formData.append("imagenes", img));

            const response = await patchRespaldoService(id, formData);
            status = response?.status ?? 200;
            mensaje = extraerMensaje(response) || "Respaldo actualizado con éxito";

            if (!isOk(response)) {
                fireDynamicSwal(status, null, mensaje);
                return false;
            }

            fireDynamicSwal(status, null, mensaje);
            if (typeof onSuccess === "function") onSuccess();
            return true;
        } catch (error) {
            status = error?.response?.status ?? 500;
            mensaje = extraerMensaje(error?.response) || "Error al editar el respaldo.";
            fireDynamicSwal(status, null, mensaje);
            return false;
        }
    };
    return { handleEditRespaldo };
}
