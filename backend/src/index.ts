import cors from "cors";
import express from "express";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import indexRoutes from "./routes/index.routes.js";
import { PORT, HOST } from "./config/configEnv.js";
import { connectDB } from "./config/configDb.js";
import { createUsers } from "./config/initDb.js";
import { iniciarCronRecordatorios } from "./services/recordatorio.service.js";
import { auditMiddleware } from "./middleware/audit.middleware.js";

/*onst __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);*/

async function setupServer(): Promise<void> {
  const app = express();
  app.disable("x-powered-by");

  app.use(
    cors({
      credentials: true,
      origin: true,
      exposedHeaders: ["Content-Disposition"], // <-- Permite al frontend leer el nombre original
    })
  );

  app.use(express.json());

  /*app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });*/
  app.use(morgan("dev"));

  // Middleware de auditoría para registro de actividades y seguridad
  app.use(auditMiddleware);

  // Servir archivos estáticos (uploads: actas, publicaciones, etc.)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));
  app.use("/uploads", express.static(path.resolve(__dirname, "../../uploads")));
  app.use("/uploads", express.static(path.resolve("uploads")));

  app.use("/api", indexRoutes);
  app.listen(Number(PORT), () => {
    console.log(`Servidor corriendo en ${HOST}:${PORT}`);
  });
}

async function setupAPI(): Promise<void> {
  try {
    await connectDB();
    await createUsers();
    iniciarCronRecordatorios();
    await setupServer();
  } catch (error) {
    console.error("Error en index.ts -> setupAPI(): ", error);
  }
}

setupAPI()
  .then(() => console.log("=> API Iniciada exitosamente"))
  .catch((error) => console.log("Error en index.ts -> setupAPI(): ", error));
