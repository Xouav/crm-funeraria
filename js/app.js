// js/app.js
// Controlador Maestro del Front-End (SPA) - Simulación de Procesos de Negocio en Memoria RAM

document.addEventListener("DOMContentLoaded", function() {
    initApp();
});

// Inicialización de Escuchadores y Enrutamiento Inicial
function initApp() {
    // Escuchar el cambio en el selector rápido de rol de usuario
    document.getElementById('role-selector').addEventListener('change', function(e) {
        const selectedRole = e.target.value;
        if (selectedRole === 'Administrador') {
            localDB.session = { userId: 1, userName: "Ana María Administradora", role: "Administrador" };
            navigate('admin-catalog');
        } else {
            localDB.session = { userId: 2, userName: "Carlos Vendedor Terreno", role: "Vendedor" };
            navigate('vendedor-dashboard');
        }
        updateNavbarSession();
    });

    // Cargar datos por defecto de la sesión en barra superior
    updateNavbarSession();
    // Forzar la carga de la vista inicial por defecto (Dashboard del vendedor)
    navigate('vendedor-dashboard');
}

// Sincroniza los textos de sesión en el layout común
function updateNavbarSession() {
    document.getElementById('session-user-name').innerText = localDB.session.userName;
    document.getElementById('session-user-role').innerText = localDB.session.role;
    document.getElementById('role-selector').value = localDB.session.role;
    renderMenuLinks();
}

// Construye dinámicamente el menú lateral según las restricciones de perfil de usuario
function renderMenuLinks() {
    const menuContainer = document.getElementById('dynamic-menu-links');
    let html = '';

    if (localDB.session.role === 'Administrador') {
        html += `
            <li class="nav-item"><a class="nav-link active" href="#" onclick="navigate('admin-catalog')">Gestión Catálogo</a></li>
            <li class="nav-item"><a class="nav-link" href="#" onclick="navigate('admin-goals')">Metas Corporativas</a></li>
        `;
    } else {
        html += `
            <li class="nav-item"><a class="nav-link active" href="#" onclick="navigate('vendedor-dashboard')">Mi Dashboard</a></li>
            <li class="nav-item"><a class="nav-link" href="#" onclick="navigate('vendedor-thresholds')">Mis Umbrales</a></li>
            <li class="nav-item"><a class="nav-link" href="#" onclick="navigate('vendedor-sales')">Embudo de Ventas</a></li>
        `;
    }
    menuContainer.innerHTML = html;
}

// Simulación del motor de base de datos en memoria RAM local
const localDB = {
    session: { userId: 2, userName: "Carlos Vendedor Terreno", role: "Vendedor" },
    
    catalog: [
        { id: 1, name: "Servicio Funerario Preferencial", category: "Servicio", shortDesc: "Atención integral premium de alta gama.", longDesc: "Incluye urna de madera noble, sala de velación, carroza de lujo y asistencia legal.", price: 1200000, active: true },
        { id: 2, name: "Ánfora de Cobre Envejecido", category: "Producto", shortDesc: "Ánfora artesanal hecha a mano.", longDesc: "Contenedor de cenizas de cobre puro tratado para conservación prolongada.", price: 350000, active: true },
        { id: 3, name: "Parque Memorial Eterno", category: "Servicio", shortDesc: "Lote de sepultación sector preferente.", longDesc: "Capacidad para 4 sepultaciones con mantención perpetua en entorno natural.", price: 2500000, active: true }
    ],

    priceHistory: [
        { catalogId: 1, price: 1200000, date: "2026-05-10" },
        { catalogId: 2, price: 350000, date: "2026-05-11" },
        { catalogId: 3, price: 2500000, date: "2026-05-12" }
    ],

    corporateGoals: {
        1: { name: "Prospectos", dailyTarget: 10, redMax: 40, yellowMax: 79, greenMin: 80 },
        2: { name: "Agendados", dailyTarget: 5, redMax: 40, yellowMax: 79, greenMin: 80 },
        3: { name: "Citas OK", dailyTarget: 3, redMax: 40, yellowMax: 79, greenMin: 80 },
        4: { name: "Ventas", dailyTarget: 1, redMax: 40, yellowMax: 79, greenMin: 80 }
    },

    vendedorThresholds: {
        1: { redMax: 40, yellowMax: 79, greenMin: 80 },
        2: { redMax: 40, yellowMax: 79, greenMin: 80 },
        3: { redMax: 40, yellowMax: 79, greenMin: 80 },
        4: { redMax: 40, yellowMax: 79, greenMin: 80 }
    },

    prospects: [
        { id: 101, userId: 2, stage: 1, name: "Juan Pérez", comuna: "Santiago Centro", phone: "+56911112222", email: "", rut: "", gender: "", birthdate: "", document: "", assignedItemId: null, finalPrice: null }
    ],

    sales: []
};

