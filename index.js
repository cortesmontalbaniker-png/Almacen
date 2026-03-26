// --- 0. SISTEMA DE USUARIOS Y AUTENTICACIÓN ---
const usuariosPorDefecto = [
    { user: "admin", pass: "admin123", nombreFormateado: "Administrador del Sistema", rol: "admin" },
    { user: "tecnico1", pass: "1234", nombreFormateado: "Pérez Gómez, Juan", rol: "tecnico" }
];

if (!localStorage.getItem("usuarios_sistema")) {
    localStorage.setItem("usuarios_sistema", JSON.stringify(usuariosPorDefecto));
}

document.addEventListener("DOMContentLoaded", () => {
    const btnUsuario = document.getElementById('btn-usuario');
    const dropdownUsuario = document.getElementById('dropdown-usuario');
    if (btnUsuario && dropdownUsuario) {
        btnUsuario.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownUsuario.classList.toggle('mostrar');
        });
        document.addEventListener('click', (e) => {
            if (!dropdownUsuario.contains(e.target)) dropdownUsuario.classList.remove('mostrar');
        });
    }

    const filtroEstado = document.getElementById("filtro-estado");
    if (filtroEstado) {
        filtroEstado.addEventListener("change", function() {
            const estado = this.value;
            document.querySelectorAll(".tablero-kanban .columna").forEach(col => {
                col.style.display = (estado === "todos" || col.id === estado) ? "flex" : "none";
            });
        });
    }
});

// --- FUNCIONES PARA DIÁLOGOS CUSTOM ---
function cerrarDialogoCustom() {
    const modal = document.getElementById("modal-custom-dialog");
    if(modal) modal.style.display = "none";
}

function mostrarDialogoCustom(config) {
    const modal = document.getElementById("modal-custom-dialog");
    const icon = document.getElementById("dialog-icon");
    const title = document.getElementById("dialog-title");
    const message = document.getElementById("dialog-message");
    const inputContainer = document.getElementById("dialog-input");
    const actions = document.getElementById("dialog-actions");

    if(!modal || !icon || !title || !message || !actions) return;

    icon.innerHTML = config.iconHTML || "ℹ️";
    icon.className = config.iconClass || ""; 
    title.textContent = config.title || "";
    message.textContent = config.message || "";
    actions.innerHTML = ""; 

    if (inputContainer) {
        if (config.tipo === 'prompt') {
            inputContainer.style.display = "block";
            inputContainer.value = ""; 
        } else {
            inputContainer.style.display = "none";
        }
    }

    if (config.tipo === 'alerta') {
        const btnOk = document.createElement("button");
        btnOk.className = "btn-primario";
        btnOk.textContent = "Aceptar";
        btnOk.onclick = () => { cerrarDialogoCustom(); if(config.onAccept) config.onAccept(); };
        actions.appendChild(btnOk);
    } else if (config.tipo === 'confirmacion' || config.tipo === 'prompt') {
        const btnCancel = document.createElement("button");
        btnCancel.className = "btn-secundario";
        btnCancel.textContent = config.textCancel || "Cancelar";
        btnCancel.onclick = () => { cerrarDialogoCustom(); if(config.onCancel) config.onCancel(); };
        actions.appendChild(btnCancel);

        const btnAccept = document.createElement("button");
        btnAccept.className = config.isDanger ? "btn-peligro" : "btn-primario";
        btnAccept.textContent = config.textAccept || "Confirmar";
        btnAccept.onclick = () => { 
            cerrarDialogoCustom(); 
            if(config.onAccept) {
                if(config.tipo === 'prompt') {
                    config.onAccept(inputContainer ? inputContainer.value : "");
                } else {
                    config.onAccept(); 
                }
            }
        };
        actions.appendChild(btnAccept);
    }

    modal.style.display = "flex";
    if (config.tipo === 'prompt' && inputContainer) {
        setTimeout(() => inputContainer.focus(), 50);
    }
}

