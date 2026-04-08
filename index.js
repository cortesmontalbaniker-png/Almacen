// =====================================================================
// 🚀 ARQUITECTURA DE PRODUCCIÓN (CLIENTE - SERVIDOR) - CONEXIÓN AL BACKEND
// =====================================================================

const API_BASE_URL = '/api'; // La API se sirve desde el mismo dominio

const handleResponse = async (response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error de red o respuesta no JSON' }));
        mostrarAlertaCustom(`Error del servidor: ${error.message}`, 'error');
        throw new Error(error.message);
    }
    return response.json();
};

const getAuthHeaders = () => {
    const token = sessionStorage.getItem("jwt_token");
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

const API_SERVER = {
    login: async function(usuario, password) {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: usuario, pass: password })
        });
        // No usamos handleResponse aquí porque necesitamos manejar el error 401 específicamente
        return response.json();
    },

    crearTecnico: async function(datosTecnico) {
        const response = await fetch(`${API_BASE_URL}/tecnicos`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(datosTecnico)
        });
        return handleResponse(response);
    },

    getTecnicos: async function() {
        const response = await fetch(`${API_BASE_URL}/tecnicos`, { headers: getAuthHeaders() });
        return handleResponse(response);
    },

    getEquipos: async function() {
        const response = await fetch(`${API_BASE_URL}/equipos`, { headers: getAuthHeaders() });
        return handleResponse(response);
    },

    guardarEquipo: async function(equipo) {
        const isUpdate = !!equipo.id_interno;
        const url = isUpdate ? `${API_BASE_URL}/equipos/${equipo.id_interno}` : `${API_BASE_URL}/equipos`;
        const method = isUpdate ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify(equipo)
        });
        return handleResponse(response);
    },

    borrarEquipos: async function(idsArray) {
        const response = await fetch(`${API_BASE_URL}/equipos/delete-many`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ ids: idsArray })
        });
        return handleResponse(response);
    },

    guardarEvento: async function(evento) {
        const response = await fetch(`${API_BASE_URL}/historial`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(evento)
        });
        return handleResponse(response);
    },
    
    getHistorial: async function() {
        const response = await fetch(`${API_BASE_URL}/historial`, { headers: getAuthHeaders() });
        return handleResponse(response);
    }
};

// =====================================================================
// FUNCIONES GLOBALES (Modales, Navegación y Eventos)
// =====================================================================

// El bloque de usuarios por defecto se ha eliminado. Ahora los gestiona el servidor.

function cerrarSesion() {
    sessionStorage.removeItem("usuarioLogueado");
    sessionStorage.removeItem("jwt_token");
    location.reload();
}

function abrirModalTecnico() { document.getElementById("modal-tecnico").style.display = "flex"; }
function cerrarModalTecnico() { document.getElementById("modal-tecnico").style.display = "none"; document.getElementById("form-nuevo-tecnico").reset(); }

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

    icon.innerHTML = config.iconHTML || "ℹ️"; icon.className = config.iconClass || ""; 
    title.textContent = config.title || ""; message.textContent = config.message || "";
    actions.innerHTML = ""; 

    if (inputContainer) {
        if (config.tipo === 'prompt') { inputContainer.style.display = "block"; inputContainer.value = ""; } 
        else { inputContainer.style.display = "none"; }
    }

    if (config.tipo === 'alerta') {
        const btnOk = document.createElement("button"); btnOk.className = "btn-primario"; btnOk.textContent = "Aceptar";
        btnOk.onclick = () => { cerrarDialogoCustom(); if(config.onAccept) config.onAccept(); };
        actions.appendChild(btnOk);
    } else if (config.tipo === 'confirmacion' || config.tipo === 'prompt') {
        const btnCancel = document.createElement("button"); btnCancel.className = "btn-secundario"; btnCancel.textContent = config.textCancel || "Cancelar";
        btnCancel.onclick = () => { cerrarDialogoCustom(); if(config.onCancel) config.onCancel(); };
        actions.appendChild(btnCancel);

        const btnAccept = document.createElement("button"); btnAccept.className = config.isDanger ? "btn-peligro" : "btn-primario";
        btnAccept.textContent = config.textAccept || "Confirmar";
        btnAccept.onclick = () => { 
            cerrarDialogoCustom(); 
            if(config.onAccept) { config.tipo === 'prompt' ? config.onAccept(inputContainer ? inputContainer.value : "") : config.onAccept(); }
        };
        actions.appendChild(btnAccept);
    }
    modal.style.display = "flex";
    if (config.tipo === 'prompt' && inputContainer) setTimeout(() => inputContainer.focus(), 50);
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

