import { Link } from "react-router-dom";
import {
  FaCalendarAlt,
  FaGraduationCap,
  FaUsers,
  FaUserCircle,
  FaArrowRight,
  FaBullhorn,
  FaHandHoldingUsd,
} from "react-icons/fa";
import escudoUBB from "../assets/escudo-color-gradiente.svg";


// Opcional: imagen de portada (ej: import hero from "../assets/hero.jpg")
const HERO_IMAGE = "";

const accesos = [
  {
    titulo: "Reuniones",
    texto: "Revisa las reuniones y actividades del centro.",
    Icono: FaCalendarAlt,
    color: "bg-primary/10 text-primary",
  },
  {
    titulo: "Aportes",
    texto: "Consulta los aportes y su estado.",
    Icono: FaHandHoldingUsd,
    color: "bg-success/15 text-success",
  },
  {
    titulo: "Representación",
    texto: "Infórmate sobre tu centro de estudiantes.",
    Icono: FaUsers,
    color: "bg-accent/15 text-accent",
  },
  {
    titulo: "Carreras",
    texto: "Todo lo que necesitas para tu carrera.",
    Icono: FaGraduationCap,
    color: "bg-secondary/15 text-secondary",
  },
];



const Landing = () => {
  const ctaTo = "/login";
  const ctaLabel = "Iniciar Sesión";

  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      {/* Franja superior UBB */}
      <div className="h-2 bg-primary" />
      <div className="h-1 bg-secondary" />

      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-base-200 bg-base-100/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
          <a href="#inicio" className="flex items-center gap-3">
            <img src={escudoUBB} alt="Escudo Universidad del Bío-Bío" className="h-12 w-auto" />
            <div className="leading-tight">
              <p className="text-2xl font-extrabold tracking-tight text-primary">FACECORE</p>
              <p className="text-sm font-medium">Centro de Estudiantes</p>
              <p className="text-[11px] text-base-content/60">Universidad del Bío-Bío</p>
            </div>
          </a>

          

          <Link to={ctaTo} className="btn btn-primary rounded-xl">
            <FaUserCircle />
            {ctaLabel}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section
        id="inicio"
        className="relative overflow-hidden bg-linear-to-br from-base-200 via-base-100 to-base-200"
      >
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/10" />
        <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-secondary/10" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 lg:grid-cols-2 lg:px-8 lg:py-20">
          <div>
            <span className="inline-block rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              Centro de Estudiantes
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight text-primary sm:text-5xl">
              Juntos construimos una mejor Facultad
            </h1>
            <p className="mt-5 max-w-xl text-lg text-base-content/70">
              El Centro de Estudiantes de la Facultad de Ciencias Empresariales trabaja por una
              comunidad universitaria más unida, participativa y con más oportunidades para todos.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#nosotros" className="btn btn-primary rounded-xl">
                <FaUsers />
                Conoce nuestro centro
              </a>
              <Link to={ctaTo} className="btn btn-outline btn-primary rounded-xl">
                <FaUserCircle />
                {ctaLabel}
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2.5rem] rounded-tl-[5rem] bg-linear-to-br from-primary to-primary/60 shadow-xl">
              {HERO_IMAGE ? (
                <img src={HERO_IMAGE} alt="Estudiantes de la facultad" className="h-full w-full object-cover" />
              ) : (
                <img
                  src={escudoUBB}
                  alt=""
                  className="absolute left-1/2 top-1/2 h-40 w-60 -translate-x-1/2 -translate-y-1/2 opacity-90 drop-shadow-lg"
                />
              )}
              <p className="absolute bottom-6 right-6 -rotate-6 text-2xl font-bold italic text-white drop-shadow-lg sm:text-3xl">
                Tu voz también cuenta
              </p>
            </div>
            <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-secondary/80" />
          </div>
        </div>
      </section>

      {/* Accesos rápidos */}
      <section id="accesos" className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {accesos.map(({ titulo, texto, Icono, color }) => (
            <Link
              key={titulo}
              to={ctaTo}
              className="group flex items-center gap-4 rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl ${color}`}>
                <Icono />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{titulo}</h3>
                <p className="mt-1 text-sm text-base-content/60">{texto}</p>
              </div>
              <FaArrowRight className="text-primary transition group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </section>

      {/* Llamado a la participación */}
      <section id="nosotros" className="mx-auto max-w-7xl px-4 pb-16 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl bg-primary/5 p-8 lg:col-span-2">
            <div className="flex items-start gap-4">
              <FaBullhorn className="mt-1 shrink-0 text-3xl text-primary" />
              <div>
                <h2 className="text-2xl font-bold text-primary">¡Tu opinión importa!</h2>
                <p className="mt-2 max-w-xl text-base-content/70">
                  Accede a las herramientas del centro de estudiantes y ayúdanos a construir una
                  mejor comunidad.
                </p>
                <Link to={ctaTo} className="btn btn-primary mt-5 rounded-xl">
                  {ctaLabel}
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center rounded-2xl border border-secondary/30 bg-secondary/10 p-8">
            <p className="text-lg font-medium italic">“Participar también es una forma de avanzar”</p>
            <p className="mt-3 text-xs text-base-content/60">Centro de Estudiantes FACECORE</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contacto" className="border-t border-base-200 bg-base-200/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-base-content/60 sm:flex-row lg:px-8">
          <p>© {new Date().getFullYear()} FACECORE · Universidad del Bío-Bío</p>
          <p>Facultad de Ciencias Empresariales</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;