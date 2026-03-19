        document.getElementById("formulario").addEventListener("submit", function(e) {
            e.preventDefault();

                const tipo = document.getElementById("tipo").value;
                        const marca = document.getElementById("marca").value;
                const modelo = document.getElementById("modelo").value;
                const serie = document.getElementById("serie").value;

                const nuevoRegistro = { tipo, marca, modelo, serie };

                let registros = JSON.parse(localStorage.getItem("registros")) || [];
                registros.push(nuevoRegistro);

                localStorage.setItem("registros", JSON.stringify(registros));

        alert("Registro guardado");

    this.reset();
});

function cargarRegistros() {
            let registros = JSON.parse(localStorage.getItem("registros")) || [];
            const tabla = document.getElementById("tablaRegistros");

            tabla.innerHTML = "";

            registros.forEach(reg => {
                let fila = `
                      <tr>
                     <td>${reg.tipo}</td>
                    <td>${reg.marca}</td>
                       <td>${reg.modelo}</td>
                    <td>${reg.serie}</td>
                </tr>
             `;
             tabla.innerHTML += fila;
         });
    }

    function borrarRegistros() {
        if (confirm("¿Seguro que quieres borrar todos los registros?")) {
            localStorage.removeItem("registros");
            cargarRegistros();
         }
        }

    cargarRegistros();