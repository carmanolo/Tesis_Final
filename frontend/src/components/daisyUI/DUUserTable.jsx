import { DUMailtoButton } from "./DUMailtoButton";
import { MdSettings } from "react-icons/md";
import { MdDeleteForever } from "react-icons/md";
import { FaUserAlt } from "react-icons/fa";
import { AiFillStar } from "react-icons/ai";
import { DisplayCarrera } from "../../class/DisplayCarrera.ts";

const mostrarUsuarios = (data, handleEditUser, handleDeleteUser, carreraList, canEdit, canDelete) => {
  const showActions = canEdit || canDelete;

  if (Array.isArray(data) && data.length > 0) {
      return data.map((user) => {
        const currentCarrera = new DisplayCarrera(carreraList, user.carreraId || 0);

        Object.assign(user, { carreraObject: currentCarrera });
        return (
          <tr key={"Class-" + user.id}>
            <td>
              <div className="flex flex-row align-middle items-center">
                <span><FaUserAlt className="mr-2" /></span>
                <span>{user?.username}</span>
              </div>
            </td>    
            <td>
              {user?.email}
              {DUMailtoButton(user?.email, "ml-2")}
            </td>
            <td>
              <div className="badge badge-secondary">
                <div className="flex flex-row align-middle items-center">
                  <span><AiFillStar className="mr-2" /></span>
                  <span>{String(user?.role).toUpperCase()}</span>
                </div>
              </div>
            </td>
            <td>
              {currentCarrera.nombre_carrera} {currentCarrera.sigla ? `(${currentCarrera.sigla})` : ""}
            </td>
            {showActions && (
              <td>
                {canEdit && (
                  <button 
                    className="btn btn-primary m-1" 
                    title="Editar usuario" 
                    onClick={() => { handleEditUser(user?.id, user || {}) }}
                  >
                    <MdSettings />
                  </button>
                )}
                {canDelete && (
                  <button 
                    className="btn btn-secondary m-1" 
                    title="Eliminar usuario" 
                    onClick={() => { handleDeleteUser(user?.id) }}
                  >
                    <MdDeleteForever />
                  </button>
                )}
              </td>
            )}
          </tr>
        );
      });
  } else {
      return (
          <tr>
              <td colSpan={showActions ? 5 : 4}>No hay Usuarios disponibles.</td>
          </tr>
      );
  }
};

export const DUUserTable = ({ 
  data, 
  handleEditUser, 
  handleDeleteUser, 
  carreraList, 
  canEdit = true, 
  canDelete = false,
  canCrudUsuarios
}) => {
    const allowEdit = canCrudUsuarios !== undefined ? canCrudUsuarios : canEdit;
    const allowDelete = canCrudUsuarios !== undefined ? canCrudUsuarios : canDelete;
    const showActions = allowEdit || allowDelete;

    return (
        <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100 m-3 max-h-full">
        <table className="table">
            <thead>
            <tr>
                <th>Nombre de usuario</th>
                <th>Gmail</th>
                <th>Rol</th>
                <th>Carrera</th>
                {showActions && <th>Acciones</th>}
            </tr>
            </thead>
            <tbody>
              {mostrarUsuarios(
                data, 
                handleEditUser, 
                handleDeleteUser,  
                carreraList,
                allowEdit,
                allowDelete
              )}
            </tbody>
        </table>
        </div>
    ); 
};