// Manejador del Sistema de Navegación de la SPA (Cambio de Vistas sin recargar página)
function navigate(viewName) {
    document.querySelectorAll('#sidebar-menu .nav-link').forEach(link => {
        link.classList.remove('active');
        if(link.getAttribute('onclick').includes(viewName)) {
            link.classList.add('active');
        }
    });

    const mainContainer = document.getElementById('view-container');
    
    switch(viewName) {
        case 'admin-catalog':
            renderAdminCatalog(mainContainer);
            break;
        case 'admin-goals':
            renderAdminGoals(mainContainer);
            break;
        case 'vendedor-dashboard':
            renderVendedorDashboard(mainContainer);
            break;
        case 'vendedor-thresholds':
            renderVendedorThresholds(mainContainer);
            break;
        case 'vendedor-sales':
            renderVendedorSales(mainContainer);
            break;
    }
}

function evaluateTrafficLight(percentage, thresholds) {
    if (percentage <= thresholds.redMax) return 'rojo';
    if (percentage <= thresholds.yellowMax) return 'amarillo';
    return 'verde';
}

// VISTA: DASHBOARD DEL VENDEDOR
function renderVendedorDashboard(container) {
    const filter = document.getElementById('dashboard-time-filter') ? document.getElementById('dashboard-time-filter').value : 'diario';
    
    let scale = 1;
    if (filter === 'semanal') scale = 5;
    if (filter === 'mensual') scale = 22;

    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
                <h2>Mi Dashboard de Rendimiento</h2>
                <p class="text-muted small">Cálculo en tiempo real según cuotas y umbrales activos.</p>
            </div>
            <div>
                <select id="dashboard-time-filter" class="form-select" onchange="navigate('vendedor-dashboard')">
                    <option value="diario" ${filter==='diario'?'selected':''}>Filtro: Vista Diaria</option>
                    <option value="semanal" ${filter==='semanal'?'selected':''}>Filtro: Vista Semanal</option>
                    <option value="mensual" ${filter==='mensual'?'selected':''}>Filtro: Vista Mensual</option>
                </select>
            </div>
        </div>
        <div class="row g-3" id="dashboard-metrics-grid"></div>
    `;

    const grid = document.getElementById('dashboard-metrics-grid');
    
    for (let stageId = 1; stageId <= 4; stageId++) {
        const goalData = localDB.corporateGoals[stageId];
        const userThreshold = localDB.vendedorThresholds[stageId];
        
        let count = localDB.prospects.filter(p => p.stage === stageId && p.userId === localDB.session.userId).length;
        if(stageId === 4) count = localDB.sales.filter(s => localDB.prospects.find(p=>p.id===s.prospectoId && p.userId === localDB.session.userId)).length;

        const targetScaled = goalData.dailyTarget * scale;
        const pct = targetScaled > 0 ? Math.round((count / targetScaled) * 100) : 0;
        const lightColor = evaluateTrafficLight(pct, userThreshold);

        const radius = 16;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (Math.min(pct, 100) / 100) * circumference;

        const card = document.createElement('div');
        card.className = `col-md-6 col-lg-3`;
        card.innerHTML = `
            <div class="card card-semaforo ${lightColor} shadow-sm h-100 p-3">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <h6 class="text-muted text-uppercase small m-0">${goalData.name}</h6>
                        <h3 class="my-2">${count} <span class="fs-6 text-muted fw-normal">de ${targetScaled}</span></h3>
                        <span class="badge bg-light text-dark border">${pct}% Cumplido</span>
                    </div>
                    <div style="width: 65px; height: 65px;">
                        <svg class="donut-svg" viewBox="0 0 42 42" width="100%" height="100%">
                            <circle class="donut-bg" cx="21" cy="21" r="${radius}"></circle>
                            <circle class="donut-fill" cx="21" cy="21" r="${radius}" 
                                    stroke-dasharray="${circumference}" 
                                    stroke-dashoffset="${strokeDashoffset}"></circle>
                        </svg>
                    </div>
                </div>
                <div class="border-top mt-3 pt-2">
                    <p class="m-0 text-success fw-bold" style="font-size:0.75rem;">
                        💡 Llevas ${count} de ${targetScaled} ${goalData.name.toLowerCase()} ${filter === 'diario' ? 'hoy' : filter === 'semanal' ? 'esta semana' : 'este mes'}.
                    </p>
                </div>
            </div>
        `;
        grid.appendChild(card);
    }
}

// VISTA: PERSONALIZACIÓN DE UMBRALES
function renderVendedorThresholds(container) {
    container.innerHTML = `
        <h2>Mis Umbrales de Rendimiento Personalizados</h2>
        <p class="text-muted">Adapta los niveles de disparo de color de tus semáforos para aumentar tu nivel de autoexigencia.</p>
        <div class="card shadow-sm p-4">
            <form id="form-thresholds">
                <div id="thresholds-inputs-container"></div>
                <button type="submit" class="btn btn-primary mt-3">Guardar Configuración Personalizada</button>
            </form>
        </div>
    `;

    const inputsContainer = document.getElementById('thresholds-inputs-container');
    
    for (let stageId = 1; stageId <= 4; stageId++) {
        const stageName = localDB.corporateGoals[stageId].name;
        const currentT = localDB.vendedorThresholds[stageId];

        const row = document.createElement('div');
        row.className = "row g-3 align-items-center mb-4 border-bottom pb-3";
        row.innerHTML = `
            <div class="col-md-3"><strong>Etapa ${stageId}: ${stageName}</strong></div>
            <div class="col-md-3">
                <label class="small text-muted d-block">Techo Alerta Roja (%)</label>
                <input type="number" class="form-control form-control-sm border-danger" name="red_${stageId}" value="${currentT.redMax}" min="0" max="100" required>
            </div>
            <div class="col-md-3">
                <label class="small text-muted d-block">Techo Alerta Amarilla (%)</label>
                <input type="number" class="form-control form-control-sm border-warning" name="yellow_${stageId}" value="${currentT.yellowMax}" min="0" max="100" required>
            </div>
            <div class="col-md-3">
                <label class="small text-muted d-block">Piso Alerta Verde (%)</label>
                <input type="number" class="form-control form-control-sm border-success" name="green_${stageId}" value="${currentT.greenMin}" min="0" max="100" required>
            </div>
        `;
        inputsContainer.appendChild(row);
    }

    document.getElementById('form-thresholds').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        for (let stageId = 1; stageId <= 4; stageId++) {
            localDB.vendedorThresholds[stageId] = {
                redMax: parseInt(formData.get(`red_${stageId}`)),
                yellowMax: parseInt(formData.get(`yellow_${stageId}`)),
                greenMin: parseInt(formData.get(`green_${stageId}`))
            };
        }
        alert("¡Éxito! Tus umbrales personalizados han sido guardados en memoria.");
        navigate('vendedor-dashboard');
    });
}

// VISTA: EMBUDO DE VENTAS
function renderVendedorSales(container) {
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
                <h2>Embudo de Ventas (Perfilado Progresivo)</h2>
                <p class="text-muted small">Flujo estrictamente secuencial de 4 etapas para capturar datos comerciales.</p>
            </div>
            <button class="btn btn-success btn-sm" data-bs-toggle="collapse" data-bs-target="#new-prospect-box">+ Nuevo Prospecto Inicial</button>
        </div>

        <div class="collapse mb-4" id="new-prospect-box">
            <div class="card p-3 shadow-sm bg-white border-success">
                <h6>Ingresar Captura de Terreno (Etapa 1 - Solo 3 campos)</h6>
                <form id="form-add-prospect" class="row g-2 mt-1">
                    <div class="col-md-4"><input type="text" class="form-control form-control-sm" name="name" placeholder="Nombre completo" required></div>
                    <div class="col-md-3"><input type="text" class="form-control form-control-sm" name="comuna" placeholder="Comuna" required></div>
                    <div class="col-md-3"><input type="text" class="form-control form-control-sm" name="phone" placeholder="Teléfono" required></div>
                    <div class="col-md-2"><button type="submit" class="btn btn-success btn-sm w-100">Registrar</button></div>
                </form>
            </div>
        </div>

        <div class="pipeline-scroll-wrapper" id="pipeline-columns-container"></div>
    `;

    document.getElementById('form-add-prospect').addEventListener('submit', function(e) {
        e.preventDefault();
        const f = new FormData(e.target);
        const nuevo = {
            id: Date.now(),
            userId: localDB.session.userId,
            stage: 1,
            name: f.get('name'),
            comuna: f.get('comuna'),
            phone: f.get('phone'),
            email: "", rut: "", gender: "", birthdate: "", document: "", assignedItemId: null, finalPrice: null
        };
        localDB.prospects.push(nuevo);
        alert("Cliente registrado con éxito en la Etapa 1.");
        navigate('vendedor-sales');
    });

    renderPipelineStages();
}

