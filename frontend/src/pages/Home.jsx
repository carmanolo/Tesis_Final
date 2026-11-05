import { useEffect, useState, useMemo } from "react";
import {
  FaCalendarAlt,
  FaFileDownload,
  FaClock,
  FaGraduationCap,
  FaInfoCircle,
  FaRegCalendarCheck,
  FaClipboardList,
  FaUserCheck,
  FaTag,
} from "react-icons/fa";
import { DUStats } from "../components/daisyUI/DUStats";
import useGetStats from "../hooks/profile/useGetStats";
import { useGetReuniones } from "../hooks/reuniones/useGetReuniones.jsx";
import { useDescargarActa } from "../hooks/reuniones/useDescargarActa.jsx";
import { useGetMateriales } from "../hooks/materiales/useGetMaterial.jsx";
import { getUserRole, getUserCarreraId } from "../services/user.service.js";
import { getEstadoStyle } from "../constants/material.constants.jsx";
import logoUbb from "../assets/escudo-color-gradiente.svg";

const ROLES_CEE = [
  "presidente cee",
  "vicepresidente cee",
  "secretario cee",
  "tesorero cee",
  "vocal cee",
];

const Home = () => {
  const DEFAULT_NAME = "Usuario";

  const getEmail = (user) => {
    if (!user) return DEFAULT_NAME;
    try {
      return String(user?.email)?.split("@")[0];
    } catch {
      return DEFAULT_NAME;
    }
  };

  const user = JSON.parse(sessionStorage.getItem("usuario")) || "";
  const username = user?.username || getEmail(user) || DEFAULT_NAME;
  const userRole = getUserRole();
  const userCarreraId = getUserCarreraId();

  // Roles específicos
  const esAdministrador = userRole === "administrador";
  const esMiembroCEE = ROLES_CEE.includes(userRole);
  const esEstudiante = userRole === "estudiante" || (!esAdministrador && !esMiembroCEE);

  const { fetchStats } = useGetStats();
  const [statsData, setStatsData] = useState(null);

  const [reunionData, setReunionData] = useState([]);
  const [reuniones, fetchReuniones] = useGetReuniones(reunionData, setReunionData);
  const { handleDescargarActa } = useDescargarActa();

  // Materiales para consultar préstamos
  const [materialData, setMaterialData] = useState([]);
  const [materiales, fetchMateriales] = useGetMateriales(materialData, setMaterialData);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    // 1. Estadísticas generales solo para el Administrador
    if (esAdministrador) {
      const getStatsData = async () => {
        const stats = await fetchStats();
        setStatsData(stats);
      };
      getStatsData();
    }

    // 2. Reuniones para miembros CEE y estudiantes (no administrador)
    if (!esAdministrador && typeof fetchReuniones === "function") {
      fetchReuniones();
    }

    // 3. Materiales para chequear préstamos (miembros CEE y estudiantes)
    if (!esAdministrador && typeof fetchMateriales === "function") {
      fetchMateriales();
    }
  }, [esAdministrador]);

  // Normalización para comparaciones de cadenas de texto sin tildes ni mayúsculas
  const normalizar = (txt) =>
    String(txt ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();

  // ----------------- CÁLCULO DEL ÚLTIMO PRÉSTAMO SEGÚN ROL -----------------
  // - Para miembros del CEE: el último préstamo activo registrado en el sistema / carrera.
  // - Para estudiantes: el último préstamo activo registrado a su nombre.
  const ultimoPrestamo = useMemo(() => {
    if (esAdministrador) return null;
    if (!Array.isArray(materiales) || materiales.length === 0) return null;

    const listaActivos = [];

    materiales.forEach((mat) => {
      // Filtrar por carrera si aplica
      if (userCarreraId) {
        const matCarreraId = mat.carreraId || mat.carrera?.id_carrera;
        if (matCarreraId && Number(matCarreraId) !== Number(userCarreraId)) {
          return;
        }
      }

      // Si el material tiene préstamos en su relación
      if (Array.isArray(mat.prestamos) && mat.prestamos.length > 0) {
        mat.prestamos.forEach((p) => {
          const estado = String(p.estado_prestamo ?? "").toLowerCase();
          // Solo préstamos activos: "prestado" o "pendiente"
          if (estado === "prestado" || estado === "pendiente") {
            listaActivos.push({
              id: p.id_prestamo,
              materialNombre: mat.nombre_material,
              tipoMaterial: mat.tipo_material,
              prestatario: p.prestatario,
              fechaPrestamo: p.fecha_prestamo,
              estado: p.estado_prestamo,
              tneEntregada: p.tne_entregada,
            });
          }
        });
      } else {
        // Respaldo: si el material en sí tiene registro de préstamo plano
        const estadoMat = String(mat.estado_prestamo ?? "").toLowerCase();
        if ((estadoMat === "prestado" || estadoMat === "pendiente") && mat.nombre_prestamo) {
          listaActivos.push({
            id: mat.id_material,
            materialNombre: mat.nombre_material,
            tipoMaterial: mat.tipo_material,
            prestatario: mat.nombre_prestamo,
            fechaPrestamo: mat.fecha_prestamo,
            estado: mat.estado_prestamo,
            tneEntregada: mat.tne_entregada,
          });
        }
      }
    });

    if (listaActivos.length === 0) return null;

    // Ordenar de más reciente a más antiguo
    listaActivos.sort((a, b) => {
      const fechaA = new Date(a.fechaPrestamo || 0).getTime();
      const fechaB = new Date(b.fechaPrestamo || 0).getTime();
      return fechaB - fechaA;
    });

    if (esMiembroCEE) {
      // Miembro del CEE: ve el último préstamo activo registrado
      return listaActivos[0];
    }

    if (esEstudiante) {
      // Estudiante: solo ve si el préstamo está registrado a su nombre / username
      const normUser = normalizar(username);
      const prestamoDelEstudiante = listaActivos.find((p) => {
        const normPrestatario = normalizar(p.prestatario);
        return normPrestatario === normUser || normPrestatario.includes(normUser) || normUser.includes(normPrestatario);
      });
      return prestamoDelEstudiante || null;
    }

    return null;
  }, [materiales, userCarreraId, esAdministrador, esMiembroCEE, esEstudiante, username]);

  // ----------------- CÁLCULO DE LA REUNIÓN MÁS PRÓXIMA -----------------
  const proximaReunion = useMemo(() => {
    if (esAdministrador) return null;
    if (!Array.isArray(reuniones) || reuniones.length === 0) return null;

    const hoyStr = new Date().toLocaleDateString("en-CA");

    const deMiCarrera = reuniones.filter((r) => {
      if (!userCarreraId) return true;
      const rCarreraId = r.carreraId || r.carrera?.id_carrera;
      return !rCarreraId || Number(rCarreraId) === Number(userCarreraId);
    });

    const futuras = deMiCarrera.filter((r) => {
      if (!r.fecha_reunion) return false;
      const fechaStr = String(r.fecha_reunion).slice(0, 10);
      return fechaStr >= hoyStr;
    });

    if (futuras.length === 0) {
      const ordenadas = [...deMiCarrera].sort(
        (a, b) => new Date(b.fecha_reunion).getTime() - new Date(a.fecha_reunion).getTime()
      );
      return ordenadas[0] ? { ...ordenadas[0], esPasada: true } : null;
    }

    futuras.sort(
      (a, b) => new Date(a.fecha_reunion).getTime() - new Date(b.fecha_reunion).getTime()
    );

    return futuras[0];
  }, [reuniones, userCarreraId, esAdministrador]);

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return "";
    const clean = String(fechaStr).slice(0, 10);
    const [yyyy, mm, dd] = clean.split("-");
    const fecha = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    return fecha.toLocaleDateString("es-CL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="home-banner space-y-6">
      {/* ----------------- CABECERA / HERO CON LOGO INSTITUCIONAL UBB ----------------- */}
      <div className="bg-gradient-to-r from-[#2F4697] to-[#1e2d63] text-white rounded-2xl shadow-md p-6 flex flex-col md:flex-row items-center justify-between gap-6 border border-blue-900/40">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-blue-100 backdrop-blur-xs">
            <span>Universidad del Bío-Bío</span>
            <span>•</span>
            <span className="capitalize">{userRole || "Usuario"}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Bienvenido, <span className="text-amber-300 uppercase">{String(username)}</span>
          </h1>
          <p className="text-sm text-blue-100/90 max-w-xl">
            Plataforma del Centro de Estudiantes y Gestión Universitaria. Consulta las actividades y servicios en tiempo real.
          </p>
        </div>

        {/* Logo Institucional de la Universidad del Bío-Bío */}
        <div className="bg-white/95 rounded-xl p-3 shadow-lg shrink-0 flex items-center justify-center border border-white/40">
          <img
            src={logoUbb}
            alt="Logo Universidad del Bío-Bío"
            className="h-16 md:h-20 w-auto object-contain"
          />
        </div>
      </div>

      {/* ----------------- SECCIÓN: ÚLTIMO PRÉSTAMO ACTIVO REGISTRADO ----------------- */}
      {!esAdministrador && ultimoPrestamo && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-800">
              <FaClipboardList className="text-xl text-[#2F4697]" />
              <h2 className="text-lg font-bold">
                {esMiembroCEE ? "Último préstamo activo registrado" : "Tu préstamo activo de material"}
              </h2>
            </div>
            <span className={`badge badge-sm uppercase font-semibold ${getEstadoStyle(ultimoPrestamo.estado).badge}`}>
              {ultimoPrestamo.estado}
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-base text-slate-900">
                  {ultimoPrestamo.materialNombre}
                </span>
                {ultimoPrestamo.tipoMaterial && (
                  <span className="badge badge-outline badge-xs text-slate-600">
                    <FaTag className="mr-1 text-[10px]" />
                    {ultimoPrestamo.tipoMaterial}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                <span className="flex items-center gap-1">
                  <FaUserCheck className="text-slate-400" />
                  Prestatario: <strong className="text-slate-800 font-semibold">{ultimoPrestamo.prestatario}</strong>
                </span>

                <span className="flex items-center gap-1">
                  <FaCalendarAlt className="text-slate-400" />
                  Fecha de préstamo:{" "}
                  <strong className="text-slate-700">
                    {ultimoPrestamo.fechaPrestamo ? formatearFecha(ultimoPrestamo.fechaPrestamo) : "Registrada"}
                  </strong>
                </span>

                <span className="flex items-center gap-1">
                  <span className="font-semibold text-slate-700">TNE en garantía:</span>{" "}
                  <span className="badge badge-xs badge-success text-white">Entregada</span>
                </span>
              </div>
            </div>

            {esMiembroCEE && (
              <a href="/materiales" className="btn btn-sm btn-outline btn-primary shrink-0">
                Ver en Materiales
              </a>
            )}
          </div>
        </div>
      )}

      {/* ----------------- SECCIÓN: REUNIÓN MÁS PRÓXIMA (EXCLUSIVA PARA NO ADMINISTRADORES) ----------------- */}
      {!esAdministrador && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-800">
              <FaRegCalendarCheck className="text-xl text-[#2F4697]" />
              <h2 className="text-lg font-bold">Reunión más próxima de tu carrera</h2>
            </div>
            {proximaReunion?.carrera && (
              <span className="badge badge-primary badge-outline text-xs font-medium">
                {proximaReunion.carrera.nombre_carrera || proximaReunion.carrera.sigla}
              </span>
            )}
          </div>

          {proximaReunion ? (
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <FaCalendarAlt className="text-emerald-700" />
                    {formatearFecha(proximaReunion.fecha_reunion)}
                  </span>
                  {proximaReunion.esPasada ? (
                    <span className="badge badge-warning badge-sm">Última reunión registrada</span>
                  ) : (
                    <span className="badge badge-success badge-sm text-white">Próximamente</span>
                  )}
                </div>

                <h3 className="text-base font-semibold text-slate-900">
                  {proximaReunion.descripcion || "Reunión de coordinación del Centro de Estudiantes"}
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                  {proximaReunion.carrera && (
                    <span className="flex items-center gap-1">
                      <FaGraduationCap className="text-slate-400" />
                      Carrera: <strong className="text-slate-700">{proximaReunion.carrera.nombre_carrera || proximaReunion.carrera.sigla}</strong>
                    </span>
                  )}
                  {proximaReunion.creador?.username && (
                    <span className="flex items-center gap-1">
                      <FaClock className="text-slate-400" />
                      Organizada por: <strong className="text-slate-700">{proximaReunion.creador.username}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Acciones de la reunión */}
              <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                {proximaReunion.ruta_archivo && (
                  <button
                    type="button"
                    onClick={() => handleDescargarActa(proximaReunion)}
                    className="btn btn-sm btn-outline btn-success gap-2"
                    title="Descargar acta de reunión"
                  >
                    <FaFileDownload />
                    <span>Descargar Acta</span>
                  </button>
                )}

                <a href="/reuniones" className="btn btn-sm bg-[#2F4697] hover:bg-[#233575] text-white">
                  Ver en calendario
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 px-4 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <FaInfoCircle className="mx-auto text-2xl text-slate-400 mb-2" />
              <p className="text-sm font-medium text-slate-700">No hay reuniones programadas para tu carrera en este momento</p>
              <p className="text-xs text-slate-400 mt-1">
                Las nuevas reuniones convocadas por el Centro de Estudiantes se reflejarán automáticamente aquí.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ----------------- ESTADÍSTICAS DEL SISTEMA (EXCLUSIVO PARA ADMINISTRADOR) ----------------- */}
      {esAdministrador && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
            Resumen General del Sistema
          </h2>
          <DUStats stats={statsData} />
        </div>
      )}
    </div>
  );
};

export default Home;
