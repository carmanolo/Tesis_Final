
import { DUMailtoButton } from "./DUMailtoButton";
import { MdSettings } from "react-icons/md";
import { MdDeleteForever } from "react-icons/md";
import { FaUserAlt } from "react-icons/fa";
import { AiFillStar } from "react-icons/ai";
import {DisplayCarrera} from "../../class/DisplayCarrera.ts"

const mostrarUsuarios = (data, handleEditUser, handleDeleteUser, carreraList) => {
  if (Array.isArray(data) && data.length > 0) {
      return data.map((user) => {
       console.log("carreraList:", carreraList);
       console.log("user.carreraId:", user.carreraId);

        const currentCarrera = new DisplayCarrera(carreraList, user.carreraId || 0);
        

        Object.assign(user, {carreraObject: currentCarrera});
        return (
                  <tr key={"Class-"+user.id}>
                       <td>
                            <div className="flex flex-row align-middle items-center">
                                    <span><FaUserAlt className="mr-2"/></span>
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
                                    <span><AiFillStar className="mr-2"/></span>
                                    <span>{String(user?.role).toUpperCase()}</span>
                                </div>
                            </div>
                        </td>
                        <td>
                            {currentCarrera.nombre_carrera} {currentCarrera.sigla ? `(${currentCarrera.sigla})` : ""}
                        </td>
                      <td>
                            <button className="btn btn-primary m-1" onClick={() => {handleEditUser(user?.id, user || {})}}><MdSettings /></button>
                            <button className="btn btn-error m-1" onClick={() => {handleDeleteUser(user?.id)}}><MdDeleteForever /></button>
                      </td>    
                  </tr>
      )});
  } else {
      return (
          <tr>
              <td colSpan="7">No hay Usuarios disponibles.</td>
          </tr>
      )
  }
}
//{currentTeacher.name !== SIN_ASIGNAR && ENABLED_MAILTO ? <a href={`mailto:${currentTeacher.email}`}><button className="btn btn-warning m-1"><MdEmail /></button></a> : <></>}

export const DUUserTable = ({data, handleEditUser, handleDeleteUser, carreraList}) => {

    return (
        <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100 m-3 max-h-full">
        <table className="table">
            <thead>
            <tr>
                {/*<th></th> */} 
                <th>Nombre de usuario</th>
                <th>Gmail</th>
                <th>Rol</th>
                <th>Carrera</th>
                <th>Acciones</th>            
            </tr>
            </thead>
            <tbody>
              {mostrarUsuarios(data, 
                handleEditUser, 
                handleDeleteUser,  
                carreraList)}
            </tbody>
        </table>
        </div>
    ); 
}

