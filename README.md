# Tesis_Final

FACECORE - Sistema de Gestión Documental y Administrativa FACECORE (Facultad de Ciencias Empresariales - Centro de Organización y Registro Estudiantil)

Es una aplicación web orientada a la centralización y digitalización de la gestión documental y administrativa de los Centros de Estudiantes (CEE) de la Facultad de Ciencias Empresariales de la Universidad del Bío-Bío.  
El sistema resuelve la vulnerabilidad asociada al uso de plataformas informales (como Discord o correo electrónico), la pérdida de trazabilidad en los aportes financieros y los problemas de comunicación entre estudiantes, directivas estudiantiles y jefaturas de carrera.  
🚀 Características Principales
Gestión y Publicación de Actas: Subida y descarga de actas de asambleas en formato PDF, integradas en una interfaz de calendario y con acceso restringido únicamente a los estudiantes de la carrera correspondiente.

Control de Acceso Basado en Roles (RBAC): Autenticación segura mediante tokens JWT y validación estricta de correo institucional (@alumnos.ubiobio.cl y @ubiobio.cl), restringiendo los permisos según el rol (Administrador, Jefe de Carrera, Miembro CEE y Estudiante).

Registro de Aportes Financieros y Estadísticas: Control y seguimiento de los fondos asignados por departamentos o autoridades universitarias para actividades estudiantiles, junto con la generación de gráficos estadísticos.  
Inventario y Préstamos de Materiales: Administración de stock de insumos y recursos (como calculadoras o juegos de mesa) y registro de préstamos activos a estudiantes con seguimiento de devolución.

Publicaciones y Transparencia: Muro de comunicados y noticias por carrera con soporte para imágenes, diseñado para transparentar la gestión y uso de recursos del CEE.

Distribución de proyecto:

# Backend

Backend de la aplicación desarrollado con Node.js, TypeScript, Express y TypeORM.

## 📁 Estructura del proyecto

````text
backend/
│
│
├── src/
│   ├── config/
│   ├── constants/
│   ├── controllers/
│   ├── entity/
│   ├── handlers/
│   ├── helpers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── types/
│   ├── utils/
│   └── validations/
│
├── .gitignore
├── index.ts
├── package.json
├── package-lock.json
└── tsconfig.json

Frontend de la aplicación desarrollado con React y Vite.


```text
frontend/
│
├── src/
│   ├── assets/
│   ├── class/
│   ├── components/
│   ├── config/
│   ├── constants/
│   ├── context/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   ├── styles/
│   ├── validations/
│   └── main.jsx
│
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
└── vite.config.js
````