function mostrarAlertaCustom(mensaje, tipo, titulo) {
    const config = { tipo: 'alerta', message: mensaje };
    if(tipo === 'success') { config.title = titulo || "¡Éxito!"; config.iconHTML = "✅"; config.iconClass = "icon-success"; }
    else if(tipo === 'error') { config.title = titulo || "Error"; config.iconHTML = "❌"; config.iconClass = "icon-error"; }
    else { config.title = titulo || "Aviso"; config.iconHTML = "⚠️"; config.iconClass = "icon-warning"; }
    mostrarDialogoCustom(config);
}

function mostrarConfirmacionCustom(mensaje, onAccept, onCancel, titulo, textAccept, isDanger) {
    mostrarDialogoCustom({
        tipo: 'confirmacion', title: titulo || "¿Estás seguro?", message: mensaje,
        iconHTML: isDanger ? "⚠️" : "❓", iconClass: isDanger ? "icon-warning" : "icon-question",
        textAccept: textAccept, isDanger: isDanger, onAccept: onAccept, onCancel: onCancel
    });
}

function mostrarPromptCustom(mensaje, onAccept, onCancel, titulo) {
    mostrarDialogoCustom({
        tipo: 'prompt', title: titulo || "Introducir Datos", message: mensaje,
        iconHTML: "✍️", iconClass: "icon-question",
        onAccept: onAccept, onCancel: onCancel
    });
}

// --- LOGIN Y SEGURIDAD ---
const formLogin = document.getElementById("form-login");
if (formLogin) {
    formLogin.addEventListener("submit", function(e) {
        e.preventDefault();
        const u = document.getElementById("login-user").value.trim();
        const p = document.getElementById("login-pass").value.trim();
        const usuariosDB = JSON.parse(localStorage.getItem("usuarios_sistema"));

        const encontrado = usuariosDB.find(user => user.user === u && user.pass === p);
        if (encontrado) {
            sessionStorage.setItem("usuarioLogueado", JSON.stringify(encontrado));
            location.reload(); 
        } else {
            mostrarAlertaCustom("❌ Usuario o contraseña incorrectos.", "error");
        }
    });
}

function cerrarSesion() {
    sessionStorage.removeItem("usuarioLogueado");
    location.reload();
}

function cargarListaTecnicosAdmin(nombreAdmin) {
    const selectTecnico = document.getElementById("tecnico");
    if (!selectTecnico) return;
    
    let usuariosDB = JSON.parse(localStorage.getItem("usuarios_sistema")) || [];
    let otrosNombres = usuariosDB.map(u => u.nombreFormateado).filter(n => n !== nombreAdmin);
    
    selectTecnico.innerHTML = `<option value="${nombreAdmin}">${nombreAdmin} (Tú)</option><option value="">-- Sin asignar --</option>`;
    
    otrosNombres.forEach(nombre => {
        selectTecnico.innerHTML += `<option value="${nombre}">${nombre}</option>`;
    });
}

function verificarSeguridad() {
    const usuarioActualJSON = sessionStorage.getItem("usuarioLogueado");
    if (!usuarioActualJSON) {
        document.getElementById("pantalla-login").style.display = "flex";
        return false;
    } else {
        document.getElementById("pantalla-login").style.display = "none";
        const usuario = JSON.parse(usuarioActualJSON);
        
        const infoTop = document.getElementById("nombre-usuario-display");
        if(infoTop) infoTop.textContent = usuario.nombreFormateado;

        const inputTecnico = document.getElementById("tecnico");
        const btnNuevoTecnico = document.getElementById("btn-añadir-tecnico");

        if (inputTecnico) {
            if (usuario.rol === "tecnico") {
                inputTecnico.innerHTML = `<option value="${usuario.nombreFormateado}">${usuario.nombreFormateado}</option>`;
                inputTecnico.disabled = true;
                inputTecnico.style.opacity = "0.6"; 
                if (btnNuevoTecnico) btnNuevoTecnico.style.display = "none";
            } else if (usuario.rol === "admin") {
                inputTecnico.disabled = false;
                inputTecnico.style.opacity = "1";
                if (btnNuevoTecnico) btnNuevoTecnico.style.display = "inline-block";
                cargarListaTecnicosAdmin(usuario.nombreFormateado);
            }
        }
        return true;
    }
}

