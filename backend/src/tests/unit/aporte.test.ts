import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createValidation, fechaNoPasadaValidation, integrityValidation, updateValidation } from "../../validations/aporte.validations.js";
import { APORTE_OBLIGATORIO, CAMPOS_ADICIONALES, ERROR_CANTIDAD_INVALIDA, MAX_NOMBRE_APORTE, MIN_NOMBRE_APORTE, MONTO_MINIMO, MONTO_OBLIGATORIA, NOMBRE_OBLIGATORIO, PROCEDENCIA_OBLIGATORIA} from "../../constants/aporte.constants.js";
import { MAX_ID, MIN_ID } from "../../constants/user.constants.js";

// 2026-10-14T01:00:00Z === 2026-10-13 22:00 en Chile (UTC-3).
// Sirve para verificar que "hoy" se calcula con la zona horaria de Chile y no con UTC.
const AHORA_FALSA = new Date("2026-10-14T01:00:00Z");
const HOY_CHILE = "2026-10-13";
const AYER_CHILE = "2026-10-12";
const MANANA_CHILE = "2026-10-14";

// const descripcionValida = "Aporte para la semana de la carrera";
//validar ingreso de espacios y valide que existan numeros y palabras
const descripcionValida = "##___________";
const procedenciaValida = "Centro de alumnos";
const montoValido = 50000;

const aporteValido = {
  descripcion_aporte: descripcionValida,
  fecha_aporte: HOY_CHILE,
  procedencia: procedenciaValida,
  monto: montoValido,
};

const mensajes = (error: any): string[] =>
  error?.details?.map((d: any) => d.message) ?? [];

