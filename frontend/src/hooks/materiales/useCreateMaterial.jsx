import { createMaterialService } from "@services/material.service.js";
import { fireDynamicSwal } from "../utils/dynamicSwal.jsx";
import Swal from "sweetalert2";
import { createMaterialFormHtml } from "../utils/swalField.jsx";

async function createMaterial(fechaPrestamo) {
    const { value: formValues } = await Swal.fire({
        title: "Registrar nuevo material",
        customClass: { popup: "swal-modal-popup" },
        html: createMaterialFormHtml({ fecha_prestamo: fechaPrestamo }, false),
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Crear",
        cancelButtonText: "Cancelar",
        preConfirm: () => {
            const nombre_material = String(document.getElementById("material-nombre")?.value ?? "").trim();
            const fecha_prestamo = document.getElementById("material-fecha")?.value;
            const prestatario = String(document.getElementById("material-prestatario")?.value ?? "").trim();
            const stock = Number(document.getElementById("material-stock")?.value);
            const estado_prestamo = document.getElementById("material-estado")?.value;
            const tne_entregada = document.getElementById("material-tne")?.value === "true";

            if (!nombre_material || !estado_prestamo) {
                Swal.showValidationMessage("Por favor, ingresa el nombre del material y el estado");
                return false;
            }

            if (nombre_material.length < 3 || nombre_material.length > 60) {
                Swal.showValidationMessage("El nombre del material debe tener entre 3 y 60 caracteres");
                return false;
            }

            if (prestatario && (prestatario.length < 3 || prestatario.length > 50)) {
                Swal.showValidationMessage("El prestatario debe tener entre 3 y 50 caracteres si se especifica");
                return false;
            }

            if (!Number.isInteger(stock) || stock < 0) {
                Swal.showValidationMessage("El stock debe ser un número entero mayor o igual a 0");
                return false;
            }

            if (estado_prestamo === "prestado" && stock < 1) {
                Swal.showValidationMessage("Para registrar en estado Prestado, el stock debe ser al menos 1");
                return false;
            }

            return { 
                nombre_material, 
                fecha_prestamo: fecha_prestamo || null, 
                prestatario: prestatario || "", 
                nombre_prestamo: prestatario || "", 
                stock, 
                estado_prestamo, 
                tne_entregada 
            };
        },
        theme: "light",
    });
    if (formValues) {
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
            if (typeof fetchMateriales === "function") {
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