const formNuevoTecnico = document.getElementById("form-nuevo-tecnico");
if (formNuevoTecnico) {
    formNuevoTecnico.addEventListener("submit", function(e) {
        e.preventDefault();
        const nombre = document.getElementById("nt_nombre").value.trim();
        const ape1 = document.getElementById("nt_ape1").value.trim();
        const ape2 = document.getElementById("nt_ape2").value.trim();
        const user = document.getElementById("nt_user").value.trim();
        const pass = document.getElementById("nt_pass").value.trim();
        const formatoOficial = `${ape1} ${ape2}, ${nombre}`;

        let usuariosDB = JSON.parse(localStorage.getItem("usuarios_sistema"));
        if (usuariosDB.find(u => u.user === user)) {
            mostrarAlertaCustom("⚠️ Este nombre de usuario ya existe.", "warning"); return;
        }

        usuariosDB.push({ user, pass, nombreFormateado: formatoOficial, rol: "tecnico" });
        localStorage.setItem("usuarios_sistema", JSON.stringify(usuariosDB));

        mostrarAlertaCustom(`✅ Técnico añadido: ${formatoOficial}`, "success");
        cerrarModalTecnico();
        verificarSeguridad();
    });
}

function abrirModalTecnico() { document.getElementById("modal-tecnico").style.display = "flex"; }
function cerrarModalTecnico() { document.getElementById("modal-tecnico").style.display = "none"; document.getElementById("form-nuevo-tecnico").reset(); }

