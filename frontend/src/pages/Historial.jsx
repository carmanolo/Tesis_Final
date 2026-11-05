import { useState, useEffect, useMemo } from "react";
import {
  FaSearch,
  FaShieldAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaUserSecret,
  FaTimes,
  FaCalendarAlt,
  FaLaptop,
  FaMobileAlt,
  FaKey,
  FaUserCheck,
  FaTrashAlt,
  FaEdit,
  FaPlusCircle,
  FaInfoCircle,
} from "react-icons/fa";
import { MdOutlineHistory, MdWarningAmber } from "react-icons/md";
import { useGetHistorial } from "../hooks/historial/useGetHistorial.jsx";

// Función para obtener icono representativo según módulo o acción
function getAccionIcon(actividad) {
  if (actividad.esSospechoso) {
    return <FaExclamationTriangle className="text-amber-500 text-sm shrink-0" title="Actividad sospechosa" />;
  }
  if (actividad.accion === "INICIO_SESION") {
    return <FaUserCheck className="text-emerald-500 text-sm shrink-0" title="Inicio de sesión" />;
  }
  if (actividad.accion === "LOGIN_FALLIDO") {
    return <FaKey className="text-rose-500 text-sm shrink-0" title="Fallo de autenticación" />;
  }
  if (actividad.accion.includes("ELIMINAR")) {
    return <FaTrashAlt className="text-red-500 text-sm shrink-0" title="Eliminación" />;
  }
  if (actividad.accion.includes("EDITAR")) {
    return <FaEdit className="text-blue-500 text-sm shrink-0" title="Modificación" />;
  }
  if (actividad.accion.includes("CREAR")) {
    return <FaPlusCircle className="text-green-600 text-sm shrink-0" title="Creación" />;
  }
  return <FaCheckCircle className="text-slate-400 text-sm shrink-0" title="Actividad" />;
}

// Formatear hora: "4:09 p. m." o "12:52 p. m."
function formatearHora(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("es-CL", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Formatear encabezado de día: "Hoy - domingo, 1 de noviembre de 2026"
function getDiaLabel(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const hoy = new Date();
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);

  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const fechaTexto = d.toLocaleDateString("es-CL", options);

  const esMismoDia = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  if (esMismoDia(d, hoy)) {
    return `Hoy - ${fechaTexto}`;
  }
  if (esMismoDia(d, ayer)) {
    return `Ayer - ${fechaTexto}`;
  }
  return fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1);
}

