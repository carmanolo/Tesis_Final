import { patchUserService } from "@services/user.service";
import Swal from "sweetalert2";
import { createSwalField } from "../utils/swalField";
import { fireDynamicSwal } from "../utils/dynamicSwal";
import { StaticDropdownList } from "../utils/DropdownList";
import { getCarreraSigla, processCarreras } from "../../utils/user.utils";
import { ROLES_VALIDOS } from "../../constants/user.constants";
import { isValidEmail } from "../../validations/isValidEmail";

async function editUserInfo(user, carreras, rolesDisponibles = ROLES_VALIDOS, defaultCarreraId = undefined) {
  const currentCarreraText = user?.carreraObject?.nombre_carrera 
    ? `${user?.carreraObject?.nombre_carrera} (${user?.carreraObject?.sigla})`
    : (carreras[0] || "");

  const { value: formValues } = await Swal.fire({
    title: "Editar Usuario",
    html: `
        ${createSwalField(1, "Nombre de usuario: ", user.username)}
        ${createSwalField(2, "gmail: ", user.email)}
        ${createSwalField(3, "Nueva contraseña (opcional): ", "", "password")}
        ${StaticDropdownList(rolesDisponibles, user.role, "swal2-input4", "m-1", false)}
        ${StaticDropdownList(carreras, currentCarreraText, "swal2-input5", "m-1", false)}
        `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Editar",
    cancelButtonText: "Cancelar",
    preConfirm: () => {
      const username = document.getElementById("swal2-input1")?.value;
      const email = document.getElementById("swal2-input2")?.value;
      const password = document.getElementById("swal2-input3")?.value || "";
      const role = document.getElementById("swal2-input4")?.value || "";
      const sigla_carrera = getCarreraSigla(String(document.getElementById("swal2-input5")?.value));

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

      const payload = { username, email, role, sigla_carrera };
      if (defaultCarreraId) {
        payload.carreraId = defaultCarreraId;
      }
      if (password && password.trim() !== "") {
        payload.password = password.trim();
      }
      return payload;
    },
  });

  return formValues;
}

export const useEditUser = (fetchUsers, carreras) => {
  const handleEditUser = async (userId, userToEdit) => {
    let response = null;
    try {
      const loggedUser = JSON.parse(sessionStorage.getItem("usuario")) || {};
      const userRole = (loggedUser?.role || loggedUser?.rol || "").toLowerCase();
      const userCarreraId = loggedUser?.carreraId;

      if (userRole === "jefe de carrera") {
        if (!userCarreraId) {
          Swal.fire({
            title: "Acceso denegado",
            text: "El jefe de carrera no tiene una carrera asignada.",
            icon: "error"
          });
          return;
        }

        if (Number(userToEdit?.carreraId) !== Number(userCarreraId)) {
          Swal.fire({
            title: "Acceso denegado",
            text: "Solo puedes editar usuarios de tu respectiva carrera.",
            icon: "error"
          });
          return;
        }

        if (userToEdit?.role === "administrador") {
          Swal.fire({
            title: "Acceso denegado",
            text: "No tienes permisos para editar administradores.",
            icon: "error"
          });
          return;
        }
      }

      let sourceCarreras = Array.isArray(carreras) ? carreras : [];
      if (userRole === "jefe de carrera") {
        const carreraPropia = sourceCarreras.find((c) => {
          if (typeof c === "string") {
            return c.startsWith(`${userCarreraId}. `) || c.startsWith(`${userCarreraId}.`);
          }
          return Number(c?.id_carrera) === Number(userCarreraId);
        });
        sourceCarreras = carreraPropia ? [carreraPropia] : sourceCarreras;
      }

      const processedCarreras = processCarreras(sourceCarreras);
      const rolesDisponibles = userRole === "jefe de carrera"
        ? ROLES_VALIDOS.filter((r) => r !== "administrador")
        : ROLES_VALIDOS;

      const formValues = await editUserInfo(
        userToEdit,
        processedCarreras,
        rolesDisponibles,
        userRole === "jefe de carrera" ? userCarreraId : undefined
      );
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
