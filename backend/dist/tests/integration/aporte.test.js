import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";
import { Like } from "typeorm";
import aporteRoutes from "../../routes/aporte.routes.js";
import { AppDataSource } from "../../config/configDb.js";
import { SESSION_SECRET } from "../../config/configEnv.js";
import UserEntity from "../../entity/user.entity.js";
import CarreraEntity from "../../entity/carrera.entity.js";
import AporteEntity from "../../entity/aporte.entity.js";
// Configuración (ajusta estos valores si tus rutas son distintas)
const BASE_APORTES = "/api/aportes";
const RUTA_CREAR = `${BASE_APORTES}/crear`;
const EMAIL_ADMIN = "admin@gmail.com";
const PREFIJO_DESCRIPCION = "Aporte de prueba";
const PROCEDENCIA_VALIDA = "Venta de completos";
const MONTO_VALIDO = 15000;
const app = express();
app.use(express.json());
app.use(BASE_APORTES, aporteRoutes);
const hoyEnChile = () => new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
}).format(new Date());
const letrasAleatorias = (largo) => Array.from({ length: largo }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join("");
describe("POST de creación de aportes - Pruebas de Integración", () => {
    let admin;
    let estudiante;
    let carreras;
    let carrera;
    let aporteRepo;
    let tokenAdmin;
    let tokenSinPermiso;
    const idsCreados = [];
    const firmar = (u, overrides = {}) => jwt.sign({
        id: u.id,
        carreraId: u.carreraId,
        username: u.username,
        email: u.email,
        role: u.role,
        rol: u.role,
        ...overrides,
    }, SESSION_SECRET, { expiresIn: "1h" });
    const datosUnicos = (extra = {}) => ({
        descripcion_aporte: `${PREFIJO_DESCRIPCION} ${letrasAleatorias(8)}`,
        fecha_aporte: hoyEnChile(),
        procedencia: PROCEDENCIA_VALIDA,
        monto: MONTO_VALIDO,
        ...extra,
    });
    const crear = (body, token = tokenAdmin) => request(app).post(RUTA_CREAR).set("Authorization", `Bearer ${token}`).send(body);
    const esperarCreado = (response) => {
        expect(response.statusCode, `La API respondió: ${JSON.stringify(response.body)}`).toBe(201);
        idsCreados.push(response.body.data.id_aporte);
    };
    const cantidadConDescripcion = (descripcion_aporte) => aporteRepo.count({ where: { descripcion_aporte } });
    beforeAll(async () => {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
        aporteRepo = AppDataSource.getRepository(AporteEntity);
        const userRepo = AppDataSource.getRepository(UserEntity);
        admin = await userRepo.findOne({ where: { email: EMAIL_ADMIN } });
        if (!admin) {
            throw new Error(`No existe el usuario ${EMAIL_ADMIN} en la BD de pruebas`);
        }
        estudiante = await userRepo.findOne({ where: { role: "estudiante" } });
        if (!estudiante) {
            throw new Error("No existe ningún usuario con rol 'estudiante' en la BD de pruebas");
        }
        carreras = await AppDataSource.getRepository(CarreraEntity).find({ take: 2 });
        carrera = carreras[0];
        if (!carrera) {
            throw new Error("No existe ninguna carrera en la BD de pruebas");
        }
        // Token determinista: el administrador actuando sobre una carrera concreta
        tokenAdmin = firmar(admin, { carreraId: carrera.id_carrera });
        tokenSinPermiso = firmar(estudiante);
    }, 30000);
    afterAll(async () => {
        // Limpieza directa en BD: no depende de que exista la ruta de eliminación
        for (const id of idsCreados) {
            await aporteRepo.delete({ id_aporte: id });
        }
        // Red de seguridad por si algún test creó un aporte inesperado
        await aporteRepo.delete({ descripcion_aporte: Like(`${PREFIJO_DESCRIPCION} %`) });
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    }, 30000);
    describe("autenticación y autorización", () => {
        it("rechaza con 401 si no se envía token", async () => {
            const body = datosUnicos();
            const response = await request(app).post(RUTA_CREAR).send(body);
            expect(response.statusCode).toBe(401);
            expect(await cantidadConDescripcion(body.descripcion_aporte)).toBe(0);
        });
        it("rechaza con 403 si el token es inválido", async () => {
            const body = datosUnicos();
            const response = await crear(body, "token-falso");
            expect(response.statusCode).toBe(403);
            expect(await cantidadConDescripcion(body.descripcion_aporte)).toBe(0);
        });
        it("rechaza con 403 si el rol no está autorizado a registrar aportes", async () => {
            const body = datosUnicos();
            const response = await crear(body, tokenSinPermiso);
            expect(response.statusCode).toBe(403);
            expect(await cantidadConDescripcion(body.descripcion_aporte)).toBe(0);
        });
    });
    describe("validaciones de entrada", () => {
        it("rechaza con 400 un body vacío", async () => {
            const response = await crear({});
            expect(response.statusCode).toBe(400);
        });
        it.each(["descripcion_aporte", "fecha_aporte", "procedencia", "monto"])("rechaza con 400 si falta el campo %s", async (campo) => {
            const body = datosUnicos();
            const descripcionOriginal = body.descripcion_aporte;
            delete body[campo];
            const response = await crear(body);
            expect(response.statusCode).toBe(400);
            expect(await cantidadConDescripcion(descripcionOriginal)).toBe(0);
        });
        it("rechaza con 400 un monto que no es número", async () => {
            const body = datosUnicos({ monto: "abc" });
            const response = await crear(body);
            expect(response.statusCode).toBe(400);
            expect(await cantidadConDescripcion(body.descripcion_aporte)).toBe(0);
        });
        it("rechaza con 400 un monto negativo", async () => {
            const body = datosUnicos({ monto: -500 });
            const response = await crear(body);
            expect(response.statusCode).toBe(400);
            expect(await cantidadConDescripcion(body.descripcion_aporte)).toBe(0);
        });
        it("rechaza con 400 una fecha con formato inválido", async () => {
            const body = datosUnicos({ fecha_aporte: "no-es-una-fecha" });
            const response = await crear(body);
            expect(response.statusCode).toBe(400);
            expect(await cantidadConDescripcion(body.descripcion_aporte)).toBe(0);
        });
        it("rechaza con 400 si se envían campos adicionales no permitidos", async () => {
            const body = datosUnicos({ campo_extra: "x" });
            const response = await crear(body);
            expect(response.statusCode).toBe(400);
            expect(await cantidadConDescripcion(body.descripcion_aporte)).toBe(0);
        });
    });
    describe("creación exitosa", () => {
        it("crea el aporte con 201 y devuelve los datos enviados", async () => {
            const body = datosUnicos();
            const response = await crear(body);
            esperarCreado(response);
            expect(response.body.data.descripcion_aporte).toBe(body.descripcion_aporte);
            expect(response.body.data.procedencia).toBe(body.procedencia);
            expect(Number(response.body.data.monto)).toBe(MONTO_VALIDO);
        });
        it("guarda el aporte en la BD asociado al usuario creador y a su carrera", async () => {
            const body = datosUnicos();
            const response = await crear(body);
            esperarCreado(response);
            const guardado = await aporteRepo.findOne({
                where: { id_aporte: response.body.data.id_aporte },
            });
            expect(guardado).not.toBeNull();
            expect(guardado.descripcion_aporte).toBe(body.descripcion_aporte);
            expect(Number(guardado.monto)).toBe(MONTO_VALIDO);
            expect(guardado.creadorId).toBe(admin.id);
            expect(guardado.carreraId).toBe(carrera.id_carrera);
        });
        it("permite montos con decimales o cifras altas", async () => {
            const body = datosUnicos({ monto: 1250000 });
            const response = await crear(body);
            esperarCreado(response);
            expect(Number(response.body.data.monto)).toBe(1250000);
        });
    });
    describe("asociación de la carrera", () => {
        it("usa la carrera del usuario en la BD aunque el body indique otra", async (ctx) => {
            if (!admin.carreraId || !carreras[1])
                return ctx.skip(); // requiere admin con carrera y 2 carreras
            const otraCarrera = carreras.find((c) => c.id_carrera !== admin.carreraId);
            const body = datosUnicos({ carreraId: otraCarrera.id_carrera });
            const response = await crear(body);
            esperarCreado(response);
            const guardado = await aporteRepo.findOne({
                where: { id_aporte: response.body.data.id_aporte },
            });
            expect(guardado.carreraId).toBe(admin.carreraId);
        });
        it("usa la carreraId del body cuando el token no trae carrera", async () => {
            const tokenSinCarrera = firmar(admin, { carreraId: null });
            const body = datosUnicos({ carreraId: carrera.id_carrera });
            const response = await crear(body, tokenSinCarrera);
            esperarCreado(response);
            const guardado = await aporteRepo.findOne({
                where: { id_aporte: response.body.data.id_aporte },
            });
            expect(guardado.carreraId).toBe(carrera.id_carrera);
        });
        it("asigna una carrera por defecto si ni el token ni el body la indican", async () => {
            const tokenSinCarrera = firmar(admin, { carreraId: null });
            const body = datosUnicos();
            const response = await crear(body, tokenSinCarrera);
            esperarCreado(response);
            const guardado = await aporteRepo.findOne({
                where: { id_aporte: response.body.data.id_aporte },
            });
            expect(guardado.carreraId).toBeTruthy();
        });
        it("rechaza con 400 si la carrera indicada en el body no existe y no crea el aporte", async (ctx) => {
            if (admin.carreraId)
                return ctx.skip(); // con carrera asignada, la del usuario se impone
            const body = datosUnicos({ carreraId: 999999 });
            const response = await crear(body);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toBe("La carrera especificada no existe");
            expect(await cantidadConDescripcion(body.descripcion_aporte)).toBe(0);
        });
    });
});
