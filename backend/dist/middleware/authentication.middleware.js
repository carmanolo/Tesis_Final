import { SESSION_SECRET } from "../config/configEnv.js";
import jwt from "jsonwebtoken";
export function authenticateJwt(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "Token no proporcionado" });
        return;
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, SESSION_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(403).json({ message: "Token inválido o expirado" });
        return;
    }
}
