import { beforeEach, describe, expect, it, vi } from "vitest";

// Mocks (se hoistean automáticamente por encima de los imports)
const repoMock = vi.hoisted(() => ({
  findOne: vi.fn(),
  count: vi.fn(),
}));

vi.mock("../../entity/user.entity.js", () => ({ default: class User {} }));

vi.mock("../../config/configDb.js", () => ({AppDataSource: { getRepository: vi.fn(() => repoMock) },}));

vi.mock("../../services/user.service.js", () => ({createUserSer: vi.fn(),getUsersSer: vi.fn(),patchUserSer: vi.fn(),deleteUserSer: vi.fn(),getUserSer: vi.fn(),}));

vi.mock("../../services/carrera.service.js", () => ({
  obtenerCarreraPorSigla: vi.fn(),
  getCarreraSer: vi.fn(),
}));

vi.mock("../../helpers/bcrypt.helper.js", () => ({
  encryptPassword: vi.fn(),
}));

vi.mock("../../validations/user.validations.js", () => ({
  createValidation: { validate: vi.fn() },
  integrityValidation: { validate: vi.fn() },
  updateValidation: { validate: vi.fn() },
}));

vi.mock("../../validations/modules/id.validation.js", () => ({
  idValidation: { validate: vi.fn() },
}));

vi.mock("../../handlers/responseHandlers.js", () => ({
  handleErrorClient: vi.fn(),
  handleErrorServer: vi.fn(),
  handleSuccess: vi.fn(),
}));

vi.mock("../../constants/ajustes.constants.js", () => ({ SHOW_ERRORS: false }));

// Imports (ya con los mocks aplicados)
import {
  createUser,
  deleteUserById,
  getProfile,
  getUserById,
  getUsers,
  getUserStats,
  patchUserById,
} from "../../controllers/user.controller.js";
import {
  createUserSer,
  deleteUserSer,
  getUserSer,
  getUsersSer,
  patchUserSer,
} from "../../services/user.service.js";
import { getCarreraSer, obtenerCarreraPorSigla } from "../../services/carrera.service.js";
import { encryptPassword } from "../../helpers/bcrypt.helper.js";
import {
  createValidation,
  integrityValidation,
  updateValidation,
} from "../../validations/user.validations.js";
import { idValidation } from "../../validations/modules/id.validation.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../../handlers/responseHandlers.js";
import { USER_NO_ENCONTRADO } from "../../constants/user.constants.js";

// Helpers
const crearRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const crearReq = (parcial: Record<string, any> = {}) =>
  ({ body: {}, params: {}, ...parcial }) as any;

const validacionOk = { error: undefined };
const validacionFalla = (message: string) => ({ error: { message } });

