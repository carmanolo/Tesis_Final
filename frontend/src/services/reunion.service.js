import axios from "./root.service.js";

export async function getReunionesService() {
    try {
        const response = await axios.get("/reuniones");
        // console.log(response);
        return response.data.data;
    } catch (error) {
        console.error("Error al obtener carreras:", error);
    }
}

export async function createReunionService(reunionData) {
    try {
        const response = await axios.post("/reuniones/crear/",reunionData);
        return Object.assign(response.data, {status: response.status});
    } catch (error) {
        console.error("Error al crear reuniones",error);
        throw error; 
    }
}

export async function patchReunionService(reunionId, reunionData) { 
    try {
        const response = await axios.patch(`/reuniones/editar/${reunionId}`, reunionData);
        return Object.assign(response.data, {status: response.status});
    } catch (error) {
        console.error("Error al editar reunion:", error);
        throw error; 
    }
}

export async function deleteReunionSer(reunionId) {
    try {
        const response = await axios.delete(`/reuniones/eliminar/${reunionId}`);
        return response.data;
    } catch (error) {
        console.error("Error al eliminar reunion:", error);
    }
}

export async function subirActaService(idReunion, archivo) {
    try {
        const formData = new FormData();
        formData.append("archivo", archivo);
 
        // No seteamos "Content-Type" a mano: el navegador arma el boundary
        // correcto del multipart/form-data al detectar un FormData.
        const response = await axios.post(`/reuniones/${idReunion}/acta`, formData);
        return Object.assign(response.data, { status: response.status });
    } catch (error) {
        console.error("Error al subir el acta:", error);
        throw error;
    }
}
 
export async function descargarActaService(idReunion) {
    try {
        const response = await axios.get(`/reuniones/${idReunion}/acta/descargar`, {
            responseType: "blob",
        });
 
        const disposition = response.headers["content-disposition"] || "";
        const match = disposition.match(/filename="?([^";]+)"?/);
        const nombreArchivo = match ? match[1] : `acta_reunion_${idReunion}`;
 
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", nombreArchivo);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
 
        return true;
    } catch (error) {
        console.error("Error al descargar el acta:", error);
        throw error;
    }
}
