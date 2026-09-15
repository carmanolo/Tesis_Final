import { Router } from "express";
import { getCarreras, getCarreraById, getCarreraList, createCarrera, patchCarreraById, deleteCarreraById } from "../controllers/carrera.controller.js"; 
import { authenticateJwt } from "../middleware/authentication.middleware.js";
import { authorizeRoles } from "../middleware/authorization.middleware.js";

const router = Router();

router.use(authenticateJwt);


// router.use(isAdmin);

router.get("/", authorizeRoles("administrador"), getCarreras);
router.get("/carrerasList", getCarreraList);
router.get("/:id_carrera", getCarreraById);
router.post("/crear/", authorizeRoles("administrador"), createCarrera);
router.patch("/editar/:id_carrera", authorizeRoles("administrador"), patchCarreraById);
router.delete("/eliminar/:id_carrera", authorizeRoles("administrador"), deleteCarreraById);

export default router;