// Variable para guardar los datos en la memoria del navegador
let inventario = [];

// FUNCIÓN PARA CONECTAR Y CARGAR EL ARCHIVO JSON
async function cargarDatos() {
    try {
        // Buscamos el archivo en tu repositorio
        const respuesta = await fetch("almacen.json");
        inventario = await respuesta.json();
        
        console.log("Datos cargados correctamente");
        mostrarEnTabla();
    } catch (error) {
        console.error("Error al cargar el archivo json:", error);
    }
}

// FUNCIÓN PARA MOSTRAR LOS DATOS EN TU TABLA XP
function mostrarEnTabla() {
    const tabla = document.getElementById("tablaRegistros");
    if (!tabla) return;

    tabla.innerHTML = ""; // Limpiamos la tabla

    inventario.forEach(reg => {
        let fila = `
            <tr>
                <td>${reg.tipo}</td>
                <td>${reg.modelo}</td>
                <td>${reg.serie || 'S/N'}</td>
            </tr>`;
        tabla.innerHTML += fila;
    });
}

// EVENTO DEL FORMULARIO PARA AGREGAR NUEVOS
document.getElementById("formulario").addEventListener("submit", function(e) {
    e.preventDefault();

    const nuevo = {
        tipo: document.getElementById("tipo").value,
        modelo: document.getElementById("modelo").value,
        serie: document.getElementById("serie").value
    };

    // Lo añadimos a la lista actual
    inventario.push(nuevo);
    alert("Equipo registrado en la sesión actual");
    
    mostrarEnTabla();
    this.reset();
});

// Arrancamos la carga al abrir la página
cargarDatos();
