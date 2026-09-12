import { patchUserService } from "@services/user.service";
import Swal from "sweetalert2";
import { createSwalField } from "../utils/swalField";
//import { fireDynamicSwal } from "../utils/dynamicSwal";
import { StaticDropdownList } from "../utils/DropdownList";
import { getCarreraSigla, processCarreras } from "../../utils/user.utils";

async function editUserInfo(user, carreras) {
  const { value: formValues } = await Swal.fire({
    title: "Editar Usuario",
    html: `
        ${createSwalField(1, "Nombre de usuario: ", user.username)}
        ${createSwalField(2, "gmail: ", user.email)}
        ${createSwalField(3, "Contrseña", "")}
        ${createSwalField(4, "Rol: ", user.role)}
        ${StaticDropdownList(carreras, `${user?.carreraObject?.nombre_carrera} (${user?.carreraObject?.sigla})`, "swal2-input5", "m-1", false)}
        `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Editar",
    preConfirm: () => {
      const username = document.getElementById("swal2-input1").value;
      const email = document.getElementById("swal2-input2").value;
      const password = document.getElementById("swal2-input3")?.value || "";
      const role = document.getElementById("swal2-input4")?.value || "";
      const sigla_carrera = getCarreraSigla(String(document.getElementById("swal2-input5")?.value))

      if (!username || !email) {
        Swal.showValidationMessage("Por favor, completa todos los campos");
        return false;
      }

      if (username.length < 3 || username.length > 30) {
        Swal.showValidationMessage(
          "El nombre de usuario debe tener entre 3 y 30 caracteres"
        );
        return false;
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        Swal.showValidationMessage(
          "El nombre de usuario solo puede contener letras, números y guiones bajos"
        );
        return false;
      }

      if (!email || email.length < 6 || email.length > 50) {
        Swal.showValidationMessage(
          "El correo electrónico debe tener entre 6 y 50 caracteres"
        );
        return false;
      }

      if (!/^[a-zA-Z0-9._%+-]+@gmail\.(com|cl)$/.test(email)) {
        Swal.showValidationMessage(
          "Por favor, ingresa un correo de Gmail válido (@gmail.com o @gmail.cl)"
        );
        return false;
      }
      return { username, email, password, role, sigla_carrera };
    },
  });
  if (formValues) {
    return {
      username: formValues.username,
      email: formValues.email,
      password: formValues.password,
      role: formValues.role,
      sigla_carrera: formValues.sigla_carrera
    };
  }
}

export const useEditUser = (fetchUsers, carreras) => {
  carreras = processCarreras(carreras);
  const handleEditUser = async (userId, user) => {
    try {
      const formValues = await editUserInfo(user, carreras);
      if (!formValues) return;

      const response = await patchUserService(userId, formValues);
      if (response) {
        await fetchUsers();
      }
    } catch (error) {
      console.error("Error al editar usuario:", error);
    }
  };

  return { handleEditUser };
};

export default useEditUser;
