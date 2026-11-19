import { fireDynamicSwal } from "../utils/dynamicSwal.jsx";
import { createRespaldoService } from "../../services/respaldo.service.js";

const isOk = (res) => res?.status >= 200 && res?.status < 300;

const extraerMensaje = (res) =>
    res?.data?.details || res?.data?.message || res?.message;

export function useCreateRespaldo(onSuccess) {
    // Devuelve true si se creó correctamente
    const handleCreateRespaldo = async ({ compromisoId, titulo, descripcion, imagenes = [] }) => {
        let status;
        let mensaje;
        try {
            const formData = new FormData();
            if (compromisoId) formData.append("compromisoId", compromisoId);
            if (titulo) formData.append("titulo", titulo);
            formData.append("descripcion", descripcion);
            imagenes.forEach((img) => formData.append("imagenes", img));

            const response = await createRespaldoService(formData);

           status = response?.status ?? 201;
            mensaje = extraerMensaje(response) || "El respaldo fue creado exitosamente.";

            if (!isOk(response)) {
                fireDynamicSwal(status, null, mensaje);
                return false;
            }

            fireDynamicSwal(status, null, mensaje);
            if (typeof onSuccess === "function") onSuccess();
            return true;
        } catch (error) {
            status = error?.response?.status ?? 500;
            mensaje = extraerMensaje(error?.response) || "Error al crear el respaldo.";
            fireDynamicSwal(status, null, mensaje);
            return false;
        }
    };
    return { handleCreateRespaldo };
}
