import { Router } from "express";
import { createMaterial, getMateriales, getMaterialById, patchMaterialById, deleteMaterialById } from "../controllers/material.controller.js";
import { authenticateJwt } from "../middleware/authentication.middleware.js";
import { authorizeRoles } from "../middleware/authorization.middleware.js";

const router = Router();

router.use(authenticateJwt);

router.get("/", authorizeRoles("administrador","presidente cee", "secretario cee", "tesorero cee", "vocal cee"), getMateriales);
router.get("/:id_material", authorizeRoles("administrador","presidente cee", "secretario cee", "tesorero cee", "vocal cee"), getMaterialById);
router.post("/crear/", authorizeRoles("administrador", "tesorero cee", "presidente cee", "secretario cee", "vocal cee"), createMaterial);
router.patch("/editar/:id_material", authorizeRoles("administrador","presidente cee", "secretario cee", "tesorero cee", "vocal cee"), patchMaterialById);
router.delete("/eliminar/:id_material", authorizeRoles("administrador","presidente cee", "secretario cee", "tesorero cee", "vocal cee"), deleteMaterialById);

export default router;