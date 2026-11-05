import { createUserService } from "../../services/user.service.js";
import { StaticDropdownList } from "../utils/DropdownList.jsx";
import { getCarreraSigla, processCarreras } from "../../utils/user.utils.js";
import { createSwalField } from "../utils/swalField.jsx";
import { gebi } from "../utils/getElementById.jsx";
import { ROLES_VALIDOS } from "../../constants/user.constants.jsx";
import { fireDynamicSwal } from "../utils/dynamicSwal.jsx";
import Swal from "sweetalert2";

async function createUser(carreras, rolesDisponibles = ROLES_VALIDOS, defaultCarreraId = undefined) {
    const { value: formValues } = await Swal.fire({
        title: "Crear Nuevo Usuario",
        html: `
            ${createSwalField(1, "Nombre de Usuario: ", "")}
            ${createSwalField(2, "Gmail: ", "")}
            ${createSwalField(3, "Contraseña: ", "", "password")}
            ${StaticDropdownList(rolesDisponibles, "Rol: ", "swal2-input4", "m-1", false)}
            ${StaticDropdownList(carreras, "Carrera: ", "swal2-input5", "m-1", false)}
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Crear",
        cancelButtonText: "Cancelar",
        preConfirm: () => {
            const username = String(gebi("swal2-input1")?.value);
            const email = gebi("swal2-input2")?.value;
            const password = String(gebi("swal2-input3")?.value);
            const role = String(gebi("swal2-input4")?.value);
            const sigla_carrera = getCarreraSigla(String(gebi("swal2-input5")?.value));
            const data = { username, email, password, role, sigla_carrera };
            if (defaultCarreraId) {
                data.carreraId = defaultCarreraId;
            }
            return data;
        },
        theme: "light",
    });
    if (formValues) {
        return formValues;
    }
}

export const useCreateUser = (fetchUsuarios, carreras) => {
    const handleCreateUser = async (carrerasParam) => {
        let response = null;

        try {
            const user = JSON.parse(sessionStorage.getItem("usuario")) || {};
            const userRole = (user?.role || user?.rol || "").toLowerCase();
            const userCarreraId = user?.carreraId;

            let sourceCarreras = Array.isArray(carrerasParam) && carrerasParam.length > 0 
                ? carrerasParam 
                : (Array.isArray(carreras) ? carreras : []);

            if (userRole === "jefe de carrera") {
                if (!userCarreraId) {
                    Swal.fire({
                        title: "Acceso denegado",
                        text: "El jefe de carrera no tiene una carrera asignada.",
                        icon: "error"
                    });
                    return;
                }
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

            const formValues = await createUser(
                processedCarreras,
                rolesDisponibles,
                userRole === "jefe de carrera" ? userCarreraId : undefined
            );
            
            if (!formValues) return;

            response = await createUserService(formValues);

            if (typeof fetchUsuarios === "function") {
                fetchUsuarios();
            }
        } catch (error) {
            console.error(error);
            response = error?.response || { status: 500, message: "Error desconocido" };
        }
        fireDynamicSwal(response?.status || 400, null, response?.data?.message || response?.message);
    };

    return {
        handleCreateUser
    };
};
export default useCreateUser;
