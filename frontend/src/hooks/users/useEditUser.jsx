import { patchUserService } from "@services/user.service";
import Swal from "sweetalert2";
import { createSwalField } from "../utils/swalField";
import { fireDynamicSwal } from "../utils/dynamicSwal";
import { StaticDropdownList } from "../utils/DropdownList";
import { getCarreraSigla, processCarreras } from "../../utils/user.utils";
import { ROLES_VALIDOS } from "../../constants/user.constants";
import { isValidEmail } from "../../validations/isValidEmail";

async function editUserInfo(user, carreras) {
  const { value: formValues } = await Swal.fire({
    title: "Editar Usuario",
    html: `
        ${createSwalField(1, "Nombre de usuario: ", user.username)}
        ${createSwalField(2, "gmail: ", user.email)}
        ${createSwalField(3, "Nueva contraseña (opcional): ", "", "password")}
        ${StaticDropdownList(ROLES_VALIDOS, user.role, "swal2-input4", "m-1", false)}
        ${StaticDropdownList(carreras, `${user?.carreraObject?.nombre_carrera} (${user?.carreraObject?.sigla})`, "swal2-input5", "m-1", false)}
        `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Editar",
    cancelButtonText: "Cancelar",
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

      if (!/^[a-zA-Z0-9_ ]+$/.test(username)) {
        Swal.showValidationMessage(
          "El nombre de usuario solo puede contener letras, números y guiones bajos"
        );
        return false;
      }

      const emailValidation = isValidEmail(email);
      if (emailValidation) {
        Swal.showValidationMessage(emailValidation);
        return false;
      }

      return { username, email, password, role, sigla_carrera };
    },
  });
  if (formValues) {
    const payload = {
      username: formValues.username,
      email: formValues.email,
      role: formValues.role,
      sigla_carrera: formValues.sigla_carrera
    };
    if (formValues.password && formValues.password.trim() !== "") {
      payload.password = formValues.password.trim();
    }
    return payload;
  }
}

export const useEditUser = (fetchUsers, carreras) => {
  carreras = processCarreras(carreras);
  const handleEditUser = async (userId, user) => {
    let response = null;
    try {
      const formValues = await editUserInfo(user, carreras);
      if (!formValues) return;

      response = await patchUserService(userId, formValues);
      if (response) {
        if (typeof fetchUsers === "function") {
          await fetchUsers();
        }
      }
    } catch (error) {
      console.error("Error al editar usuario:", error);
      response = error?.response || { status: 500, message: "Error desconocido" };
    }

    if (response) {
      fireDynamicSwal(
        response?.status || (response?.data ? 200 : 400),
        null,
        response?.data?.message || response?.message
      );
    }
  };

  return { handleEditUser };
};

export default useEditUser;
