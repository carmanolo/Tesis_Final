import { Router } from "express";
import { createCompromiso, getCompromisos, getCompromisoById, getCompromisoList, patchCompromisoById, deleteCompromisoById, asignarAporte, quitarAporte, descargarSolicitudPdf, descargarSolicitudExcel} from "../controllers/compromiso.controller.js";
import { authenticateJwt } from "../middleware/authentication.middleware.js";
import { authorizeRoles } from "../middleware/authorization.middleware.js";

const router = Router();

router.use(authenticateJwt);


router.get("/", authorizeRoles("presidente cee", "vicepresidente cee", "tesorero cee", "secretario cee", "vocal cee"), getCompromisos);
router.get("/:id_compromiso", authorizeRoles("presidente cee", "vicepresidente cee", "tesorero cee", "secretario cee", "vocal cee"), getCompromisoById);
router.get("/compromisoList", authorizeRoles("presidente cee", "vicepresidente cee", "tesorero cee", "secretario cee", "vocal cee"),getCompromisoById);
router.get("/:id_compromiso/solicitud/pdf", authorizeRoles("presidente cee", "vicepresidente cee", "tesorero cee", "secretario cee"), descargarSolicitudPdf);
router.get("/:id_compromiso/solicitud/excel", authorizeRoles("presidente cee", "vicepresidente cee", "tesorero cee", "secretario cee"), descargarSolicitudExcel);
router.post("/crear/", authorizeRoles("presidente cee", "vicepresidente cee", "tesorero cee"), createCompromiso);
router.patch("/editar/:id_compromiso", authorizeRoles("presidente cee", "vicepresidente cee", "tesorero cee"), patchCompromisoById);
router.delete("/eliminar/:id_compromiso", authorizeRoles("presidente cee", "vicepresidente cee", "tesorero cee"), deleteCompromisoById);

// Financia: asignar / quitar aportes de un compromiso
router.post("/:id_compromiso/aportes", authorizeRoles("presidente cee", "vicepresidente cee", "tesorero cee"), asignarAporte);
router.delete("/:id_compromiso/aportes/:id_aporte", authorizeRoles("presidente cee", "vicepresidente cee", "tesorero cee"), quitarAporte);

export default router;