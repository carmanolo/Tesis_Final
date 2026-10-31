import { Router } from "express";
import { createAporte, patchAporteById, getAporteById, getAportes, deleteAporteById, getSaldoAportes, descargarReportePdf, descargarReporteExcel } from "../controllers/aporte.controller.js";
import { authenticateJwt } from "../middleware/authentication.middleware.js";
import { authorizeRoles } from "../middleware/authorization.middleware.js";

const router = Router();

router.use(authenticateJwt);

router.get("/", authorizeRoles("administrador","presidente cee", "vicepresidente cee", "tesorero cee"), getAportes);
router.get("/saldo", authorizeRoles("administrador","presidente cee", "vicepresidente cee", "tesorero cee"), getSaldoAportes);
router.get("/reporte/pdf", authorizeRoles("administrador","presidente cee", "vicepresidente cee", "tesorero cee"), descargarReportePdf);
router.get("/reporte/excel", authorizeRoles("administrador","presidente cee", "vicepresidente cee", "tesorero cee"), descargarReporteExcel);
router.get("/:id_aporte", authorizeRoles("administrador","presidente cee", "secretario cee", "tesorero cee", "vocal cee"), getAporteById);
router.post("/crear/", authorizeRoles("administrador", "presidente cee" , "vicepresidente cee", "tesorero cee"), createAporte);
router.patch("/editar/:id_aporte", authorizeRoles("administrador","presidente cee", "vicepresidente cee", "tesorero cee"), patchAporteById);
router.delete("/eliminar/:id_aporte", authorizeRoles("administrador","presidente cee", "vicepresidente cee", "tesorero cee"), deleteAporteById);

export default router; //tesorero, vicepresidente, presidente
