import { FaUserAlt } from 'react-icons/fa';
import { AiFillStar } from 'react-icons/ai';
import { MdSchool } from 'react-icons/md';

export const DUStats = ({stats}) => {
    const getPorcentaje = (cantidad, total) => {
        let numeroCantidad = Math.abs(Number(cantidad));
        numeroCantidad = isNaN(numeroCantidad) ? 0 : numeroCantidad;
        let numeroTotal = Math.abs(Number(total));
        numeroTotal = (isNaN(numeroTotal) || numeroTotal === 0) ? 1 : numeroTotal;
        return String(Math.ceil((numeroCantidad / numeroTotal) * 100)) + "%";
    }

    return (
        <div className="stats">
            <div className="stat">
                <div className="stat-figure text-primary">
                    <FaUserAlt className="text-2xl"></FaUserAlt>
                </div>
                <div className="stat-title">Usuarios Totales</div>
                <div className="stat-value ">{Number(stats?.usuariosCreados) || 0}</div>
                <div className="stat-desc text-wrap">Cantidad de usuarios totales en el sistema.</div>
            </div>

            <div className="stat">
                <div className="stat-figure text-secondary">
                    <AiFillStar className="text-2xl"></AiFillStar>
                </div>
                <div className="stat-title">Administradores</div>
                <div className="stat-value text-secondary">{getPorcentaje(stats?.admninistradores, stats?.usuariosCreados) || 0}</div>
                <div className="stat-desc text-wrap">Porcentaje de administradores en el sistema.</div>
            </div>            
            
            <div className="stat">
                <div className="stat-figure text-accent">
                    <MdSchool className="text-2xl"></MdSchool>
                </div>
                <div className="stat-title">Estudiantes</div>
                <div className="stat-value text-accent">{getPorcentaje(stats?.usuarios, stats?.usuariosCreados) || 0}</div>
                <div className="stat-desc text-wrap">Porcentaje de estudiantes en el sistema.</div>
            </div>   
        </div>
    );
}