import { patchMaterialService } from "@services/material.service";
import Swal from "sweetalert2";

export const usePatchMaterial = (fetchMateriales) => {
  const handleEditMateriales = async (materialId, formValues) => {
    try {
      const targetId = materialId || formValues?.id_material || formValues?.id;
      if (!targetId) {
        console.error("ID del material no encontrado");
        return false;
      }

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
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error al editar material:", error);
      const errMsg = error?.response?.data?.message || error?.message || "No se pudo actualizar el material";
      Swal.fire({
        title: "Error",
        text: errMsg,
        icon: "error",
      });
      return false;
    }
  };

  return { handleEditMateriales };
};

export default usePatchMaterial;