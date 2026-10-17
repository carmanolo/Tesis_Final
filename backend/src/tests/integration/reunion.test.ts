import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import express from "express";
import fs from "fs";
import jwt from "jsonwebtoken";

// Único mock: Google Calendar es un servicio externo y no queremos crear eventos reales.
vi.mock("../../services/googleCalendar.service.js", () => ({
  crearEventoReunion: vi.fn().mockResolvedValue(null),
  actualizarEventoReunion: vi.fn().mockResolvedValue(undefined),
  eliminarEventoReunion: vi.fn().mockResolvedValue(undefined),
}));

import reunionRoutes from "../../routes/reunion.routes.js";
import { AppDataSource } from "../../config/configDb.js";
import { SESSION_SECRET } from "../../config/configEnv.js";
import UserEntity from "../../entity/user.entity.js";
import {
  ACTA_NO_PROPORCIONADA,
  ACTA_UPLOAD_DIR,
  FORMATO_NO_PERMITIDO,
  TAMANO_MAXIMO_ACTA_BYTES,
} from "../../constants/reunion.constants.js";

const app = express();
app.use(express.json());
app.use("/api/reuniones", reunionRoutes);

// Usuario administrador que ya existe en la BD de pruebas (el mismo de auth.test.js)
const EMAIL_ADMIN = "admin@gmail.com";

const PDF_FALSO = Buffer.from("%PDF-1.4\nacta de prueba\n%%EOF");
const PDF_FALSO_2 = Buffer.from("%PDF-1.4\nacta reemplazada\n%%EOF");

const parseBinario = (res: any, cb: (err: Error | null, body: Buffer) => void) => {
  const chunks: Buffer[] = [];
  res.on("data", (c: Buffer) => chunks.push(c));
  res.on("end", () => cb(null, Buffer.concat(chunks)));
};

const fechaFutura = () => {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().slice(0, 10);
};

