let db;

// 1. CONECTAR AL ARCHIVO ALMACEN.BD
async function iniciarBaseDeDatos() {
    try {
        const SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });

        // Cargamos tu archivo específico
        const respuesta = await fetch("ALMACEN.BD"); 
        const buffer = await respuesta.arrayBuffer();

        db = new SQL.Database(new Uint8Array(buffer));
        console.log("Conectado a ALMACEN.BD con éxito");

        // Cargar los datos en la tabla nada más conectar
        cargarRegistros();
    } catch (err) {
        console.error("Error al cargar la BD:", err);
    }
}

// 2. FUNCIÓN PARA LEER Y MOSTRAR LOS EQUIPOS
function cargarRegistros() {
    const tabla = document.getElementById("tablaRegistros");
    if (!tabla || !db) return;

    // Consulta SQL usando TUS nombres de columna
    const resultado = db.exec("SELECT tipo, modelo, numero_serie FROM Inventario_Equipos");
    
    tabla.innerHTML = "";

    if (resultado.length > 0) {
        const filas = resultado[0].values;
        filas.forEach(reg => {
            let fila = `
                <tr>
                    <td>${reg[0]}</td> <td>${reg[1]}</td> <td>${reg[2] || 'S/N'}</td> </tr>`;
            tabla.innerHTML += fila;
        });
    }
}

// 3. GUARDAR NUEVOS (Temporalmente en memoria)
document.getElementById("formulario").addEventListener("submit", function(e) {
    e.preventDefault();

    const tipo = document.getElementById("tipo").value;
    const modelo = document.getElementById("modelo").value;
    const serie = document.getElementById("serie").value;

    if (db) {
        try {
            db.run("INSERT INTO Inventario_Equipos (tipo, modelo, numero_serie) VALUES (?,?,?)", 
                  [tipo, modelo, serie]);
            alert("Registro añadido a la vista actual");
            cargarRegistros();
        } catch (error) {
            alert("Error al insertar: " + error.message);
        }
    }
    this.reset();
});

// Arrancar el proceso
iniciarBaseDeDatos();
