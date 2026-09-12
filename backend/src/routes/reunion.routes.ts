import { Router } from "express";
import {
    getReuniones,
    getReunionById,
    createReunion,
    patchReunionById,
    deleteReunionById,
    subirActa,
    descargarActa
} from "../controllers/reunion.controller.js";
import { authenticateJwt } from "../middleware/authentication.middleware.js";
import { authorizeRoles } from "../middleware/authorization.middleware.js";
import { uploadActaMiddleware } from "../middleware/reunion.upload.middleware.js";

const router = Router();

router.use(authenticateJwt);

router.get("/", getReuniones);
router.get("/:id_reunion", getReunionById);
router.post("/crear", authorizeRoles("administrador", "presidente cee", "secreatario cee", "tesorero cee", "vocal cee"), createReunion);
router.patch("/editar/:id_reunion", authorizeRoles("administrador", "presidente cee", "secreatario cee", "tesorero cee", "vocal cee"), patchReunionById);
router.delete("/eliminar/:id_reunion", authorizeRoles("administrador"), deleteReunionById);

// Gestión de actas (importación/exportación de archivos PDF y Word)
router.post("/:id_reunion/acta", authorizeRoles("administrador", "presidente cee", "secreatario cee", "tesorero cee", "vocal cee"), uploadActaMiddleware, subirActa);
router.get("/:id_reunion/acta/descargar", descargarActa);

export default router;