describe("user.controller - Pruebas Unitarias", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});

    (integrityValidation.validate as any).mockReturnValue(validacionOk);
    (createValidation.validate as any).mockReturnValue(validacionOk);
    (updateValidation.validate as any).mockReturnValue(validacionOk);
    (idValidation.validate as any).mockReturnValue(validacionOk);
  });

  // -------------------------------------------------------------------------
  describe("createUser", () => {
    const body = {
      username: "juan",
      email: "juan@mail.cl",
      password: "Clave1234",
      role: "usuario",
    };

    it("responde 400 si no hay body", async () => {
      const res = crearRes();
      await createUser(crearReq({ body: undefined }), res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "datos no proporcionados");
      expect(createUserSer).not.toHaveBeenCalled();
    });

    it("responde 404 si la sigla de carrera no existe", async () => {
      (obtenerCarreraPorSigla as any).mockResolvedValue(null);
      const res = crearRes();
      await createUser(crearReq({ body: { ...body, sigla_carrera: "XXX" } }), res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 404, "La carrera especificada no existe");
      expect(createUserSer).not.toHaveBeenCalled();
    });

    it("convierte la sigla en carreraId y elimina las siglas del body", async () => {
      (obtenerCarreraPorSigla as any).mockResolvedValue({ id_carrera: 7 });
      (createUserSer as any).mockResolvedValue({ id: 1, ...body });
      const req = crearReq({ body: { ...body, siglaCarrera: "ICI" } });

      await createUser(req, crearRes());

      expect(obtenerCarreraPorSigla).toHaveBeenCalledWith("ICI");
      expect(req.body.carreraId).toBe(7);
      expect(req.body.siglaCarrera).toBeUndefined();
      expect(req.body.sigla_carrera).toBeUndefined();
      expect(createUserSer).toHaveBeenCalledWith(
        body.username, body.email, body.password, body.role, 7
      );
    });

    it("responde 400 si falla integrityValidation", async () => {
      (integrityValidation.validate as any).mockReturnValue(validacionFalla("campo extra"));
      const res = crearRes();
      await createUser(crearReq({ body }), res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "parametros invalidos", "campo extra");
      expect(createUserSer).not.toHaveBeenCalled();
    });

    it("responde 400 si falla createValidation", async () => {
      (createValidation.validate as any).mockReturnValue(validacionFalla("falta email"));
      const res = crearRes();
      await createUser(crearReq({ body }), res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "faltan parametros", "falta email");
      expect(createUserSer).not.toHaveBeenCalled();
    });

    it("responde 201 y no expone la contraseña", async () => {
      const creado = { id: 1, ...body };
      (createUserSer as any).mockResolvedValue({ data: creado, error: null });
      const res = crearRes();

      await createUser(crearReq({ body }), res);

      expect(creado.password).toBeUndefined();
      expect(handleSuccess).toHaveBeenCalledWith(res, 201, "Usuario registrado exitosamente", creado);
    });

    it("responde 500 si el servicio no devuelve el usuario", async () => {
      (createUserSer as any).mockResolvedValue({ data: null, error: null });
      const res = crearRes();
      await createUser(crearReq({ body }), res);
      expect(handleErrorServer).toHaveBeenCalledWith(res, 500, "error al registrar usuario");
    });

    it("responde 500 si el servicio lanza una excepción", async () => {
      (createUserSer as any).mockRejectedValue(new Error("boom"));
      const res = crearRes();
      await createUser(crearReq({ body }), res);
      expect(handleErrorServer).toHaveBeenCalledWith(res, 500, "error interno del servidor", "boom");
    });
  });

  describe("getUsers", () => {
    it("responde 200 con el primer elemento del resultado", async () => {
      const lista = [{ id: 1 }];
      (getUsersSer as any).mockResolvedValue([lista, 1]);
      const res = crearRes();
      await getUsers(crearReq(), res);
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, "Usuarios obtenidos exitosamnete", lista);
    });

    it("responde 400 si el servicio no devuelve datos", async () => {
      (getUsersSer as any).mockResolvedValue(null);
      const res = crearRes();
      await getUsers(crearReq(), res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "Usuarios no encontrados");
    });

    it("responde 500 si hay una excepción", async () => {
      (getUsersSer as any).mockRejectedValue(new Error("boom"));
      const res = crearRes();
      await getUsers(crearReq(), res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error interno del servidor." });
    });
  });

  describe("getUserById", () => {
    it("responde 200 con el usuario encontrado", async () => {
      const user = { id: 5 };
      repoMock.findOne.mockResolvedValue(user);
      const res = crearRes();
      await getUserById(crearReq({ params: { id: "5" } }), res);
      expect(repoMock.findOne).toHaveBeenCalledWith({ where: { id: 5 } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Usuario encontrado: ", data: user });
    });

    it("responde 404 si no existe", async () => {
      repoMock.findOne.mockResolvedValue(null);
      const res = crearRes();
      await getUserById(crearReq({ params: { id: "5" } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Usuario no encontrado." });
    });

    it("responde 500 si el repositorio falla", async () => {
      repoMock.findOne.mockRejectedValue(new Error("db"));
      const res = crearRes();
      await getUserById(crearReq({ params: { id: "5" } }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("patchUserById", () => {
    const usuarioExistente = () => ({
      id: 1, username: "viejo", email: "viejo@mail.cl", role: "usuario", password: "hash", carreraId: 1,
    });

    it("responde 400 si no hay body", async () => {
      const res = crearRes();
      await patchUserById(crearReq({ body: undefined, params: { id: "1" } }), res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "datos no prporcionados");
    });

    it("responde 400 si no viene el id", async () => {
      const res = crearRes();
      await patchUserById(crearReq({ params: {} }), res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "el id de usuario es obligatorio");
    });

    it("responde 400 si el id es inválido", async () => {
      (idValidation.validate as any).mockReturnValue(validacionFalla("id inválido"));
      const res = crearRes();
      await patchUserById(crearReq({ params: { id: "abc" } }), res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "id inválido");
    });

    it("elimina la contraseña vacía del body", async () => {
      (getUserSer as any).mockResolvedValue(usuarioExistente());
      (patchUserSer as any).mockResolvedValue({ data: {} });
      const req = crearReq({ params: { id: "1" }, body: { username: "nuevo", password: "   " } });

      await patchUserById(req, crearRes());

      expect(req.body.password).toBeUndefined();
      expect(encryptPassword).not.toHaveBeenCalled();
    });

    it("responde 400 si falla integrityValidation", async () => {
      (integrityValidation.validate as any).mockReturnValue(validacionFalla("extra"));
      const res = crearRes();
      await patchUserById(crearReq({ params: { id: "1" }, body: { username: "x" } }), res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "Parámetros invalidos", "extra");
    });

    it("responde 400 si falla updateValidation", async () => {
      (updateValidation.validate as any).mockReturnValue(validacionFalla("vacío"));
      const res = crearRes();
      await patchUserById(crearReq({ params: { id: "1" }, body: { username: "x" } }), res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "falto actualizar parametros", "vacío");
    });

    it("responde 404 si el usuario no existe", async () => {
      (getUserSer as any).mockResolvedValue(null);
      const res = crearRes();
      await patchUserById(crearReq({ params: { id: "1" }, body: { username: "x" } }), res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 404, "Usuario no encontrado");
    });

    it("responde 404 si la carreraId indicada no existe", async () => {
      (getUserSer as any).mockResolvedValue(usuarioExistente());
      (getCarreraSer as any).mockResolvedValue(null);
      const res = crearRes();
      await patchUserById(crearReq({ params: { id: "1" }, body: { carreraId: 99 } }), res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 404, "La carrera especificada no existe");
      expect(patchUserSer).not.toHaveBeenCalled();
    });

    it("actualiza los campos, encripta la contraseña y responde 200", async () => {
      const existente = usuarioExistente();
      (getUserSer as any).mockResolvedValue(existente);
      (getCarreraSer as any).mockResolvedValue({ id_carrera: 3 });
      (encryptPassword as any).mockResolvedValue("hash-nuevo");
      (patchUserSer as any).mockResolvedValue({ data: { id: 1 } });
      const res = crearRes();

      await patchUserById(
        crearReq({
          params: { id: "1" },
          body: {
            username: "nuevo", email: "nuevo@mail.cl", role: "administrador",
            password: " Clave9999 ", carreraId: 3,
          },
        }),
        res
      );

      expect(encryptPassword).toHaveBeenCalledWith("Clave9999");
      expect(patchUserSer).toHaveBeenCalledWith(
        expect.objectContaining({
          username: "nuevo", email: "nuevo@mail.cl", role: "administrador",
          password: "hash-nuevo", carreraId: 3,
        })
      );
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, "Usuario actualizado con éxito", { id: 1 });
    });

    it("responde 400 si patchUserSer no devuelve data", async () => {
      (getUserSer as any).mockResolvedValue(usuarioExistente());
      (patchUserSer as any).mockResolvedValue({ message: "email duplicado" });
      const res = crearRes();
      await patchUserById(crearReq({ params: { id: "1" }, body: { username: "x" } }), res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "email duplicado");
    });

    it("responde 500 si hay una excepción", async () => {
      (getUserSer as any).mockRejectedValue(new Error("boom"));
      const res = crearRes();
      await patchUserById(crearReq({ params: { id: "1" }, body: { username: "x" } }), res);
      expect(handleErrorServer).toHaveBeenCalledWith(res, 500, "Error interno del servidor", "boom");
    });
  });

  describe("deleteUserById", () => {
    it("responde 400 si no viene el id", async () => {
      const res = crearRes();
      await deleteUserById(crearReq({ params: {} }), res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "El id del usuario es obligatorio");
    });

    it("responde 200 si se eliminó al menos un registro", async () => {
      (deleteUserSer as any).mockResolvedValue({ result: { affected: 1 } });
      const res = crearRes();
      await deleteUserById(crearReq({ params: { id: "1" } }), res);
      expect(deleteUserSer).toHaveBeenCalledWith(1);
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, "Usuario elimnado exitosamnete");
    });

    it("responde 404 si el usuario no fue encontrado", async () => {
      (deleteUserSer as any).mockResolvedValue({ message: USER_NO_ENCONTRADO, result: null });
      const res = crearRes();
      await deleteUserById(crearReq({ params: { id: "1" } }), res);
      expect(handleSuccess).toHaveBeenCalledWith(res, 404, USER_NO_ENCONTRADO, null);
    });

    it("responde 400 para cualquier otro resultado", async () => {
      (deleteUserSer as any).mockResolvedValue({ message: "otro error", result: { affected: 0 } });
      const res = crearRes();
      await deleteUserById(crearReq({ params: { id: "1" } }), res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, "otro error", { affected: 0 });
    });

    it("responde 500 si hay una excepción", async () => {
      (deleteUserSer as any).mockRejectedValue(new Error("boom"));
      const res = crearRes();
      await deleteUserById(crearReq({ params: { id: "1" } }), res);
      expect(handleErrorServer).toHaveBeenCalledWith(res, 500, "Error al elimar el usuario", "boom");
    });
  });

  describe("getProfile", () => {
    it("responde 200 solo con los campos del perfil", async () => {
      repoMock.findOne.mockResolvedValue({
        id: 1, username: "juan", email: "j@mail.cl", rut: "1-9", role: "usuario", password: "hash",
      });
      const res = crearRes();
      await getProfile(crearReq({ user: { email: "j@mail.cl" } }), res);

      expect(repoMock.findOne).toHaveBeenCalledWith({ where: { email: "j@mail.cl" } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Perfil encontrado: ",
        data: { id: 1, username: "juan", email: "j@mail.cl", rut: "1-9", role: "usuario" },
      });
    });

    it("responde 404 si no hay perfil", async () => {
      repoMock.findOne.mockResolvedValue(null);
      const res = crearRes();
      await getProfile(crearReq({ user: { email: "x@mail.cl" } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Perfil no encontrado." });
    });

    it("responde 500 si el repositorio falla", async () => {
      repoMock.findOne.mockRejectedValue(new Error("db"));
      const res = crearRes();
      await getProfile(crearReq({ user: { email: "x@mail.cl" } }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getUserStats", () => {
    it("responde 200 con los conteos", async () => {
      repoMock.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(8) // usuarios
        .mockResolvedValueOnce(2); // administradores
      const res = crearRes();
      await getUserStats(crearReq(), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        usuariosCreados: 10,
        usuarios: 8,
        admninistradores: 2,
      });
    });

    it("devuelve ceros con status 200 si hay un error", async () => {
      repoMock.count.mockRejectedValue(new Error("db"));
      const res = crearRes();
      await getUserStats(crearReq(), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        usuariosCreados: 0,
        usuarios: 0,
        admninistradores: 0,
      });
    });
  });
});