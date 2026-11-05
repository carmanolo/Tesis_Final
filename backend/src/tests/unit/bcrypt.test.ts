import { describe, expect, it } from "vitest";
import { comparePassword, encryptPassword } from "../../helpers/bcrypt.helper.js";

describe("Bcrypt Helper - Pruebas Unitarias", () => {
  it("debe encriptar una contraseña correctamente y generar un hash válido", async () => {
    const password = "Password123!";
    const hash = await encryptPassword(password);

    expect(hash).toBeDefined();
    expect(typeof hash).toBe("string");
    expect(hash).not.toBe(password);
    // Verifica el formato estándar de un hash bcrypt ($2a$, $2b$ o $2y$)
    expect(hash).toMatch(/^\$2[ayb]\$.{56}$/);
  });

  it("debe retornar true cuando la contraseña coincide con el hash", async () => {
    const password = "Password123!";
    const hash = await encryptPassword(password);
    const isValid: boolean = await comparePassword(password, hash);

    expect(isValid).toBe(true);
  });

  it("debe retornar false si la contraseña es incorrecta", async () => {
    const password = "Password123!";
    const hash = await encryptPassword(password);
    const isValid: boolean = await comparePassword("WrongPassword", hash);

    expect(isValid).toBe(false);
  });
});