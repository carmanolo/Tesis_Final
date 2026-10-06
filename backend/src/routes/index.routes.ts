import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import carreraRoutes from "./carreras.routes.js";
import reunionRoutes from "./reunion.routes.js";
import AporteRoutes from "./aporte.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/carreras", carreraRoutes);
router.use("/reuniones", reunionRoutes);
router.use("/aportes", AporteRoutes);

export default router;