// --- 1. BASE DE DATOS Y ARRANQUE ---
let db;
async function conectarDB() {
    if (!verificarSeguridad()) return; 

    try {
        const SQL = await initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}` });
        const respuesta = await fetch("almacen.db");
        const buffer = await respuesta.arrayBuffer();
        db = new SQL.Database(new Uint8Array(buffer));
        arrancarApp();
    } catch (e) {
        console.log("No se pudo cargar .db. Usando memoria local.");
        arrancarApp();
    }
}

function arrancarApp() {
    inicializarDesplegablesInteligentes();
    mostrarTodoTabla();
    if(document.querySelector('.tablero-kanban')) {
        renderizarKanban();
        inicializarDragAndDrop();
    }
    renderizarHistorial('hoy');
}

// --- 2. LISTAS INTELIGENTES ---
function inicializarDesplegablesInteligentes() {
    let categorias = new Set(["Portátil", "Monitor", "Cascos", "PC"]);
    let marcas = new Set(["HP", "Dell", "Lenovo"]);
    let modelos = new Set();
    let asignados = new Set();

    if (db) {
        const res = db.exec("SELECT Nombre_modelo FROM Inventario");
        if (res.length > 0) { res[0].values.forEach(fila => { if(fila[0]) modelos.add(fila[0]); }); }
    }

    let temporales = JSON.parse(localStorage.getItem("mis_registros")) || [];
    temporales.forEach(reg => {
        if(reg.tipo) categorias.add(reg.tipo);
        if(reg.marca) marcas.add(reg.marca);
        if(reg.modelo) modelos.add(reg.modelo);
        if(reg.asignado) asignados.add(reg.asignado);
    });

    if (document.getElementById("tipo")) {
        configurarDesplegableDinámico("tipo", "lista_categorias", Array.from(categorias));
        configurarDesplegableDinámico("marca", "lista_marcas", Array.from(marcas));
        configurarDesplegableDinámico("modelo", "lista_modelos", Array.from(modelos));
        configurarDatalist("lista_asignados_dl", "lista_asignados", Array.from(asignados));
    }

    if (document.getElementById("filtro_categoria")) {
        llenarFiltroNormal("filtro_categoria", Array.from(categorias));
        llenarFiltroNormal("filtro_marca", Array.from(marcas));
        llenarFiltroNormal("filtro_modelo", Array.from(modelos));
        document.getElementById("filtro_texto").addEventListener("input", filtrarTabla);
    }
}

function configurarDatalist(idDatalist, storageKey, datosExtraidos) {
    const datalist = document.getElementById(idDatalist);
    if (!datalist) return;
    let opcionesGuardadas = JSON.parse(localStorage.getItem(storageKey)) || [];
    let opcionesFinales = [...new Set([...datosExtraidos, ...opcionesGuardadas])];
    localStorage.setItem(storageKey, JSON.stringify(opcionesFinales));
    datalist.innerHTML = "";
    opcionesFinales.forEach(opt => { if (opt.trim() !== "") datalist.innerHTML += `<option value="${opt}">`; });
}

function llenarFiltroNormal(idSelect, opciones) {
    const select = document.getElementById(idSelect);
    if (!select) return;
    const storageKey = idSelect.replace("filtro_", "lista_") + "s";
    let opcionesGuardadas = JSON.parse(localStorage.getItem(storageKey)) || [];
    let opcionesFinales = [...new Set([...opciones, ...opcionesGuardadas])];
    select.innerHTML = `<option value="">-- Todas --</option>`;
    opcionesFinales.forEach(opt => { select.innerHTML += `<option value="${opt}">${opt}</option>`; });
    select.addEventListener("change", filtrarTabla);
}

function configurarDesplegableDinámico(idSelect, storageKey, datosExtraidos) {
    const select = document.getElementById(idSelect);
    if (!select) return;
    let opcionesGuardadas = JSON.parse(localStorage.getItem(storageKey)) || [];
    let opcionesFinales = [...new Set([...datosExtraidos, ...opcionesGuardadas])];
    localStorage.setItem(storageKey, JSON.stringify(opcionesFinales));

    function renderizar() {
        select.innerHTML = "";
        if (!select.hasAttribute("required")) select.innerHTML += `<option value="">-- Dejar en blanco --</option>`;
        else select.innerHTML += `<option value="" disabled selected>-- Seleccionar --</option>`;
        opcionesFinales.forEach(opt => { select.innerHTML += `<option value="${opt}">${opt}</option>`; });
        select.innerHTML += `<option value="OTRO_NUEVO" style="font-weight: bold; background: #8b5cf6; color: white;">➕ Añadir otro...</option>`;
    }
    renderizar();
    let valorAnterior = select.value;
    select.addEventListener("change", function() {
        if (this.value === "OTRO_NUEVO") {
            mostrarPromptCustom("Introduce el nuevo valor para añadirlo a la lista:", (nuevoValor) => {
                if (nuevoValor && nuevoValor.trim() !== "") {
                    const valorLimpio = nuevoValor.trim();
                    if (!opcionesFinales.includes(valorLimpio)) {
                        opcionesFinales.push(valorLimpio);
                        localStorage.setItem(storageKey, JSON.stringify(opcionesFinales));
                        renderizar();
                    }
                    select.value = valorLimpio;
                    valorAnterior = valorLimpio;
                } else {
                    select.value = valorAnterior;
                }
            }, () => {
                select.value = valorAnterior;
            }, "Añadir Opción");
        } else { 
            valorAnterior = this.value; 
        }
    });
}

// --- 3. HISTORIAL DE ACTIVIDAD (TIMELINE) ---
function registrarEvento(id_equipo, accion, estado, tipo_color) {
    let historial = JSON.parse(localStorage.getItem("historial_eventos")) || [];
    const usuarioActual = JSON.parse(sessionStorage.getItem("usuarioLogueado"));
    const nombrePersona = usuarioActual ? usuarioActual.nombreFormateado : "Sistema";

    const nuevoEvento = {
        id_evento: Date.now(),
        fecha: new Date().toISOString(),
        usuario: nombrePersona,
        equipo: id_equipo,
        accion: accion,
        estado: estado,
        color: tipo_color
    };

    historial.unshift(nuevoEvento); 
    localStorage.setItem("historial_eventos", JSON.stringify(historial));
    renderizarHistorial('hoy'); 
}

function renderizarHistorial(filtro) {
    const feed = document.getElementById("timeline-feed");
    if(!feed) return;
    
    feed.innerHTML = "";
    let historial = JSON.parse(localStorage.getItem("historial_eventos")) || [];
    const ahora = new Date();

    let filtrados = historial.filter(evento => {
        const fechaObj = new Date(evento.fecha);
        const diasDiferencia = (ahora - fechaObj) / (1000 * 60 * 60 * 24);
        
        if (filtro === 'hoy') return diasDiferencia < 1;
        if (filtro === 'semana') return diasDiferencia <= 7;
        if (filtro === 'mes') return diasDiferencia <= 30;
        return true; 
    });

    if(filtrados.length === 0) {
        feed.innerHTML = `<p style="color:#8b949e; font-size:12px; text-align:center; padding:20px;">No hay actividad en este periodo.</p>`;
        return;
    }

    filtrados.forEach(evento => {
        const d = new Date(evento.fecha);
        const fechaFormato = `${d.getDate()}/${d.getMonth()+1} - ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
        
        let claseColor = "dot-creado";
        if(evento.color === "Disponible") claseColor = "dot-disponible";
        if(evento.color === "En Reparación") claseColor = "dot-reparacion";
        if(evento.color === "Roto" || evento.color === "Borrado") claseColor = "dot-roto";
        if(evento.color === "Asignado") claseColor = "dot-asignado";
        if(evento.color === "Para Formatear") claseColor = "dot-formatear";

        feed.innerHTML += `
            <div class="timeline-item">
                <div class="timeline-dot ${claseColor}"></div>
                <div class="timeline-content">
                    <div class="tl-header">
                        <span class="tl-fecha">${fechaFormato}</span>
                        <span class="tl-usuario">👤 ${evento.usuario.split(',')[0]}</span>
                    </div>
                    <p class="tl-texto">
                        Equipo <span class="tl-equipo">#${evento.equipo}</span> ${evento.accion} <strong>${evento.estado}</strong>
                    </p>
                </div>
            </div>
        `;
    });
}

