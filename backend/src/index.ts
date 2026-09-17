import cors from "cors";
import express from "express";
import morgan from "morgan";
import indexRoutes from "./routes/index.routes.js";
import { PORT, HOST } from "./config/configEnv.js";
import { connectDB } from "./config/configDb.js";
import { createUsers } from "./config/initDb.js";

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
  app.use("/api", indexRoutes);
  app.listen(Number(PORT), () => {
    console.log(`Servidor corriendo en ${HOST}:${PORT}`);
  });
}

async function setupAPI(): Promise<void> {
  try {
    await connectDB();
    await createUsers();
    await setupServer();
  } catch (error) {
    console.error("Error en index.ts -> setupAPI(): ", error);
  }
}

setupAPI()
  .then(() => console.log("=> API Iniciada exitosamente"))
  .catch((error) => console.log("Error en index.ts -> setupAPI(): ", error));