let inventario = [];

// Cargar los datos del archivo JSON
async function cargarDatos() {
    try {
        const respuesta = await fetch("almacen.json");
        if (!respuesta.ok) throw new Error("No se pudo cargar almacen.json");
        
        inventario = await respuesta.json();
        console.log("Datos cargados:", inventario);
        mostrarEnTabla();
    } catch (error) {
        console.error("Error:", error);
    }
}

// Dibujar la tabla en Registros.html
function mostrarEnTabla() {
    const tabla = document.getElementById("tablaRegistros");
    if (!tabla) return; // Si no estamos en la página de registros, salimos

    tabla.innerHTML = ""; // Limpiar tabla

    inventario.forEach(reg => {
        let fila = `
            <tr>
                <td>${reg.tipo || '-'}</td>
                <td>${reg.marca || '-'}</td>
                <td>${reg.modelo || '-'}</td>
                <td>${reg.serie || 'S/N'}</td>
            </tr>`;
        tabla.innerHTML += fila;
    });
}

// Configurar el formulario (solo si estamos en index.html)
const formulario = document.getElementById("formulario");
if (formulario) {
    formulario.addEventListener("submit", function(e) {
        e.preventDefault();
        
        const nuevo = {
            tipo: document.getElementById("tipo").value,
            marca: document.getElementById("marca").value,
            modelo: document.getElementById("modelo").value,
            serie: document.getElementById("serie").value
        };

        alert("Registro enviado (recuerda que para que sea permanente debes editar almacen.json en GitHub)");
        this.reset();
    });
}

// Función para el botón de borrar (solo borra la vista visual)
function borrarRegistros() {
    if (confirm("¿Seguro que quieres limpiar la vista? Los datos del archivo JSON no se borrarán.")) {
        const tabla = document.getElementById("tablaRegistros");
        if (tabla) tabla.innerHTML = "";
    }
}

// Iniciar carga
cargarDatos();
