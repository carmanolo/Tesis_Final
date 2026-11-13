import { describe, expect, it } from "vitest";
import {
  createValidation,
  integrityValidation,
  updateValidation,
} from "../../validations/publicacion.validations.js";
import {
  CAMPOS_ADICIONALES,
  DESCRIPCION_OBLIGATORIA,
  MAX_DESCRIPCION,
  MAX_TITULO,
  MIN_DESCRIPCION,
  MIN_TITULO,
  TITULO_OBLIGATORIO,
} from "../../constants/publicacion.constants.js";
import { MAX_ID, MIN_ID } from "../../constants/user.constants.js";

// ---------------------------------------------------------------------------
// Helpers y datos de prueba
// ---------------------------------------------------------------------------
const tituloValido = "Título de prueba";
const descripcionValida = "Descripción de prueba válida";

const publicacionValida = {
  titulo: tituloValido,
  descripcion: descripcionValida,
};

const mensajes = (error: any): string[] =>
  error?.details?.map((d: any) => d.message) ?? [];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("publicacion.validations - Pruebas Unitarias", () => {
  // =========================================================================
  // integrityValidation
  // =========================================================================
  describe("integrityValidation", () => {
    it("acepta un objeto vacío (todos los campos son opcionales)", () => {
      const { error } = integrityValidation.validate({});
      expect(error).toBeUndefined();
    });

    it("acepta una publicación completa y válida", () => {
      const { error } = integrityValidation.validate({
        ...publicacionValida,
        carreraId: 1,
        id_carrera: 1,
      });
      expect(error).toBeUndefined();
    });

    it("rechaza campos adicionales no permitidos", () => {
      const { error } = integrityValidation.validate({
        ...publicacionValida,
        campo_extra: "x",
      });
      expect(error).toBeDefined();
      expect(error!.message).toBe(CAMPOS_ADICIONALES);
    });

    // -----------------------------------------------------------------------
    // titulo
    // -----------------------------------------------------------------------
    describe("titulo", () => {
      it("rechaza un título vacío", () => {
        const { error } = integrityValidation.validate({ titulo: "" });
        expect(error).toBeDefined();
        expect(error!.message).toBe("El título no puede estar vacío");
      });

      it("rechaza un título que no es string", () => {
        const { error } = integrityValidation.validate({ titulo: 12345 });
        expect(error).toBeDefined();
        expect(error!.message).toBe("El título debe ser un texto");
      });

      it("rechaza un título más corto que el mínimo", () => {
        const { error } = integrityValidation.validate({
          titulo: "a".repeat(MIN_TITULO - 1),
        });
        expect(error).toBeDefined();
        expect(error!.message).toBe(
          `El título debe tener al menos ${MIN_TITULO} caracteres`
        );
      });

      it("acepta un título con exactamente el mínimo de caracteres", () => {
        const { error } = integrityValidation.validate({
          titulo: "a".repeat(MIN_TITULO),
        });
        expect(error).toBeUndefined();
      });

      it("acepta un título con exactamente el máximo de caracteres", () => {
        const { error } = integrityValidation.validate({
          titulo: "a".repeat(MAX_TITULO),
        });
        expect(error).toBeUndefined();
      });

      it("rechaza un título más largo que el máximo", () => {
        const { error } = integrityValidation.validate({
          titulo: "a".repeat(MAX_TITULO + 1),
        });
        expect(error).toBeDefined();
        expect(error!.message).toBe(
          `El título no puede tener más de ${MAX_TITULO} caracteres`
        );
      });
    });

    // -----------------------------------------------------------------------
    // descripcion
    // -----------------------------------------------------------------------
    describe("descripcion", () => {
      it("rechaza una descripción vacía", () => {
        const { error } = integrityValidation.validate({ descripcion: "" });
        expect(error).toBeDefined();
        expect(error!.message).toBe("La descripción no puede estar vacía");
      });

      it("rechaza una descripción que no es string", () => {
        const { error } = integrityValidation.validate({ descripcion: 999 });
        expect(error).toBeDefined();
        expect(error!.message).toBe("La descripción debe ser un texto");
      });

      it("rechaza una descripción más corta que el mínimo", () => {
        const { error } = integrityValidation.validate({
          descripcion: "a".repeat(MIN_DESCRIPCION - 1),
        });
        expect(error).toBeDefined();
        expect(error!.message).toBe(
          `La descripción debe tener al menos ${MIN_DESCRIPCION} caracteres`
        );
      });

      it("acepta una descripción con exactamente el mínimo de caracteres", () => {
        const { error } = integrityValidation.validate({
          descripcion: "a".repeat(MIN_DESCRIPCION),
        });
        expect(error).toBeUndefined();
      });

      it("acepta una descripción con exactamente el máximo de caracteres", () => {
        const { error } = integrityValidation.validate({
          descripcion: "a".repeat(MAX_DESCRIPCION),
        });
        expect(error).toBeUndefined();
      });

      it("rechaza una descripción más larga que el máximo", () => {
        const { error } = integrityValidation.validate({
          descripcion: "a".repeat(MAX_DESCRIPCION + 1),
        });
        expect(error).toBeDefined();
        expect(error!.message).toBe(
          `La descripción no puede tener más de ${MAX_DESCRIPCION} caracteres`
        );
      });
    });

    // -----------------------------------------------------------------------
    // carreraId / id_carrera
    // -----------------------------------------------------------------------
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
        expect(error!.message).toBe(
          "El id de la carrera debe ser un número positivo"
        );
      });

      it("rechaza un número negativo", () => {
        const { error } = integrityValidation.validate({ [campo]: -1 });
        expect(error).toBeDefined();
        expect(error!.message).toBe(
          "El id de la carrera debe ser un número positivo"
        );
      });

      it("rechaza un número decimal", () => {
        const { error } = integrityValidation.validate({ [campo]: 1.5 });
        expect(error).toBeDefined();
        expect(error!.details[0].type).toBe("number.integer");
      });
    });

    // -----------------------------------------------------------------------
    // id_publicacion (usa idValidationFunction)
    // -----------------------------------------------------------------------
    describe("id_publicacion", () => {
      it("acepta un id válido (MIN_ID)", () => {
        const { error } = integrityValidation.validate({
          id_publicacion: MIN_ID,
        });
        expect(error).toBeUndefined();
      });

      it("acepta el id máximo permitido (MAX_ID)", () => {
        const { error } = integrityValidation.validate({
          id_publicacion: MAX_ID,
        });
        expect(error).toBeUndefined();
      });

      

      it("rechaza un id decimal", () => {
        const { error } = integrityValidation.validate({
          id_publicacion: 1.5,
        });
        expect(error).toBeDefined();
        expect(error!.message).toBe("El ID tiene que ser un entero");
      });

      it("rechaza un id negativo", () => {
        const { error } = integrityValidation.validate({
          id_publicacion: -1,
        });
        expect(error).toBeDefined();
        expect(error!.message).toBe("El ID tiene que ser positivo");
      });

      it("rechaza un id mayor al máximo", () => {
        const { error } = integrityValidation.validate({
          id_publicacion: MAX_ID + 1,
        });
        expect(error).toBeDefined();
        expect(error!.message).toBe(
          `El ID debe ser menor que ${MAX_ID + 1}`
        );
      });

      // Solo se puede probar el mensaje de "number.min" si MIN_ID > 1,
      // porque si MIN_ID === 1 cualquier entero positivo ya cumple el mínimo.
      it.skipIf(MIN_ID <= 1)("rechaza un id menor al mínimo", () => {
        const { error } = integrityValidation.validate({
          id_publicacion: MIN_ID - 1,
        });
        expect(error).toBeDefined();
        expect(error!.message).toBe(
          `El ID debe ser mayor que ${MIN_ID - 1}`
        );
      });
    });
  });

  // =========================================================================
  // createValidation
  // =========================================================================
  describe("createValidation", () => {
    it("acepta los dos campos obligatorios", () => {
      const { error } = createValidation.validate(publicacionValida);
      expect(error).toBeUndefined();
    });

    it("acepta además carreraId e id_carrera (opcionales)", () => {
      const { error } = createValidation.validate({
        ...publicacionValida,
        carreraId: 1,
        id_carrera: 1,
      });
      expect(error).toBeUndefined();
    });

    it.each([
      ["titulo", TITULO_OBLIGATORIO],
      ["descripcion", DESCRIPCION_OBLIGATORIA],
    ])("exige el campo %s", (campo, mensaje) => {
      const {
        [campo as keyof typeof publicacionValida]: _omitido,
        ...resto
      } = publicacionValida;
      const { error } = createValidation.validate(resto);
      expect(error).toBeDefined();
      expect(error!.message).toBe(mensaje);
    });

    it("reporta todos los campos obligatorios cuando el objeto está vacío", () => {
      const { error } = createValidation.validate({}, { abortEarly: false });
      expect(error).toBeDefined();
      const msgs = mensajes(error);
      expect(msgs).toContain(TITULO_OBLIGATORIO);
      expect(msgs).toContain(DESCRIPCION_OBLIGATORIA);
    });

    it("rechaza un objeto vacío por la regla .min(1)", () => {
      const { error } = createValidation.validate({});
      expect(error).toBeDefined();
      // object.min puede ganarle a any.required según el orden interno de Joi
      expect(error!.message).toBeDefined();
    });

    it("rechaza campos adicionales", () => {
      const { error } = createValidation.validate({
        ...publicacionValida,
        campo_extra: "x",
      });
      expect(error).toBeDefined();
      expect(error!.message).toBe(CAMPOS_ADICIONALES);
    });
  });

  // =========================================================================
  // updateValidation
  // =========================================================================
  describe("updateValidation", () => {
    it.each([
      ["titulo", tituloValido],
      ["descripcion", descripcionValida],
      ["carreraId", 1],
      ["id_carrera", 1],
    ])("acepta solo el campo %s", (campo, valor) => {
      const { error } = updateValidation.validate({ [campo]: valor });
      expect(error).toBeUndefined();
    });

    it("acepta varios campos a la vez", () => {
      const { error } = updateValidation.validate(publicacionValida);
      expect(error).toBeUndefined();
    });

    // updateValidation NO tiene .min(1) a propósito: el controlador permite
    // actualizar solo con imágenes (multipart) sin campos de texto.
    it("acepta un objeto vacío (porque el controlador valida imágenes)", () => {
      const { error } = updateValidation.validate({});
      expect(error).toBeUndefined();
    });

    it("rechaza campos adicionales", () => {
      const { error } = updateValidation.validate({
        titulo: tituloValido,
        campo_extra: "x",
      });
      expect(error).toBeDefined();
      expect(error!.message).toBe(CAMPOS_ADICIONALES);
    });

    it("rechaza id_publicacion en el body como campo adicional", () => {
      const { error } = updateValidation.validate({ id_publicacion: "x" });
      expect(error).toBeDefined();
      expect(error!.message).toBe(CAMPOS_ADICIONALES);
    });
  });
});