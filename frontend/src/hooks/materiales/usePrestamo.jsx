import { createPrestamoService, devolverPrestamoService, deletePrestamoService } from "../../services/prestamo.service.js";
import { fireDynamicSwal } from "../utils/dynamicSwal.jsx";
import Swal from "sweetalert2";

export const usePrestamo = (fetchMateriales) => {
    const handleCreatePrestamo = async (prestamoData) => {
        let response = null;
        try {
            response = await createPrestamoService(prestamoData);
            if (typeof fetchMateriales === "function") {
                await fetchMateriales();
            }
        } catch (error) {
            console.error("Error al registrar préstamo:", error);
            response = error?.response || { status: 500, message: "Error desconocido" };
        }

        const status = response?.status || 400;
        fireDynamicSwal(status, null, response?.data?.message || response?.message);
        return status >= 200 && status < 300;
    };

    const handleDevolverPrestamo = async (prestamoId) => {

        let response = null;
        try {
            response = await devolverPrestamoService(prestamoId);
            if (typeof fetchMateriales === "function") {
                await fetchMateriales();
            }
        } catch (error) {
            console.error("Error al devolver préstamo:", error);
            response = error?.response || { status: 500, message: "Error desconocido" };
        }

        const status = response?.status || 400;
        fireDynamicSwal(status, null, response?.data?.message || response?.message);
        return status >= 200 && status < 300;
    };

    const handleDeletePrestamo = async (prestamoId) => {

        let response = null;
        try {
            response = await deletePrestamoService(prestamoId);
            if (typeof fetchMateriales === "function") {
                await fetchMateriales();
            }
        } catch (error) {
            console.error("Error al eliminar préstamo:", error);
            response = error?.response || { status: 500, message: "Error desconocido" };
        }

        const status = response?.status || 400;
        fireDynamicSwal(status, null, response?.data?.message || response?.message);
        return status >= 200 && status < 300;
    };

    return {
        handleCreatePrestamo,
        handleDevolverPrestamo,
        handleDeletePrestamo,
    };
};

export default usePrestamo;
