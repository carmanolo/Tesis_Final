import useCreateUser from "@hooks/users/useCreateUser";
import useGetUsers from "../hooks/users/useGetUsers.jsx";
import useDeleteUser from "@hooks/users/useDeleteUser.jsx";
import useEditUser from "@hooks/users/useEditUser.jsx";
import { useGetCarreraList } from "../hooks/listas/useGetCarreraList.jsx";
import { useEffect, useState } from "react";
import { DUUserTable } from "../components/daisyUI/DUUserTable";
import { DUPageBrowser } from "../components/daisyUI/DUPageBrowser.jsx";
import { DUMailtoButton } from "../components/daisyUI/DUMailtoButton";
import { PERMISOS, ROLES_VALIDOS } from "../constants/user.constants";

const Users = () => {

  const [carreras, setCarreras] = useState([]);

  const [carreraList, fetchCarreraList] = useGetCarreraList(carreras, setCarreras);

  const { users, fetchUsers } = useGetUsers();
  const { handleDeleteUser } = useDeleteUser(fetchUsers);
  const { handleEditUser } = useEditUser(fetchUsers, carreras);

  const { handleCreateUser } = useCreateUser(fetchUsers, carreras);

  ;

  const canCrudUsuarios = PERMISOS.includes(ROLES_VALIDOS);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if(typeof(fetchUsers) === "function"){
      fetchUsers();
    }
    if (typeof(fetchCarreraList) === "function") {
            fetchCarreraList();
        }
  }, []);

  const POSTS_PER_PAGE = 4;
    const [currentPage, setCurrentPage] = useState(1);

    const lastPostIndex  = currentPage * POSTS_PER_PAGE;
    const firstPostIndex = lastPostIndex - POSTS_PER_PAGE;
    const currentPageContent = (Array.isArray(users) && users.slice(firstPostIndex, lastPostIndex)) || [];
    const pageAmount = Math.abs(Math.ceil((Array.isArray(users) && users?.length) / POSTS_PER_PAGE)) || 0;

  return (
    <div className="users2-page">
      <h2 className="text-xl font-semibold">Lista de usuarios</h2>
      <div className="flex justify-end">
        { (<button className="btn btn-primary " onClick={() => handleCreateUser(carreras, setCarreras)}>Crear Usuario </button>)}
      </div>
      <div className="usuario2-page">
        <DUUserTable data={currentPageContent || []}
          handleEditUser={handleEditUser}
          handleDeleteUser={handleDeleteUser}
          canCrudUsuarios={canCrudUsuarios}
          carreraList={carreraList}
        />
      </div>
      <DUPageBrowser setCurrentPageNumber={setCurrentPage} currentPageNumber={currentPage} pageAmount={pageAmount}></DUPageBrowser>
    </div>
  );
};

export default Users;
