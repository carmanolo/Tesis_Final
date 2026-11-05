"use strict";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Root from "@pages/Root"
import Landing from "@pages/Landing"
import Home from "@pages/Home"
import Login from "@pages/Login"
import Error404 from "@pages/Error404"
import Users from "@pages/Users"
import Carreras from "@pages/Carreras"
import Profile from "@pages/Profile"
import Reuniones from "@pages/Reuniones"
import Aportes from "@pages/Aportes"
import Materiales from "@pages/Materiales"
import Publicaciones from "@pages/Publicaciones"
import Historial from "@pages/Historial"
import ProtectedRoute from "@components/ProtectedRoute"
import "@styles/global.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
    errorElement: <Error404 />,
  },
  {
    //path: "/",
    element: <Root />,
    errorElement: <Error404 />,
    children: [
      {
        path: "/home",
        element: <Home />,
      },
      {
        path: "/users",
        element: (
          <ProtectedRoute allowedRoles={["administrador", "jefe de carrera"]}>
            <Users />
          </ProtectedRoute>
        ),
      },
      {
        path: "/carreras",
        element: (
          <ProtectedRoute allowedRoles={["administrador"]}>
            <Carreras />
          </ProtectedRoute>
        ),
      },
      {
        path: "/reuniones",
        element: (
            <Reuniones />
        ),
      },
      {
        path: "/aportes",
        element: (
            <Aportes />
        ),
      },
      {
        path: "/materiales",
        element: (
            <Materiales />
        ),
      },
      {
        path: "/publicaciones",
        element: (
            <Publicaciones />
        ),
      },
      {
        path: "/historial",
        element: (
          <ProtectedRoute allowedRoles={["administrador"]}>
            <Historial />
          </ProtectedRoute>
        ),
      },
      {
        path: "/profile",
        element: <Profile />,
      }
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
