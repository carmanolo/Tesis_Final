import crypto from "crypto";
import { ALFABETO } from "../constants/ajustes.constants.js";
import { obtenerIp, obtenerDispositivo } from "./audit.utils.js";
export const isAdminRole = (role) => {
    const r = role?.toLowerCase();
    return r === "admin" || r === "administrador";
};
export function generarCodigo(largo = 8) {
    let c = "";
    for (let i = 0; i < largo; i++)
        c += ALFABETO[crypto.randomInt(ALFABETO.length)];
    return c;
}
export function auditBase(req) {
    return {
        ip: obtenerIp(req),
        dispositivo: obtenerDispositivo(req),
        metodoHttp: req.method,
        ruta: req.originalUrl || req.url,
    };
}