function renderPipelineStages() {
    const container = document.getElementById('pipeline-columns-container');
    container.innerHTML = '';

    const stagesDef = [
        { id: 1, title: "1. Prospectos" },
        { id: 2, title: "2. Agendamiento" },
        { id: 3, title: "3. Cita Concretada" },
        { id: 4, title: "4. Cierres Exitosos" }
    ];

    stagesDef.forEach(st => {
        const col = document.createElement('div');
        col.className = "pipeline-column";
        col.innerHTML = `<h5>${st.title}</h5><div id="box-stage-${st.id}"></div>`;
        container.appendChild(col);
    });

    localDB.prospects.forEach(p => {
        if(p.userId !== localDB.session.userId) return;

        const box = document.getElementById(`box-stage-${p.stage}`);
        const card = document.createElement('div');
        card.className = "prospect-card shadow-sm";
        
        let innerHTML = `<strong>${p.name}</strong><br><span class="text-muted small">${p.comuna} | ${p.phone}</span>`;

        if (p.stage === 1) {
            innerHTML += `
                <form class="mt-2 pt-2 border-top">
                    <label class="small text-primary fw-bold mb-1">Avanzar a Etapa 2 (Exige Correo)</label>
                    <input type="email" class="form-control form-control-sm mb-1" placeholder="correo@cliente.cl" required id="mail-${p.id}">
                    <button type="button" class="btn btn-primary btn-sm w-100" onclick="processAdvanceStage1(${p.id})">Agendar Reunión</button>
                </form>
            `;
        } else if (p.stage === 2) {
            innerHTML += `<br><span class="badge bg-info text-dark mt-1">${p.email}</span>`;
            innerHTML += `
                <form class="mt-2 pt-2 border-top">
                    <label class="small text-warning fw-bold mb-1">Avanzar a Etapa 3 (Datos Duros)</label>
                    <input type="text" class="form-control form-control-sm mb-1" placeholder="12.345.678-K" required id="rut-${p.id}">
                    <select class="form-select form-select-sm mb-1" id="gender-${p.id}">
                        <option value="Femenino">Femenino</option><option value="Masculino">Masculino</option><option value="Otro">Otro</option>
                    </select>
                    <input type="date" class="form-control form-control-sm mb-1" required id="birth-${p.id}">
                    <button type="button" class="btn btn-warning btn-sm w-100" onclick="processAdvanceStage2(${p.id})">Marcar Realizada</button>
                </form>
            `;
        } else if (p.stage === 3) {
            innerHTML += `<br><small class="text-muted">RUT: ${p.rut}</small>`;
            
            let itemsOptions = '';
            localDB.catalog.filter(i=>i.active).forEach(i => {
                itemsOptions += `<option value="${i.id}">${i.name} ($${i.price.toLocaleString('es-CL')})</option>`;
            });

            innerHTML += `
                <form class="mt-2 pt-2 border-top bg-light p-2 rounded">
                    <label class="small text-danger fw-bold d-block mb-1">Etapa 4: Contrato</label>
                    <input type="file" class="form-control form-control-sm mb-2" id="doc-${p.id}" required>
                    <select class="form-select form-select-sm mb-2" id="cat-${p.id}">${itemsOptions}</select>
                    
                    <div class="p-1 border rounded bg-white mb-2">
                        <span class="small d-block fw-bold text-center text-muted border-bottom mb-1">3 Referidos Obligatorios</span>
                        <input type="text" class="form-control form-control-sm mb-1" placeholder="Nombre Ref 1" id="refn1-${p.id}" required>
                        <input type="text" class="form-control form-control-sm mb-2" placeholder="Fono Ref 1" id="reft1-${p.id}" required>
                        <input type="text" class="form-control form-control-sm mb-1" placeholder="Nombre Ref 2" id="refn2-${p.id}" required>
                        <input type="text" class="form-control form-control-sm mb-2" placeholder="Fono Ref 2" id="reft2-${p.id}" required>
                        <input type="text" class="form-control form-control-sm mb-1" placeholder="Nombre Ref 3" id="refn3-${p.id}" required>
                        <input type="text" class="form-control form-control-sm mb-1" placeholder="Fono Ref 3" id="reft3-${p.id}" required>
                    </div>
                    <button type="button" class="btn btn-success btn-sm w-100" onclick="processAdvanceStage3(${p.id})">Cerrar Contrato</button>
                </form>
            `;
        } else if (p.stage === 4) {
            const saleRecord = localDB.sales.find(s => s.prospectoId === p.id);
            const catItem = localDB.catalog.find(i => i.id === saleRecord.catalogId);
            innerHTML += `
                <div class="mt-2 p-1 bg-success bg-opacity-10 rounded border border-success text-center">
                    <span class="text-success fw-bold small d-block">🎉 CONTRATO CONGELADO</span>
                    <small class="text-muted d-block">${catItem.name}</small>
                    <strong class="text-dark">$${saleRecord.precioHistorico.toLocaleString('es-CL')}</strong>
                </div>
            `;
        }

        card.innerHTML = innerHTML;
        box.appendChild(card);
    });
}

