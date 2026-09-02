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

export async function register(req: Request, res: Response): Promise<any> {
  try {
    const userRepository = AppDataSource.getRepository(User as any);
    const { username, rut, email, password } = req.body;
    const { error } = registerValidation.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

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
  try {
    const userRepository = AppDataSource.getRepository(User as any);
    const { email, password } = req.body;
    const { error } = loginValidation.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const userFound = await userRepository.findOne({ where: { email } });
    if (!userFound)
      return res
        .status(404)
        .json({ message: "El correo electrónico no está registrado" });

    const isMatch = await comparePassword(password, userFound.password);
    if (!isMatch)
      return res
        .status(401)
        .json({ message: "La contraseña ingresada no es correcta" });

    const payload = {
      username: userFound.username,
      email: userFound.email,
      role: userFound?.role || userFound?.rol,
      rol: userFound?.role || userFound?.rol,
    };
    const accessToken = jwt.sign(payload, SESSION_SECRET, { expiresIn: "1d" });

    res.status(200).json({ message: "Inicio de sesión exitoso", accessToken });
  } catch (error) {
    console.error("Error en auth.controller.ts -> login(): ", error);
    return res.status(500).json({ message: "Error al iniciar sesión" });
  }
}

export async function logout(req: Request, res: Response): Promise<any> {
  try {
    res.clearCookie("jwt", { httpOnly: true });
    res.status(200).json({ message: "Sesión cerrada exitosamente" });
  } catch (error) {
    return res.status(500).json({ message: "Error al cerrar sesión" });
  }
}