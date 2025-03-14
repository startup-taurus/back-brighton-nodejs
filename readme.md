Proyecto Backend para Instituto de Inglés

Descripción

Este proyecto es un backend desarrollado en Node.js para la gestión de un instituto de inglés. La aplicación está diseñada para manejar de manera eficiente la información relacionada con estudiantes, cursos, profesores y sus respectivas relaciones. El proyecto utiliza un enfoque basado en la inyección de dependencias para mejorar la modularidad, reutilización y facilidad de mantenimiento del código.

Características

    •	Gestión de Estudiantes: Registro, actualización, y eliminación de estudiantes.
    •	Gestión de Profesores: Administración del perfil de profesores y asignación de cursos.
    •	Gestión de Cursos: Creación y manejo de cursos ofrecidos por el instituto.
    •	Inyección de Dependencias: Utilización de patrones de inyección de dependencias para una mejor organización del código.
    •	Autenticación y Autorización: Implementación de JWT para asegurar las rutas y proteger los recursos.
    •	API REST: Diseño de una API RESTful para interactuar con el sistema de forma eficiente.

Tecnologías Utilizadas

    •	Node.js - Entorno de ejecución para JavaScript del lado del servidor.
    •	Express.js - Framework para aplicaciones web en Node.js.
    •	TypeScript - Lenguaje de programación que extiende JavaScript y agrega tipado estático.
    •	Inyección de Dependencias - Implementada con InversifyJS para una arquitectura más robusta y flexible.
    •	muSql- Base de datos SQL para almacenar la información.
    •	JWT - JSON Web Tokens para la autenticación y autorización.

## Contexto del Proyecto

Este proyecto backend está diseñado para satisfacer las necesidades de gestión de un instituto de inglés llamado Brighton. La aplicación permite administrar todos los aspectos operativos del instituto, incluyendo:

- **Gestión académica**: Manejo de cursos, niveles, sílabos y evaluaciones.
- **Gestión administrativa**: Control de estudiantes, profesores, pagos y asistencias.
- **Planificación**: Administración de horarios, días festivos y clases canceladas.

El sistema está construido siguiendo principios de arquitectura limpia y patrones de diseño que facilitan su mantenimiento y escalabilidad. La inyección de dependencias implementada con Awilix permite un acoplamiento débil entre los componentes, facilitando las pruebas unitarias y la reutilización de código.

La base de datos MySQL almacena toda la información relacionada con el instituto, utilizando Sequelize como ORM para interactuar con ella de manera eficiente y segura.

## Arquitectura del Proyecto

El proyecto sigue una arquitectura de capas bien definida:

1. **Capa de Presentación**: Controladores y rutas que manejan las solicitudes HTTP.
2. **Capa de Lógica de Negocio**: Servicios que implementan la lógica de negocio de la aplicación.
3. **Capa de Acceso a Datos**: Modelos que representan las entidades de la base de datos.
4. **Capa de Infraestructura**: Configuración, middleware y utilidades que soportan el funcionamiento de la aplicación.

La aplicación utiliza un contenedor de inyección de dependencias para gestionar las dependencias entre los diferentes componentes, lo que facilita la modularidad y el mantenimiento del código.

## Estructura del Proyecto

