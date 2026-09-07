import { patchCarreraService} from "@services/carrera.service.js"
import Swal from "sweetalert2";

async function editCarreraInfo(carrera) {
  const { value: formValues } = await Swal.fire({
    title: "Editar Carrera",
    html: `
    <div>
      <label for="swal2-input1">Nombre de Carrera</label>  
      <input id="swal2-input1" class="swal2-input" placeholder="nombre de la carrera" value = "${carrera.nombre_carrera}">
    </div>
    <div>
      <label for="swal2-input2">Sigla</label>
      <input id="swal2-input2" class="swal2-input" placeholder="sigla" value = "${carrera.sigla}">
    </div>
        `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Editar",
    preConfirm: () => {
      const nombre_carrera = document.getElementById("swal2-input1").value;
      const sigla = document.getElementById("swal2-input2").value;

      if (!nombre_carrera || !sigla) {
        Swal.showValidationMessage("Por favor, completa todos los campos");
        return false;
      }

      if (nombre_carrera.length < 3 || nombre_carrera.length > 30) {
        Swal.showValidationMessage(
          "El nombre de la Carrera debe tener entre 3 y 30 caracteres"
        );
        return false;
      }

      if (!/^[a-zA-Z0-9_]+$/.test(nombre_carrera)) {
        Swal.showValidationMessage(
          "El nombre de la carrera solo puede contener letras, números y guiones bajos"
        );
        return false;
      }

      if (!sigla || sigla.length < 2 || sigla.length > 8) {
        Swal.showValidationMessage(
          "La sigla debe tener entre 2 y 8 caracteres"
        );
        return false;
      }

      return { nombre_carrera, sigla };
    },
  });
  if (formValues) {
    return {
      nombre_carrera: formValues.nombre_carrera,
      sigla: formValues.sigla
    };
  }
}

export const useEditCarrera = (fetchCarreras) => {
  const handleEditCarreras = async (carreraId, carrera) => {
    try {
      const formValues = await editCarreraInfo(carrera);
      if (!formValues) return;

      const response = await patchCarreraService(carreraId, formValues);
      if (response) {
        await fetchCarreras();
      }
    } catch (error) {
      console.error("Error al editar usuario:", error);
    }
  };

  return { handleEditCarreras };
};

export default useEditCarrera;