function filtrarHistorial(tipo, btnClicado) {
    document.querySelectorAll('.btn-pill').forEach(b => b.classList.remove('activa'));
    btnClicado.classList.add('activa');
    renderizarHistorial(tipo);
}

// --- 4. GUARDAR FORMULARIO ---
const formulario = document.getElementById("formulario");
if (formulario) {
    formulario.addEventListener("submit", function(e) {
        e.preventDefault();
        let temporales = JSON.parse(localStorage.getItem("mis_registros")) || [];
        let nuevoIdInterno = temporales.length > 0 ? temporales[temporales.length - 1].id_interno + 1 : 1;

        const estadoFisico = document.getElementById("estado_fisico").value;

        const nuevoEquipo = {
            id_interno: nuevoIdInterno,
            tipo: document.getElementById("tipo").value,
            marca: document.getElementById("marca").value,
            modelo: document.getElementById("modelo").value,
            serie: document.getElementById("serie").value,
            tecnico: document.getElementById("tecnico").value, 
            estado_f: estadoFisico,
            estado_l: document.getElementById("estado_logico").value,
            asignado: document.getElementById("asignado").value.trim()
        };

        temporales.push(nuevoEquipo);
        localStorage.setItem("mis_registros", JSON.stringify(temporales));
        
        registrarEvento(nuevoIdInterno, "registrado por primera vez como", estadoFisico, estadoFisico);

        mostrarAlertaCustom(`✅ Dispositivo registrado. ID Interno: ${nuevoIdInterno}`, "success");
        this.reset();
        
        verificarSeguridad(); 
        arrancarApp(); 
        
        const inputSerie = document.getElementById("serie");
        if(inputSerie) inputSerie.focus();
    });
}

