import { createCarreraService } from "@services/carrera.service.js";
import { gebi } from "../utils/getElementById.jsx";
import { fireDynamicSwal } from "../utils/dynamicSwal.jsx";
import Swal from "sweetalert2";
import { createSwalField } from "../utils/swalField.jsx";

async function createCarrera() {
    const {value: formValues} = await Swal.fire({
        title:"Crear Nueva Carrera",
        html: `
            ${createSwalField(1, "Nombre de la carrera", "")}
            ${createSwalField(2, "Sigla", "")}
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText:"Crear",
        cancelButtonText:"Cancelar",
        preConfirm: () => {
            const nombre_carrera = String(gebi("swal2-input1")?.value);
            const sigla = gebi("swal2-input2")?.value;

            return {nombre_carrera, sigla}
        },
        theme: "light",

    });
    if(formValues){
        return formValues;
    }
}

export const useCreateCarrera = (fetchCarreras) => {
    const handleCreateCarrera = async () =>{
        let response = null;

        try {
            let formValues = await createCarrera();
            
            if(!formValues) return;

            response = await createCarreraService(formValues);

            if(typeof(fetchCarreras) === "function"){
                fetchCarreras();
            }
        } catch (error) {
            console.error(error);
            response = error?.response || {status: 500, message: "Error desconocido"};
        }
        fireDynamicSwal(response?.status || 400, null, response?.data?.message || response?.message);
    };

    return {
        handleCreateCarrera
    };
};
export default useCreateCarrera;