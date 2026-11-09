import { Router } from "express";
import { createCompromiso, getCompromisos, getCompromisoById, patchCompromisoById, deleteCompromisoById, asignarAporte, quitarAporte, descargarSolicitudPdf, descargarSolicitudExcel} from "../controllers/compromiso.controller.js";
import { authenticateJwt } from "../middleware/authentication.middleware.js";
import { authorizeRoles } from "../middleware/authorization.middleware.js";

const router = Router();

router.use(authenticateJwt);

const ROLES = [ "presidente cee", "vicepresidente cee", "tesorero cee"] as const;

router.get("/", authorizeRoles(...ROLES), getCompromisos);
router.get("/:id_compromiso", authorizeRoles(...ROLES), getCompromisoById);
router.get("/:id_compromiso/solicitud/pdf", authorizeRoles(...ROLES), descargarSolicitudPdf);
router.get("/:id_compromiso/solicitud/excel", authorizeRoles(...ROLES), descargarSolicitudExcel);
router.post("/crear/", authorizeRoles(...ROLES), createCompromiso);
router.patch("/editar/:id_compromiso", authorizeRoles(...ROLES), patchCompromisoById);
router.delete("/eliminar/:id_compromiso", authorizeRoles(...ROLES), deleteCompromisoById);

// Financia: asignar / quitar aportes de un compromiso
router.post("/:id_compromiso/aportes", authorizeRoles(...ROLES), asignarAporte);
router.delete("/:id_compromiso/aportes/:id_aporte", authorizeRoles(...ROLES), quitarAporte);

export default router;