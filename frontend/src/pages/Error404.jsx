import { Link } from "react-router-dom";

const Error404 = () => {
  return (
    <div class="grid h-screen place-items-center">
      <div class="card w-96 bg-base-100 card-xl shadow-sm">
        <div class="card-body">
          <h2 class="card-title">404</h2>
          <p>Página no encontrada</p>
          <div class="justify-end card-actions">
            <Link to="/home"><button class="btn btn-primary">Volver al inicio</button></Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Error404;