// test/integration/material.test.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";
import { Like } from "typeorm";
import materialRoutes from "../../routes/material.routes.js";
import { AppDataSource } from "../../config/configDb.js";
import { SESSION_SECRET } from "../../config/configEnv.js";
import UserEntity from "../../entity/user.entity.js";
import CarreraEntity from "../../entity/carrera.entity.js";
import MaterialEntity from "../../entity/material.entity.js";

const BASE_MATERIALES = "/api/materiales";
const RUTA_CREAR = `${BASE_MATERIALES}/crear/`;
const EMAIL_ADMIN = "admin@gmail.com";
const EMAIL_CEE = "carlos.dominguez2301@alumnos.ubiobio.cl";
const PREFIJO_NOMBRE = "__TEST__ Material";

const TIPO_VALIDO = "calculadora";
const ESTADO_VALIDO = "disponible";
const STOCK_VALIDO = 10;

// Roles autorizados según material.routes.ts
const ROLES_GESTION = [
  "administrador",
  "presidente cee",
  "vicepresidente cee",
  "secretario cee",
  "tesorero cee",
  "vocal cee",
];

const app = express();
app.use(express.json());
app.use(BASE_MATERIALES, materialRoutes);

const letrasAleatorias = (largo: number) =>
  Array.from({ length: largo }, () =>
    String.fromCharCode(97 + Math.floor(Math.random() * 26))
  ).join("");

