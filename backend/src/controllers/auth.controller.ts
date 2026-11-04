import User from "../entity/user.entity.js";
import jwt from "jsonwebtoken";
import { encryptPassword, comparePassword } from "../helpers/bcrypt.helper.js";
import { AppDataSource } from "../config/configDb.js";
import { SESSION_SECRET } from "../config/configEnv.js";
import {
  registerValidation,
  loginValidation,
} from "../validations/auth.validations.js";
import { Request, Response } from "express";
import { handleErrorClient } from "../handlers/responseHandlers.js";
import { registrarActividad } from "../services/historialActividad.service.js";
import { obtenerIp, obtenerDispositivo } from "../utils/audit.utils.js";

export async function register(req: Request, res: Response): Promise<any> {
  const ip = obtenerIp(req);
  const dispositivo = obtenerDispositivo(req);

  try {
    const userRepository = AppDataSource.getRepository(User as any);
    const { username, rut, email, password } = req.body;
    const { error } = registerValidation.validate(req.body);
    if (error) {
      await registrarActividad({
        usuarioEmail: email,
        usuarioNombre: username,
        accion: "REGISTRO_VALIDACION_FALLIDA",
        modulo: "AUTH",
        descripcion: `Fallo de validación en registro: ${error.message}`,
        ip,
        dispositivo,
        metodoHttp: req.method,
        ruta: req.originalUrl || req.url,
        estadoHttp: 400,
        esSospechoso: false,
      });

      return res.status(400).json({
        status: "Client error",
        message: error.message,
      });
    }

    const existingEmailUser = await userRepository.findOne({
      where: { email },
    });
    if (existingEmailUser)
      return res.status(409).json({ message: "Correo ya registrado." });

    const existingRutUser = await userRepository.findOne({ where: { rut } });
    if (existingRutUser)
      return res.status(409).json({ message: "Rut ya registrado." });

    const existingUsernameUser = await userRepository.findOne({
      where: { username },
    });
    if (existingUsernameUser)
      return res
        .status(409)
        .json({ message: "Nombre de usuario ya registrado." });

    const newUser = userRepository.create({
      username,
      email,
      rut,
      password: await encryptPassword(password),
    });
    await userRepository.save(newUser);

    await registrarActividad({
      usuarioId: newUser.id,
      usuarioEmail: newUser.email,
      usuarioNombre: newUser.username,
      rol: newUser.role,
      accion: "REGISTRO_EXITOSO",
      modulo: "AUTH",
      descripcion: `Registro de usuario exitoso: ${newUser.email}`,
      ip,
      dispositivo,
      metodoHttp: req.method,
      ruta: req.originalUrl || req.url,
      estadoHttp: 201,
      esSospechoso: false,
    });

    const { password: _, ...dataUser } = newUser;

    res
      .status(201)
      .json({ message: "Usuario registrado exitosamente!", data: dataUser });
  } catch (error) {
    console.error("Error en auth.controller.ts -> register(): ", error);
    return res.status(500).json({ message: "Error al registrar el usuario" });
  }
}

export async function login(req: Request, res: Response): Promise<any> {
  const ip = obtenerIp(req);
  const dispositivo = obtenerDispositivo(req);
  const { email, password } = req.body;

  try {
    const userRepository = AppDataSource.getRepository(User as any);
    const { error } = loginValidation.validate(req.body);
    if (error) {
      await registrarActividad({
        usuarioEmail: email,
        accion: "LOGIN_FALLIDO",
        modulo: "AUTH",
        descripcion: `Intento de login con datos inválidos: ${error.message}`,
        ip,
        dispositivo,
        metodoHttp: req.method,
        ruta: req.originalUrl || req.url,
        estadoHttp: 400,
        esSospechoso: false,
      });
      return handleErrorClient(res, 400, error.message);
    }

    const userFound = await userRepository.findOne({ where: { email } });
    if (!userFound) {
      await registrarActividad({
        usuarioEmail: email,
        accion: "LOGIN_FALLIDO",
        modulo: "AUTH",
        descripcion: `Intento de login con correo no registrado: ${email}`,
        ip,
        dispositivo,
        metodoHttp: req.method,
        ruta: req.originalUrl || req.url,
        estadoHttp: 404,
        esSospechoso: true,
        motivoSospecha: "Intento de inicio de sesión con cuenta inexistente",
      });

      return res
        .status(404)
        .json({ message: "El correo electrónico no está registrado" });
    }

    const isMatch = await comparePassword(password, userFound.password);
    if (!isMatch) {
      await registrarActividad({
        usuarioId: userFound.id,
        usuarioEmail: userFound.email,
        usuarioNombre: userFound.username,
        rol: userFound.role || userFound.rol,
        accion: "LOGIN_FALLIDO",
        modulo: "AUTH",
        descripcion: `Contraseña incorrecta para el usuario: ${email}`,
        ip,
        dispositivo,
        metodoHttp: req.method,
        ruta: req.originalUrl || req.url,
        estadoHttp: 400,
        esSospechoso: true,
        motivoSospecha: "Credenciales erróneas proporcionadas",
      });

      return handleErrorClient(res, 400, "Contraseña incorrecta");
    }

    const payload = {
      id: userFound.id,
      carreraId: userFound.carreraId,
      username: userFound.username,
      email: userFound.email,
      role: userFound?.role || userFound?.rol,
      rol: userFound?.role || userFound?.rol,
    };
    const accessToken = jwt.sign(payload, SESSION_SECRET, { expiresIn: "1d" });

    await registrarActividad({
      usuarioId: userFound.id,
      usuarioEmail: userFound.email,
      usuarioNombre: userFound.username,
      rol: userFound?.role || userFound?.rol,
      accion: "INICIO_SESION",
      modulo: "AUTH",
      descripcion: `Inicio de sesión exitoso (${userFound.role || userFound.rol})`,
      ip,
      dispositivo,
      metodoHttp: req.method,
      ruta: req.originalUrl || req.url,
      estadoHttp: 200,
      esSospechoso: false,
    });

    res.status(200).json({ message: "Inicio de sesión exitoso", accessToken });
  } catch (error) {
    console.error("Error en auth.controller.ts -> login(): ", error);
    return res.status(500).json({ message: "Error al iniciar sesión" });
  }
}

export async function logout(req: Request, res: Response): Promise<any> {
  const ip = obtenerIp(req);
  const dispositivo = obtenerDispositivo(req);

  try {
    const user = (req as any).user;
    if (user) {
      await registrarActividad({
        usuarioId: user.id,
        usuarioEmail: user.email,
        usuarioNombre: user.username,
        rol: user.role || user.rol,
        accion: "CIERRE_SESION",
        modulo: "AUTH",
        descripcion: `Cierre de sesión de usuario: ${user.email}`,
        ip,
        dispositivo,
        metodoHttp: req.method,
        ruta: req.originalUrl || req.url,
        estadoHttp: 200,
        esSospechoso: false,
      });
    }

    res.clearCookie("jwt", { httpOnly: true });
    res.status(200).json({ message: "Sesión cerrada exitosamente" });
  } catch (error) {
    return res.status(500).json({ message: "Error al cerrar sesión" });
  }
}
