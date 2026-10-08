import Swal from "sweetalert2";
import { deleteMaterialService} from "@services/material.service.js"

async function confirmDeleteMaterial() {
  const result = await Swal.fire({
    title: "¿Estás seguro?",
    text: "No podrás deshacer esta acción",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
  });
  return result.isConfirmed;
}

async function confirmAlert() {
  await Swal.fire({
    title: "Material eliminada",
    text: "El material ha sido eliminada correctamente",
    icon: "success",
    confirmButtonText: "Aceptar",
  });
}

async function confirmError() {
  await Swal.fire({
    title: "Error",
    text: "No se pudo eliminar el material",
    icon: "error",
    confirmButtonText: "Aceptar",
  });
}

export const useDeleteMateriales = (fetchMaterials) => {
  const handleDeleteMateriales = async (materialId) => {
    try {
      const isConfirmed = await confirmDeleteMaterial();
      if (isConfirmed) {
        const response = await deleteMaterialService(materialId);
        if (response) {
          confirmAlert();
          await fetchMaterials();
        }
      }
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      confirmError();
    }
  };

  return { handleDeleteMateriales };
};

export default useDeleteMateriales;