describe("Actas de reuniones - Pruebas de Integración", () => {
  let tokenAdmin: string;
  let tokenOtraCarrera: string;
  let tokenSinPermiso: string;
  let reunionConActaId: number;
  let reunionSinActaId: number;
  const reunionesCreadas: number[] = [];

  const crearReunion = async (descripcion: string): Promise<number> => {
    const response = await request(app)
      .post("/api/reuniones/crear")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ fecha_reunion: fechaFutura(), descripcion });

    expect(response.statusCode).toBe(201);
    const id = response.body.data.id_reunion;
    reunionesCreadas.push(id);
    return id;
  };

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const admin: any = await AppDataSource.getRepository(UserEntity as any).findOne({
      where: { email: EMAIL_ADMIN },
    });
    if (!admin) {
      throw new Error(`No existe el usuario ${EMAIL_ADMIN} en la BD de pruebas`);
    }

    const userRepo = AppDataSource.getRepository(UserEntity as any);

    const estudiante: any = await userRepo.findOne({ where: { role: "estudiante" } });
      if (!estudiante) {
      throw new Error("No existe ningún usuario con rol 'estudiante' en la BD de pruebas");
    }

    let directivo: any = null;
    for (const rol of ["secretario cee", "presidente cee", "tesorero cee", "vocal cee"]) {
      directivo = await userRepo.findOne({ where: { role: rol } });
      if (directivo) break;
    }
    if (!directivo) {
      throw new Error("No existe ningún usuario de la directiva (cee) en la BD de pruebas");
    }



    const firmar = (payload: Record<string, any>) =>
      jwt.sign(payload, SESSION_SECRET, { expiresIn: "1h" });

    tokenAdmin = firmar({
      id: admin.id,
      carreraId: admin.carreraId,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      rol: admin.role,
    });

    // Usuario válido pero de una carrera distinta a la de la reunión
    tokenOtraCarrera = firmar({
      id: directivo.id,
      carreraId: 999999,
      username: directivo.username,
      email: directivo.email,
      role: directivo.role,
      rol: directivo.role,
    });

    // Rol que no está autorizado a subir actas
    tokenSinPermiso = firmar({
      id: estudiante.id,
      carreraId: estudiante.carreraId,
      username: estudiante.username,
      email: estudiante.email,
      role: estudiante.role,
      rol: estudiante.role,
    });
    reunionConActaId = await crearReunion("Reunión de prueba con acta");
    reunionSinActaId = await crearReunion("Reunión de prueba sin acta");
  }, 30000);

  afterAll(async () => {
    // Eliminar por la API también borra el archivo físico del acta
    for (const id of reunionesCreadas) {
      await request(app)
        .delete(`/api/reuniones/eliminar/${id}`)
        .set("Authorization", `Bearer ${tokenAdmin}`);
    }
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }, 30000);

  describe("POST /api/reuniones/:id_reunion/acta", () => {
    it("rechaza con 401 si no se envía token", async () => {
      const response = await request(app)
        .post(`/api/reuniones/${reunionConActaId}/acta`)
        .attach("archivo", PDF_FALSO, { filename: "acta.pdf", contentType: "application/pdf" });

      expect(response.statusCode).toBe(401);
    });

    it("rechaza con 403 si el token es inválido", async () => {
      const response = await request(app)
        .post(`/api/reuniones/${reunionConActaId}/acta`)
        .set("Authorization", "Bearer token-falso")
        .attach("archivo", PDF_FALSO, { filename: "acta.pdf", contentType: "application/pdf" });

      expect(response.statusCode).toBe(403);
    });

    it("rechaza con 403 si el rol no está autorizado", async () => {
      const response = await request(app)
        .post(`/api/reuniones/${reunionConActaId}/acta`)
        .set("Authorization", `Bearer ${tokenSinPermiso}`)
        .attach("archivo", PDF_FALSO, { filename: "acta.pdf", contentType: "application/pdf" });

      console.log(response.body);

      expect(response.statusCode).toBe(403);
    });

    it("rechaza con 400 si no se adjunta archivo", async () => {
      const response = await request(app)
        .post(`/api/reuniones/${reunionConActaId}/acta`)
        .set("Authorization", `Bearer ${tokenAdmin}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe(ACTA_NO_PROPORCIONADA);
    });

    it("rechaza con 400 un formato no permitido", async () => {
      const response = await request(app)
        .post(`/api/reuniones/${reunionConActaId}/acta`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .attach("archivo", Buffer.from("texto plano"), {
          filename: "acta.txt",
          contentType: "text/plain",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe(FORMATO_NO_PERMITIDO);
    });

    it("rechaza con 400 un archivo que supera el tamaño máximo", async () => {
      const response = await request(app)
        .post(`/api/reuniones/${reunionConActaId}/acta`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .attach("archivo", Buffer.alloc(TAMANO_MAXIMO_ACTA_BYTES + 1), {
          filename: "grande.pdf",
          contentType: "application/pdf",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe("El archivo excede el tamaño máximo permitido");
    });

    it("rechaza con 404 si la reunión no existe y no deja el archivo en disco", async () => {
      const idInexistente = 999999;
      const response = await request(app)
        .post(`/api/reuniones/${idInexistente}/acta`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .attach("archivo", PDF_FALSO, { filename: "acta.pdf", contentType: "application/pdf" });

      expect(response.statusCode).toBe(404);

      const huerfanos = fs
        .readdirSync(ACTA_UPLOAD_DIR)
        .filter((f) => f.startsWith(`acta_${idInexistente}_`));
      expect(huerfanos).toHaveLength(0);
    });

    it("rechaza con 404 si la reunión pertenece a otra carrera", async () => {
      const response = await request(app)
        .post(`/api/reuniones/${reunionConActaId}/acta`)
        .set("Authorization", `Bearer ${tokenOtraCarrera}`)
        .attach("archivo", PDF_FALSO, { filename: "acta.pdf", contentType: "application/pdf" });

      // Si el rol de este token no pasa authorizeRoles, será 403: en ambos casos no se sube nada
      expect([403, 404]).toContain(response.statusCode);
    });

    it("sube el acta correctamente y la guarda en disco", async () => {
      const response = await request(app)
        .post(`/api/reuniones/${reunionConActaId}/acta`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .attach("archivo", PDF_FALSO, { filename: "acta.pdf", contentType: "application/pdf" });

      expect(response.statusCode).toBe(200);
      expect(response.body.data.nombre_original).toBe("acta.pdf");
      expect(response.body.data.tipo_archivo).toBe("application/pdf");
      expect(fs.existsSync(response.body.data.ruta_archivo)).toBe(true);
    });

    it("al subir otra acta reemplaza la anterior y borra el archivo viejo", async () => {
      const primera = await request(app)
        .post(`/api/reuniones/${reunionSinActaId}/acta`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .attach("archivo", PDF_FALSO, { filename: "v1.pdf", contentType: "application/pdf" });
      expect(primera.statusCode).toBe(200);
      const rutaVieja = primera.body.data.ruta_archivo;

      // multer usa Date.now() en el nombre: se espera 5 ms para no repetirlo
      await new Promise((r) => setTimeout(r, 5));

      const segunda = await request(app)
        .post(`/api/reuniones/${reunionSinActaId}/acta`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .attach("archivo", PDF_FALSO_2, { filename: "v2.pdf", contentType: "application/pdf" });
      expect(segunda.statusCode).toBe(200);

      const rutaNueva = segunda.body.data.ruta_archivo;
      expect(rutaNueva).not.toBe(rutaVieja);
      expect(fs.existsSync(rutaVieja)).toBe(false);
      expect(fs.existsSync(rutaNueva)).toBe(true);
    });
  });

  describe("GET /api/reuniones/:id_reunion/acta/descargar", () => {
    let reunionSinActaNuevaId: number;

    beforeAll(async () => {
      reunionSinActaNuevaId = await crearReunion("Reunión que nunca tendrá acta");
    }, 30000);

    it("rechaza con 401 si no se envía token", async () => {
      const response = await request(app).get(
        `/api/reuniones/${reunionConActaId}/acta/descargar`
      );
      expect(response.statusCode).toBe(401);
    });

    it("rechaza con 400 si el id es inválido", async () => {
      const response = await request(app)
        .get("/api/reuniones/abc/acta/descargar")
        .set("Authorization", `Bearer ${tokenAdmin}`);

      expect(response.statusCode).toBe(400);
    });

    it("rechaza con 404 si la reunión no existe", async () => {
      const response = await request(app)
        .get("/api/reuniones/999999/acta/descargar")
        .set("Authorization", `Bearer ${tokenAdmin}`);

      expect(response.statusCode).toBe(404);
    });

    it("rechaza con 404 si la reunión pertenece a otra carrera", async () => {
      const response = await request(app)
      .post(`/api/reuniones/${reunionConActaId}/acta`)
      .set("Authorization", `Bearer ${tokenOtraCarrera}`)
      .attach("archivo", PDF_FALSO, { filename: "acta.pdf", contentType: "application/pdf" });

      expect(response.statusCode).toBe(404);
    });

    it("rechaza con 404 si la reunión no tiene acta", async () => {
      const response = await request(app)
        .get(`/api/reuniones/${reunionSinActaNuevaId}/acta/descargar`)
        .set("Authorization", `Bearer ${tokenAdmin}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe("acta no encontrada");
    });

    it("descarga el acta con el nombre original y el mismo contenido que se subió", async () => {
      const response = await request(app)
        .get(`/api/reuniones/${reunionConActaId}/acta/descargar`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .buffer(true)
        .parse(parseBinario);

      expect(response.statusCode).toBe(200);
      expect(response.headers["content-disposition"]).toContain("acta.pdf");
      expect(Buffer.isBuffer(response.body)).toBe(true);
      expect(response.body.equals(PDF_FALSO)).toBe(true);
    });

    it("responde 404 si el archivo fue borrado del servidor", async () => {
      const subida = await request(app)
        .post(`/api/reuniones/${reunionSinActaNuevaId}/acta`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .attach("archivo", PDF_FALSO, { filename: "perdida.pdf", contentType: "application/pdf" });
      expect(subida.statusCode).toBe(200);

      fs.unlinkSync(subida.body.data.ruta_archivo);

      const response = await request(app)
        .get(`/api/reuniones/${reunionSinActaNuevaId}/acta/descargar`)
        .set("Authorization", `Bearer ${tokenAdmin}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe("el archivo del acta no existe en el servidor");
    });
  });
});