import axios from "./root.service.js";

export async function createPrestamoService(prestamoData) {
    try {
        const response = await axios.post("/prestamos/crear", prestamoData);
        return Object.assign(response.data, { status: response.status });
    } catch (error) {
        console.error("Error al registrar préstamo:", error);
        throw error;
    }
}

export async function devolverPrestamoService(prestamoId) {
    try {
        const response = await axios.patch(`/prestamos/devolver/${prestamoId}`);
        return Object.assign(response.data, { status: response.status });
    } catch (error) {
        console.error("Error al devolver préstamo:", error);
        throw error;
    }
}

export async function deletePrestamoService(prestamoId) {
    try {
        const response = await axios.delete(`/prestamos/eliminar/${prestamoId}`);
        return Object.assign(response.data ?? {}, { status: response.status });
    } catch (error) {
        console.error("Error al eliminar préstamo:", error);
        throw error;
    }
}