async function cargarListaTecnicosAdmin(nombreAdmin) {
    const selectTecnico = document.getElementById("tecnico");
    if (!selectTecnico) return;
    
    const todosLosTecnicos = await API_SERVER.getTecnicos();
    let otrosNombres = todosLosTecnicos.filter(n => n !== nombreAdmin);
    
    selectTecnico.innerHTML = `<option value="${nombreAdmin}">${nombreAdmin} (Tú)</option><option value="">-- Sin asignar --</option>`;
    otrosNombres.forEach(nombre => selectTecnico.innerHTML += `<option value="${nombre}">${nombre}</option>`);
}

async function verificarSeguridad() {
    const token = sessionStorage.getItem("jwt_token");
    const usuarioActualJSON = sessionStorage.getItem("usuarioLogueado");
    
    if (!token || !usuarioActualJSON) {
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
                await cargarListaTecnicosAdmin(usuario.nombreFormateado);
            }
        }
        return true;
    }
}

async function arrancarApp() {
    await inicializarDesplegablesInteligentes();
    await mostrarTodoTabla();
    await actualizarDashboard();
    
    if(document.querySelector('.tablero-kanban')) {
        await renderizarKanban();
        inicializarDragAndDrop();
    }
    await renderizarHistorial('hoy');

    const seriePendiente = sessionStorage.getItem('ver_detalle_serie');
    if(seriePendiente && document.getElementById("filtro_serie")) {
        document.getElementById("filtro_serie").value = seriePendiente;
        filtrarTabla();
        sessionStorage.removeItem('ver_detalle_serie'); 
    }
}

async function actualizarDashboard() {
    const dTotal = document.getElementById("dash-total");
    const dFormatear = document.getElementById("dash-formatear");
    const dDisp = document.getElementById("dash-disp");
    const dRep = document.getElementById("dash-rep");
    const dRoto = document.getElementById("dash-roto");
    
    if(!dTotal) return;

    const baseDeDatos = await API_SERVER.getEquipos();
    
    dTotal.textContent = baseDeDatos.length;
    if(dFormatear) dFormatear.textContent = baseDeDatos.filter(t => t.estado_f === "Para Formatear").length;
    if(dDisp) dDisp.textContent = baseDeDatos.filter(t => t.estado_f === "Disponible").length;
    if(dRep) dRep.textContent = baseDeDatos.filter(t => t.estado_f === "En Reparación").length;
    if(dRoto) dRoto.textContent = baseDeDatos.filter(t => t.estado_f === "Roto").length;
}

