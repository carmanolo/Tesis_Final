import { createUserService } from "../../services/user.service.js";
import { gebi } from "../utils/getElementById.jsx";
import { DEFAULT_ROL } from "../../constants/user.constants.jsx";
import { fireDynamicSwal } from "../utils/dynamicSwal.jsx";
import Swal from "sweetalert2";

async function createUser() {
    const {value: formValues} = await Swal.fire({
        title:"Crear Nuevo Usuario",
        html: `
        <div>
            <label for= "swal2-input1">Nombre del usuario</label>
            <input id="swal2-input1" class="swal2-input" placeholder="Nombred de usuario" value = "">
        </div>
        <div>
            <label for="swal2-input2">Correo elctronico</label>
            <input id="swal2-input2" class="swal2-input" placeholder="Correo electronico" value = "">
        </div>
        <div>
            <label for="swal2-input3">Contraseña</label>
            <input id="swal2-input3" class="swal2-input" placeholder="Contraseña" value = "">
        </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText:"Crear",
        cancelButtonText:"Cancelar",
        preConfirm: () => {
            const username = String(gebi('swal2-input1')?.value);
            const email = gebi('swal2-input2')?.value;
            const password = String(gebi('swal2-input3')?.value);
            const role =DEFAULT_ROL

            return {username, email, password, role}
        },
        theme: "light",

    });
    if(formValues){
        return formValues;
    }
}

export const useCreateUser = (fetchUsuarios) => {
    const handleCreateUser = async () =>{
        let response = null;

        try {
            let formValues = await createUser();
            
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





