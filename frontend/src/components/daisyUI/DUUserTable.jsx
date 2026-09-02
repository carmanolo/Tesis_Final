import { DUMailtoButton } from "./DUMailtoButton";
import { MdSettings } from 'react-icons/md';
import { MdDeleteForever } from 'react-icons/md';
import { FaUserAlt } from 'react-icons/fa';
import { AiFillStar } from 'react-icons/ai';

export const DUUserTable = (users, handleEditUser, handleDeleteUser) => {
    return (
        <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
        <table className="table">
            {/* head */}
            <thead>
            <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Acciones</th>
            </tr>
            </thead>
            <tbody>
            {Array.isArray(users) && users.length >= 1 && users.map(
                (user, index) => {
                    if (user) {
                        // console.log(user);
                        return ( 
                            <tr key={user.id || ("USUARIO" + index)}>
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
                                    <button className="btn btn-warning m-1" onClick={() => {handleEditUser(user?.id, user || {})}}><MdSettings /></button>
                                    <button className="btn btn-error m-1" onClick={() => {handleDeleteUser(user?.id)}}><MdDeleteForever /></button>
                                </td>                            
                            </tr>
                        )
                    } else {
                        // console.log("USUARIO NULO!!!");
                    }
                }
            )}
            </tbody>
        </table>
        </div>
    )
}