import { createUserService } from "../../services/user.service.js";
import { StaticDropdownList } from "../utils/DropdownList.jsx";
import { getCarreraSigla, processCarreras } from "../../utils/user.utils.js";
import { createSwalField } from "../utils/swalField.jsx";
import { gebi } from "../utils/getElementById.jsx";
import { ROLES_VALIDOS } from "../../constants/user.constants.jsx";
import { fireDynamicSwal } from "../utils/dynamicSwal.jsx";
import Swal from "sweetalert2";

async function createUser(carreras) {
    const {value: formValues} = await Swal.fire({
        title:"Crear Nuevo Usuario",
        html: `
            ${createSwalField(1, "Nombre de Usuario: ", "")}
            ${createSwalField(2, "Gmail: ", "")}
            ${createSwalField(3, "Contraseña: ", "", "password")}
            ${StaticDropdownList(ROLES_VALIDOS, "Rol: ","swal2-input4","m-1", false)}
            ${StaticDropdownList(carreras , "Carrera: ", "swal2-input5", "m-1", false)}
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText:"Crear",
        cancelButtonText:"Cancelar",
        preConfirm: () => {
            const username = String(gebi("swal2-input1")?.value);
            const email = gebi("swal2-input2")?.value;
            const password = String(gebi("swal2-input3")?.value);
            const role = String(gebi("swal2-input4")?.value);
            const sigla_carrera = getCarreraSigla(String(gebi("swal2-input5")?.value));
            return {username, email, password, role, sigla_carrera}
        },
        theme: "light",

    });
    if(formValues){
        return formValues;
    }
}

export const useCreateUser = (fetchUsuarios, carreras) => {
    carreras = processCarreras(carreras);
    const handleCreateUser = async () =>{
        let response = null;

        try {
            let formValues = await createUser(carreras);
            
            if(!formValues) return;

            response = await createUserService(formValues);

            if(typeof(fetchUsuarios) === "function"){
                fetchUsuarios();
            }
        } catch (error) {
            console.error(error);
            response = error?.response || {status: 500, message: "Error desconocido"};
        }
        fireDynamicSwal(response?.status || 400, null, response?.data?.message || response?.message);
    };

    return {
        handleCreateUser
    };
};
export default useCreateUser;