async function inicializarDesplegablesInteligentes() {
    let categorias = new Set(["Portátil", "Monitor", "Cascos", "PC"]);
    let marcas = new Set(["HP", "Dell", "Lenovo"]);
    let modelos = new Set();
    let asignados = new Set();
    
    const baseDeDatos = await API_SERVER.getEquipos();
    
    baseDeDatos.forEach(reg => {
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
    
    if (document.getElementById("edit_tipo")) {
        configurarDesplegableDinámico("edit_tipo", "lista_categorias", Array.from(categorias));
        configurarDesplegableDinámico("edit_marca", "lista_marcas", Array.from(marcas));
        configurarDesplegableDinámico("edit_modelo", "lista_modelos", Array.from(modelos));
        
        const selTec = document.getElementById("edit_tecnico");
        const tecnicos = await API_SERVER.getTecnicos();
        selTec.innerHTML = '<option value="">-- Sin asignar --</option>';
        tecnicos.forEach(t => selTec.innerHTML += `<option value="${t}">${t}</option>`);
    }

    if (document.getElementById("filtro_categoria")) {
        llenarFiltroNormal("filtro_categoria", Array.from(categorias));
        llenarFiltroNormal("filtro_marca", Array.from(marcas));
        llenarFiltroNormal("filtro_modelo", Array.from(modelos));
    }
}

function configurarDatalist(idDatalist, storageKey, datosExtraidos) {
    const datalist = document.getElementById(idDatalist);
    if (!datalist) return;
    let opcionesFinales = [...new Set([...datosExtraidos])];
    datalist.innerHTML = "";
    opcionesFinales.forEach(opt => { if (opt.trim() !== "") datalist.innerHTML += `<option value="${opt}">`; });
}

function llenarFiltroNormal(idSelect, opciones) {
    const select = document.getElementById(idSelect);
    if (!select) return;
    select.innerHTML = `<option value="">-- Todas --</option>`;
    opciones.forEach(opt => { select.innerHTML += `<option value="${opt}">${opt}</option>`; });
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
            mostrarPromptCustom("Introduce el nuevo valor para guardarlo en el sistema:", (nuevoValor) => {
                if (nuevoValor && nuevoValor.trim() !== "") {
                    const valorLimpio = nuevoValor.trim();
                    if (!opcionesFinales.includes(valorLimpio)) {
                        opcionesFinales.push(valorLimpio);
                        localStorage.setItem(storageKey, JSON.stringify(opcionesFinales));
                        renderizar();
                    }
                    select.value = valorLimpio;
                    valorAnterior = valorLimpio;
                } else { select.value = valorAnterior; }
            }, () => { select.value = valorAnterior; }, "Añadir Opción");
        } else { valorAnterior = this.value; }
    });
}

async function registrarEvento(id_equipo, accion, estado, tipo_color) {
    const usuarioActual = JSON.parse(sessionStorage.getItem("usuarioLogueado"));
    const nuevoEvento = {
        fecha: new Date().toISOString(),
        usuario: usuarioActual ? usuarioActual.nombreFormateado : "Sistema",
        equipo: id_equipo, accion: accion, estado: estado, color: tipo_color
    };
    await API_SERVER.guardarEvento(nuevoEvento);
    renderizarHistorial('hoy'); 
}