```
.
├── .gitignore
├── .vscode/
│   └── launch.json
├── Brighton School.postman_collection.json
├── config/
│   ├── container.js         # Configuración del contenedor de inyección de dependencias
│   └── index.js             # Configuración general de la aplicación
├── controllers/             # Controladores para manejar las solicitudes HTTP
│   ├── attendance.controller.js
│   ├── base.controller.js   # Controlador base con funcionalidad común
│   ├── cancelled-lesson.controller.js
│   ├── course-grading.controller.js
│   ├── course-schedule.controller.js
│   ├── course.controller.js
│   ├── holidays.controller.js
│   ├── index.js
│   ├── payment.controller.js
│   ├── professor.controller.js
│   ├── registered-student.controller.js
│   ├── student-grades.controller.js
│   ├── student.controller.js
│   ├── syllabus.controller.js
│   └── user.controller.js
├── index.js                 # Punto de entrada de la aplicación
├── middleware/              # Middleware para procesar solicitudes
│   ├── authMiddleware.js    # Middleware de autenticación
│   ├── errorMiddleware.js   # Middleware de manejo de errores
│   ├── index.js
│   └── not-found.middleware.js
├── models/                  # Modelos de datos (Sequelize)
│   ├── associations.js      # Definición de relaciones entre modelos
│   ├── attendance.js
│   ├── cancelled-lesson.models.js
│   ├── course-grading.model.js
│   ├── course-schedule.model.js
│   ├── course-student.model.js
│   ├── course.models.js
│   ├── grade-percentages.js
│   ├── grades.js
│   ├── grading-category.model.js
│   ├── grading-item.model.js
│   ├── holidays.js
│   ├── index.js
│   ├── payment.models.js
│   ├── percentages.model.js
│   ├── professor.models.js
│   ├── registered-student.model.js
│   ├── student-grades.model.js
│   ├── student.models.js
│   ├── syllabus.js
│   ├── syllabusItems.js
│   └── user.models.js
├── package-lock.json
├── package.json
├── readme.md
├── routes/                  # Definición de rutas de la API
│   ├── api/
│   │   ├── index.js
│   │   ├── v1.attendance.js
│   │   ├── v1.cancelled-lesson.js
│   │   ├── v1.course-schedule.js
│   │   ├── v1.course.js
│   │   ├── v1.holidays.js
│   │   ├── v1.payment.js
│   │   ├── v1.professor.js
│   │   ├── v1.registered-student.js
│   │   ├── v1.student-grades.js
│   │   ├── v1.student.js
│   │   ├── v1.syllabus.js
│   │   └── v1.user.js
│   └── index.js
├── services/                # Servicios que implementan la lógica de negocio
│   ├── attendance.service.js
│   ├── base.service.js      # Servicio base con funcionalidad común
│   ├── cancelled-lesson.service.js
│   ├── course-grading.service.js
│   ├── course-schedule.service.js
│   ├── course.service.js
│   ├── holidays.service.js
│   ├── index.js
│   ├── payment.service.js
│   ├── professor.service.js
│   ├── registered-student.service.js
│   ├── student-grades.service.js
│   ├── student.service.js
│   ├── syllabus.service.js
│   └── user.service.js
├── startup/                 # Configuración de inicio de la aplicación
│   ├── database.js          # Configuración de la conexión a la base de datos
│   ├── index.js
│   └── server.js            # Configuración del servidor Express
├── uploads/                 # Directorio para almacenar archivos subidos
└── utils/                   # Utilidades y funciones auxiliares
    ├── app-error.js         # Manejo de errores personalizado
    ├── app-response.js      # Formato de respuesta estandarizado
    ├── auth.js              # Utilidades de autenticación
    ├── catch-controller-async.js
    ├── catch-service-async.js
    ├── constants.js
    ├── email.utils.js       # Utilidades para envío de correos
    ├── handleHttpResponse.js
    ├── handlePagination.js  # Utilidades para paginación
    ├── handlePatterns.js
    ├── handleValidator.js
    ├── upload.js            # Utilidades para carga de archivos
    └── utils.js             # Funciones de utilidad general
```

## Flujo de la Aplicación

1. Las solicitudes HTTP llegan a las rutas definidas en el directorio `routes`.
2. Las rutas dirigen las solicitudes a los controladores correspondientes en el directorio `controllers`.
3. Los controladores utilizan los servicios del directorio `services` para implementar la lógica de negocio.
4. Los servicios interactúan con los modelos del directorio `models` para acceder a la base de datos.
5. Los modelos representan las entidades de la base de datos y definen las relaciones entre ellas.

## Configuración y Despliegue

Para configurar y desplegar la aplicación, sigue estos pasos:

1. Clona el repositorio.
2. Instala las dependencias con `npm install`.
3. Configura las variables de entorno en un archivo `.env` siguiendo el ejemplo proporcionado.
4. Ejecuta las migraciones de la base de datos (si es necesario).
5. Inicia la aplicación con `npm start` o `npm run dev` para el modo de desarrollo.

La aplicación estará disponible en el puerto especificado en las variables de entorno o en el puerto 3000 por defecto.

## Colección de Postman

El proyecto incluye el archivo `Brighton School.postman_collection.json`, una colección de Postman que contiene todas las solicitudes HTTP predefinidas para probar la API del sistema. Esta colección está organizada por entidades (Usuario, Estudiante, Profesor, Curso, etc.) y proporciona ejemplos de solicitudes para cada endpoint disponible.

Para utilizar esta colección:

1. Descarga e instala [Postman](https://www.postman.com/downloads/) si aún no lo tienes.
2. Importa el archivo `Brighton School.postman_collection.json` en Postman:
   - Abre Postman y haz clic en "Import".
   - Arrastra el archivo o navega hasta su ubicación para seleccionarlo.
   - Confirma la importación.
3. Configura la variable de entorno `localhost` en Postman para que apunte a la URL base de tu servidor (por ejemplo, `http://localhost:3000`).
4. Ahora puedes ejecutar cualquiera de las solicitudes predefinidas para probar los diferentes endpoints de la API.

La colección incluye ejemplos para operaciones CRUD en todas las entidades del sistema, así como para procesos específicos como autenticación, gestión de asistencias, calificaciones, y más.
