import { AppDataSource } from "../config/configDb.js";
import CompromisoEntity, { Compromiso } from "../entity/compromiso.entity.js";
import CompromisoAporteEntity from "../entity/compromisoAporte.entity.js";
import AporteEntity from "../entity/aporte.entity.js";
import CarreraEntity from "../entity/carrera.entity.js";
import { isAdminRole } from "../utils/user.utils.js";
import { formatearMonto } from "../utils/aporte.utils.js";
import { calcularResumenCompromiso } from "../utils/compromiso.utils.js";
import type { CompromisoReporte } from "../utils/compromiso.utils.js";

const repo = () => AppDataSource.getRepository(CompromisoEntity as any);
const asignacionRepo = () => AppDataSource.getRepository(CompromisoAporteEntity as any);

const sumaAsignada = (asignaciones: any[]) =>
    asignaciones.reduce((suma, a) => suma + (Number(a.monto_asignado) || 0), 0);

// Agrega el resumen de financiamiento y evita exponer el hash de la contraseña del creador
function conResumen(c: any) {
    if (c?.creador) delete c.creador.password;
    return {
        ...c,
        resumen: calcularResumenCompromiso(
            c.monto_total,
            (c.aportes ?? []).map((a: any) => a.monto_asignado),
        ),
    };
}

export async function createCompromisoSer(
    descripcion_compromiso: string,
    fecha_compromiso: Date | string,
    monto_total: number,
    creadorId: number,
    carreraId: number,
): Promise<{ data: any | null; error: string | null }> {
    try {
        const carreraRepo = AppDataSource.getRepository(CarreraEntity as any);
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
    } catch (error) {
        console.error(error);
        return { data: null, error: "Error interno al crear el Compromiso" };
    }
}

// Devuelve los compromisos de la carrera o todos si es administrador
export async function getCompromisosSer(carreraId?: number, role?: string): Promise<any[] | null> {
    try {
        const whereCondition: any = {};
        if (!isAdminRole(role) && !carreraId) return [];
        if (carreraId) whereCondition.carreraId = carreraId;

        const compromisos = await repo().find({
            where: Object.keys(whereCondition).length > 0 ? whereCondition : undefined,
            relations: { carrera: true, aportes: true },
            order: { fecha_compromiso: "DESC", id_compromiso: "DESC" },
        });
        return compromisos.map(conResumen);
    } catch (error) {
        console.error("error al obtener Compromisos: ", error);
        return null;
    }
}

// Devuelve el compromiso si pertenece a la carrera del usuario o si es administrador
export async function getCompromisoSer(id_compromiso: number, carreraId?: number, role?: string): Promise<any | null> {
    try {
        const whereCondition: any = { id_compromiso };
        if (!isAdminRole(role)) {
            if (!carreraId) return null;
            whereCondition.carreraId = carreraId;
        }

        const compromiso = await repo().findOne({
            where: whereCondition,
            relations: { carrera: true, creador: true, aportes: { aporte: true } },
        });
        return compromiso ? conResumen(compromiso) : null;
    } catch (error) {
        console.error("Error al obtener el Compromiso", error);
        throw error;
    }
}

export async function patchCompromisoSer(
    id_compromiso: number,
    cambios: { descripcion_compromiso?: string; fecha_compromiso?: Date | string; monto_total?: number },
): Promise<{ data: any | null; message: string }> {
    try {
        return await AppDataSource.transaction(async (manager) => {
            const actual: any = await manager.findOne(CompromisoEntity as any, {
                where: { id_compromiso },
                lock: { mode: "pessimistic_write" },
            });
            if (!actual) return { data: null, message: "Compromiso no encontrado" };

            // El monto total no puede quedar por debajo de lo ya financiado
            if (cambios.monto_total !== undefined) {
                const asignaciones = (await manager.find(CompromisoAporteEntity as any, {
                    where: { compromisoId: id_compromiso },
                })) as any[];
                const financiado = sumaAsignada(asignaciones);
                if (cambios.monto_total < financiado) {
                    return {
                        data: null,
                        message: `El monto total no puede ser menor al monto ya financiado (${formatearMonto(financiado)})`,
                    };
                }
            }

            const permitidos: any = {};
            if (cambios.descripcion_compromiso !== undefined) permitidos.descripcion_compromiso = cambios.descripcion_compromiso;
            if (cambios.fecha_compromiso !== undefined) permitidos.fecha_compromiso = cambios.fecha_compromiso;
            if (cambios.monto_total !== undefined) permitidos.monto_total = cambios.monto_total;

            await manager.update(CompromisoEntity as any, { id_compromiso }, permitidos);

            const actualizado = await manager.findOne<any>(CompromisoEntity as any, {
                where: { id_compromiso },
                relations: { carrera: true, aportes: true },
            });
            return {
                data: actualizado ? conResumen(actualizado) : null,
                message: "Compromiso actualizado con éxito",
            };
        });
    } catch (error) {
        console.error("Error al actualizar Compromiso", error);
        return { data: null, message: "Error interno del servidor" };
    }
}

// Las asignaciones de aportes se eliminan y se reintegra el monto a cada aporte
export async function deleteCompromisoSer(id_compromiso: number): Promise<any> {
    try {
        return await AppDataSource.transaction(async (manager) => {
            const asignaciones = (await manager.find(CompromisoAporteEntity as any, {
                where: { compromisoId: id_compromiso },
            })) as any[];

            for (const asig of asignaciones) {
                const aporte: any = await manager.findOne(AporteEntity as any, {
                    where: { id_aporte: asig.aporteId },
                });
                if (aporte) {
                    aporte.monto = Number(aporte.monto) + (Number(asig.monto_asignado) || 0);
                    await manager.save(AporteEntity as any, aporte);
                }
            }

            const result = await manager.delete(CompromisoEntity as any, { id_compromiso });
            return { result, message: "Compromiso eliminado exitosamente" };
        });
    } catch (error) {
        console.error(error);
        return { result: null, message: "Error al eliminar el compromiso" };
    }
}

