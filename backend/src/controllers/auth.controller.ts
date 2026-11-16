import User from "../entity/user.entity.js";
import jwt from "jsonwebtoken";
import { In } from "typeorm";
import { encryptPassword, comparePassword } from "../helpers/bcrypt.helper.js";
import { AppDataSource } from "../config/configDb.js";
import { SESSION_SECRET } from "../config/configEnv.js";
import {
  registerValidation,
  loginValidation,
  recoveryRequestValidation,
  resetPasswordValidation
} from "../validations/auth.validations.js";
import { Request, Response } from "express";
import { handleErrorClient } from "../handlers/responseHandlers.js";
import { registrarActividad } from "../services/historialActividad.service.js";
import { obtenerIp, obtenerDispositivo } from "../utils/audit.utils.js";
import { auditBase, generarCodigo } from "../utils/user.utils.js";
import { CAMPOS_RECUPERACION,MINUTOS_VIGENCIA, MAX_INTENTOS, LIMPIAR } from "../constants/ajustes.constants.js";

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

export async function requestRecovery(req: Request, res: Response): Promise<any> {
  const generic = {
    message:
      "Si el correo está registrado, se notificó al administrador. Él te entregará un código de recuperación.",
  };

  try {
    const { error } = recoveryRequestValidation.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const { email } = req.body;
    const userRepo = AppDataSource.getRepository(User as any);

    const user: any = await userRepo.findOne({
      where: { email },
      select: CAMPOS_RECUPERACION,
    });

    if (user) {
      const codigoVencido =
        user.recoveryStatus === "codigo_generado" &&
        (!user.recoveryCodeExpires || user.recoveryCodeExpires.getTime() < Date.now());

      if (!user.recoveryStatus || codigoVencido) {
        await userRepo.update(user.id, {
          recoveryStatus: "pendiente",
          recoveryRequestedAt: new Date(),
          recoveryCodeHash: null,
          recoveryCodeExpires: null,
          recoveryAttempts: 0,
        });
      }

      await registrarActividad({
        usuarioId: user.id,
        usuarioEmail: user.email,
        usuarioNombre: user.username,
        rol: user.role,
        accion: "RECUPERACION_SOLICITADA",
        modulo: "AUTH",
        descripcion: `Solicitud de recuperación de cuenta: ${user.email}`,
        estadoHttp: 200,
        esSospechoso: false,
        ...auditBase(req),
      });
    }

    return res.status(200).json(generic);
  } catch (error) {
    console.error("Error en recovery.controller.ts -> requestRecovery(): ", error);
    return res.status(500).json({ message: "Error al solicitar la recuperación" });
  }
}

/** ADMIN: lista solicitudes activas */
export async function listPending(_req: Request, res: Response): Promise<any> {
  try {
    const userRepo = AppDataSource.getRepository(User as any);

    const users: any[] = await userRepo.find({
      where: { recoveryStatus: In(["pendiente", "codigo_generado"]) },
      select: CAMPOS_RECUPERACION,
      order: { recoveryRequestedAt: "DESC" },
    });

    const data = users.map((u) => ({
      id: u.id, // el id de la solicitud es el id del usuario
      userId: u.id,
      username: u.username,
      email: u.email,
      status: u.recoveryStatus,
      createdAt: u.recoveryRequestedAt,
      codeExpires: u.recoveryCodeExpires,
    }));

    return res.status(200).json({ data });
  } catch (error) {
    console.error("Error en recovery.controller.ts -> listPending(): ", error);
    return res.status(500).json({ message: "Error al listar solicitudes" });
  }
}

/** ADMIN: genera el código de recuperación (se muestra una sola vez) */
export async function generateCode(req: Request, res: Response): Promise<any> {
  try {
    const admin = (req as any).user;
    const userId = Number(req.params.id);
    const userRepo = AppDataSource.getRepository(User as any);

    const user: any = await userRepo.findOne({
      where: { id: userId },
      select: CAMPOS_RECUPERACION,
    });
    if (!user || !["pendiente", "codigo_generado"].includes(user.recoveryStatus)) {
      return res.status(404).json({ message: "Solicitud no encontrada o ya resuelta" });
    }

    const code = generarCodigo();
    const expiresAt = new Date(Date.now() + MINUTOS_VIGENCIA * 60 * 1000);

    await userRepo.update(userId, {
      recoveryStatus: "codigo_generado",
      recoveryCodeHash: await encryptPassword(code),
      recoveryCodeExpires: expiresAt,
      recoveryAttempts: 0,
    });

    await registrarActividad({
      usuarioId: admin.id,
      usuarioEmail: admin.email,
      usuarioNombre: admin.username,
      rol: admin.role || admin.rol,
      accion: "RECUPERACION_CODIGO_GENERADO",
      modulo: "AUTH",
      descripcion: `Código de recuperación generado para el usuario id ${userId}`,
      estadoHttp: 200,
      esSospechoso: false,
      ...auditBase(req),
    });

    return res.status(200).json({ message: "Código generado", data: { code, expiresAt } });
  } catch (error) {
    console.error("Error en recovery.controller.ts -> generateCode(): ", error);
    return res.status(500).json({ message: "Error al generar el código" });
  }
}