function processAdvanceStage1(id) {
    const emailVal = document.getElementById(`mail-${id}`).value;
    if(!emailVal.includes('@')) { alert("Email inválido."); return; }

    const prospect = localDB.prospects.find(p => p.id === id);
    prospect.email = emailVal;
    prospect.stage = 2;

    alert(`[CONEXIÓN API GOOGLE CALENDAR]\n• Evento sincronizado de forma transparente.\n• Invitación enviada a: ${emailVal}`);
    navigate('vendedor-sales');
}

function processAdvanceStage2(id) {
    const rut = document.getElementById(`rut-${id}`).value;
    const gender = document.getElementById(`gender-${id}`).value;
    const birth = document.getElementById(`birth-${id}`).value;

    if(rut.trim() === "" || birth === "") { alert("Campos obligatorios."); return; }

    const prospect = localDB.prospects.find(p => p.id === id);
    prospect.rut = rut;
    prospect.gender = gender;
    prospect.birthdate = birth;
    prospect.stage = 3;

    navigate('vendedor-sales');
}

function processAdvanceStage3(id) {
    const fileInput = document.getElementById(`doc-${id}`);
    const catalogId = parseInt(document.getElementById(`cat-${id}`).value);
    const rn1 = document.getElementById(`refn1-${id}`).value;
    const rt1 = document.getElementById(`reft1-${id}`).value;
    const rn2 = document.getElementById(`refn2-${id}`).value;
    const rt2 = document.getElementById(`reft2-${id}`).value;
    const rn3 = document.getElementById(`refn3-${id}`).value;
    const rt3 = document.getElementById(`reft3-${id}`).value;

    if(!fileInput.files[0] || rn1==="" || rt1==="" || rn2==="" || rt2==="" || rn3==="" || rt3==="") {
        alert("Falta adjuntar el archivo o los 3 referidos obligatorios.");
        return;
    }

    const prospect = localDB.prospects.find(p => p.id === id);
    const catalogItem = localDB.catalog.find(i => i.id === catalogId);

    prospect.stage = 4;
    prospect.document = fileInput.files[0].name;
    prospect.assignedItemId = catalogId;
    prospect.finalPrice = catalogItem.price;

    localDB.sales.push({
        id: Date.now(),
        prospectoId: id,
        catalogId: catalogId,
        precioHistorico: catalogItem.price
    });

    const comunaOrigen = prospect.comuna;
    const referidos = [{ name: rn1, phone: rt1 }, { name: rn2, phone: rt2 }, { name: rn3, phone: rt3 }];

    referidos.forEach(ref => {
        localDB.prospects.push({
            id: Date.now() + Math.random(),
            userId: localDB.session.userId,
            stage: 1,
            name: ref.name,
            comuna: comunaOrigen,
            phone: ref.phone,
            email: "", rut: "", gender: "", birthdate: "", document: "", assignedItemId: null, finalPrice: null
        });
    });

    alert("🎉 ¡Venta cerrada con éxito y 3 referidos ingresados a la Etapa 1!");
    navigate('vendedor-sales');
}

