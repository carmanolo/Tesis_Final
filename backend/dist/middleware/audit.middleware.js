import { registrarActividad } from "../services/historialActividad.service.js";
import { obtenerIp, obtenerDispositivo } from "../utils/audit.utils.js";
// Mapeo amigable de rutas a módulos y descripciones
function identificarEvento(req, statusCode) {
    const method = req.method;
    const path = req.originalUrl || req.url;
    // Ignorar consultas GET de solo lectura frecuentes para no saturar con ruido
    if (method === "GET") {
        return null;
    }
    const ip = obtenerIp(req);
    // Módulo de Usuarios
    if (path.includes("/users/crear")) {
        return {
            accion: "CREAR_USUARIO",
            modulo: "USUARIOS",
            descripcion: `Creación de nuevo usuario (${req.body?.email || req.body?.username || "sin datos"})`,
        };
    }
    if (path.includes("/users/editar")) {
        return {
            accion: "EDITAR_USUARIO",
            modulo: "USUARIOS",
            descripcion: `Modificación de usuario ID: ${path.split("/").pop()}`,
        };
    }
    if (path.includes("/users/eliminar")) {
        return {
            accion: "ELIMINAR_USUARIO",
            modulo: "USUARIOS",
            descripcion: `Eliminación de usuario ID: ${path.split("/").pop()}`,
        };
    }
    // Módulo de Carreras
    if (path.includes("/carreras/crear") || (path.includes("/carreras") && method === "POST")) {
        return {
            accion: "CREAR_CARRERA",
            modulo: "CARRERAS",
            descripcion: `Creación de carrera: ${req.body?.nombre_carrera || "N/A"}`,
        };
    }
    if (path.includes("/carreras") && method === "DELETE") {
        return {
            accion: "ELIMINAR_CARRERA",
            modulo: "CARRERAS",
            descripcion: `Eliminación de carrera ID: ${path.split("/").pop()}`,
        };
    }
    // Módulo de Publicaciones
    if (path.includes("/publicaciones/crear") || (path.includes("/publicaciones") && method === "POST")) {
        return {
            accion: "CREAR_PUBLICACION",
            modulo: "PUBLICACIONES",
            descripcion: `Nueva publicación creada: "${req.body?.titulo || "Sin título"}"`,
        };
    }
    if (path.includes("/publicaciones/editar") || (path.includes("/publicaciones") && method === "PATCH")) {
        return {
            accion: "EDITAR_PUBLICACION",
            modulo: "PUBLICACIONES",
            descripcion: `Edición de publicación: "${req.body?.titulo || path.split("/").pop()}"`,
        };
    }
    if (path.includes("/publicaciones/eliminar") || (path.includes("/publicaciones") && method === "DELETE")) {
        return {
            accion: "ELIMINAR_PUBLICACION",
            modulo: "PUBLICACIONES",
            descripcion: `Eliminación de publicación ID: ${path.split("/").pop()}`,
        };
    }
    // Módulo de Materiales / Préstamos
    if (path.includes("/materiales") && method === "POST") {
        return {
            accion: "CREAR_MATERIAL",
            modulo: "MATERIALES",
            descripcion: `Registro de material: ${req.body?.nombre_material || "N/A"}`,
        };
    }
    if (path.includes("/prestamos") && method === "POST") {
        return {
            accion: "CREAR_PRESTAMO",
            modulo: "PRESTAMOS",
            descripcion: `Préstamo registrado a: ${req.body?.prestatario || "N/A"}`,
        };
    }
    // Módulo de Aportes
    if (path.includes("/aportes") && (method === "POST" || method === "PATCH" || method === "DELETE")) {
        return {
            accion: `${method}_APORTE`,
            modulo: "APORTES",
            descripcion: `Operación sobre aporte económico (${method})`,
        };
    }
    // Genérico para cualquier otra mutación POST/PATCH/PUT/DELETE
    return {
        accion: `${method}_ACTIVIDAD`,
        modulo: "SISTEMA",
        descripcion: `Petición ${method} en ${path}`,
    };
}
export function auditMiddleware(req, res, next) {
    // Capturamos el final de la respuesta
    res.on("finish", () => {
        // Si es ruta de auth, ya se maneja directamente con precisión en auth.controller
        if (req.originalUrl?.includes("/api/auth/")) {
            return;
        }
        const evento = identificarEvento(req, res.statusCode);
        if (!evento)
            return;
        const user = req.user;
        const ip = obtenerIp(req);
        const dispositivo = obtenerDispositivo(req);
        // Sanitizar datos del body eliminando passwords sensibles antes de guardar
        let sanitizedBody = null;
        if (req.body && typeof req.body === "object") {
            const { password, ...resto } = req.body;
            sanitizedBody = Object.keys(resto).length > 0 ? resto : null;
        }
        registrarActividad({
            usuarioId: user?.id || null,
            usuarioEmail: user?.email || null,
            usuarioNombre: user?.username || null,
            rol: user?.role || user?.rol || null,
            accion: evento.accion,
            modulo: evento.modulo,
            descripcion: evento.descripcion,
            detalles: sanitizedBody,
            ip,
            dispositivo,
            metodoHttp: req.method,
            ruta: req.originalUrl || req.url,
            estadoHttp: res.statusCode,
        });
    });
    next();
}
