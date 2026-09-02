import axios from './root.service.js';

export async function getUsersService() {
    try {
        const response = await axios.get('/users');
        // console.log(response);
        return response.data.data;
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
    }
}

export async function createUserService(userData) {
    try {
        const response = await axios.post('/users/crear/', userData);
        return Object.assign(response.data, {status: response.status});
    } catch (error) {
        console.error("Error al crear usuarios",error);
        throw error; 
    }
}

export async function patchUserService(userId, userData) { 
    try {
        const response = await axios.patch(`/users/editar/${userId}`, userData);
        return Object.assign(response.data, {status: response.status});
    } catch (error) {
        console.error("Error al editar usuario:", error);
        throw error; 
    }
}

export async function deleteUserSer(userId) {
    try {
        const response = await axios.delete(`/users/eliminar/${userId}`);
        return response.data;
    } catch (error) {
        console.error("Error al eliminar usuario:", error);
    }
}

export async function getProfile() { 
    try {
        const response = await axios.get('/users/profile');
        return response.data;
    } catch (error) {
        console.error("Error al obtener perfil:", error);
        throw error;
    }
}

export async function getStats() {
    try {
        const response = await axios.get("/users/getUserStats");
        return response.data;
    } catch (error) {
        console.error("Error al obtener estadísticas: ", error);
        throw error;
    }
}