import { SESSION_SECRET } from "../config/configEnv.js";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export function authenticateJwt(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Token no proporcionado" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SESSION_SECRET) as { email?: string; rol?: string; [key: string]: any };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: "Token inválido o expirado" });
    return;
  }
}