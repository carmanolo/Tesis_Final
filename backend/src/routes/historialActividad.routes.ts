import { Router } from "express";
import { getHistorial, deleteHistorialItem, deleteHistorialLote } from "../controllers/historialActividad.controller.js";
import { authenticateJwt } from "../middleware/authentication.middleware.js";
import { authorizeRoles } from "../middleware/authorization.middleware.js";

const router = Router();

router.use(authenticateJwt);
router.use(authorizeRoles("administrador"));

router.get("/", getHistorial);
router.delete("/lote", deleteHistorialLote);
router.delete("/:id", deleteHistorialItem);

export default router;