/** ADMIN: rechaza la solicitud */
export async function rejectRequest(req: Request, res: Response): Promise<any> {
  try {
    const admin = (req as any).user;
    const userId = Number(req.params.id);
    const userRepo = AppDataSource.getRepository(User as any);

    const user: any = await userRepo.findOne({
      where: { id: userId },
      select: CAMPOS_RECUPERACION,
    });
    if (!user || !["pendiente", "codigo_generado"].includes(user.recoveryStatus)) {
      return res.status(404).json({ message: "Solicitud no encontrada o ya resuelta" });
    }

    await userRepo.update(userId, LIMPIAR);

    await registrarActividad({
      usuarioId: admin.id,
      usuarioEmail: admin.email,
      usuarioNombre: admin.username,
      rol: admin.role || admin.rol,
      accion: "RECUPERACION_RECHAZADA",
      modulo: "AUTH",
      descripcion: `Solicitud de recuperación rechazada (usuario id ${userId})`,
      estadoHttp: 200,
      esSospechoso: false,
      ...auditBase(req),
    });

    return res.status(200).json({ message: "Solicitud rechazada" });
  } catch (error) {
    console.error("Error en recovery.controller.ts -> rejectRequest(): ", error);
    return res.status(500).json({ message: "Error al rechazar la solicitud" });
  }
}

/** PÚBLICO: el usuario cambia su clave con el código del administrador */
export async function resetWithCode(req: Request, res: Response): Promise<any> {
  const invalido = { message: "Código inválido o expirado" };

  try {
    const { error } = resetPasswordValidation.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const email: string = req.body.email;
    const code: string = String(req.body.code).trim().toUpperCase();
    const newPassword: string = req.body.newPassword;

    const userRepo = AppDataSource.getRepository(User as any);

    const user: any = await userRepo.findOne({
      where: { email },
      select: CAMPOS_RECUPERACION,
    });

    if (
      !user ||
      user.recoveryStatus !== "codigo_generado" ||
      !user.recoveryCodeHash ||
      !user.recoveryCodeExpires
    ) {
      return res.status(400).json(invalido);
    }

    if (user.recoveryCodeExpires.getTime() < Date.now() || user.recoveryAttempts >= MAX_INTENTOS) {
      await userRepo.update(user.id, LIMPIAR);
      return res.status(400).json(invalido);
    }

    const ok = await comparePassword(code, user.recoveryCodeHash);
    if (!ok) {
      const intentos = user.recoveryAttempts + 1;
      await userRepo.update(user.id, { recoveryAttempts: intentos });

      await registrarActividad({
        usuarioId: user.id,
        usuarioEmail: user.email,
        usuarioNombre: user.username,
        rol: user.role,
        accion: "RECUPERACION_CODIGO_INCORRECTO",
        modulo: "AUTH",
        descripcion: `Código de recuperación incorrecto (intento ${intentos}/${MAX_INTENTOS})`,
        estadoHttp: 400,
        esSospechoso: true,
        motivoSospecha: "Código de recuperación incorrecto",
        ...auditBase(req),
      });

      return res.status(400).json(invalido);
    }

    await userRepo.update(user.id, {
      password: await encryptPassword(newPassword),
      ...LIMPIAR,
    });

    await registrarActividad({
      usuarioId: user.id,
      usuarioEmail: user.email,
      usuarioNombre: user.username,
      rol: user.role,
      accion: "RECUPERACION_EXITOSA",
      modulo: "AUTH",
      descripcion: `Contraseña restablecida mediante código del administrador: ${user.email}`,
      estadoHttp: 200,
      esSospechoso: false,
      ...auditBase(req),
    });

    return res.status(200).json({ message: "Contraseña actualizada. Ya puedes iniciar sesión." });
  } catch (error) {
    console.error("Error en recovery.controller.ts -> resetWithCode(): ", error);
    return res.status(500).json({ message: "Error al restablecer la contraseña" });
  }
}
