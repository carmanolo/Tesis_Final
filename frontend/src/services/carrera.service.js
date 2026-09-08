import axios from "./root.service.js";

export async function getCarrerasService() {
    try {
        const response = await axios.get("/carreras");
        // console.log(response);
        return response.data.data;
    } catch (error) {
        console.error("Error al obtener carreras:", error);
    }
}

export async function createCarreraService(carreraData) {
    try {
        const response = await axios.post("/carreras/crear/", carreraData);
        return Object.assign(response.data, {status: response.status});
    } catch (error) {
        console.error("Error al crear carreras",error);
        throw error; 
    }
}

export async function patchCarreraService(carreraId, carreraData) { 
    try {
        const response = await axios.patch(`/carreras/editar/${carreraId}`, carreraData);
        return Object.assign(response.data, {status: response.status});
    } catch (error) {
        console.error("Error al editar carrera:", error);
        throw error; 
    }
}

export async function deleteCarreraSer(carreraId) {
    try {
        const response = await axios.delete(`/carreras/eliminar/${carreraId}`);
        return response.data;
    } catch (error) {
        console.error("Error al eliminar :", error);
    }
}