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
        const confirmacion = await Swal.fire({
            title: "¿Confirmar devolución?",
            text: "El artículo será reincorporado al stock disponible.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sí, marcar devuelto",
            cancelButtonText: "Cancelar",
        });

        if (!confirmacion.isConfirmed) return false;

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
        const confirmacion = await Swal.fire({
            title: "¿Eliminar registro de préstamo?",
            text: "Si el artículo estaba prestado, su unidad será restaurada al stock.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#d33",
        });

        if (!confirmacion.isConfirmed) return false;

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