// --- 5. SISTEMA KANBAN Y NAVEGACIÓN (NUEVA VENTANA MODAL) ---
function mostrarDetalles(id_interno) {
    let temporales = JSON.parse(localStorage.getItem("mis_registros")) || [];
    const item = temporales.find(i => i.id_interno === id_interno);
    if (!item) return;

    const iconos = { "PC": "🖥️", "Portátil": "💻", "Cascos": "🎧", "Monitor": "📺" };
    
    document.getElementById("detalle-icono").textContent = iconos[item.tipo] || "📦";
    document.getElementById("detalle-titulo").textContent = `${item.tipo} ${item.marca}`;
    document.getElementById("detalle-modelo").textContent = item.modelo;
    
    document.getElementById("detalle-id").textContent = item.id_interno;
    document.getElementById("detalle-serie").textContent = item.serie;
    document.getElementById("detalle-tecnico").textContent = item.tecnico || "Sin asignar";
    document.getElementById("detalle-asignado").textContent = item.asignado || "Sin dueño";
    document.getElementById("detalle-logico").textContent = item.estado_l;

    const spanEstado = document.getElementById("detalle-estado");
    spanEstado.textContent = item.estado_f;
    
    let colorFondo, colorTexto, colorBorde;
    if (item.estado_f === "Disponible") { colorFondo = "rgba(16, 185, 129, 0.2)"; colorTexto = "#6ee7b7"; colorBorde = "rgba(16, 185, 129, 0.3)"; }
    else if (item.estado_f === "En Reparación") { colorFondo = "rgba(245, 158, 11, 0.2)"; colorTexto = "#fcd34d"; colorBorde = "rgba(245, 158, 11, 0.3)"; }
    else if (item.estado_f === "Roto") { colorFondo = "rgba(239, 68, 68, 0.2)"; colorTexto = "#fca5a5"; colorBorde = "rgba(239, 68, 68, 0.3)"; }
    else if (item.estado_f === "Asignado") { colorFondo = "rgba(168, 85, 247, 0.2)"; colorTexto = "#d8b4fe"; colorBorde = "rgba(168, 85, 247, 0.3)"; }
    else { colorFondo = "rgba(99, 102, 241, 0.2)"; colorTexto = "#a5b4fc"; colorBorde = "rgba(99, 102, 241, 0.3)"; }

    spanEstado.style.background = colorFondo;
    spanEstado.style.color = colorTexto;
    spanEstado.style.border = `1px solid ${colorBorde}`;

    document.getElementById("modal-detalles").style.display = "flex";
}

function cerrarModalDetalles() {
    document.getElementById("modal-detalles").style.display = "none";
}

function inicializarDragAndDrop() {
    const zonasDrop = document.querySelectorAll('.zona-drop');
    zonasDrop.forEach(zona => {
        zona.addEventListener('dragover', e => { e.preventDefault(); zona.classList.add('drag-over'); });
        zona.addEventListener('dragleave', () => zona.classList.remove('drag-over'));
        zona.addEventListener('drop', e => {
            e.preventDefault();
            zona.classList.remove('drag-over');
            
            const idItemStr = e.dataTransfer.getData('text/plain');
            const nuevoEstado = zona.parentElement.id; 

            let temporales = JSON.parse(localStorage.getItem("mis_registros")) || [];
            const itemIndex = temporales.findIndex(i => i.id_interno.toString() === idItemStr);
            
            if(itemIndex > -1 && temporales[itemIndex].estado_f !== nuevoEstado) {
                const viejoEstado = temporales[itemIndex].estado_f;

                if (nuevoEstado === "Asignado") {
                    mostrarPromptCustom("¿A quién se asigna este dispositivo?", (nombre) => {
                        if (nombre && nombre.trim() !== "") {
                            mostrarConfirmacionCustom(`¿Asignar este equipo (#${idItemStr}) a ${nombre.trim()}?`, () => {
                                temporales[itemIndex].estado_f = nuevoEstado;
                                temporales[itemIndex].asignado = nombre.trim();
                                localStorage.setItem("mis_registros", JSON.stringify(temporales));
                                renderizarKanban(); 
                                mostrarTodoTabla(); 
                                registrarEvento(idItemStr, "asignado a", nombre.trim(), nuevoEstado);
                            }, () => { renderizarKanban(); });
                        } else {
                            mostrarAlertaCustom("❌ Debes indicar un nombre para asignarlo.", "error");
                            renderizarKanban(); 
                        }
                    }, () => { 
                        renderizarKanban(); 
                    }, "Asignar Dispositivo");
                    
                } else {
                    mostrarConfirmacionCustom(`¿Mover equipo #${idItemStr} a ${nuevoEstado}?`, () => {
                        temporales[itemIndex].estado_f = nuevoEstado;
                        temporales[itemIndex].asignado = "";
                        localStorage.setItem("mis_registros", JSON.stringify(temporales));
                        renderizarKanban(); 
                        mostrarTodoTabla(); 
                        registrarEvento(idItemStr, "movido de " + viejoEstado + " a", nuevoEstado, nuevoEstado);
                    }, () => { renderizarKanban(); });
                }
            }
        });
    });
}

