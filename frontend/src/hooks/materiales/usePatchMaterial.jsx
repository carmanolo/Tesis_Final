import { patchMaterialService } from "@services/material.service";
import Swal from "sweetalert2";
import { createSwalField, createSwalDateField } from "../utils/swalField";
import { StaticDropdownList } from "../utils/DropdownList";
import { ESTADOS_PRESTAMO } from "../../constants/material.constants";

async function editMaterialInfo(material) {
  const { value: formValues } = await Swal.fire({
    title: "Editar material",
    html: `
      ${createSwalField(1, "Nombre del material", material.nombre_material)}
      ${createSwalDateField(2, "fecha_prestamo", material.fecha_prestamo)}
      ${createSwalField(3, "Prestatario: ", material.nombre_prestamo)}
      ${createSwalField(4, "Stock: ", material.stock)}
      ${StaticDropdownList(ESTADOS_PRESTAMO, "Estado préstamo: ","swal2-input5","m-1", false)}
      ${createSwalField(6, "tne entregada: ", material.tne_entregada)}
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Editar",
    preConfirm: () => {
      const nombre_material = document.getElementById("swal2-input1").value;
      const fecha_prestamo = document.getElementById("swal2-input2").value;
      const prestatario = document.getElementById("swal2-input3")?.value;
      const stock = document.getElementById("swal2-input4")?.value;
      const estado_prestamo = document.getElementById("swal2-input5")?.value;
      const tne_entregada = document.getElementById("swal-input6")?.value;

      if (!nombre_material || !prestatario || !stock || !estado_prestamo || !tne_entregada) {
        Swal.showValidationMessage("Por favor, completa todos los campos");
        return false;
      }

      if (nombre_material.length < 3 || nombre_material.length > 60) {
        Swal.showValidationMessage(
          "El nombre del material debe tener entre 3 y 60 caracteres"
        );
        return false;
      }

      if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]*$/.test(nombre_material)) {
        Swal.showValidationMessage(
          "El nombre del material solo puede contener letras, números y guiones bajos"
        );
        return false;
      }

      if (!prestatario || prestatario.length < 5 || prestatario.length > 50) {
        Swal.showValidationMessage(
          "El prestatario debe tener entre 5 y 50 caracteres"
        );
        return false;
      }

      return { nombre_material, fecha_prestamo, prestatario, stock, estado_prestamo, tne_entregada };
    },
  });
  if (formValues) {
    return {
      nombre_material: formValues.nombre_material,
      fecha_prestamo: formValues.fecha_prestamo,
      prestatario: formValues.nombre_prestamo,
      stock: formValues.estado_prestamo,
      tne_entregada:formValues.tne_entregada
    };
  }
}

export const usePatchMaterial = (fetchMateriales) => {
  const handleEditMateriales = async (materialId, material) => {
    try {
      const formValues = await editMaterialInfo(material);
      if (!formValues) return;

      const response = await patchMaterialService(materialId, formValues);
      if (response) {
        await fetchMateriales();
      }
    } catch (error) {
      console.error("Error al editar material:", error);
    }
  };

  return { handleEditMateriales };
};

export default usePatchMaterial;
