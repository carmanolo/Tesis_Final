import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import express from "express";
import authRoutes from "../../routes/auth.routes.js";
import { AppDataSource } from "../../config/configDb.js";

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

describe("POST /api/auth/login - Prueba de Integración", () => {

    beforeAll(async () => {
        if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
        }
    });

    afterAll(async () => {
        if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        }
    });

  it("debe rechazar la solicitud con status 400 si falta la contraseña", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "usuario@ejemplo.com" });

    // Expectativa 1
    expect(response.statusCode).toBe(400);
    // Expectativa 2
    expect(response.body).toHaveProperty("status", "Client error");
  });

  it("debe responder adecuadamente ante credenciales enviadas", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "administrador2024@gmail.cl",
        password: "admin1234"
      });

    // Expectativa 3
    expect([200, 400, 404]).toContain(response.statusCode);
  });
});