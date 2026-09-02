import { useAuth } from '@context/AuthContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user } = useAuth();
    
    // console.log(user);

    // console.log("EL ROL DEL USUARIO: ", user?.role || user?.rol);

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (allowedRoles && !allowedRoles.includes(user?.role || user?.rol)) {
        return <Navigate to="/home" />;
    }

    return children;
};

export default ProtectedRoute;
