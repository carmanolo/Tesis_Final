import Swal from "sweetalert2";
import { createReunionService } from "@services/reunion.service.js";
import { createSwalField, createSwalDateField } from "../utils/swalField.jsx";
import { gebi } from "../utils/getElementById.jsx";
import { fireDynamicSwal } from "../utils/dynamicSwal.jsx";

async function pedirDatosReunion(fechaSugerida) {
    const { value: formValues } = await Swal.fire({
        title: "Nueva reunión",
        html: `
            ${createSwalDateField(1, "Fecha", fechaSugerida || "")}
            ${createSwalField(2, "Descripción", "")}
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Crear",
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

export const useCreateReunion = (fetchReuniones) => {
    const handleCreateReunion = async (fechaSugerida) => {
        let response = null;
        try {
            const formValues = await pedirDatosReunion(fechaSugerida);
            if (!formValues) return;

            response = await createReunionService(formValues);
            if (typeof fetchReuniones === "function") {
                await fetchReuniones();
            }
        } catch (error) {
            console.error(error);
            response = error?.response || { status: 500, message: "Error desconocido" };
        }
        fireDynamicSwal(response?.status, null, response?.data?.message || response?.message);
    };

    return { handleCreateReunion };
};

export default useCreateReunion;