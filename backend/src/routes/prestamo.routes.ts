import { Router } from "express";
import { createPrestamo, devolverPrestamo, deletePrestamo } from "../controllers/prestamo.controller.js";
import { authenticateJwt } from "../middleware/authentication.middleware.js";
import { authorizeRoles } from "../middleware/authorization.middleware.js";

const router = Router();

router.use(authenticateJwt);

const ROLES_GESTION_PRESTAMOS = ["administrador", "presidente cee", "vicepresidente cee", "secretario cee", "tesorero cee", "vocal cee"];

router.post("/crear", authorizeRoles(...ROLES_GESTION_PRESTAMOS), createPrestamo);
router.patch("/devolver/:id_prestamo", authorizeRoles(...ROLES_GESTION_PRESTAMOS), devolverPrestamo);
router.delete("/eliminar/:id_prestamo", authorizeRoles(...ROLES_GESTION_PRESTAMOS), deletePrestamo);

export default router;
