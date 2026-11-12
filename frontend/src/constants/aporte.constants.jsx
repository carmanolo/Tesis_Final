// Debe coincidir con los roles que las rutas de crear / editar / eliminar autorizan en el backend
export const PUEDE_EDITAR_APORTE = ["administrador", "presidente cee", "vicepresidente cee", "tesorero cee"];

export const OPCIONES_PROCEDENCIA = ["DDE", "Rectoria", "Decanatura", "Dirección de Departamento", "DCCTI","FACE", "FACI", "FARCORDI", "FI", "FEDUH", "FACSA", "Externo", "Otro"];
export const OPCIONES_DESCRIPCION = [
    "Aniversario FACE",
    "Aniversario Carrera",
    "Aniversario Universidad",
    "Otro",
];

export const OPCIONES_TIPO = [
    { id: "ingreso", etiqueta: "Ingreso" },
    { id: "egreso", etiqueta: "Egreso" },
];

// Límites del backend (aporte.constants.ts): monto mínimo 1000, descripción mínimo 10
export const MONTO_MINIMO = 1000;
export const APORTE_DESCRIPCION_MIN = 10;
export const APORTE_DESCRIPCION_MAX = 100;

export const COLOR_BASE = "#014898";
export const COLOR_DESTACADO = "#EE820F"; // arreglar y colocar más colores
export const TOP_N = 10;

export const CRITERIOS = [
    { id: "procedencia", etiqueta: "Procedencia con más aportes", corta: "Procedencia" },
    { id: "actividad", etiqueta: "Actividad con mayor monto", corta: "Actividad" },
    { id: "mes", etiqueta: "Aportes por mes", corta: "Por mes" },
];