describe("aporte.validations - Pruebas Unitarias", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(AHORA_FALSA);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  describe("integrityValidation", () => {
    it("acepta un objeto vacío (todos los campos son opcionales)", () => {
      const { error } = integrityValidation.validate({});
      expect(error).toBeUndefined();
    });

    it("acepta un aporte completo y válido", () => {
      const { error } = integrityValidation.validate({
        ...aporteValido,
        carreraId: 1,
        id_carrera: 1,
      });
      expect(error).toBeUndefined();
    });

    it("rechaza campos adicionales no permitidos", () => {
      const { error } = integrityValidation.validate({
        ...aporteValido,
        campo_extra: "x",
      });
      expect(error).toBeDefined();
      expect(error!.message).toBe(CAMPOS_ADICIONALES);
    });

    describe("descripcion_aporte", () => {
      it("rechaza una descripción vacía", () => {
        const { error } = integrityValidation.validate({ descripcion_aporte: "" });
        expect(error).toBeDefined();
        expect(error!.message).toBe("La descripción del aporte no puede ser vacía");
      });

      it("rechaza una descripción que no es string", () => {
        const { error } = integrityValidation.validate({ descripcion_aporte: 12345 });
        expect(error).toBeDefined();
        expect(error!.message).toBe("La descripción del aporte debe ser un string");
      });

      it("rechaza una descripción más corta que el mínimo", () => {
        const { error } = integrityValidation.validate({
          descripcion_aporte: "a".repeat(MIN_NOMBRE_APORTE - 1),
        });
        expect(error).toBeDefined();
        expect(error!.message).toBe(
          `La descripción del aporte debe tener al menos ${MIN_NOMBRE_APORTE} caracteres`
        );
      });

      it("acepta una descripción con exactamente el mínimo de caracteres", () => {
        const { error } = integrityValidation.validate({
          descripcion_aporte: "a".repeat(MIN_NOMBRE_APORTE),
        });
        expect(error).toBeUndefined();
      });

      it("acepta una descripción con exactamente el máximo de caracteres", () => {
        const { error } = integrityValidation.validate({
          descripcion_aporte: "a".repeat(MAX_NOMBRE_APORTE),
        });
        expect(error).toBeUndefined();
      });

      it("rechaza una descripción más larga que el máximo", () => {
        const { error } = integrityValidation.validate({
          descripcion_aporte: "a".repeat(MAX_NOMBRE_APORTE + 1),
        });
        expect(error).toBeDefined();
        expect(error!.message).toBe(
          `La descripción del aporte no puede tener más de ${MAX_NOMBRE_APORTE} caracteres`
        );
      });
    });

    describe("fecha_aporte", () => {
      it("acepta la fecha de hoy (en Chile)", () => {
        const { error } = integrityValidation.validate({ fecha_aporte: HOY_CHILE });
        expect(error).toBeUndefined();
      });

      it("acepta una fecha futura", () => {
        const { error } = integrityValidation.validate({ fecha_aporte: MANANA_CHILE });
        expect(error).toBeUndefined();
      });

      it("rechaza una fecha anterior a hoy", () => {
        const { error } = integrityValidation.validate({ fecha_aporte: AYER_CHILE });
        expect(error).toBeDefined();
        expect(error!.message).toBe("La fecha del aporte no puede ser anterior a hoy");
      });

      it("rechaza una fecha con formato inválido", () => {
        const { error } = integrityValidation.validate({ fecha_aporte: "no-es-una-fecha" });
        expect(error).toBeDefined();
        expect(error!.message).toBe("La fecha del aporte debe ser una fecha válida");
      });
    });

    describe("procedencia", () => {
      it("acepta una procedencia válida", () => {
        const { error } = integrityValidation.validate({ procedencia: procedenciaValida });
        expect(error).toBeUndefined();
      });

      it("rechaza una procedencia vacía", () => {
        const { error } = integrityValidation.validate({ procedencia: "" });
        expect(error).toBeDefined();
        expect(error!.message).toBe("La procedencia no puede ser vacía");
      });

      it("rechaza una procedencia que no es string", () => {
        const { error } = integrityValidation.validate({ procedencia: 123 });
        expect(error).toBeDefined();
        expect(error!.message).toBe("La procedencia debe ser un string");
      });
    });

    describe("monto", () => {
      it("acepta un monto entero", () => {
        const { error } = integrityValidation.validate({ monto: montoValido });
        expect(error).toBeUndefined();
      });

      it("rechaza un monto que no es número", () => {
        const { error } = integrityValidation.validate({ monto: "abc" });
        expect(error).toBeDefined();
        expect(error!.message).toBe(ERROR_CANTIDAD_INVALIDA);
      });

      it("rechaza un monto decimal", () => {
        const { error } = integrityValidation.validate({ monto: 1500.5 });
        expect(error).toBeDefined();
        expect(error!.message).toBe(ERROR_CANTIDAD_INVALIDA);
      });

      it("acepta un monto igual al mínimo", () => {
        const { error } = integrityValidation.validate({ monto: MONTO_MINIMO });
        expect(error).toBeUndefined();
      });

      it("rechaza un monto menor al mínimo", () => {
        const { error } = integrityValidation.validate({ monto: MONTO_MINIMO - 1 });
        expect(error).toBeDefined();
        expect(error!.message).toBe(`El monto del aporte debe ser al menos ${MONTO_MINIMO}`);
      });

      it("rechaza un monto cero o negativo", () => {
        expect(integrityValidation.validate({ monto: 0 }).error).toBeDefined();
        expect(integrityValidation.validate({ monto: -5000 }).error).toBeDefined();
      });
    });

    describe.each(["carreraId", "id_carrera"])("%s", (campo) => {
      it("acepta un id positivo", () => {
        const { error } = integrityValidation.validate({ [campo]: 1 });
        expect(error).toBeUndefined();
      });

      it("rechaza un valor que no es número", () => {
        const { error } = integrityValidation.validate({ [campo]: "abc" });
        expect(error).toBeDefined();
        expect(error!.message).toBe("El id de la carrera debe ser un número");
      });

      it("rechaza cero", () => {
        const { error } = integrityValidation.validate({ [campo]: 0 });
        expect(error).toBeDefined();
        expect(error!.message).toBe("El id de la carrera debe ser un número positivo");
      });

      it("rechaza un número negativo", () => {
        const { error } = integrityValidation.validate({ [campo]: -1 });
        expect(error).toBeDefined();
        expect(error!.message).toBe("El id de la carrera debe ser un número positivo");
      });

      it("rechaza un número decimal", () => {
        const { error } = integrityValidation.validate({ [campo]: 1.5 });
        expect(error).toBeDefined();
        expect(error!.details[0].type).toBe("number.integer");
      });
    });

    describe("id_aporte", () => {
      it("acepta un id válido", () => {
        const { error } = integrityValidation.validate({ id_aporte: MIN_ID });
        expect(error).toBeUndefined();
      });

      it("acepta el id máximo permitido", () => {
        const { error } = integrityValidation.validate({ id_aporte: MAX_ID });
        expect(error).toBeUndefined();
      });

      it("rechaza un id que no es número", () => {
        const { error } = integrityValidation.validate({ id_aporte: "abc" });
        expect(error).toBeDefined();
        expect(error!.message).toBe("El ID tiene que ser un número");
      });

      it("rechaza un id decimal", () => {
        const { error } = integrityValidation.validate({ id_aporte: 1.5 });
        expect(error).toBeDefined();
        expect(error!.message).toBe("El ID tiene que ser un entero");
      });

      it("rechaza un id negativo", () => {
        const { error } = integrityValidation.validate({ id_aporte: -1 });
        expect(error).toBeDefined();
        expect(error!.message).toBe("El ID tiene que ser positivo");
      });

      it("rechaza un id mayor al máximo", () => {
        const { error } = integrityValidation.validate({ id_aporte: MAX_ID + 1 });
        expect(error).toBeDefined();
        expect(error!.message).toBe(`El ID debe ser menor que ${MAX_ID + 1}`);
      });
    });
  });

  describe("createValidation", () => {
    it("acepta los cuatro campos obligatorios", () => {
      const { error } = createValidation.validate(aporteValido);
      expect(error).toBeUndefined();
    });

    it("acepta además carreraId e id_carrera (opcionales)", () => {
      const { error } = createValidation.validate({
        ...aporteValido,
        carreraId: 1,
        id_carrera: 1,
      });
      expect(error).toBeUndefined();
    });

    it.each([
      ["descripcion_aporte", NOMBRE_OBLIGATORIO],
      ["fecha_aporte", APORTE_OBLIGATORIO],
      ["procedencia", PROCEDENCIA_OBLIGATORIA],
      ["monto", MONTO_OBLIGATORIA],
    ])("exige el campo %s", (campo, mensaje) => {
      const { [campo as keyof typeof aporteValido]: _omitido, ...resto } = aporteValido;
      const { error } = createValidation.validate(resto);
      expect(error).toBeDefined();
      expect(error!.message).toBe(mensaje);
    });

    it("reporta todos los campos obligatorios cuando el objeto está vacío", () => {
      const { error } = createValidation.validate({}, { abortEarly: false });
      expect(error).toBeDefined();
      const msgs = mensajes(error);
      expect(msgs).toContain(NOMBRE_OBLIGATORIO);
      expect(msgs).toContain(APORTE_OBLIGATORIO);
      expect(msgs).toContain(PROCEDENCIA_OBLIGATORIA);
      expect(msgs).toContain(MONTO_OBLIGATORIA);
    });

    it("rechaza campos adicionales", () => {
      const { error } = createValidation.validate({ ...aporteValido, campo_extra: "x" });
      expect(error).toBeDefined();
      expect(error!.message).toBe(CAMPOS_ADICIONALES);
    });
  });

  describe("updateValidation", () => {
    it.each([
      ["descripcion_aporte", descripcionValida],
      ["fecha_aporte", HOY_CHILE],
      ["procedencia", procedenciaValida],
      ["monto", montoValido],
      ["carreraId", 1],
      ["id_carrera", 1],
    ])("acepta solo el campo %s", (campo, valor) => {
      const { error } = updateValidation.validate({ [campo]: valor });
      expect(error).toBeUndefined();
    });

    it("acepta varios campos a la vez", () => {
      const { error } = updateValidation.validate(aporteValido);
      expect(error).toBeUndefined();
    });

    it("rechaza un objeto vacío", () => {
      const { error } = updateValidation.validate({});
      expect(error).toBeDefined();
      expect(error!.message).toBe("Debe proporcionar al menos un campo para actualizar");
    });

    it("rechaza campos adicionales", () => {
      const { error } = updateValidation.validate({
        descripcion_aporte: descripcionValida,
        campo_extra: "x",
      });
      expect(error).toBeDefined();
      expect(error!.message).toBe(CAMPOS_ADICIONALES);
    });
  });

  describe("fechaNoPasadaValidation", () => {
    const crearHelpers = (original?: unknown) => {
      const error = vi.fn((code: string) => ({ code }));
      return { helpers: { original, error } as any, error };
    };

    it("devuelve el mismo valor cuando la fecha es hoy en Chile", () => {
      const { helpers, error } = crearHelpers(HOY_CHILE);
      const valor = new Date(HOY_CHILE);
      expect(fechaNoPasadaValidation(valor, helpers)).toBe(valor);
      expect(error).not.toHaveBeenCalled();
    });

    it("devuelve date.min cuando la fecha es anterior a hoy", () => {
      const { helpers, error } = crearHelpers(AYER_CHILE);
      const resultado = fechaNoPasadaValidation(new Date(AYER_CHILE), helpers);
      expect(error).toHaveBeenCalledWith("date.min");
      expect(resultado).toEqual({ code: "date.min" });
    });

    it("usa los primeros 10 caracteres del valor original (ignora la hora)", () => {
      const { helpers, error } = crearHelpers(`${AYER_CHILE}T23:59:59.000Z`);
      fechaNoPasadaValidation(new Date(`${AYER_CHILE}T23:59:59.000Z`), helpers);
      expect(error).toHaveBeenCalledWith("date.min");
    });

    it("usa el día de Chile y no el de UTC para determinar 'hoy'", () => {
      // En UTC ya es 2026-10-14, pero en Chile todavía es 2026-10-13.
      const { helpers, error } = crearHelpers(HOY_CHILE);
      fechaNoPasadaValidation(new Date(HOY_CHILE), helpers);
      expect(error).not.toHaveBeenCalled();
    });
  });
});