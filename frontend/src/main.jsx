"use strict";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Root from "@pages/Root"
import Home from "@pages/Home"
import Login from "@pages/Login"
import Error404 from "@pages/Error404"
import Users from "@pages/Users"
import Carreras from "@pages/Carreras"
import Profile from "@pages/Profile"
import Reuniones from "@pages/Reuniones"
import ProtectedRoute from "@components/ProtectedRoute"
import "@styles/global.css";

const router = createBrowserRouter([
  {
    path: "/",
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
          <ProtectedRoute allowedRoles={["administrador"]}>
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
