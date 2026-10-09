import { patchMaterialService } from "@services/material.service";
import Swal from "sweetalert2";
import { createMaterialFormHtml } from "../utils/swalField";

async function editMaterialInfo(material) {
  const estadoActual = String(material.estado_prestamo || "prestado").toLowerCase();

  const { value: formValues } = await Swal.fire({
    title: "Editar material",
    customClass: { popup: "swal-modal-popup" },
    html: createMaterialFormHtml(material, true),
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Guardar cambios",
    cancelButtonText: "Cancelar",
    preConfirm: () => {
      const nombre_material = String(document.getElementById("material-edit-nombre")?.value ?? "").trim();
      const fecha_prestamo = document.getElementById("material-edit-fecha")?.value;
      const prestatario = String(document.getElementById("material-edit-prestatario")?.value ?? "").trim();
      const stock = Number(document.getElementById("material-edit-stock")?.value);
      const estado_prestamo = document.getElementById("material-edit-estado")?.value;
      const tne_entregada = document.getElementById("material-edit-tne")?.value === "true";

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

      // Si pasa a estado prestado desde otro estado, verificar que haya stock
      if (estado_prestamo === "prestado" && estadoActual !== "prestado" && stock < 1) {
        Swal.showValidationMessage("No hay stock suficiente para cambiar el estado a Prestado");
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

  return formValues || undefined;
}

export const usePatchMaterial = (fetchMateriales) => {
  const handleEditMateriales = async (materialId, material) => {
    try {
      const targetId = materialId || material?.id_material || material?.id;
      if (!targetId) {
        console.error("ID del material no encontrado");
        return;
      }

      const formValues = await editMaterialInfo(material);
      if (!formValues) return;

      const response = await patchMaterialService(targetId, formValues);
      if (response) {
        await Swal.fire({
          title: "Material actualizado",
          text: response.message || "El material ha sido modificado con éxito",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
        if (typeof fetchMateriales === "function") {
          await fetchMateriales();
        }
      }
    } catch (error) {
      console.error("Error al editar material:", error);
      const errMsg = error?.response?.data?.message || error?.message || "No se pudo actualizar el material";
      Swal.fire({
        title: "Error",
        text: errMsg,
        icon: "error",
      });
    }
  };

  return { handleEditMateriales };
};

export default usePatchMaterial;