// VISTA: PANEL ADMINISTRADOR - GESTIÓN DE CATÁLOGO
function renderAdminCatalog(container) {
    container.innerHTML = `
        <h2>Gestión Corporativa de Catálogo</h2>
        <p class="text-muted small">Panel exclusivo de control de oferta.</p>
        
        <div class="card p-3 shadow-sm mb-4">
            <h5 id="catalog-form-title">Agregar Nuevo Item</h5>
            <form id="form-admin-catalog" class="row g-3 mt-1">
                <input type="hidden" id="edit-item-id" value="">
                <div class="col-md-4">
                    <label class="small text-muted">Nombre Comercial *</label>
                    <input type="text" class="form-control form-control-sm" id="cat-name" required>
                </div>
                <div class="col-md-2">
                    <label class="small text-muted">Categoría *</label>
                    <select class="form-select form-select-sm" id="cat-category">
                        <option value="Producto">Producto</option><option value="Servicio">Servicio</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <label class="small text-muted">Precio Venta ($ CLP) *</label>
                    <input type="number" class="form-control form-control-sm" id="cat-price" min="1" required>
                </div>
                <div class="col-md-3">
                    <label class="small text-muted">Descripción Corta *</label>
                    <input type="text" class="form-control form-control-sm" id="cat-short" required>
                </div>
                <div class="col-12">
                    <label class="small text-muted">Ficha Detallada de Contrato</label>
                    <textarea class="form-control form-control-sm" id="cat-long" rows="2"></textarea>
                </div>
                <div class="col-12 text-end">
                    <button type="button" class="btn btn-secondary btn-sm me-2" onclick="navigate('admin-catalog')">Limpiar</button>
                    <button type="submit" class="btn btn-primary btn-sm">Guardar en Catálogo</button>
                </div>
            </form>
        </div>

        <div class="card p-3 shadow-sm">
            <h5>Items Disponibles en el Sistema</h5>
            <div class="table-responsive">
                <table class="table table-sm table-hover align-middle mt-2">
                    <thead class="table-light">
                        <tr>
                            <th>Categoría</th><th>Nombre</th><th>Descripción Corta</th><th>Precio Lista</th><th>Estado</th><th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="catalog-table-body"></tbody>
                </table>
            </div>
        </div>
    `;

    const tbody = document.getElementById('catalog-table-body');
    localDB.catalog.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="badge bg-secondary">${item.category}</span></td>
            <td><strong>${item.name}</strong></td>
            <td>${item.shortDesc}</td>
            <td>$${item.price.toLocaleString('es-CL')}</td>
            <td><span class="fw-bold ${item.active?'text-success':'text-danger'}">${item.active?'Activo':'Inactivo'}</span></td>
            <td>
                <button class="btn btn-outline-primary btn-xs py-0 px-2" onclick="loadItemToEdit(${item.id})">Editar</button>
                <button class="btn ${item.active?'btn-outline-danger':'btn-outline-success'} btn-xs py-0 px-2" onclick="toggleItemActive(${item.id})">
                    ${item.active?'Desactivar':'Reactivar'}
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('form-admin-catalog').addEventListener('submit', function(e) {
        e.preventDefault();
        const editId = document.getElementById('edit-item-id').value;
        const name = document.getElementById('cat-name').value;
        const category = document.getElementById('cat-category').value;
        const price = parseInt(document.getElementById('cat-price').value);
        const shortDesc = document.getElementById('cat-short').value;
        const longDesc = document.getElementById('cat-long').value;

        if(editId) {
            const item = localDB.catalog.find(i => i.id == editId);
            if (item.price !== price) {
                localDB.priceHistory.push({ catalogId: item.id, price: price, date: new Date().toISOString().split('T')[0] });
                alert(`[HISTÓRICO] Precio modificado. Se resguarda el valor anterior para contratos históricos.`);
            }
            item.name = name; item.category = category; item.price = price; item.shortDesc = shortDesc; item.longDesc = longDesc;
        } else {
            const newItem = { id: Date.now(), name, category, price, shortDesc, longDesc, active: true };
            localDB.catalog.push(newItem);
            localDB.priceHistory.push({ catalogId: newItem.id, price, date: new Date().toISOString().split('T')[0] });
        }
        navigate('admin-catalog');
    });
}

