import { MdSettings } from "react-icons/md";
import { MdDeleteForever } from "react-icons/md";
import { FaUserAlt } from "react-icons/fa";
import { AiFillStar } from "react-icons/ai";


const mostrarClases = (data, handleEditCarreras, handleDeleteCarreras) => {
  if (Array.isArray(data) && data.length > 0) {
           
      return data.map((Carrera) => {
        return (
                  <tr key={"Class-"+Carrera.id_carrera}>
                      <td>
                        <div className="badge badge-tertiary">
                          {Carrera.nombre_carrera}
                        </div>
                      </td>
                      <td>
                        <div className="badge badge-tertiary pt-3 pb-3">
                          {String(Carrera.sigla).toUpperCase()}
                        </div>
                      </td>   
                      <td>
                      <button className="btn btn-primary m-1" onClick={() => {handleEditCarreras(Carrera.id_carrera, Carrera)}}><MdSettings></MdSettings></button>
                      <button className="btn btn-secondary m-1" onClick={() => {handleDeleteCarreras(Carrera.id_carrera)}}><MdDeleteForever></MdDeleteForever></button>
                      
                      </td>
                    
                  </tr>
      )});
  } else {
      return (
          <tr>
              <td colSpan="7">No hay carreras disponibles.</td>
          </tr>
      )
  }
}


export const DUCarreraTable = ({data, handleEditCarreras, handleDeleteCarreras}) => {

    return (
        <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100 m-3 max-h-full">
        <table className="table">
            <thead>
            <tr>
                {/*<th></th> */} 
                <th>Nombre de la carrera</th>
                <th>Sigla</th>
                <th>Acciones</th>             
            </tr>
            </thead>
            <tbody>
              {mostrarClases(data, 
                handleEditCarreras, 
                handleDeleteCarreras,
                )}
            </tbody>
        </table>
        </div>
    ); 
}