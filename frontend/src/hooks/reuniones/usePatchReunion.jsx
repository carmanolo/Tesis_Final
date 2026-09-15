import Swal from "sweetalert2";
import { patchReunionService } from "@services/reunion.service.js";
import { createSwalField, createSwalDateField } from "../utils/swalField.jsx";
import { gebi } from "../utils/getElementById.jsx";
import { fireDynamicSwal } from "../utils/dynamicSwal.jsx";

async function editarDatosReunion(reunion) {
    const { value: formValues } = await Swal.fire({
        title: "Editar reunión",
        html: `
            ${createSwalDateField(1, "Fecha", reunion.fecha_reunion)}
            ${createSwalField(2, "Descripción", reunion.descripcion)}
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Guardar",
        cancelButtonText: "Cancelar",
        preConfirm: () => {
            const fecha_reunion = gebi("swal2-input1")?.value;
            const descripcion = String(gebi("swal2-input2")?.value || "").trim();

            if (!fecha_reunion || !descripcion) {
                Swal.showValidationMessage("Por favor complete todos los campos");
                return false;
            }

            return { fecha_reunion, descripcion };
        },
        theme: "light",
    });

    return formValues;
}

export const usePatchReunion = (fetchReuniones) => {
    const handleEditReunion = async (idReunion, reunion) => {
        let response = null;
        try {
            const formValues = await editarDatosReunion(reunion);
            if (!formValues) return;

            response = await patchReunionService(idReunion, formValues);
            if (typeof fetchReuniones === "function") {
                await fetchReuniones();
            }
        } catch (error) {
            console.error(error);
            response = error?.response || { status: 500, message: "Error desconocido" };
        }
        fireDynamicSwal(response?.status, null, response?.data?.message || response?.message);
    };

    return { handleEditReunion };
};

export default usePatchReunion;