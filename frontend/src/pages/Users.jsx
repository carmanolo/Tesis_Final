import useCreateUser from "@hooks/users/useCreateUser";
import useGetUsers from "../hooks/users/useGetUsers.jsx";
import useDeleteUser from "@hooks/users/useDeleteUser.jsx";
import useEditUser from "@hooks/users/useEditUser.jsx";
import { useEffect } from "react";
import { DUUserTable } from "../components/daisyUI/DUUserTable";
import { DUMailtoButton } from "../components/daisyUI/DUMailtoButton";
import { PERMISOS, ROLES_VALIDOS } from "../constants/user.constants";

const Users = () => {
  const { users, fetchUsers } = useGetUsers();
  const { handleDeleteUser } = useDeleteUser(fetchUsers);
  const { handleEditUser } = useEditUser(fetchUsers);

  const { handleCreateUser } = useCreateUser(fetchUsers);

  //const userRole = ROLES_VALIDOS;

  //const canCrudUser = PERMISOS.includes(userRole);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if(typeof(fetchUsers) === 'function'){
      fetchUsers();
    }
  }, []);

  return (
    <div className="users-page">
      <div>
        { (<button className="btn btn-primary" onClick={() => handleCreateUser()}>Crear Usuario </button>)}
      </div>
      <h2 className="card-title mb-2">Lista de Usuarios</h2>
      {DUUserTable(users, handleEditUser, handleDeleteUser)}
    </div>
  );
};

export default Users;