function renderizarKanban() {
    document.querySelectorAll('.zona-drop').forEach(zona => zona.innerHTML = '');
    let temporales = JSON.parse(localStorage.getItem("mis_registros")) || [];
    const iconos = { "PC": "🖥️", "Portátil": "💻", "Cascos": "🎧", "Monitor": "📺" };
    
    temporales.forEach(item => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta';
        tarjeta.draggable = true;
        tarjeta.id = "tarjeta-" + item.id_interno;
        tarjeta.title = "Haz clic para ver detalles del equipo";
        
        let htmlAsignado = item.asignado ? `<div class="asignado-extra" style="font-size: 11px; margin-top: 6px; color: #a855f7; font-weight: bold;">👤 Asignado a: ${item.asignado}</div>` : '';

        tarjeta.innerHTML = `
            <span class="icono">${iconos[item.tipo] || "📦"}</span>
            <div class="info" style="flex-grow: 1;">
                <strong>${item.tipo} ${item.marca}</strong>
                <small>${item.modelo} | SN: ${item.serie}</small>
                ${htmlAsignado}
            </div>
        `;
        
        let isDragging = false;

        tarjeta.addEventListener('dragstart', (e) => {
            isDragging = true;
            tarjeta.classList.add('dragging');
            e.dataTransfer.setData('text/plain', item.id_interno.toString());
        });
        
        tarjeta.addEventListener('dragend', () => {
            tarjeta.classList.remove('dragging');
            setTimeout(() => { isDragging = false; }, 100);
        });

        // 🔥 Ahora abre el modal en lugar de redirigir
        tarjeta.addEventListener('click', () => {
            if (!isDragging) {
                mostrarDetalles(item.id_interno);
            }
        });

        const columnaDestino = document.getElementById(item.estado_f);
        if(columnaDestino) {
            const zona = columnaDestino.querySelector('.zona-drop');
            if(zona) zona.appendChild(tarjeta);
        }
    });
}

// --- 6. TABLA, FILTROS Y BORRADO INTELIGENTE ---
function mostrarTodoTabla() {
    const tabla = document.getElementById("tablaRegistros");
    if (!tabla) return;
    tabla.innerHTML = ""; 

    if (db) {
        const res = db.exec("SELECT id_inventario, Nombre_modelo, numer_serie FROM Inventario");
        if (res.length > 0) {
            res[0].values.forEach(fila => {
                tabla.innerHTML += `<tr><td style="text-align: center;"><input type="checkbox" disabled title="Base intocable"></td>
                <td>DB-${fila[0]}</td><td>-</td><td>-</td><td>${fila[1]}</td><td>${fila[2] || 'S/N'}</td>
                <td>-</td><td>-</td><td>-</td><td>-</td></tr>`;
            });
        }
    }

    let temporales = JSON.parse(localStorage.getItem("mis_registros")) || [];
    temporales.forEach(reg => {
        tabla.innerHTML += `
            <tr>
                <td style="text-align: center;"><input type="checkbox" class="check-borrar" data-id="${reg.id_interno}"></td>
                <td>${reg.id_interno}</td><td>${reg.tipo}</td><td>${reg.marca}</td><td>${reg.modelo}</td>
                <td>${reg.serie}</td><td>${reg.tecnico || '-'}</td><td>${reg.estado_f}</td><td>${reg.estado_l}</td>
                <td>${reg.asignado || 'Sin dueño'}</td>
            </tr>`;
    });
}

