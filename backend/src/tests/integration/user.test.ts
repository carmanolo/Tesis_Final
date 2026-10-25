import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";
import userRoutes from "../../routes/user.routes.js";
import authRoutes from "../../routes/auth.routes.js";
import { AppDataSource } from "../../config/configDb.js";
import { SESSION_SECRET } from "../../config/configEnv.js";
import UserEntity from "../../entity/user.entity.js";
import CarreraEntity from "../../entity/carrera.entity.js";

// Configuración (ajusta estos valores si tus rutas son distintas)
const BASE_USUARIOS = "/api/users";
const RUTA_CREAR = `${BASE_USUARIOS}/crear`;
const RUTA_LOGIN = "/api/auth/login";

const EMAIL_ADMIN = "admin@gmail.com";
const PASSWORD_VALIDA = "Prueba1234";
const ROL_NUEVO_USUARIO = "estudiante";

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use(BASE_USUARIOS, userRoutes);

describe("POST de creación de usuarios - Pruebas de Integración", () => {
  let tokenAdmin: string;
  let tokenSinPermiso: string;
  let tokenJefe: string;
  let carrera: any;
  let userRepo: any;
  const emailsCreados: string[] = [];

  // Datos únicos por llamada para no chocar con usuarios existentes
  const letrasAleatorias = (largo: number) =>
  Array.from({ length: largo }, () =>
    String.fromCharCode(97 + Math.floor(Math.random() * 26))
  ).join("");

let contador = 0;
const datosUnicos = (extra: Record<string, any> = {}) => {
  contador += 1;
  const sufijo = `${Date.now().toString().slice(-7)}${contador}`;
  const email = `test${sufijo}@gmail.com`;
  emailsCreados.push(email);
  return {
  username: `Test ${letrasAleatorias(8)}`,
  email,
  password: PASSWORD_VALIDA,
  role: ROL_NUEVO_USUARIO,
  carreraId: carrera.id_carrera,
  ...extra,
};
};

  const crear = (body: Record<string, any>, token: string = tokenAdmin) =>
    request(app).post(RUTA_CREAR).set("Authorization", `Bearer ${token}`).send(body);

  const cantidadConEmail = (email: string) => userRepo.count({ where: { email } });

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    userRepo = AppDataSource.getRepository(UserEntity as any);

    const admin: any = await userRepo.findOne({ where: { email: EMAIL_ADMIN } });
    if (!admin) {
      throw new Error(`No existe el usuario ${EMAIL_ADMIN} en la BD de pruebas`);
    }
    const estudiante: any = await userRepo.findOne({ where: { role: "estudiante" } });
    if (!estudiante) {
      throw new Error("No existe ningún usuario con rol 'estudiante' en la BD de pruebas");
    }

    carrera = await AppDataSource.getRepository(CarreraEntity as any).findOne({ where: {} });
    if (!carrera) {
        throw new Error("No existe ninguna carrera en la BD de pruebas");
    }

    let jefe: any = await userRepo.findOne({ where: { role: "jefe de carrera" } });
    if (!jefe) {
      jefe = userRepo.create({
        username: "Jefe Test Integracion",
        email: "jefetest@ubiobio.cl",
        password: "hash",
        role: "jefe de carrera",
        carreraId: carrera.id_carrera,
      });
      await userRepo.save(jefe);
      emailsCreados.push(jefe.email);
    } else {
      jefe.carreraId = carrera.id_carrera;
      await userRepo.save(jefe);
    }

    const firmar = (u: any) =>
      jwt.sign(
        {
          id: u.id,
          carreraId: u.carreraId,
          username: u.username,
          email: u.email,
          role: u.role,
          rol: u.role,
        },
        SESSION_SECRET,
        { expiresIn: "1h" }
      );

    tokenAdmin = firmar(admin);
    tokenSinPermiso = firmar(estudiante);
    tokenJefe = firmar(jefe);
  }, 30000);


  afterAll(async () => {
    // Limpieza directa en BD: no depende de que exista la ruta de eliminación
    for (const email of emailsCreados) {
      await userRepo.delete({ email });
    }
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }, 30000);

  describe("autenticación y autorización", () => {
    it("rechaza con 401 si no se envía token", async () => {
      const body = datosUnicos();
      const response = await request(app).post(RUTA_CREAR).send(body);

      expect(response.statusCode).toBe(401);
      expect(await cantidadConEmail(body.email)).toBe(0);
    });

    it("rechaza con 403 si el token es inválido", async () => {
      const body = datosUnicos();
      const response = await crear(body, "token-falso");

      expect(response.statusCode).toBe(403);
      expect(await cantidadConEmail(body.email)).toBe(0);
    });

    it("rechaza con 403 si el rol no está autorizado a crear usuarios", async () => {
      const body = datosUnicos();
      const response = await crear(body, tokenSinPermiso);

      expect(response.statusCode).toBe(403);
      expect(await cantidadConEmail(body.email)).toBe(0);
    });

    it("permite a un jefe de carrera crear usuarios de su respectiva carrera", async () => {
      const body = datosUnicos({ carreraId: carrera.id_carrera });
      const response = await crear(body, tokenJefe);

      expect(response.statusCode).toBe(201);
      expect(response.body.data.carreraId).toBe(carrera.id_carrera);
      expect(await cantidadConEmail(body.email)).toBe(1);
    });

    it("rechaza con 403 si el jefe de carrera intenta crear un usuario de otra carrera", async () => {
      const body = datosUnicos({ carreraId: carrera.id_carrera + 999 });
      const response = await crear(body, tokenJefe);

      expect(response.statusCode).toBe(403);
      expect(response.body.message).toBe("Solo tiene permisos para crear usuarios de su respectiva carrera");
      expect(await cantidadConEmail(body.email)).toBe(0);
    });

    it("rechaza con 403 si el jefe de carrera intenta crear un usuario con rol administrador", async () => {
      const body = datosUnicos({ role: "administrador", carreraId: carrera.id_carrera });
      const response = await crear(body, tokenJefe);

      expect(response.statusCode).toBe(403);
      expect(response.body.message).toBe("No tiene permisos para crear usuarios con rol administrador");
      expect(await cantidadConEmail(body.email)).toBe(0);
    });
  });

  describe("validaciones de entrada", () => {
    it("rechaza con 400 un body vacío", async () => {
      const response = await crear({});
      expect(response.statusCode).toBe(400);
    });

    it.each(["username", "email", "password"])(
        "rechaza con 400 si falta el campo %s",
        async (campo) => {
        const body: Record<string, any> = datosUnicos();
        const emailOriginal = body.email;
        delete body[campo];

        const response = await crear(body);

        expect(response.statusCode).toBe(400);
        expect(await cantidadConEmail(emailOriginal)).toBe(0);
    }
    );

    it("rechaza con 400 un email con formato inválido", async () => {
      const body = datosUnicos({ email: "esto-no-es-un-email" });
      const response = await crear(body);

      expect(response.statusCode).toBe(400);
      expect(await cantidadConEmail(body.email)).toBe(0);
    });

    it("rechaza con 400 un rol que no existe", async () => {
      const body = datosUnicos({ role: "superadmin" });
      const response = await crear(body);

      expect(response.statusCode).toBe(400);
      expect(await cantidadConEmail(body.email)).toBe(0);
    });

     it("rechaza con 400 si no se indica la carrera", async () => {
      const { carreraId, ...body } = datosUnicos();
      const response = await crear(body);

      expect(response.statusCode).toBe(400);
      expect(response.body.errorDetails).toBe("la carrera es obligatorio");
      expect(await cantidadConEmail(body.email)).toBe(0);
    });


    it("rechaza con 404 si la sigla de carrera no existe", async () => {
      const body = datosUnicos({ sigla_carrera: "ZZZZZZ" });
      const response = await crear(body);

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe("La carrera especificada no existe");
      expect(await cantidadConEmail(body.email)).toBe(0);
    });
  });

  describe("creación exitosa", () => {
    it("crea el usuario con 201 y no expone la contraseña en la respuesta", async () => {
      const body = datosUnicos();
      const response = await crear(body);
      console.log(response.statusCode, response.body);

      expect(response.statusCode).toBe(201);
      expect(response.body.data.email).toBe(body.email);
      expect(response.body.data.username).toBe(body.username);
      expect(response.body.data.role).toBe(ROL_NUEVO_USUARIO);
      expect(response.body.data.password).toBeUndefined();
    });

    it("guarda la contraseña encriptada en la BD, nunca en texto plano", async () => {
      const body = datosUnicos();
      const response = await crear(body);
      expect(response.statusCode).toBe(201);

      const guardado = await userRepo.findOne({ where: { email: body.email } });
      expect(guardado).not.toBeNull();
      expect(guardado.password).not.toBe(PASSWORD_VALIDA);
      expect(guardado.password).toMatch(/^\$2[aby]\$/); // formato bcrypt
    });

    it("el usuario creado puede iniciar sesión con su contraseña", async () => {
      const body = datosUnicos();
      const creado = await crear(body);
      expect(creado.statusCode).toBe(201);

      const login = await request(app)
        .post(RUTA_LOGIN)
        .send({ email: body.email, password: PASSWORD_VALIDA });

      expect(login.statusCode).toBe(200);
      expect(login.body).toHaveProperty("accessToken");
    });

    it("no permite iniciar sesión con una contraseña incorrecta", async () => {
      const body = datosUnicos();
      await crear(body);

      const login = await request(app)
        .post(RUTA_LOGIN)
        .send({ email: body.email, password: "OtraClave9999" });

      expect(login.statusCode).toBe(400);
    });

    it("asocia la carrera cuando se envía su sigla (sigla_carrera)", async (ctx) => {
      if (!carrera?.sigla) return ctx.skip();
        const { carreraId, ...body } = datosUnicos({ sigla_carrera: carrera.sigla });
        const response = await crear(body);
        expect(response.statusCode).toBe(201);

        const guardado = await userRepo.findOne({ where: { email: body.email } });
        expect(guardado.carreraId).toBe(carrera.id_carrera); 
    });

    it("también acepta la sigla con el nombre siglaCarrera", async (ctx) => {
      if (!carrera?.sigla) return ctx.skip();

        const { carreraId, ...body } = datosUnicos({ siglaCarrera: carrera.sigla });
        const response = await crear(body);
        expect(response.statusCode).toBe(201);

        const guardado = await userRepo.findOne({ where: { email: body.email } });
        expect(guardado.carreraId).toBe(carrera.id_carrera);
    });
  });

  describe("duplicados", () => {
    it("rechaza crear dos usuarios con el mismo email y deja solo uno en la BD", async () => {
      const body = datosUnicos();
      const primero = await crear(body);
      expect(primero.statusCode).toBe(201);

      const segundo = await crear({ ...body, username: `${body.username}b` });

      expect(segundo.statusCode).toBeGreaterThanOrEqual(400);
      expect(segundo.statusCode).toBeLessThan(500);
      expect(await cantidadConEmail(body.email)).toBe(1);
    });

    it("rechaza crear dos usuarios con el mismo username", async () => {
      const body = datosUnicos();
      const primero = await crear(body);
      expect(primero.statusCode).toBe(201);

      const otro = datosUnicos({ username: body.username });
      const segundo = await crear(otro);

      expect(segundo.statusCode).toBeGreaterThanOrEqual(400);
      expect(segundo.statusCode).toBeLessThan(500);
      expect(await cantidadConEmail(otro.email)).toBe(0);
    });
  });

  describe("PATCH de edición de usuarios - Pruebas de Integración", () => {
    const RUTA_EDITAR = (id: number) => `${BASE_USUARIOS}/editar/${id}`;
    const editar = (id: number, body: Record<string, any>, token: string = tokenAdmin) =>
      request(app).patch(RUTA_EDITAR(id)).set("Authorization", `Bearer ${token}`).send(body);

    it("permite a un jefe de carrera editar un usuario de su carrera", async () => {
      const body = datosUnicos({ carreraId: carrera.id_carrera });
      const respCrear = await crear(body, tokenAdmin);
      const userId = respCrear.body.data.id;

      const editResp = await editar(userId, { username: "Nuevo Nombre Jefe" }, tokenJefe);
      expect(editResp.statusCode).toBe(200);
      expect(editResp.body.data.username).toBe("Nuevo Nombre Jefe");
    });

    it("rechaza con 403 si un jefe de carrera intenta editar un usuario de otra carrera", async () => {
      const carreraRepo = AppDataSource.getRepository(CarreraEntity as any);
      const todasCarreras: any[] = await carreraRepo.find();
      let otraCarrera = todasCarreras.find((c: any) => Number(c.id_carrera) !== Number(carrera.id_carrera));
      if (!otraCarrera) {
        otraCarrera = carreraRepo.create({
          nombre_carrera: "Carrera Prueba Extra",
          sigla: `EXT${Date.now().toString().slice(-3)}`,
        });
        await carreraRepo.save(otraCarrera);
      }

      const usuarioOtraCarrera = userRepo.create({
        username: `Otra Carrera ${Date.now().toString().slice(-4)}`,
        email: `otra${Date.now()}@gmail.com`,
        password: "hash",
        role: "estudiante",
        carreraId: otraCarrera.id_carrera,
      });
      await userRepo.save(usuarioOtraCarrera);
      emailsCreados.push(usuarioOtraCarrera.email);

      const editResp = await editar(usuarioOtraCarrera.id, { username: "Cambio No Permitido" }, tokenJefe);
      expect(editResp.statusCode).toBe(403);
      expect(editResp.body.message).toBe("Solo tiene permisos para editar usuarios de su respectiva carrera");
    });

    it("rechaza con 403 si un jefe de carrera intenta asignar el rol administrador al editar", async () => {
      const body = datosUnicos({ carreraId: carrera.id_carrera });
      const respCrear = await crear(body, tokenAdmin);
      const userId = respCrear.body.data.id;

      const editResp = await editar(userId, { role: "administrador" }, tokenJefe);
      expect(editResp.statusCode).toBe(403);
      expect(editResp.body.message).toBe("No tiene permisos para asignar el rol administrador");
    });
  });
});