describe("POST de creación de materiales - Pruebas de Integración", () => {
  let admin: any;
  let miembro: any;       // usuario CEE (carlos.dominguez2301...)
  let estudiante: any;
  let carrera: any;
  let materialRepo: any;
  let tokenAdmin: string;
  let tokenMiembro: string;
  let tokenSinPermiso: string;
  const idsCreados: number[] = [];

  const firmar = (u: any, overrides: Record<string, any> = {}) =>
    jwt.sign(
      {
        id: u.id,
        carreraId: u.carreraId,
        username: u.username,
        email: u.email,
        role: u.role,
        rol: u.role,
        ...overrides,
      },
      SESSION_SECRET,
      { expiresIn: "1h" }
    );

  const datosUnicos = (extra: Record<string, any> = {}) => ({
    nombre_material: `${PREFIJO_NOMBRE} ${letrasAleatorias(8)}`,
    tipo_material: TIPO_VALIDO,
    stock: STOCK_VALIDO,
    estado_prestamo: ESTADO_VALIDO,
    tne_entregada: false,
    ...extra,
  });

  const crear = (body: Record<string, any>, token: string = tokenMiembro) =>
    request(app)
      .post(RUTA_CREAR)
      .set("Authorization", `Bearer ${token}`)
      .send(body);

  const esperarCreado = (response: any) => {
    expect(
      response.statusCode,
      `La API respondió: ${JSON.stringify(response.body)}`
    ).toBe(201);
    idsCreados.push(response.body.data.id_material);
  };

  const cantidadConNombre = (nombre_material: string) =>
    materialRepo.count({ where: { nombre_material } });

  const buscarGuardado = (response: any) =>
    materialRepo.findOne({ where: { id_material: response.body.data.id_material } });

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    materialRepo = AppDataSource.getRepository(MaterialEntity as any);
    const userRepo = AppDataSource.getRepository(UserEntity as any);

    admin = await userRepo.findOne({ where: { email: EMAIL_ADMIN } });
    if (!admin) {
      throw new Error(`No existe el usuario ${EMAIL_ADMIN} en la BD de pruebas`);
    }

    miembro = await userRepo.findOne({ where: { email: EMAIL_CEE } });
    if (!miembro) {
      throw new Error(`No existe el usuario ${EMAIL_CEE} en la BD de pruebas`);
    }
    if (!miembro.carreraId) {
      throw new Error(`El usuario ${EMAIL_CEE} debe tener una carrera asignada`);
    }
    // ⚠️ CRÍTICO: el usuario CEE debe tener rol de gestión en BD,
    // porque authorizeRoles consulta la BD (no confía en el token).
    if (!ROLES_GESTION.includes(miembro.role)) {
      throw new Error(
        `El usuario ${EMAIL_CEE} tiene rol "${miembro.role}" en BD, ` +
        `pero se requiere uno de: ${ROLES_GESTION.join(", ")} para crear materiales`
      );
    }

    estudiante = await userRepo.findOne({ where: { role: "estudiante" } });
    if (!estudiante) {
      throw new Error("No existe ningún usuario con rol 'estudiante' en la BD de pruebas");
    }

    const carreras = await AppDataSource.getRepository(CarreraEntity as any).find({ take: 1 });
    carrera = carreras[0];
    if (!carrera) {
      throw new Error("No existe ninguna carrera en la BD de pruebas");
    }

    tokenAdmin = firmar(admin);
    tokenMiembro = firmar(miembro);
    tokenSinPermiso = firmar(estudiante);
  }, 30000);

  afterAll(async () => {
    for (const id of idsCreados) {
      await materialRepo.delete({ id_material: id });
    }
    await materialRepo.delete({ nombre_material: Like(`${PREFIJO_NOMBRE} %`) });

    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }, 30000);

  // ────────────────────────────────────────────────────────────────────────
  describe("autenticación y autorización", () => {
    it("rechaza con 401 si no se envía token", async () => {
      const body = datosUnicos();
      const response = await request(app).post(RUTA_CREAR).send(body);

      expect(response.statusCode).toBe(401);
      expect(await cantidadConNombre(body.nombre_material)).toBe(0);
    });

    it("rechaza con 403 si el token es inválido", async () => {
      // authenticateJwt devuelve 403 para token con firma inválida
      const body = datosUnicos();
      const response = await crear(body, "token-falso");

      expect(response.statusCode).toBe(403);
      expect(await cantidadConNombre(body.nombre_material)).toBe(0);
    });

    it("rechaza con 403 si el rol no está autorizado a registrar materiales", async () => {
      const body = datosUnicos();
      const response = await crear(body, tokenSinPermiso);

      expect(response.statusCode).toBe(403);
      expect(await cantidadConNombre(body.nombre_material)).toBe(0);
    });

    it("rechaza con 404 si el email del token no existe en la BD", async () => {
      // authorizeRoles busca por email; si no existe → 404 (no 403)
      const tokenFantasma = jwt.sign(
        { email: "no-existe-xyz@ubiobio.cl", role: "administrador" },
        SESSION_SECRET,
        { expiresIn: "1h" }
      );
      const body = datosUnicos();
      const response = await crear(body, tokenFantasma);

      expect(response.statusCode).toBe(404);
      expect(await cantidadConNombre(body.nombre_material)).toBe(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  describe("validaciones de entrada", () => {
    it("rechaza con 400 un body vacío", async () => {
      const response = await crear({});
      expect(response.statusCode).toBe(400);
    });

    it.each(["nombre_material", "tipo_material", "stock"])(
      "rechaza con 400 si falta el campo %s",
      async (campo) => {
        const body: Record<string, any> = datosUnicos();
        const nombreOriginal = body.nombre_material;
        delete body[campo];

        const response = await crear(body);

        expect(response.statusCode).toBe(400);
        expect(await cantidadConNombre(nombreOriginal)).toBe(0);
      }
    );

    it("rechaza con 400 un stock negativo", async () => {
      const body = datosUnicos({ stock: -5 });
      const response = await crear(body);
      expect(response.statusCode).toBe(400);
      expect(await cantidadConNombre(body.nombre_material)).toBe(0);
    });

    it("rechaza con 400 un stock no numérico", async () => {
      const body = datosUnicos({ stock: "abc" });
      const response = await crear(body);

      expect(response.statusCode).toBe(400);
      expect(await cantidadConNombre(body.nombre_material)).toBe(0);
    });

    it("rechaza con 400 un tipo_material inválido", async () => {
      const body = datosUnicos({ tipo_material: "tipo_inexistente" });
      const response = await crear(body);

      expect(response.statusCode).toBe(400);
      expect(await cantidadConNombre(body.nombre_material)).toBe(0);
    });

    it("rechaza con 400 un estado_prestamo inválido", async () => {
      const body = datosUnicos({ estado_prestamo: "estado_random" });
      const response = await crear(body);

      expect(response.statusCode).toBe(400);
      expect(await cantidadConNombre(body.nombre_material)).toBe(0);
    });

    // ⚠️ Verifica contra tu material.validation.ts real.
    //    El controlador lee muchos aliases (prestatario, paso_tne, id_carrera, carreraId),
    //    pero si integrityValidation no los declara, JOI los rechaza como "campos extra".
    it("rechaza con 400 si se envían campos adicionales no permitidos", async () => {
      const body = datosUnicos({ campo_extra: "x" });
      const response = await crear(body);

      expect(response.statusCode).toBe(400);
      expect(await cantidadConNombre(body.nombre_material)).toBe(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  describe("creación exitosa", () => {
    it("crea el material con 201 y devuelve los datos enviados", async () => {
      const body = datosUnicos();
      const response = await crear(body);

      esperarCreado(response);
      expect(response.body.data.nombre_material).toBe(body.nombre_material);
      expect(response.body.data.tipo_material).toBe(body.tipo_material);
      expect(Number(response.body.data.stock)).toBe(STOCK_VALIDO);
      expect(response.body.data.estado_prestamo).toBe(ESTADO_VALIDO);
    });

    it("guarda el material en la BD asociado a la carrera del usuario creador", async () => {
      const body = datosUnicos();
      const response = await crear(body, tokenMiembro);
      esperarCreado(response);

      const guardado = await buscarGuardado(response);
      expect(guardado).not.toBeNull();
      expect(guardado.nombre_material).toBe(body.nombre_material);
      expect(guardado.carreraId).toBe(miembro.carreraId);
    });

    it("mantiene stock intacto en estado 'disponible'", async () => {
      const body = datosUnicos({ stock: 7, estado_prestamo: "disponible" });
      const response = await crear(body);

      esperarCreado(response);
      expect(Number(response.body.data.stock)).toBe(7);
    });

    it("decrementa stock en 1 al crear en estado 'prestado'", async () => {
      const body = datosUnicos({ stock: 5, estado_prestamo: "prestado" });
      const response = await crear(body);

      esperarCreado(response);
      expect(Number(response.body.data.stock)).toBe(4);
      expect(response.body.data.estado_prestamo).toBe("prestado");
    });

    it("rechaza con 400 crear en estado 'prestado' con stock 0", async () => {
      const body = datosUnicos({ stock: 0, estado_prestamo: "prestado" });
      const response = await crear(body);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toMatch(/stock menor a 1/i);
      expect(await cantidadConNombre(body.nombre_material)).toBe(0);
    });

    it("acepta fecha_prestamo válida", async () => {
      const body = datosUnicos({
        fecha_prestamo: "2025-12-01",
        estado_prestamo: "prestado",
        stock: 2,
      });
      const response = await crear(body);

      esperarCreado(response);
      expect(response.body.data.fecha_prestamo).toBeTruthy();
    });

    it("acepta creación sin fecha_prestamo (null)", async () => {
      const body = datosUnicos({ fecha_prestamo: null });
      const response = await crear(body);

      esperarCreado(response);
      expect(response.body.data.fecha_prestamo).toBeFalsy();
    });

  });

  // ────────────────────────────────────────────────────────────────────────
  describe("asociación de la carrera", () => {
    it("prioriza la carrera del usuario aunque el body indique otra", async () => {
      // El controlador hace: targetCarreraId = userCarreraId || carreraId || id_carrera
      // Como authorizeRoles inyecta userCarreraId desde BD, gana el del usuario.
      const response = await crear(
        datosUnicos({ carreraId: 999999 }),
        tokenMiembro
      );
      esperarCreado(response);

      const guardado = await buscarGuardado(response);
      expect(guardado.carreraId).toBe(miembro.carreraId);
    });

    it("usa la carrera indicada si el usuario no tiene carrera asignada", async () => {
      // Este test requiere un admin sin carrera. Si el tuyo la tiene, se salta.
      if (admin.carreraId) {
        console.warn(
          `⚠️ ${EMAIL_ADMIN} tiene carrera asignada (${admin.carreraId}). ` +
          `Se omite este test.`
        );
        return;
      }

      const response = await crear(
        datosUnicos({ carreraId: carrera.id_carrera }),
        tokenAdmin
      );
      esperarCreado(response);

      const guardado = await buscarGuardado(response);
      expect(guardado.carreraId).toBe(carrera.id_carrera);
    });

    it("usa la primera carrera registrada si el usuario no tiene carrera y el body tampoco", async () => {
      if (admin.carreraId) {
        console.warn(
          `⚠️ ${EMAIL_ADMIN} tiene carrera asignada (${admin.carreraId}). ` +
          `Se omite este test.`
        );
        return;
      }

      const response = await crear(datosUnicos(), tokenAdmin);
      esperarCreado(response);

      const guardado = await buscarGuardado(response);
      expect(guardado.carreraId).toBeTruthy();
    });
  });
});