const Historial = () => {
  const { actividades, loading, fetchHistorial, handleDeleteItem } = useGetHistorial();

  const [filtroTexto, setFiltroTexto] = useState("");
  const [seccionActiva, setSeccionActiva] = useState("todo"); // 'todo' | 'sospechoso' | 'auth'
  const [filtroFecha, setFiltroFecha] = useState("");
  const [mostrarDatePicker, setMostrarDatePicker] = useState(false);
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [itemDetalle, setItemDetalle] = useState(null);

  useEffect(() => {
    fetchHistorial({
      soloSospechosos: seccionActiva === "sospechoso",
      fecha: filtroFecha,
      buscar: filtroTexto,
    });
  }, [seccionActiva, filtroFecha]);

  const handleBuscar = (e) => {
    e.preventDefault();
    fetchHistorial({
      soloSospechosos: seccionActiva === "sospechoso",
      fecha: filtroFecha,
      buscar: filtroTexto,
    });
  };

  const toggleSelect = (id) => {
    setSeleccionados((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  };

  // Filtrado reactivo en memoria sobre la lista obtenida
  const listaFiltrada = useMemo(() => {
    let res = actividades;
    if (seccionActiva === "sospechoso") {
      res = res.filter((a) => a.esSospechoso);
    } else if (seccionActiva === "auth") {
      res = res.filter((a) => a.modulo === "AUTH");
    }
    if (filtroTexto.trim()) {
      const q = filtroTexto.toLowerCase();
      res = res.filter(
        (a) =>
          a.descripcion?.toLowerCase().includes(q) ||
          a.usuarioEmail?.toLowerCase().includes(q) ||
          a.usuarioNombre?.toLowerCase().includes(q) ||
          a.ip?.toLowerCase().includes(q) ||
          a.accion?.toLowerCase().includes(q)
      );
    }
    return res;
  }, [actividades, seccionActiva, filtroTexto]);

  // Agrupación en: "Recientes" (últimas 2 horas) y bloques por día
  const agrupacion = useMemo(() => {
    const dosHorasAtras = Date.now() - 2 * 60 * 60 * 1000;
    const recientes = [];
    const gruposPorDia = {};

    listaFiltrada.forEach((act) => {
      const timestamp = new Date(act.createdAt).getTime();
      if (timestamp >= dosHorasAtras && recientes.length < 5) {
        recientes.push(act);
      }

      const keyDia = new Date(act.createdAt).toISOString().split("T")[0];
      if (!gruposPorDia[keyDia]) {
        gruposPorDia[keyDia] = [];
      }
      gruposPorDia[keyDia].push(act);
    });

    return { recientes, gruposPorDia };
  }, [listaFiltrada]);

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-100px)] bg-white rounded-lg shadow-sm border border-[#e2e8f0] overflow-hidden font-sans">
      {/* -------------------- BARRA LATERAL IZQUIERDA -------------------- */}
      <aside className="w-full md:w-64 bg-[#f8f9fa] border-r border-[#e5e7eb] p-4 flex flex-col shrink-0">
        <h1 className="text-xl font-semibold text-[#1f2937] mb-4">Historial</h1>

        {/* Buscador de historial */}
        <form onSubmit={handleBuscar} className="relative mb-5">
          <input
            type="text"
            placeholder="Búsqueda de historial"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            className="w-full bg-white border border-[#d1d5db] text-xs text-[#374151] placeholder-[#9ca3af] pl-8 pr-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2F4697] focus:border-[#2F4697]"
          />
          <FaSearch className="absolute left-2.5 top-2.5 text-[#9ca3af] text-xs pointer-events-none" />
        </form>

        {/* Menú de pestañas / filtros */}
        <nav className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setSeccionActiva("todo")}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors text-left ${
              seccionActiva === "todo"
                ? "bg-[#e5e7eb] text-[#111827] font-semibold border-l-4 border-[#2F4697]"
                : "text-[#4b5563] hover:bg-[#f1f5f9]"
            }`}
          >
            <MdOutlineHistory className="text-base text-[#2F4697]" />
            <span>Todo</span>
          </button>

          <button
            type="button"
            onClick={() => setSeccionActiva("sospechoso")}
            className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors text-left ${
              seccionActiva === "sospechoso"
                ? "bg-[#fee2e2] text-[#991b1b] font-semibold border-l-4 border-[#dc2626]"
                : "text-[#4b5563] hover:bg-[#f1f5f9]"
            }`}
          >
            <div className="flex items-center gap-3">
              <FaShieldAlt className="text-base text-[#dc2626]" />
              <span>Actividad sospechosa</span>
            </div>
            {actividades.filter((a) => a.esSospechoso).length > 0 && (
              <span className="badge badge-error badge-xs text-white">
                {actividades.filter((a) => a.esSospechoso).length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSeccionActiva("auth")}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors text-left ${
              seccionActiva === "auth"
                ? "bg-[#e5e7eb] text-[#111827] font-semibold border-l-4 border-[#2F4697]"
                : "text-[#4b5563] hover:bg-[#f1f5f9]"
            }`}
          >
            <FaUserSecret className="text-base text-[#4b5563]" />
            <span>Inicios de sesión y accesos</span>
          </button>
        </nav>

        {/* Alerta de detección */}
        <div className="mt-auto pt-6 border-t border-[#e5e7eb]">
          <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-md p-3 text-xs text-[#0369a1]">
            <p className="font-semibold flex items-center gap-1.5 mb-1">
              <FaShieldAlt className="text-[#0284c7]" />
              Protección Activa
            </p>
            <p className="text-[11px] leading-tight text-[#0c4a6e]">
              El sistema analiza intentos de inicio de sesión, anomalías por IP y operaciones críticas.
            </p>
          </div>
        </div>
      </aside>

      {/* -------------------- PANEL PRINCIPAL DE ACTIVIDAD -------------------- */}
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Cabecera superior con título y botón de Filtrar por fecha */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e7eb] pb-3 mb-6">
          <h2 className="text-2xl font-bold text-[#111827]">
            {seccionActiva === "todo" && "Todo"}
            {seccionActiva === "sospechoso" && "Actividad sospechosa detectada"}
            {seccionActiva === "auth" && "Inicios de sesión y accesos"}
          </h2>

          <div className="flex items-center gap-3 relative">
            <button
              type="button"
              onClick={() => setMostrarDatePicker((prev) => !prev)}
              className="flex items-center gap-2 text-xs text-[#374151] hover:text-[#111827] px-3 py-1.5 rounded-md border border-[#d1d5db] bg-white hover:bg-[#f9fafb] shadow-xs"
            >
              <FaCalendarAlt className="text-[#6b7280] text-xs" />
              <span>{filtroFecha ? `Fecha: ${filtroFecha}` : "Filtrar por fecha"}</span>
            </button>

            {filtroFecha && (
              <button
                type="button"
                onClick={() => setFiltroFecha("")}
                className="text-xs text-[#dc2626] hover:underline"
              >
                Quitar filtro
              </button>
            )}

            {/* Popover selector de fecha */}
            {mostrarDatePicker && (
              <div className="absolute right-0 top-10 bg-white border border-[#e5e7eb] p-3 rounded-md shadow-lg z-20 flex flex-col gap-2">
                <label className="text-[11px] font-semibold text-[#4b5563]">Seleccionar día:</label>
                <input
                  type="date"
                  value={filtroFecha}
                  onChange={(e) => {
                    setFiltroFecha(e.target.value);
                    setMostrarDatePicker(false);
                  }}
                  className="input input-bordered input-xs"
                />
              </div>
            )}
          </div>
        </div>

        {/* Estado de carga */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <span className="loading loading-spinner loading-md text-[#2F4697]"></span>
          </div>
        )}

        {/* Estado vacío */}
        {!loading && listaFiltrada.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-[#9ca3af]">
            <MdOutlineHistory className="text-5xl mb-2 opacity-40" />
            <p className="text-sm font-medium text-[#4b5563]">No hay actividades registradas en esta vista</p>
            <p className="text-xs text-[#9ca3af]">Las nuevas acciones en la plataforma se mostrarán aquí de inmediato.</p>
          </div>
        )}

        {/* ------------------ SECCIÓN: RECIENTES ------------------ */}
        {!loading && agrupacion.recientes.length > 0 && seccionActiva === "todo" && !filtroFecha && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-[#4b5563] mb-3">Recientes</h3>
            <div className="flex flex-col gap-1">
              {agrupacion.recientes.map((item) => (
                <FilaActividad
                  key={`reciente-${item.id}`}
                  item={item}
                  seleccionado={seleccionados.has(item.id)}
                  onToggleSelect={() => toggleSelect(item.id)}
                  onVerDetalle={() => setItemDetalle(item)}
                  onEliminar={() => handleDeleteItem(item.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ------------------ BLOQUES POR DÍA ------------------ */}
        {!loading &&
          Object.keys(agrupacion.gruposPorDia).map((keyDia) => {
            const itemsDelDia = agrupacion.gruposPorDia[keyDia];
            const tituloDia = getDiaLabel(keyDia);

            return (
              <div key={keyDia} className="mb-8">
                <h3 className="text-sm font-semibold text-[#4b5563] mb-3 border-b border-[#f3f4f6] pb-1">
                  {tituloDia}
                </h3>
                <div className="flex flex-col gap-1">
                  {itemsDelDia.map((item) => (
                    <FilaActividad
                      key={item.id}
                      item={item}
                      seleccionado={seleccionados.has(item.id)}
                      onToggleSelect={() => toggleSelect(item.id)}
                      onVerDetalle={() => setItemDetalle(item)}
                      onEliminar={() => handleDeleteItem(item.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
      </main>

      {/* Modal de Detalle de Actividad */}
      {itemDetalle && (
        <ModalDetalleActividad item={itemDetalle} onCerrar={() => setItemDetalle(null)} />
      )}
    </div>
  );
};

// Componente para cada fila del historial (fiel al diseño de Chrome / imagen)
function FilaActividad({ item, seleccionado, onToggleSelect, onVerDetalle, onEliminar }) {
  return (
    <div
      className={`group flex items-center justify-between gap-3 px-3 py-2 rounded-md hover:bg-[#f8f9fa] transition-colors border-b border-[#f1f5f9] text-xs ${
        item.esSospechoso ? "bg-[#fff5f5] hover:bg-[#fee2e2]" : ""
      }`}
    >
      {/* Izquierda: Checkbox + Icono + Título/Descripción */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <input
          type="checkbox"
          checked={seleccionado}
          onChange={onToggleSelect}
          className="checkbox checkbox-xs rounded-xs border-[#9ca3af] shrink-0"
        />

        <div className="cursor-pointer" onClick={onVerDetalle}>
          {getAccionIcon(item)}
        </div>

        <div
          className="min-w-0 flex-1 cursor-pointer select-none"
          onClick={onVerDetalle}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium text-[#1f2937] truncate hover:text-[#2F4697]">
              {item.descripcion}
            </span>

            {item.esSospechoso && (
              <span className="badge badge-error badge-xs text-white shrink-0">
                Sospechosa
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Centro / Detalle: Origen, IP, Usuario o Dispositivo */}
      <div
        className="hidden sm:flex items-center gap-2 text-[#6b7280] text-[11px] truncate max-w-[260px] cursor-pointer"
        onClick={onVerDetalle}
      >
        <span className="truncate">{item.usuarioEmail || item.ip}</span>
        {item.dispositivo && (
          <span className="text-[10px] text-[#9ca3af] border border-[#e5e7eb] px-1 rounded-xs">
            {item.dispositivo}
          </span>
        )}
      </div>

      {/* Derecha: Hora formateada + Botón X para descartar */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-[#6b7280] text-[11px] whitespace-nowrap">
          {formatearHora(item.createdAt)}
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEliminar();
          }}
          className="text-[#9ca3af] hover:text-[#111827] p-1 rounded-full hover:bg-[#e5e7eb] transition-colors"
          title="Descartar del historial"
        >
          <FaTimes className="text-xs" />
        </button>
      </div>
    </div>
  );
}

// Modal informativo con los detalles completos del evento
function ModalDetalleActividad({ item, onCerrar }) {
  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-lg w-full p-6 bg-white rounded-lg shadow-xl border border-[#e5e7eb]">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-3 mb-4">
          <div className="flex items-center gap-2">
            {item.esSospechoso ? (
              <MdWarningAmber className="text-xl text-[#dc2626]" />
            ) : (
              <FaInfoCircle className="text-xl text-[#2F4697]" />
            )}
            <h3 className="font-bold text-base text-[#111827]">
              {item.esSospechoso ? "Alerta de Actividad Sospechosa" : "Detalle de Actividad"}
            </h3>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-ghost btn-circle"
            onClick={onCerrar}
          >
            ✕
          </button>
        </div>

        {item.esSospechoso && item.motivoSospecha && (
          <div className="bg-[#fef2f2] border-l-4 border-[#dc2626] p-3 rounded-r-md text-xs text-[#991b1b] mb-4">
            <p className="font-semibold">Motivo de advertencia:</p>
            <p>{item.motivoSospecha}</p>
          </div>
        )}

        <div className="space-y-2.5 text-xs text-[#374151]">
          <div className="flex justify-between border-b border-[#f3f4f6] pb-1.5">
            <span className="text-[#6b7280] font-medium">Acción:</span>
            <span className="font-semibold text-[#111827]">{item.accion}</span>
          </div>

          <div className="flex justify-between border-b border-[#f3f4f6] pb-1.5">
            <span className="text-[#6b7280] font-medium">Módulo:</span>
            <span className="badge badge-ghost badge-sm">{item.modulo}</span>
          </div>

          <div className="flex justify-between border-b border-[#f3f4f6] pb-1.5">
            <span className="text-[#6b7280] font-medium">Descripción:</span>
            <span className="text-right font-medium">{item.descripcion}</span>
          </div>

          <div className="flex justify-between border-b border-[#f3f4f6] pb-1.5">
            <span className="text-[#6b7280] font-medium">Usuario / Email:</span>
            <span className="font-mono">{item.usuarioEmail || "Anónimo / No identificado"}</span>
          </div>

          <div className="flex justify-between border-b border-[#f3f4f6] pb-1.5">
            <span className="text-[#6b7280] font-medium">Rol:</span>
            <span>{item.rol || "N/A"}</span>
          </div>

          <div className="flex justify-between border-b border-[#f3f4f6] pb-1.5">
            <span className="text-[#6b7280] font-medium">Dirección IP:</span>
            <span className="font-mono bg-[#f3f4f6] px-1.5 py-0.5 rounded-xs">{item.ip}</span>
          </div>

          <div className="flex justify-between border-b border-[#f3f4f6] pb-1.5">
            <span className="text-[#6b7280] font-medium">Dispositivo / SO:</span>
            <span>{item.dispositivo || "Desconocido"}</span>
          </div>

          {item.ruta && (
            <div className="flex justify-between border-b border-[#f3f4f6] pb-1.5">
              <span className="text-[#6b7280] font-medium">Ruta HTTP:</span>
              <span className="font-mono text-[11px]">{item.metodoHttp} {item.ruta}</span>
            </div>
          )}

          <div className="flex justify-between border-b border-[#f3f4f6] pb-1.5">
            <span className="text-[#6b7280] font-medium">Fecha y Hora:</span>
            <span>{new Date(item.createdAt).toLocaleString("es-CL")}</span>
          </div>

          {item.detalles && (
            <div className="mt-3">
              <span className="text-[#6b7280] font-medium block mb-1">Payload / Detalles adicionales:</span>
              <pre className="bg-[#1e293b] text-[#e2e8f0] p-2.5 rounded-md text-[10px] overflow-x-auto max-h-32">
                {item.detalles}
              </pre>
            </div>
          )}
        </div>

        <div className="modal-action mt-5">
          <button type="button" className="btn btn-sm bg-[#2F4697] hover:bg-[#233575] text-white" onClick={onCerrar}>
            Cerrar
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onCerrar}></div>
    </div>
  );
}

export default Historial;

