import useCreateUser from "@hooks/users/useCreateUser";
import useGetUsers from "@hooks/users/useGetUsers.jsx";
import useDeleteUser from "@hooks/users/useDeleteUser.jsx";
import useEditUser from "@hooks/users/useEditUser.jsx";
import { useGetCarreraList } from "@hooks/listas/useGetCarreraList.jsx";
import { useEffect, useState, useMemo } from "react";
import { DUUserTable } from "@components/daisyUI/DUUserTable";
import { DUPageBrowser } from "@components/daisyUI/DUPageBrowser.jsx";
import { DUMailtoButton } from "@components/daisyUI/DUMailtoButton";
//import { PERMISOS, ROLES_VALIDOS } from "../constants/user.constants";
import { sendRegistroMailService } from "@services/user.service.js";
import { DisplayCarrera } from "../class/DisplayCarrera.js"
import { norm } from "../utils/user.utils.js";


const POSTS_PER_PAGE = 4;

const Users = () => {
  const [carreras, setCarreras] = useState([]);
  const [carreraList, fetchCarreraList] = useGetCarreraList(carreras, setCarreras);

  const { users, fetchUsers } = useGetUsers();
  const { handleDeleteUser } = useDeleteUser(fetchUsers);
  const { handleEditUser } = useEditUser(fetchUsers, carreras);
  const { handleCreateUser } = useCreateUser(fetchUsers, carreras);

  const [buscar, setBuscar] = useState("");
  const [carreraFiltro, setCarreraFiltro] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const handleSendMail = async (id, targetUser) => {
    try {
      await sendRegistroMailService(id);
      alert(`Correo enviado a ${targetUser?.email}`);
    } catch (error) {
      alert(error?.response?.data?.message || "Error al enviar el correo");
    }
  };

  const user = JSON.parse(sessionStorage.getItem("usuario")) || {};
  const userRole = (user?.role || user?.rol || "").toLowerCase();
  const canEdit = userRole === "administrador" || userRole === "jefe de carrera";

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (typeof fetchUsers === "function") {
      fetchUsers();
    }
    if (typeof fetchCarreraList === "function") {
      fetchCarreraList();
    }
  }, []);

  const limpiarFiltros = () => {
    setBuscar("");
    setCarreraFiltro("");
    setCurrentPage(1);
  };

  // Opciones del select, sacadas de la lista de carreras ("1. Nombre (SIGLA)")
  const opcionesCarrera = useMemo(() => {
    const lista = Array.isArray(carreraList) ? carreraList : [];
    return lista
      .filter((c) => typeof c === "string")
      .map((c) => {
        const id = Number(c.split(". ")[0]?.trim());
        const info = new DisplayCarrera(lista, id);
        return {
          id,
          label: `${info.nombre_carrera}${info.sigla ? ` (${info.sigla})` : ""}`,
        };
      })
      .filter((o) => o.id);
  }, [carreraList]);

  // Filtro por texto (usuario, correo, rol, carrera) y por carrera exacta
  const usuariosFiltrados = useMemo(() => {
    const lista = Array.isArray(users) ? users : [];
    const q = norm(buscar);

    return lista.filter((u) => {
      // Solo incluimos la carrera si el usuario tiene una asignada,
      // para que buscar "nada" no traiga a todos los "sin asignar"
      const carrera = u.carreraId ? new DisplayCarrera(carreraList, u.carreraId) : null;

      const coincideTexto =
        !q ||
        [u.username, u.email, u.role, carrera?.nombre_carrera, carrera?.sigla].some((campo) =>
          norm(campo).includes(q)
        );

      const coincideCarrera = !carreraFiltro || Number(u.carreraId) === Number(carreraFiltro);

      return coincideTexto && coincideCarrera;
    });
  }, [users, carreraList, buscar, carreraFiltro]);

  const lastPostIndex = currentPage * POSTS_PER_PAGE;
  const firstPostIndex = lastPostIndex - POSTS_PER_PAGE;
  const currentPageContent = usuariosFiltrados.slice(firstPostIndex, lastPostIndex);
  const pageAmount = Math.ceil(usuariosFiltrados.length / POSTS_PER_PAGE) || 0;

  return (
    <div className="users2-page">
      <h2 className="text-xl font-semibold">Lista de usuarios</h2>

      <div className="flex flex-wrap gap-3 items-center justify-between my-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="join">
            <input
              className="input input-bordered input-sm join-item w-[500px]"
              placeholder="Buscar usuario, correo, rol o carrera..."
              value={buscar}
              onChange={(e) => {
                setBuscar(e.target.value);
                setCurrentPage(1);
              }}
            />
            <select
              className="select select-bordered select-sm join-item"
              value={carreraFiltro}
              onChange={(e) => {
                setCarreraFiltro(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Todas las carreras</option>
              {opcionesCarrera.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {(buscar || carreraFiltro) && (
            <button className="btn btn-sm btn-outline" onClick={limpiarFiltros}>
              Limpiar
            </button>
          )}
        </div>

        <button className="btn btn-primary" onClick={() => handleCreateUser(carreras)}>
          Crear Usuario
        </button>
      </div>

      <div className="usuario2-page">
        <DUUserTable
          data={currentPageContent}
          handleEditUser={handleEditUser}
          handleDeleteUser={handleDeleteUser}
          handleSendMail={handleSendMail}
          canCrudUsuarios={canEdit}
          carreraList={carreraList}
        />
      </div>

      {pageAmount > 0 && (
        <DUPageBrowser
          setCurrentPageNumber={setCurrentPage}
          currentPageNumber={currentPage}
          pageAmount={pageAmount}
        />
      )}
    </div>
  );
};

export default Users;