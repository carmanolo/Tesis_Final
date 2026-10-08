import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import carreraRoutes from "./carreras.routes.js";
import reunionRoutes from "./reunion.routes.js";
import AporteRoutes from "./aporte.routes.js";
import MaterialRoutes from "./material.routes.js"

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/carreras", carreraRoutes);
router.use("/reuniones", reunionRoutes);
router.use("/aportes", AporteRoutes);
router.use("/materiales", MaterialRoutes);

export default router;