export interface CeldaDia {
  dia: number;
  fecha: Date;
  delMesActual: boolean;
}

export const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;

export const DIAS_SEMANA = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"] as const;

// Genera las celdas del mes especificado
export function generalDiasDelMes(anio: number, mes: number): CeldaDia[] {
  const primerDiaMes = new Date(anio, mes, 1);
  const ultimoDiaMes = new Date(anio, mes + 1, 0);

  const diasAntes = primerDiaMes.getDay();
  const totalDiasMes = ultimoDiaMes.getDate();
  const totalDiasMesAnterior = new Date(anio, mes, 0).getDate();

  const celdas: CeldaDia[] = [];

  for (let i = diasAntes - 1; i >= 0; i--) {
    celdas.push({
      dia: totalDiasMesAnterior - i,
      fecha: new Date(anio, mes - 1, totalDiasMesAnterior - i),
      delMesActual: false,
    });
  }

  for (let d = 1; d <= totalDiasMes; d++) {
    celdas.push({
      dia: d,
      fecha: new Date(anio, mes, d),
      delMesActual: true,
    });
  }

  const celdasFaltantes = (7 - (celdas.length % 7)) % 7;
  for (let d = 1; d <= celdasFaltantes; d++) {
    celdas.push({
      dia: d,
      fecha: new Date(anio, mes + 1, d),
      delMesActual: false,
    });
  }

  return celdas;
}

export function obtenerFechaKey(fecha?: Date | string | number | null): string | null {
  try {
    return new Date(fecha ?? 0).toISOString().split("T")[0];
  } catch (error) {
    console.error(error);
    return null;
  }
}

export function esMismodia(fechaA: Date, fechaB: Date): boolean {
  return (
    fechaA.getFullYear() === fechaB.getFullYear() &&
    fechaA.getMonth() === fechaB.getMonth() &&
    fechaA.getDate() === fechaB.getDate()
  );
}