function loadItemToEdit(id) {
    const item = localDB.catalog.find(i => i.id === id);
    document.getElementById('catalog-form-title').innerText = `Modificar: ${item.name}`;
    document.getElementById('edit-item-id').value = item.id;
    document.getElementById('cat-name').value = item.name;
    document.getElementById('cat-category').value = item.category;
    document.getElementById('cat-price').value = item.price;
    document.getElementById('cat-short').value = item.shortDesc;
    document.getElementById('cat-long').value = item.longDesc;
}

function toggleItemActive(id) {
    const item = localDB.catalog.find(i => i.id === id);
    item.active = !item.active;
    navigate('admin-catalog');
}

// VISTA: PANEL ADMINISTRADOR - METAS CORPORATIVAS
function renderAdminGoals(container) {
    container.innerHTML = `
        <h2>Configuración de Metas Corporativas</h2>
        <p class="text-muted small">Establece el estándar de volumen diario esperado y rangos base del semáforo.</p>
        <div class="card p-4 shadow-sm bg-white">
            <form id="form-corporate-goals">
                <div id="goals-rows-container"></div>
                <button type="submit" class="btn btn-primary btn-sm mt-2">Guardar Estándar Corporativo</button>
            </form>
        </div>
    `;

    const rContainer = document.getElementById('goals-rows-container');
    for (let stageId = 1; stageId <= 4; stageId++) {
        const goal = localDB.corporateGoals[stageId];
        const d = document.createElement('div');
        d.className = "row g-2 align-items-center mb-3 border-bottom pb-2";
        d.innerHTML = `
            <div class="col-md-3"><strong>${goal.name}</strong></div>
            <div class="col-md-2">
                <label class="small text-muted d-block">Meta Diaria</label>
                <input type="number" class="form-control form-control-sm" name="target_${stageId}" value="${goal.dailyTarget}" required>
            </div>
            <div class="col-md-2">
                <label class="small text-muted d-block">Techo Rojo (%)</label>
                <input type="number" class="form-control form-control-sm" name="red_${stageId}" value="${goal.redMax}" required>
            </div>
            <div class="col-md-2">
                <label class="small text-muted d-block">Techo Amarillo (%)</label>
                <input type="number" class="form-control form-control-sm" name="yellow_${stageId}" value="${goal.yellowMax}" required>
            </div>
            <div class="col-md-3">
                <label class="small text-muted d-block">Piso Verde (%)</label>
                <input type="number" class="form-control form-control-sm" name="green_${stageId}" value="${goal.greenMin}" required>
            </div>
        `;
        rContainer.appendChild(d);
    }

    document.getElementById('form-corporate-goals').addEventListener('submit', function(e) {
        e.preventDefault();
        const f = new FormData(e.target);
        for (let stageId = 1; stageId <= 4; stageId++) {
            localDB.corporateGoals[stageId].dailyTarget = parseInt(f.get(`target_${stageId}`));
            localDB.corporateGoals[stageId].redMax = parseInt(f.get(`red_${stageId}`));
            localDB.corporateGoals[stageId].yellowMax = parseInt(f.get(`yellow_${stageId}`));
            localDB.corporateGoals[stageId].greenMin = parseInt(f.get(`green_${stageId}`));
        }
        alert("Línea base de rendimiento corporativo guardada.");
        navigate('admin-catalog');
    });
}
