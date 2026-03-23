// Variable para la base de datos
let db;

// 1. FUNCIÓN PARA CONECTAR EL .DB (LECTURA)
async function conectarDB() {
    try {
        // Usamos el motor desde internet para no bajar nada
        const SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });

        const respuesta = await fetch("almacen.db");
        const buffer = await respuesta.arrayBuffer();
        db = new SQL.Database(new Uint8Array(buffer));

        console.log("Almacen.db conectado");
        actualizarTabla();
    } catch (e) {
        console.log("Esperando archivo almacen.db o librería...");
    }
}

// 2. LÓGICA DEL FORMULARIO (MENSAJE DE REGISTRADO)
document.getElementById("formulario").addEventListener("submit", function(e) {
    e.preventDefault();

    // Sacamos los datos de los inputs
    const tipo = document.getElementById("tipo").value;
    const modelo = document.getElementById("modelo").value;
    const serie = document.getElementById("serie").value;

    // Si la DB está cargada, insertamos en la memoria temporal
    if (db) {
        try {
            db.run("INSERT INTO Inventario_Equipos (tipo, modelo, numero_serie) VALUES (?,?,?)", [tipo, modelo, serie]);
            actualizarTabla();
        } catch (err) {
            console.error("Error al insertar en memoria:", err);
        }
    }

    // EL MENSAJE QUE QUERÍAS:
    alert("¡Equipo registrado con éxito!");
    
    this.reset(); // Limpia el formulario
});

// 3. FUNCIÓN PARA MOSTRAR LOS DATOS EN REGISTROS.HTML
function actualizarTabla() {
    const tabla = document.getElementById("tablaRegistros");
    if (!tabla || !db) return;

    const res = db.exec("SELECT tipo, modelo, numero_serie FROM Inventario_Equipos");
    
    if (res.length > 0) {
        tabla.innerHTML = "";
        res[0].values.forEach(fila => {
            tabla.innerHTML += `
                <tr>
                    <td>${fila[0]}</td>
                    <td>-</td> <td>${fila[1]}</td>
                    <td>${fila[2] || 'S/N'}</td>
                </tr>`;
        });
    }
}

// Arrancar conexión
conectarDB();