async function renderizarHistorial(filtro) {
    const feed = document.getElementById("timeline-feed");
    if(!feed) return;
    feed.innerHTML = "";
    
    const historial = await API_SERVER.getHistorial();
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
        feed.innerHTML = `<p style="color:#8b949e; font-size:12px; text-align:center; padding:20px;">No hay actividad en el servidor.</p>`;
        return;
    }

    filtrados.forEach(evento => {
        const d = new Date(evento.fecha);
        const fechaFormato = `${d.getDate()}/${d.getMonth()+1} - ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
        
        let claseColor = "dot-creado";
        if(evento.color === "Disponible") claseColor = "dot-disponible";
        else if(evento.color === "En Reparación") claseColor = "dot-reparacion";
        else if(evento.color === "Roto" || evento.color === "Borrado") claseColor = "dot-roto";
        else if(evento.color === "Asignado") claseColor = "dot-asignado";
        else if(evento.color === "Para Formatear") claseColor = "dot-formatear";

        feed.innerHTML += `
            <div class="timeline-item">
                <div class="timeline-dot ${claseColor}"></div>
                <div class="timeline-content">
                    <div class="tl-header">
                        <span class="tl-fecha">${fechaFormato}</span>
                        <span class="tl-usuario">👤 ${evento.usuario.split(',')[0]}</span>
                    </div>
                    <p class="tl-texto">Equipo <span class="tl-equipo">#${evento.equipo}</span> ${evento.accion} <strong>${evento.estado}</strong></p>
                </div>
            </div>`;
    });
}

function filtrarHistorial(tipo, btnClicado) {
    document.querySelectorAll('.btn-pill').forEach(b => b.classList.remove('activa'));
    btnClicado.classList.add('activa');
    renderizarHistorial(tipo);
}

let idEdicionActual = null;

async function mostrarDetalles(id_interno) {
    const baseDeDatos = await API_SERVER.getEquipos();
    const item = baseDeDatos.find(i => i.id_interno === id_interno);
    if (!item) return;

    idEdicionActual = id_interno;

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

    spanEstado.style.background = colorFondo; spanEstado.style.color = colorTexto; spanEstado.style.border = `1px solid ${colorBorde}`;

    const usuarioLogueado = JSON.parse(sessionStorage.getItem("usuarioLogueado"));
    const btnEditar = document.getElementById("btn-abrir-editar");

    if (btnEditar) {
        if (usuarioLogueado && usuarioLogueado.rol !== "admin" && item.tecnico !== usuarioLogueado.nombreFormateado) {
            btnEditar.style.display = "none"; 
        } else {
            btnEditar.style.display = "block"; 
        }
    }
    document.getElementById("modal-detalles").style.display = "flex";
}

function cerrarModalDetalles() { document.getElementById("modal-detalles").style.display = "none"; }

async function abrirModalEditar() {
    cerrarModalDetalles();
    const baseDeDatos = await API_SERVER.getEquipos();
    const item = baseDeDatos.find(i => i.id_interno === idEdicionActual);
    if (!item) return;

    document.getElementById("edit_id").value = item.id_interno;
    document.getElementById("edit_tipo").value = item.tipo;
    document.getElementById("edit_marca").value = item.marca;
    document.getElementById("edit_modelo").value = item.modelo;
    document.getElementById("edit_serie").value = item.serie;
    document.getElementById("edit_tecnico").value = item.tecnico;
    document.getElementById("edit_estado_fisico").value = item.estado_f;
    document.getElementById("edit_estado_logico").value = item.estado_l;
    document.getElementById("edit_asignado").value = item.asignado || "";

    document.getElementById("modal-editar").style.display = "flex";
}

function inicializarDragAndDrop() {
    const zonasDrop = document.querySelectorAll('.zona-drop');
    zonasDrop.forEach(zona => {
        zona.addEventListener('dragover', e => { e.preventDefault(); zona.classList.add('drag-over'); });
        zona.addEventListener('dragleave', () => zona.classList.remove('drag-over'));
        zona.addEventListener('drop', async e => {
            e.preventDefault();
            zona.classList.remove('drag-over');
            
            const idItemStr = parseInt(e.dataTransfer.getData('text/plain'));
            const nuevoEstado = zona.closest('.columna').getAttribute("data-estado"); 

            const baseDeDatos = await API_SERVER.getEquipos();
            const itemIndex = baseDeDatos.findIndex(i => i.id_interno === idItemStr);
            
            if(itemIndex > -1 && baseDeDatos[itemIndex].estado_f !== nuevoEstado) {
                const equipo = baseDeDatos[itemIndex];
                const viejoEstado = equipo.estado_f;
                
                const usuarioLogueado = JSON.parse(sessionStorage.getItem("usuarioLogueado"));

                if (usuarioLogueado && usuarioLogueado.rol !== "admin" && equipo.tecnico !== usuarioLogueado.nombreFormateado) {
                    mostrarAlertaCustom("❌ Denegado por el servidor: No puedes mover equipos de otros.", "error");
                    renderizarKanban(); 
                    return;
                }

                if (nuevoEstado === "Asignado") {
                    mostrarPromptCustom("¿A quién se asigna este dispositivo?", (nombre) => {
                        if (nombre && nombre.trim() !== "") {
                            mostrarConfirmacionCustom(`¿Asignar a ${nombre.trim()}?`, async () => {
                                equipo.estado_f = nuevoEstado;
                                equipo.asignado = nombre.trim();
                                await API_SERVER.guardarEquipo(equipo);
                                await registrarEvento(equipo.id_interno, "asignado a", nombre.trim(), nuevoEstado);
                                arrancarApp(); 
                            }, () => { arrancarApp(); });
                        } else {
                            mostrarAlertaCustom("❌ Faltan datos obligatorios.", "error");
                            arrancarApp(); 
                        }
                    }, () => { arrancarApp(); }, "Sincronizar Asignación");
                    
                } else {
                    mostrarConfirmacionCustom(`¿Trasladar a ${nuevoEstado}?`, async () => {
                        equipo.estado_f = nuevoEstado;
                        equipo.asignado = "";
                        await API_SERVER.guardarEquipo(equipo);
                        await registrarEvento(equipo.id_interno, "trasladado a", nuevoEstado, nuevoEstado);
                        arrancarApp(); 
                    }, () => { arrancarApp(); });
                }
            }
        });
    });
}

async function renderizarKanban() {
    document.querySelectorAll('.zona-drop').forEach(zona => zona.innerHTML = '');
    const baseDeDatos = await API_SERVER.getEquipos();
    const iconos = { "PC": "🖥️", "Portátil": "💻", "Cascos": "🎧", "Monitor": "📺" };
    
    baseDeDatos.forEach(item => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta';
        tarjeta.draggable = true;
        tarjeta.id = "tarjeta-" + item.id_interno;
        tarjeta.title = "Ver detalles desde base de datos";
        
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

        tarjeta.addEventListener('click', () => {
            if (!isDragging) mostrarDetalles(item.id_interno);
        });

        const columnaDestino = document.querySelector(`.columna[data-estado="${item.estado_f}"]`);
        if(columnaDestino) {
            const zona = columnaDestino.querySelector('.zona-drop');
            if(zona) zona.appendChild(tarjeta);
        }
    });
}

async function mostrarTodoTabla() {
    const tabla = document.getElementById("tablaRegistros");
    if (!tabla) return;
    tabla.innerHTML = ""; 
    
    const usuarioLogueado = JSON.parse(sessionStorage.getItem("usuarioLogueado"));
    const iconos = { "PC": "🖥️", "Portátil": "💻", "Cascos": "🎧", "Monitor": "📺" };

    const baseDeDatos = await API_SERVER.getEquipos();

    baseDeDatos.forEach(reg => {
        let badgeClass = "badge-default";
        if (reg.estado_f === "Disponible") badgeClass = "badge-disponible";
        else if (reg.estado_f === "En Reparación") badgeClass = "badge-reparacion";
        else if (reg.estado_f === "Roto") badgeClass = "badge-roto";
        else if (reg.estado_f === "Asignado") badgeClass = "badge-asignado";
        else if (reg.estado_f === "Para Formatear") badgeClass = "badge-formatear";

        let logicoClass = reg.estado_l === "Activo" ? "badge-activo" : "badge-inactivo";
        
        let disableCheck = ""; let tituloCheck = "Seleccionar para borrar";
        
        if (usuarioLogueado && usuarioLogueado.rol !== "admin" && reg.tecnico !== usuarioLogueado.nombreFormateado) {
            disableCheck = "disabled"; tituloCheck = "Bloqueado por el servidor";
        }

        tabla.innerHTML += `
            <tr class="fila-interactiva" onclick="mostrarDetalles(${reg.id_interno})">
                <td style="text-align: center;" onclick="event.stopPropagation()">
                    <input type="checkbox" class="check-borrar" data-id="${reg.id_interno}" ${disableCheck} title="${tituloCheck}">
                </td>
                <td><strong>#${reg.id_interno}</strong></td>
                <td><span style="font-size:16px; margin-right:4px;">${iconos[reg.tipo] || "📦"}</span> ${reg.tipo}</td>
                <td>${reg.marca}</td>
                <td>${reg.modelo}</td>
                <td style="font-family: monospace; color: #a1a1aa;">${reg.serie}</td>
                <td>${reg.tecnico || '<span style="color:#64748b; font-style:italic;">-</span>'}</td>
                <td><span class="badge ${badgeClass}">${reg.estado_f}</span></td>
                <td><span class="badge ${logicoClass}">${reg.estado_l}</span></td>
                <td>${reg.asignado ? `👤 ${reg.asignado}` : '<span style="color:#64748b; font-style:italic;">Sin dueño</span>'}</td>
            </tr>`;
    });
}

// 🔥 FILTRADO SIN BÚSQUEDA GLOBAL
function filtrarTabla() {
    const id = document.getElementById("filtro_id") ? document.getElementById("filtro_id").value.toLowerCase().trim() : "";
    const cat = document.getElementById("filtro_categoria") ? document.getElementById("filtro_categoria").value.toLowerCase() : "";
    const mar = document.getElementById("filtro_marca") ? document.getElementById("filtro_marca").value.toLowerCase() : "";
    const mod = document.getElementById("filtro_modelo") ? document.getElementById("filtro_modelo").value.toLowerCase() : "";
    const serie = document.getElementById("filtro_serie") ? document.getElementById("filtro_serie").value.toLowerCase().trim() : "";
    const tec = document.getElementById("filtro_tecnico") ? document.getElementById("filtro_tecnico").value.toLowerCase() : "";
    const estF = document.getElementById("filtro_estado_f") ? document.getElementById("filtro_estado_f").value.toLowerCase() : "";
    const estL = document.getElementById("filtro_estado_l") ? document.getElementById("filtro_estado_l").value.toLowerCase() : "";
    const asig = document.getElementById("filtro_asignado") ? document.getElementById("filtro_asignado").value.toLowerCase() : "";
    
    const filas = document.querySelectorAll("#tablaRegistros tr");

    filas.forEach(fila => {
        if(fila.cells.length < 10) return;
        
        const c_id = fila.cells[1].innerText.toLowerCase();
        const c_cat = fila.cells[2].innerText.toLowerCase();
        const c_mar = fila.cells[3].innerText.toLowerCase();
        const c_mod = fila.cells[4].innerText.toLowerCase();
        const c_serie = fila.cells[5].innerText.toLowerCase();
        const c_tec = fila.cells[6].innerText.toLowerCase();
        const c_estF = fila.cells[7].innerText.toLowerCase();
        const c_estL = fila.cells[8].innerText.toLowerCase();
        const c_asig = fila.cells[9].innerText.toLowerCase();

        const matchId = id === "" || c_id.includes(id);
        const matchCat = cat === "" || c_cat.includes(cat);
        const matchMar = mar === "" || c_mar.includes(mar);
        const matchMod = mod === "" || c_mod.includes(mod);
        const matchSerie = serie === "" || c_serie.includes(serie);
        const matchTec = tec === "" || c_tec.includes(tec); 
        const matchEstF = estF === "" || c_estF.includes(estF);
        const matchEstL = estL === "" || c_estL.includes(estL);
        const matchAsig = asig === "" || c_asig.includes(asig);

        fila.style.display = (matchId && matchCat && matchMar && matchMod && matchSerie && matchTec && matchEstF && matchEstL && matchAsig) ? "" : "none";
    });
}

function limpiarFiltros() {
    const campos = ["filtro_id", "filtro_categoria", "filtro_marca", "filtro_modelo", "filtro_serie", "filtro_tecnico", "filtro_estado_f", "filtro_estado_l", "filtro_asignado"];
    campos.forEach(c => { if(document.getElementById(c)) document.getElementById(c).value = ""; });
    filtrarTabla(); 
}

function actualizarBotonBorrar() {
    const btn = document.getElementById('btn-borrar-seleccionados');
    if(!btn) return;
    const marcados = document.querySelectorAll('.check-borrar:checked').length;
    if(marcados > 0) {
        btn.innerHTML = `🗑️ Borrar ${marcados} seleccionados`; btn.classList.add('activo');
    } else {
        btn.innerHTML = `🗑️ Borrar seleccionados`; btn.classList.remove('activo');
    }
}

function marcarTodos(origen) {
    document.querySelectorAll('.check-borrar').forEach(cb => {
        if(cb.closest('tr').style.display !== "none" && !cb.disabled) cb.checked = origen.checked;
    });
    actualizarBotonBorrar();
}

function borrarSeleccionados() {
    const checkboxes = document.querySelectorAll('.check-borrar:checked');
    if (checkboxes.length === 0) return; 
    
    mostrarConfirmacionCustom(`¿Estás seguro de solicitar al servidor el borrado de ${checkboxes.length} equipo(s)?`, async () => {
        const ids = Array.from(checkboxes).map(cb => parseInt(cb.getAttribute('data-id')));
        
        const res = await API_SERVER.borrarEquipos(ids);
        
        if(res.success) {
            ids.forEach(id => registrarEvento(id, "fue eliminado del servidor", "Borrado", "Borrado"));
            arrancarApp(); 
            const checkTodos = document.getElementById('seleccionarTodos');
            if(checkTodos) checkTodos.checked = false;
            actualizarBotonBorrar();
            mostrarAlertaCustom("✅ Registros eliminados de la Base de Datos.", "success");
        }
    }, () => {}, "Petición Crítica", "Borrar del servidor", true); 
}

function exportarExcel() {
    let csv = "ID Interno;Tipo;Marca;Modelo;N. Serie;Preparado por;Estado Fisico;Estado Logico;Asignado a\n";
    const filas = document.querySelectorAll("#tablaRegistros tr");
    
    let exportados = 0;
    filas.forEach(fila => {
        if (fila.style.display !== "none") {
            let cols = fila.querySelectorAll("td");
            if (cols.length > 1) { 
                let rowData = [];
                for(let i=1; i<cols.length; i++) {
                    let textLimpio = cols[i].innerText.replace(/(\r\n|\n|\r)/gm, " ").replace(/"/g, '""').trim();
                    rowData.push('"' + textLimpio + '"');
                }
                csv += rowData.join(";") + "\n";
                exportados++;
            }
        }
    });

    if(exportados === 0) { mostrarAlertaCustom("No hay registros para exportar con los filtros actuales.", "warning"); return; }

    const blob = new Blob(["\uFEFF"+csv], { type: 'text/csv;charset=utf-8;' }); 
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Inventario_API_Export_" + new Date().toLocaleDateString().replace(/\//g, '-') + ".csv";
    link.click();
}

// =====================================================================
// 🎯 PROTECCIÓN DE CARGA (EL SEGURO CONTRA FALLOS DE EVENTOS)
// =====================================================================

document.addEventListener("DOMContentLoaded", () => {
    
    const btnUsuario = document.getElementById('btn-usuario');
    const dropdownUsuario = document.getElementById('dropdown-usuario');
    if (btnUsuario && dropdownUsuario) {
        btnUsuario.addEventListener('click', (e) => { e.stopPropagation(); dropdownUsuario.classList.toggle('mostrar'); });
        document.addEventListener('click', (e) => { if (!dropdownUsuario.contains(e.target)) dropdownUsuario.classList.remove('mostrar'); });
    }

    const filtroEstado = document.getElementById("filtro-estado");
    if (filtroEstado) {
        filtroEstado.addEventListener("change", function() {
            const estado = this.value;
            document.querySelectorAll(".tablero-kanban .columna").forEach(col => {
                col.style.display = (estado === "todos" || col.getAttribute("data-estado") === estado) ? "flex" : "none";
            });
        });
    }

    const formLogin = document.getElementById("form-login");
    if (formLogin) {
        formLogin.addEventListener("submit", async function(e) {
            e.preventDefault();
            const u = document.getElementById("login-user").value.trim();
            const p = document.getElementById("login-pass").value.trim();
            
            const btnSubmit = document.getElementById("btn-login-submit") || formLogin.querySelector('button[type="submit"]');
            
            if(btnSubmit) {
                btnSubmit.textContent = "Conectando al servidor...";
                btnSubmit.disabled = true;
            }

            const respuestaServidor = await API_SERVER.login(u, p);
            
            if (respuestaServidor.success) {
                sessionStorage.setItem("jwt_token", respuestaServidor.token);
                sessionStorage.setItem("usuarioLogueado", JSON.stringify(respuestaServidor.user));
                location.reload(); 
            } else {
                mostrarAlertaCustom(respuestaServidor.message || "Credenciales incorrectas.", "error");
                if(btnSubmit) {
                    btnSubmit.textContent = "Entrar al Sistema";
                    btnSubmit.disabled = false;
                }
            }
        });
    }

    const formNuevoTecnico = document.getElementById("form-nuevo-tecnico");
    if (formNuevoTecnico) {
        formNuevoTecnico.addEventListener("submit", async function(e) {
            e.preventDefault();
            const nombre = document.getElementById("nt_nombre").value.trim();
            const ape1 = document.getElementById("nt_ape1").value.trim();
            const ape2 = document.getElementById("nt_ape2").value.trim();
            const user = document.getElementById("nt_user").value.trim();
            const pass = document.getElementById("nt_pass").value.trim();
            
            const formatoOficial = `${ape1} ${ape2}, ${nombre}`;

            const respuesta = await API_SERVER.crearTecnico({ user, pass, nombreFormateado: formatoOficial, rol: "tecnico" });

            if(respuesta.success) {
                mostrarAlertaCustom(`✅ Técnico registrado en la Base de Datos: ${formatoOficial}`, "success");
                cerrarModalTecnico();
                verificarSeguridad(); 
            } else {
                mostrarAlertaCustom("❌ Error: " + respuesta.message, "error");
            }
        });
    }

    const formulario = document.getElementById("formulario");
    if (formulario) {
        formulario.addEventListener("submit", async function(e) {
            e.preventDefault();
            
            const nuevoEquipo = {
                tipo: document.getElementById("tipo").value,
                marca: document.getElementById("marca").value,
                modelo: document.getElementById("modelo").value,
                serie: document.getElementById("serie").value,
                tecnico: document.getElementById("tecnico").value, 
                estado_f: document.getElementById("estado_fisico").value,
                estado_l: document.getElementById("estado_logico").value,
                asignado: document.getElementById("asignado").value.trim()
            };

            const res = await API_SERVER.guardarEquipo(nuevoEquipo);
            
            if (res.success) {
                await registrarEvento(res.id_interno, "registrado en base de datos como", nuevoEquipo.estado_f, nuevoEquipo.estado_f);
                mostrarAlertaCustom(`✅ Servidor: Dispositivo guardado correctamente.`, "success");
                this.reset();
                arrancarApp(); 
                const inputSerie = document.getElementById("serie");
                if(inputSerie) inputSerie.focus();
            }
        });
    }

    const formEditar = document.getElementById("form-editar");
    if (formEditar) {
        formEditar.addEventListener("submit", async function(e) {
            e.preventDefault();
            
            const equipoActualizado = {
                id_interno: parseInt(document.getElementById("edit_id").value),
                tipo: document.getElementById("edit_tipo").value,
                marca: document.getElementById("edit_marca").value,
                modelo: document.getElementById("edit_modelo").value,
                serie: document.getElementById("edit_serie").value,
                tecnico: document.getElementById("edit_tecnico").value,
                estado_f: document.getElementById("edit_estado_fisico").value,
                estado_l: document.getElementById("edit_estado_logico").value,
                asignado: document.getElementById("edit_asignado").value.trim()
            };

            const res = await API_SERVER.guardarEquipo(equipoActualizado);
            if(res.success) {
                await registrarEvento(equipoActualizado.id_interno, "actualizado en el servidor", equipoActualizado.estado_f, equipoActualizado.estado_f);
                document.getElementById("modal-editar").style.display = "none";
                mostrarAlertaCustom(`✅ Sincronización exitosa.`, "success");
                arrancarApp();
            }
        });
    }

    document.addEventListener('change', function(e) {
        if(e.target.classList.contains('check-borrar') || e.target.id === 'seleccionarTodos') {
            actualizarBotonBorrar();
        }
    });

    verificarSeguridad().then(logueado => {
        if(logueado) arrancarApp();
    });
});