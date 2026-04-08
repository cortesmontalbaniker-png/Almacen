# Sistema de Gestión de Almacén

Una aplicación web completa para la gestión de inventario de equipos informáticos, con un frontend interactivo y un backend robusto.

## Arquitectura

Esta aplicación sigue una arquitectura Cliente-Servidor:

-   **Frontend:** Una Single Page Application (SPA) construida con HTML, CSS y JavaScript puro. Se encarga de toda la interfaz de usuario y la interacción.
-   **Backend:** Un servidor API REST construido con Node.js y Express. Se encarga de la lógica de negocio, la autenticación de usuarios y la persistencia de datos.
-   **Base de Datos:** Actualmente, los datos se almacenan en archivos JSON (`/db` folder) para simplicidad, simulando una base de datos NoSQL.

## Requisitos

-   Node.js (versión 16 o superior)

## Instalación y Puesta en Marcha

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/cortesmontalbaniker-png/Almacen.git
    cd Almacen
    ```

2.  **Instalar dependencias del servidor:**
    ```bash
    npm install
    ```

3.  **Iniciar el servidor:**
    ```bash
    npm start
    ```

4.  **Acceder a la aplicación:**
    Abre tu navegador y ve a `http://localhost:3000`.

    El servidor se iniciará y podrás acceder a la aplicación. Cualquier persona en tu misma red podrá acceder usando la dirección IP de tu máquina (ej. `http://192.168.1.10:3000`).

## Credenciales por Defecto

-   **Administrador:**
    -   Usuario: `admin`
    -   Contraseña: `admin123`
-   **Técnico:**
    -   Usuario: `tecnico1`
    -   Contraseña: `1234`