function filtrarTabla() {
    const cat = document.getElementById("filtro_categoria").value.toLowerCase();
    const mar = document.getElementById("filtro_marca").value.toLowerCase();
    const mod = document.getElementById("filtro_modelo").value.toLowerCase();
    const txt = document.getElementById("filtro_texto").value.toLowerCase();
    const filas = document.querySelectorAll("#tablaRegistros tr");

    filas.forEach(fila => {
        const c_id = fila.cells[1].innerText.toLowerCase();
        const c_cat = fila.cells[2].innerText.toLowerCase();
        const c_mar = fila.cells[3].innerText.toLowerCase();
        const c_mod = fila.cells[4].innerText.toLowerCase();
        const c_serie = fila.cells[5].innerText.toLowerCase();

        const matchCat = cat === "" || c_cat === cat;
        const matchMar = mar === "" || c_mar === mar;
        const matchMod = mod === "" || c_mod === mod;
        const matchTxt = txt === "" || c_id.includes(txt) || c_serie.includes(txt);

        fila.style.display = (matchCat && matchMar && matchMod && matchTxt) ? "" : "none";
    });
}

function limpiarFiltros() {
    document.getElementById("filtro_categoria").value = "";
    document.getElementById("filtro_marca").value = "";
    document.getElementById("filtro_modelo").value = "";
    document.getElementById("filtro_texto").value = "";
    filtrarTabla(); 
}

document.addEventListener('change', function(e) {
    if(e.target.classList.contains('check-borrar') || e.target.id === 'seleccionarTodos') {
        actualizarBotonBorrar();
    }
});

function actualizarBotonBorrar() {
    const btn = document.getElementById('btn-borrar-seleccionados');
    if(!btn) return;
    const marcados = document.querySelectorAll('.check-borrar:checked').length;
    if(marcados > 0) {
        btn.innerHTML = `🗑️ Borrar ${marcados} seleccionados`;
        btn.classList.add('activo');
    } else {
        btn.innerHTML = `🗑️ Borrar seleccionados`;
        btn.classList.remove('activo');
    }
}

function marcarTodos(origen) {
    document.querySelectorAll('.check-borrar').forEach(cb => {
        if(cb.closest('tr').style.display !== "none") cb.checked = origen.checked;
    });
    actualizarBotonBorrar();
}

function borrarSeleccionados() {
    const checkboxes = document.querySelectorAll('.check-borrar:checked');
    if (checkboxes.length === 0) return; 
    
    mostrarConfirmacionCustom(`¿Estás seguro de que quieres borrar de forma permanente ${checkboxes.length} equipo(s)?`, () => {
        let temporales = JSON.parse(localStorage.getItem("mis_registros")) || [];
        const ids = Array.from(checkboxes).map(cb => parseInt(cb.getAttribute('data-id')));
        
        ids.forEach(id => {
            registrarEvento(id, "fue eliminado permanentemente", "Borrado", "Borrado");
        });

        temporales = temporales.filter(reg => !ids.includes(reg.id_interno));
        localStorage.setItem("mis_registros", JSON.stringify(temporales));
        
        mostrarTodoTabla();
        filtrarTabla(); 
        renderizarHistorial('hoy');
        
        const checkTodos = document.getElementById('seleccionarTodos');
        if(checkTodos) checkTodos.checked = false;
        actualizarBotonBorrar();
        
        mostrarAlertaCustom("✅ Registros eliminados correctamente.", "success");
    }, () => {
        // Al cancelar no hacemos nada
    }, "¿Borrar registros?", "Borrar permanentemente", true); 
}

conectarDB();