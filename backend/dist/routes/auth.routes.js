import { Router } from "express";
import { login, register, logout, rejectRequest, requestRecovery, resetWithCode, listPending, generateCode } from "../controllers/auth.controller.js";
import { authenticateJwt } from "../middleware/authentication.middleware.js";
import { authorizeRoles } from "../middleware/authorization.middleware.js";
const router = Router();
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
// Recuperación de contraseña
router.post("/recovery/request", requestRecovery);
router.post("/recovery/reset", resetWithCode);
router.get("/recovery/pending", authenticateJwt, authorizeRoles("administrador"), listPending);
router.post("/recovery/:id/code", authenticateJwt, authorizeRoles("administrador"), generateCode);
router.post("/recovery/:id/reject", authenticateJwt, authorizeRoles("administrador"), rejectRequest);
export default router;
