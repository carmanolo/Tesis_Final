import { Router } from "express";
import { getUsers, getUserById, getProfile, createUser, deleteUserById, getUserStats, patchUserById } from "../controllers/user.controller.js";
import { authenticateJwt } from "../middleware/authentication.middleware.js";
import { authorizeRoles } from "../middleware/authorization.middleware.js";

const router = Router();

router.use(authenticateJwt);

router.get("/profile", getProfile);
router.get("/getUserStats", getUserStats);

// router.use(isAdmin);

router.get("/", getUsers);
router.get("/:id", getUserById);
router.post("/crear/", authorizeRoles("administrador"), createUser);
router.patch("/editar/:id", authorizeRoles("administrador"), patchUserById);
router.delete("/eliminar/:id", authorizeRoles("administrador"), deleteUserById);

export default router;