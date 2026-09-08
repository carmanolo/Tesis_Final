import Swal from "sweetalert2";
import { deleteCarreraSer } from "@services/carrera.service.js";

async function confirmDeleteCarrera() {
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
    title: "Carrera eliminada",
    text: "La carrera ha sido eliminada correctamente",
    icon: "success",
    confirmButtonText: "Aceptar",
  });
}

async function confirmError() {
  await Swal.fire({
    title: "Error",
    text: "No se pudo eliminar la carrera",
    icon: "error",
    confirmButtonText: "Aceptar",
  });
}

export const useDeleteCarreras = (fetchCarreras) => {
  const handleDeleteCarreras = async (carreraId) => {
    try {
      const isConfirmed = await confirmDeleteCarrera();
      if (isConfirmed) {
        const response = await deleteCarreraSer(carreraId);
        if (response) {
          confirmAlert();
          await fetchCarreras();
        }
      }
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      confirmError();
    }
  };

  return { handleDeleteCarreras };
};

export default useDeleteCarreras;
