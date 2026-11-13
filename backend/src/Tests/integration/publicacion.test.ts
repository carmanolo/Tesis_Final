// src/tests/integration/publicacion.edit.test.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";
import fs from "fs";
import { AppDataSource } from "../../config/configDb.js";
import { SESSION_SECRET } from "../../config/configEnv.js";
import UserEntity from "../../entity/user.entity.js";
import CarreraEntity from "../../entity/carrera.entity.js";
import PublicacionEntity from "../../entity/publicacion.entity.js";
import publicacionRoutes from "../../routes/publicacion.routes.js";
import { PUBLICACION_UPLOAD_DIR } from "../../constants/publicacion.constants.js";

const BASE_PUBLICACIONES = "/api/publicaciones";
const EMAIL_ADMIN = "admin@gmail.com";
const EMAIL_CEE = "carlos.dominguez2301@alumnos.ubiobio.cl";
const PREFIJO_TITULO = "__TEST__ Publicacion";

const app = express();
app.use(express.json());
app.use(BASE_PUBLICACIONES, publicacionRoutes);

const letrasAleatorias = (largo: number) =>
  Array.from({ length: largo }, () =>
    String.fromCharCode(97 + Math.floor(Math.random() * 26))
  ).join("");

// Buffer con los "Magic Numbers" (firma) de un PNG válido de 1x1 pixel.
const PNG_BUFFER = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