export async function asignarAporteSer(
    compromisoId: number,
    aporteId: number,
    montoAsignado: number,
): Promise<{ data: any | null; error: string | null; creada?: boolean }> {
    try {
        return await AppDataSource.transaction(async (manager) => {
            // Se bloquean las filas para que dos asignaciones simultáneas no sobrepasen los montos
            const compromiso: any = await manager.findOne(CompromisoEntity as any, {
                where: { id_compromiso: compromisoId },
                lock: { mode: "pessimistic_write" },
            });
            if (!compromiso) return { data: null, error: "Compromiso no encontrado" };

            const aporte: any = await manager.findOne(AporteEntity as any, {
                where: { id_aporte: aporteId },
                lock: { mode: "pessimistic_write" },
            });
            if (!aporte) return { data: null, error: "El aporte especificado no existe" };
            if (aporte.carreraId !== compromiso.carreraId) {
                return { data: null, error: "El aporte pertenece a otra carrera" };
            }

            const delCompromiso = (await manager.find(CompromisoAporteEntity as any, {
                where: { compromisoId },
            })) as any[];

            const existente = delCompromiso.find((a) => a.aporteId === aporteId);

            const saldoCompromiso =
                Number(compromiso.monto_total) - sumaAsignada(delCompromiso.filter((a) => a.aporteId !== aporteId));
            if (montoAsignado > saldoCompromiso) {
                return {
                    data: null,
                    error: `El monto excede el saldo por financiar del compromiso (${formatearMonto(Math.max(saldoCompromiso, 0))})`,
                };
            }

            // Lo disponible del aporte es su monto actual libre en BD más lo que este compromiso ya tenía asignado
            const asignadoAnteriormente = existente ? Number(existente.monto_asignado) || 0 : 0;
            const disponibleAporte = Number(aporte.monto) + asignadoAnteriormente;
            if (montoAsignado > disponibleAporte) {
                return {
                    data: null,
                    error: `El monto excede lo disponible del aporte (${formatearMonto(Math.max(disponibleAporte, 0))})`,
                };
            }

            // Ajustar el monto libre del aporte en la BD para que los ingresos se reduzcan
            const diferencia = montoAsignado - asignadoAnteriormente;
            aporte.monto = Number(aporte.monto) - diferencia;
            await manager.save(AporteEntity as any, aporte);

            const guardado = await manager.save(
                CompromisoAporteEntity as any,
                existente
                    ? { ...existente, monto_asignado: montoAsignado }
                    : { compromisoId, aporteId, monto_asignado: montoAsignado },
            );
            return { data: guardado, error: null, creada: !existente };
        });
    } catch (error) {
        console.error("Error al asignar aporte al compromiso", error);
        return { data: null, error: "Error interno al asignar el aporte" };
    }
}

export async function desasignarAporteSer(compromisoId: number, aporteId: number): Promise<any> {
    try {
        return await AppDataSource.transaction(async (manager) => {
            const asignacion: any = await manager.findOne(CompromisoAporteEntity as any, {
                where: { compromisoId, aporteId },
            });
            if (!asignacion) return { result: null, message: "Aporte no asignado a este compromiso" };

            // Reintegrar el monto asignado de vuelta al aporte
            const aporte: any = await manager.findOne(AporteEntity as any, {
                where: { id_aporte: aporteId },
            });
            if (aporte) {
                aporte.monto = Number(aporte.monto) + (Number(asignacion.monto_asignado) || 0);
                await manager.save(AporteEntity as any, aporte);
            }

            const result = await manager.delete(CompromisoAporteEntity as any, { compromisoId, aporteId });
            return { result, message: "Aporte quitado del compromiso" };
        });
    } catch (error) {
        console.error(error);
        return { result: null, message: "Error al quitar el aporte del compromiso" };
    }
}

// Datos de un único compromiso listos para generar la solicitud de fondos (PDF / Excel)
export async function getCompromisoReporteSer(
    id_compromiso: number,
    carreraUsuario?: number,
    role?: string,
): Promise<CompromisoReporte | null> {
    const c = await getCompromisoSer(id_compromiso, carreraUsuario, role);
    if (!c) return null;

    const aportes = ((c.aportes ?? []) as any[])
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
        .sort(
            (a, b) =>
                new Date(a.fecha_aporte).getTime() - new Date(b.fecha_aporte).getTime() || a.id_aporte - b.id_aporte,
        );

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

export async function obtenerListaCompromiso(carreraId?: number, role?: string): Promise<Compromiso[]> {
  try {
    const compromisoRepository = AppDataSource.getRepository(CompromisoEntity);
    const whereCondition: any = {};
    if (!isAdminRole(role) && carreraId) {
      whereCondition.carreraId = carreraId;
    }
    const compromisos = await compromisoRepository.find({
      where: Object.keys(whereCondition).length > 0 ? whereCondition : undefined,
      order: { fecha_compromiso: "DESC", id_compromiso: "DESC" },
    });
    return compromisos as any;
  } catch (error) {
    console.error("Error al obtener la lista de compromiso:", error);
    return [];
  }
}