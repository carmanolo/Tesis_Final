import { createMaterialService } from "@services/material.service.js";
import { gebi } from "../utils/getElementById.jsx";
import { fireDynamicSwal } from "../utils/dynamicSwal.jsx";
import Swal from "sweetalert2";
import { createSwalField, createSwalDateField } from "../utils/swalField.jsx";

async function createMaterial(fechaPrestamo) {
    const {value: formValues} = await Swal.fire({
        title:"Registrar Nuevo Matrial",
        html: `
            ${createSwalField(1, "Nombre del material: ", "")}
            ${createSwalDateField(2, "Fecha", fechaPrestamo || "")}
            ${createSwalField(3, "Prestatario: ", "")}
            ${createSwalField(4, "Stock: ", "")}
            ${createSwalField(5, "Estado prestamo: ", "")}
            ${createSwalField(6, "tne entregada: ", "")}
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText:"Crear",
        cancelButtonText:"Cancelar",
        preConfirm: () => {
            const nombre_material = String(gebi("swal2-input1")?.value);
            const fecha_prestamo = gebi("swal2-input2")?.value;
            const prestatario = gebi("swal2-input3")?.value;
            const stock = gebi("swal2-input4")?.value;
            const estado_prestamo = gebi("swal2-input5")?.value;
            const tne_entregada = gebi("swal-input6")?.value;

            return {nombre_material, fecha_prestamo, prestatario, stock, estado_prestamo, tne_entregada}
        },
        theme: "light",

    });
    if(formValues){
        return formValues;
    }
}

export const useCreateMaterial = (fetchMateriales) => {
    const handleCreateMaterial = async (fechaPrestamo) => {
        let response = null;
        try {
            const formValues = await createMaterial(fechaPrestamo);
            if (!formValues) return;

            response = await createMaterialService(formValues);
            if (typeof fetchReuniones === "function") {
                await fetchMateriales();
            }
        } catch (error) {
            console.error(error);
            response = error?.response || { status: 500, message: "Error desconocido" };
        }
        fireDynamicSwal(response?.status, null, response?.data?.message || response?.message);
    };

    return { handleCreateMaterial };
};

export default useCreateMaterial;