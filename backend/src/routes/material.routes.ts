import { Router } from "express";
import { createMaterial, getMateriales, getMaterialById, patchMaterialById, deleteMaterialById } from "../controllers/material.controller.js";
import { authenticateJwt } from "../middleware/authentication.middleware.js";
import { authorizeRoles } from "../middleware/authorization.middleware.js";

const router = Router();

router.use(authenticateJwt);

// Lectura de materiales accesible para cualquier usuario autenticado (incluyendo estudiantes para ver disponibilidad o préstamos en Home)
router.get("/", getMateriales);
router.get("/:id_material", getMaterialById);

// Operaciones de gestión exclusivas para CEE y administrador
const ROLES_GESTION_MATERIAL = ["administrador", "presidente cee", "vicepresidente cee", "secretario cee", "tesorero cee", "vocal cee"];
router.post("/crear/", authorizeRoles(...ROLES_GESTION_MATERIAL), createMaterial);
router.patch("/editar/:id_material", authorizeRoles(...ROLES_GESTION_MATERIAL), patchMaterialById);
router.delete("/eliminar/:id_material", authorizeRoles(...ROLES_GESTION_MATERIAL), deleteMaterialById);

export default router; //utiles, articulos deportivos, juegos, calculadora