describe("PATCH de edición de publicaciones - Pruebas de Integración", () => {
  let admin: any;
  let miembro: any;
  let estudiante: any;
  let carrera: any;
  let publicacionRepo: any;
  
  let tokenAdmin: string;
  let tokenMiembro: string;
  let tokenSinPermiso: string;
  let idPublicacionTest: number;

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

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    publicacionRepo = AppDataSource.getRepository(PublicacionEntity as any);
    const userRepo = AppDataSource.getRepository(UserEntity as any);

    admin = await userRepo.findOne({ where: { email: EMAIL_ADMIN } });
    if (!admin) throw new Error(`No existe el usuario ${EMAIL_ADMIN}`);

    miembro = await userRepo.findOne({ where: { email: EMAIL_CEE } });
    if (!miembro) throw new Error(`No existe el usuario ${EMAIL_CEE}`);
    if (!miembro.carreraId) throw new Error(`El usuario ${EMAIL_CEE} no tiene carrera`);

    estudiante = await userRepo.findOne({ where: { role: "estudiante" } });
    if (!estudiante) throw new Error("No hay usuario estudiante para probar 403");

    const carreras = await AppDataSource.getRepository(CarreraEntity as any).find({ take: 1 });
    carrera = carreras[0];
    if (!carrera) throw new Error("No hay carreras en la BD");

    tokenAdmin = firmar(admin);
    tokenMiembro = firmar(miembro);
    tokenSinPermiso = firmar(estudiante);

    // Creamos una publicación semilla para editar durante los tests
    const semilla = await publicacionRepo.save({
      titulo: `${PREFIJO_TITULO} Original`,
      descripcion: "Esta es la descripción original de prueba.",
      imagenes: [],
      creadorId: miembro.id,
      carreraId: miembro.carreraId,
    });
    idPublicacionTest = semilla.id_publicacion;
  }, 30000);

  afterAll(async () => {
    // 1. Buscar todas las publicaciones de prueba para borrar sus imágenes del disco
    const publicacionesTest = await publicacionRepo.find({
      where: { titulo: require("typeorm").Like(`${PREFIJO_TITULO}%`) },
    });

    for (const pub of publicacionesTest) {
      for (const imgPath of pub.imagenes || []) {
        if (fs.existsSync(imgPath)) {
          fs.unlinkSync(imgPath); // Borrar archivo físico
        }
      }
    }

    // 2. Borrar publicaciones de la BD
    await publicacionRepo.delete({ titulo: require("typeorm").Like(`${PREFIJO_TITULO}%`) });
    
    // 3. Destruir conexión
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }, 30000);

  describe("autenticación y autorización", () => {
    it("rechaza con 401 si no se envía token", async () => {
      const response = await request(app)
        .patch(`${BASE_PUBLICACIONES}/editar/${idPublicacionTest}`)
        .field("titulo", "Hackeado");

      expect(response.statusCode).toBe(401);
    });

    it("rechaza con 403 si el rol no está autorizado (estudiante)", async () => {
      const response = await request(app)
        .patch(`${BASE_PUBLICACIONES}/editar/${idPublicacionTest}`)
        .set("Authorization", `Bearer ${tokenSinPermiso}`)
        .field("titulo", "Hackeado");

      expect(response.statusCode).toBe(403);
    });
  });

  describe("validaciones de entrada (texto)", () => {
    it("rechaza con 400 si se envían campos no permitidos", async () => {
      const response = await request(app)
        .patch(`${BASE_PUBLICACIONES}/editar/${idPublicacionTest}`)
        .set("Authorization", `Bearer ${tokenMiembro}`)
        .field("titulo", "Nuevo título")
        .field("campo_malicioso", "x");

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toMatch(/Parámetros invalidos/i);
    });

    it("rechaza con 400 si el body y las imágenes están completamente vacíos", async () => {
      const response = await request(app)
        .patch(`${BASE_PUBLICACIONES}/editar/${idPublicacionTest}`)
        .set("Authorization", `Bearer ${tokenMiembro}`);

      expect(response.statusCode).toBe(400);
      //  El controlador corta antes si req.body no existe
      expect(response.body.message).toMatch(/datos no proporcionados/i);
    });

     it("rechaza con 400 un tipo de archivo no permitido (texto plano)", async () => {
      const textoBuffer = Buffer.from("Hola mundo");
      
      const response = await request(app)
        .patch(`${BASE_PUBLICACIONES}/editar/${idPublicacionTest}`)
        .set("Authorization", `Bearer ${tokenMiembro}`)
        .attach("imagenes", textoBuffer, "documento.txt");

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toMatch(/formato de archivo no permitido/i);
    });
  });

  describe("subida de imágenes", () => {
    it("agrega una imagen válida (PNG real) al array de imágenes", async () => {
      const response = await request(app)
        .patch(`${BASE_PUBLICACIONES}/editar/${idPublicacionTest}`)
        .set("Authorization", `Bearer ${tokenMiembro}`)
        .attach("imagenes", PNG_BUFFER, "test-image.png");

      expect(response.statusCode).toBe(200);
      
      const imagenes = response.body.data.imagenes;
      expect(imagenes.length).toBeGreaterThan(0);
      // Comprobar que se guardó en disco
      expect(fs.existsSync(imagenes[0])).toBe(true);
    });

    it("rechaza con 400 una imagen corrupta (falso PNG)", async () => {
      const fakeBuffer = Buffer.from("Esto no es una imagen, solo texto");
      
      const response = await request(app)
        .patch(`${BASE_PUBLICACIONES}/editar/${idPublicacionTest}`)
        .set("Authorization", `Bearer ${tokenMiembro}`)
        .attach("imagenes", fakeBuffer, "fake-image.png");

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toMatch(/está corrupto, vacío o no corresponde/i);
    });

    it("rechaza con 400 un tipo de archivo no permitido (texto plano)", async () => {
      const textoBuffer = Buffer.from("Hola mundo");
      
      const response = await request(app)
        .patch(`${BASE_PUBLICACIONES}/editar/${idPublicacionTest}`)
        .set("Authorization", `Bearer ${tokenMiembro}`)
        .attach("imagenes", textoBuffer, "documento.txt"); 

      expect(response.statusCode).toBe(400);
      // El fileFilter de multer lo rechaza antes de llegar al validador de firma
      expect(response.body.message).toMatch(/formato de archivo no permitido/i);
    });
  });


  describe("edición exitosa (lógica de negocio)", () => {
    it("actualiza el título y la descripción correctamente", async () => {
      const nuevoTitulo = `${PREFIJO_TITULO} Editado ${letrasAleatorias(4)}`;
      const nuevaDesc = "Descripción completamente nueva.";

      const response = await request(app)
        .patch(`${BASE_PUBLICACIONES}/editar/${idPublicacionTest}`)
        .set("Authorization", `Bearer ${tokenMiembro}`)
        .field("titulo", nuevoTitulo)
        .field("descripcion", nuevaDesc);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.titulo).toBe(nuevoTitulo);
      expect(response.body.data.descripcion).toBe(nuevaDesc);

      const guardada = await publicacionRepo.findOne({ where: { id_publicacion: idPublicacionTest } });
      expect(guardada.titulo).toBe(nuevoTitulo);
    });

    it("permite cambiar la carrera si el usuario es administrador", async () => {
      const carreraRepo = AppDataSource.getRepository(CarreraEntity as any);
      
      const otraCarrera = await carreraRepo.save({ 
        nombre_carrera: `Carrera Test ${letrasAleatorias(4)}`,
        sigla: `CT${letrasAleatorias(3).toUpperCase()}`
      });

      const response = await request(app)
        .patch(`${BASE_PUBLICACIONES}/editar/${idPublicacionTest}`)
        .set("Authorization", `Bearer ${tokenAdmin}`) 
        .field("carreraId", otraCarrera.id_carrera);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.carreraId).toBe(otraCarrera.id_carrera);

      // Limpiamos la carrera creada
      await carreraRepo.delete({ id_carrera: otraCarrera.id_carrera });
    });

    it("IGNORA el cambio de carrera si el usuario es CEE", async () => {
      // 1. Creamos una publicación fresca para este test (así evitamos que el test anterior la haya afectado)
      const pubCEE = await publicacionRepo.save({
        titulo: `${PREFIJO_TITULO} CEE Test`,
        descripcion: "Descripción para probar el CEE",
        imagenes: [],
        creadorId: miembro.id,
        carreraId: miembro.carreraId,
      });

      // 2. Intentamos cambiarle la carrera a un ID inventado
      const response = await request(app)
        .patch(`${BASE_PUBLICACIONES}/editar/${pubCEE.id_publicacion}`)
        .set("Authorization", `Bearer ${tokenMiembro}`)
        .field("carreraId", 999999);

      expect(response.statusCode).toBe(200);
      
      // 3. Verificamos que el backend ignoró el intento y la dejó en la carrera del CEE
      expect(response.body.data.carreraId).toBe(miembro.carreraId);

      // 4. Limpiamos esta publicación en específico
      await publicacionRepo.delete({ id_publicacion: pubCEE.id_publicacion });
    });
  });
});