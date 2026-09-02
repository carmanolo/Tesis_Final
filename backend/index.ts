import cors from "cors";
import express from "express";
import morgan from "morgan";
import indexRoutes from "./src/routes/index.routes.js";
import { PORT, HOST } from "./src/config/configEnv.js";
import { connectDB } from "./src/config/configDb.js";
import { createUsers } from "./src/config/initDb.js";

async function setupServer(): Promise<void> {
  const app = express();
  app.disable("x-powered-by");

  app.use(
    cors({
      credentials: true,
      origin: true,
    })
  );

  app.use(express.json());
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