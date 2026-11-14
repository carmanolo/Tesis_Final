import { Router } from "express";
import {
  createCompromiso,
  getCompromisos,
  getCompromisoById,
  getCompromisoList,
  patchCompromisoById,
  deleteCompromisoById,
  asignarAporte,
  quitarAporte,
  descargarSolicitudPdf,
  descargarSolicitudExcel,
} from "../controllers/compromiso.controller.js";
import { authenticateJwt } from "../middleware/authentication.middleware.js";
import { authorizeRoles } from "../middleware/authorization.middleware.js";

const router = Router();

router.use(authenticateJwt);

const VIEW_ROLES = [
  "administrador",
  "admin",
  "presidente cee",
  "vicepresidente cee",
  "tesorero cee",
  "secretario cee",
  "vocal cee",
];

const MANAGE_ROLES = [
  "administrador",
  "admin",
  "presidente cee",
  "vicepresidente cee",
  "tesorero cee",
];

router.get("/compromisoList", authorizeRoles(...VIEW_ROLES), getCompromisoList);
router.get("/", authorizeRoles(...VIEW_ROLES), getCompromisos);
router.get("/:id_compromiso", authorizeRoles(...VIEW_ROLES), getCompromisoById);
router.get("/:id_compromiso/solicitud/pdf", authorizeRoles(...MANAGE_ROLES, "secretario cee"), descargarSolicitudPdf);
router.get("/:id_compromiso/solicitud/excel", authorizeRoles(...MANAGE_ROLES, "secretario cee"), descargarSolicitudExcel);
router.post("/crear/", authorizeRoles(...MANAGE_ROLES), createCompromiso);
router.patch("/editar/:id_compromiso", authorizeRoles(...MANAGE_ROLES), patchCompromisoById);
router.delete("/eliminar/:id_compromiso", authorizeRoles(...MANAGE_ROLES), deleteCompromisoById);

// Financia: asignar / quitar aportes de un compromiso
router.post("/:id_compromiso/aportes", authorizeRoles(...MANAGE_ROLES), asignarAporte);
router.delete("/:id_compromiso/aportes/:id_aporte", authorizeRoles(...MANAGE_ROLES), quitarAporte);

export default router;
