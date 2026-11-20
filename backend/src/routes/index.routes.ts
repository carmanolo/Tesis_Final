import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import carreraRoutes from "./carreras.routes.js";
import reunionRoutes from "./reunion.routes.js";
import AporteRoutes from "./aporte.routes.js";
import MaterialRoutes from "./material.routes.js";
import PrestamoRoutes from "./prestamo.routes.js";
import RespaldoRoutes from "./respaldo.routes.js";
import CompromisoRoutes from "./compromiso.routes.js";
import HistorialActividadRoutes from "./historialActividad.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/carreras", carreraRoutes);
router.use("/reuniones", reunionRoutes);
router.use("/aportes", AporteRoutes);
router.use("/materiales", MaterialRoutes);
router.use("/prestamos", PrestamoRoutes);
router.use("/respaldos", RespaldoRoutes);
router.use("/historial", HistorialActividadRoutes);
router.use("/compromisos", CompromisoRoutes);


export default router;