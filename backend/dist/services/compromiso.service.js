import { AppDataSource } from "../config/configDb.js";
import CompromisoEntity from "../entity/compromiso.entity.js";
import CompromisoAporteEntity from "../entity/compromisoAporte.entity.js";
import AporteEntity from "../entity/aporte.entity.js";
import CarreraEntity from "../entity/carrera.entity.js";
import { isAdminRole } from "../utils/user.utils.js";
import { formatearMonto } from "../utils/aporte.utils.js";
import { calcularResumenCompromiso } from "../utils/compromiso.utils.js";
const repo = () => AppDataSource.getRepository(CompromisoEntity);
const asignacionRepo = () => AppDataSource.getRepository(CompromisoAporteEntity);
const sumaAsignada = (asignaciones) => asignaciones.reduce((suma, a) => suma + (Number(a.monto_asignado) || 0), 0);
// Agrega el resumen de financiamiento y evita exponer el hash de la contraseña del creador
function conResumen(c) {
    if (c?.creador)
        delete c.creador.password;
    return {
        ...c,
        resumen: calcularResumenCompromiso(c.monto_total, (c.aportes ?? []).map((a) => a.monto_asignado)),
    };
}
export async function createCompromisoSer(descripcion_compromiso, fecha_compromiso, monto_total, creadorId, carreraId) {
    try {
        const carreraRepo = AppDataSource.getRepository(CarreraEntity);
        const carrera = await carreraRepo.findOneBy({ id_carrera: carreraId });
        if (!carrera) {
            return { data: null, error: "La carrera especificada no existe" };
        }
        const nuevo = repo().create({
            descripcion_compromiso,
            fecha_compromiso,
            monto_total,
            creadorId,
            carreraId,
            carrera: { id_carrera: carreraId },
        });
        const saved = await repo().save(nuevo);
        return { data: saved, error: null };
    }
    catch (error) {
        console.error(error);
        return { data: null, error: "Error interno al crear el Compromiso" };
    }
}
// Devuelve los compromisos de la carrera o todos si es administrador
export async function getCompromisosSer(carreraId, role) {
    try {
        const whereCondition = {};
        if (!isAdminRole(role) && !carreraId)
            return [];
        if (carreraId)
            whereCondition.carreraId = carreraId;
        const compromisos = await repo().find({
            where: Object.keys(whereCondition).length > 0 ? whereCondition : undefined,
            relations: { carrera: true, aportes: true },
            order: { fecha_compromiso: "DESC", id_compromiso: "DESC" },
        });
        return compromisos.map(conResumen);
    }
    catch (error) {
        console.error("error al obtener Compromisos: ", error);
        return null;
    }
}
// Devuelve el compromiso si pertenece a la carrera del usuario o si es administrador
export async function getCompromisoSer(id_compromiso, carreraId, role) {
    try {
        const whereCondition = { id_compromiso };
        if (!isAdminRole(role)) {
            if (!carreraId)
                return null;
            whereCondition.carreraId = carreraId;
        }
        const compromiso = await repo().findOne({
            where: whereCondition,
            relations: { carrera: true, creador: true, aportes: { aporte: true } },
        });
        return compromiso ? conResumen(compromiso) : null;
    }
    catch (error) {
        console.error("Error al obtener el Compromiso", error);
        throw error;
    }
}
export async function patchCompromisoSer(id_compromiso, cambios) {
    try {
        return await AppDataSource.transaction(async (manager) => {
            const actual = await manager.findOne(CompromisoEntity, {
                where: { id_compromiso },
                lock: { mode: "pessimistic_write" },
            });
            if (!actual)
                return { data: null, message: "Compromiso no encontrado" };
            // El monto total no puede quedar por debajo de lo ya financiado
            if (cambios.monto_total !== undefined) {
                const asignaciones = (await manager.find(CompromisoAporteEntity, {
                    where: { compromisoId: id_compromiso },
                }));
                const financiado = sumaAsignada(asignaciones);
                if (cambios.monto_total < financiado) {
                    return {
                        data: null,
                        message: `El monto total no puede ser menor al monto ya financiado (${formatearMonto(financiado)})`,
                    };
                }
            }
            const permitidos = {};
            if (cambios.descripcion_compromiso !== undefined)
                permitidos.descripcion_compromiso = cambios.descripcion_compromiso;
            if (cambios.fecha_compromiso !== undefined)
                permitidos.fecha_compromiso = cambios.fecha_compromiso;
            if (cambios.monto_total !== undefined)
                permitidos.monto_total = cambios.monto_total;
            await manager.update(CompromisoEntity, { id_compromiso }, permitidos);
            const actualizado = await manager.findOne(CompromisoEntity, {
                where: { id_compromiso },
                relations: { carrera: true, aportes: true },
            });
            return {
                data: actualizado ? conResumen(actualizado) : null,
                message: "Compromiso actualizado con éxito",
            };
        });
    }
    catch (error) {
        console.error("Error al actualizar Compromiso", error);
        return { data: null, message: "Error interno del servidor" };
    }
}
// Las asignaciones de aportes se eliminan y se reintegra el monto a cada aporte
export async function deleteCompromisoSer(id_compromiso) {
    try {
        return await AppDataSource.transaction(async (manager) => {
            const asignaciones = (await manager.find(CompromisoAporteEntity, {
                where: { compromisoId: id_compromiso },
            }));
            // No se modifica aporte.monto al eliminar: el disponible se calcula dinámicamente
            const result = await manager.delete(CompromisoEntity, { id_compromiso });
            return { result, message: "Compromiso eliminado exitosamente" };
        });
    }
    catch (error) {
        console.error(error);
        return { result: null, message: "Error al eliminar el compromiso" };
    }
}
export async function asignarAporteSer(compromisoId, aporteId, montoAsignado) {
    try {
        return await AppDataSource.transaction(async (manager) => {
            // Se bloquean las filas para que dos asignaciones simultáneas no sobrepasen los montos
            const compromiso = await manager.findOne(CompromisoEntity, {
                where: { id_compromiso: compromisoId },
                lock: { mode: "pessimistic_write" },
            });
            if (!compromiso)
                return { data: null, error: "Compromiso no encontrado" };
            const aporte = await manager.findOne(AporteEntity, {
                where: { id_aporte: aporteId },
                lock: { mode: "pessimistic_write" },
            });
            if (!aporte)
                return { data: null, error: "El aporte especificado no existe" };
            if (aporte.carreraId !== compromiso.carreraId) {
                return { data: null, error: "El aporte pertenece a otra carrera" };
            }
            const delCompromiso = (await manager.find(CompromisoAporteEntity, {
                where: { compromisoId },
            }));
            const existente = delCompromiso.find((a) => a.aporteId === aporteId);
            const saldoCompromiso = Number(compromiso.monto_total) - sumaAsignada(delCompromiso.filter((a) => a.aporteId !== aporteId));
            if (montoAsignado > saldoCompromiso) {
                return {
                    data: null,
                    error: `El monto excede el saldo por financiar del compromiso (${formatearMonto(Math.max(saldoCompromiso, 0))})`,
                };
            }
            // Solo se pueden asignar ingresos a compromisos
            if (aporte.tipo === "egreso") {
                return { data: null, error: "Solo se pueden asignar aportes de tipo ingreso a compromisos" };
            }
            // Lo disponible del aporte = monto original - suma de lo asignado en TODOS los compromisos (excepto este)
            const todasLasAsignaciones = (await manager.find(CompromisoAporteEntity, {
                where: { aporteId },
            }));
            const asignadoEnOtros = todasLasAsignaciones
                .filter((a) => a.compromisoId !== compromisoId)
                .reduce((suma, a) => suma + (Number(a.monto_asignado) || 0), 0);
            const asignadoAnteriormente = existente ? Number(existente.monto_asignado) || 0 : 0;
            const disponibleAporte = Number(aporte.monto) - asignadoEnOtros;
            if (montoAsignado > disponibleAporte) {
                return {
                    data: null,
                    error: `El monto excede lo disponible del aporte (${formatearMonto(Math.max(disponibleAporte, 0))})`,
                };
            }
            // No se modifica aporte.monto: el disponible se calcula dinámicamente desde compromiso_aportes
            const guardado = await manager.save(CompromisoAporteEntity, existente
                ? { ...existente, monto_asignado: montoAsignado }
                : { compromisoId, aporteId, monto_asignado: montoAsignado });
            return { data: guardado, error: null, creada: !existente };
        });
    }
    catch (error) {
        console.error("Error al asignar aporte al compromiso", error);
        return { data: null, error: "Error interno al asignar el aporte" };
    }
}
export async function desasignarAporteSer(compromisoId, aporteId) {
    try {
        return await AppDataSource.transaction(async (manager) => {
            const asignacion = await manager.findOne(CompromisoAporteEntity, {
                where: { compromisoId, aporteId },
            });
            if (!asignacion)
                return { result: null, message: "Aporte no asignado a este compromiso" };
            // No se modifica aporte.monto: el disponible se calcula dinámicamente desde compromiso_aportes
            const result = await manager.delete(CompromisoAporteEntity, { compromisoId, aporteId });
            return { result, message: "Aporte quitado del compromiso" };
        });
    }
    catch (error) {
        console.error(error);
        return { result: null, message: "Error al quitar el aporte del compromiso" };
    }
}
// Datos de un único compromiso listos para generar la solicitud de fondos (PDF / Excel)
export async function getCompromisoReporteSer(id_compromiso, carreraUsuario, role) {
    const c = await getCompromisoSer(id_compromiso, carreraUsuario, role);
    if (!c)
        return null;
    const aportes = (c.aportes ?? [])
        .filter((asig) => asig.aporte)
        .map((asig) => ({
        id_aporte: asig.aporte.id_aporte,
        descripcion_aporte: asig.aporte.descripcion_aporte,
        fecha_aporte: asig.aporte.fecha_aporte,
        procedencia: asig.aporte.procedencia,
        fecha_recepcion: asig.aporte.fecha_recepcion,
        monto_aporte: Number(asig.aporte.monto) || 0,
        monto_asignado: Number(asig.monto_asignado) || 0,
    }))
        .sort((a, b) => new Date(a.fecha_aporte).getTime() - new Date(b.fecha_aporte).getTime() || a.id_aporte - b.id_aporte);
    return {
        id_compromiso: c.id_compromiso,
        descripcion_compromiso: c.descripcion_compromiso,
        fecha_compromiso: c.fecha_compromiso,
        monto_total: Number(c.monto_total) || 0,
        carrera: {
            nombre_carrera: c.carrera?.nombre_carrera ?? "",
            sigla: String(c.carrera?.sigla ?? ""),
        },
        aportes,
    };
}
//listas para procesamiento en respaldos
export async function obtenerListaCompromiso(carreraId, role) {
    try {
        const compromisoRepository = AppDataSource.getRepository(CompromisoEntity);
        const whereCondition = {};
        if (!isAdminRole(role) && carreraId) {
            whereCondition.carreraId = carreraId;
        }
        const compromisos = await compromisoRepository.find({
            where: Object.keys(whereCondition).length > 0 ? whereCondition : undefined,
            order: { fecha_compromiso: "DESC", id_compromiso: "DESC" },
        });
        return compromisos;
    }
    catch (error) {
        console.error("Error al obtener la lista de compromiso:", error);
        return [];
    }
}
