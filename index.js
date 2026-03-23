let db;

async function cargarBaseDeDatos() {
    // 1. Iniciamos el motor SQL
    const SQL = await initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    });

    // 2. Traemos tu archivo almacen.db desde GitHub
    const dataPromise = await fetch("almacen.db");
    const buffer = await dataPromise.arrayBuffer();

    // 3. Abrimos la base de datos
    db = new SQL.Database(new Uint8Array(buffer));
    console.log("¡Conectado a almacen.db con éxito!");
    
    dibujarTabla();
}

function dibujarTabla() {
    const tabla = document.getElementById("tablaRegistros");
    if (!tabla || !db) return;

    // Hacemos la consulta SQL a tu tabla
    const consulta = db.exec("SELECT tipo, modelo, numero_serie FROM Inventario_Equipos");
    
    if (consulta.length > 0) {
        const filas = consulta[0].values;
        tabla.innerHTML = ""; // Limpiamos la tabla

        filas.forEach(dato => {
            tabla.innerHTML += `
                <tr>
                    <td>${dato[0]}</td>
                    <td>${dato[1]}</td>
                    <td>${dato[2] || '---'}</td>
                </tr>`;
        });
    }
}

// Iniciar todo
cargarBaseDeDatos();
