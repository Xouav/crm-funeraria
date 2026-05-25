// js/app.js
// Controlador Maestro Front-End SPA - Lógica de Negocio y Reglas Críticas del PDF

document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

// Base de datos simulada en memoria RAM para cumplir persistencia local durante el uso
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

    // Umbrales específicos del vendedor que se pueden sobrescribir de forma aislada
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

function initApp() {
    // Escucha el cambio rápido de roles requerido para simular el Login
    document.getElementById('role-selector').addEventListener('change', (e) => {
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

    updateNavbarSession();
}

function updateNavbarSession() {
    document.getElementById('session-user-name').innerText = localDB.session.userName;
    document.getElementById('session-user-role').innerText = localDB.session.role;
    document.getElementById('role-selector').value = localDB.session.role;
    renderMenuLinks();
}

function renderMenuLinks() {
    const menuContainer = document.getElementById('dynamic-menu-links');
    let html = '';

    if (localDB.session.role === 'Administrador') {
        html += `
            <li class="nav-item"><a class="nav-link" href="#" id="link-admin-catalog" onclick="navigate('admin-catalog')">Gestión Catálogo</a></li>
            <li class="nav-item"><a class="nav-link" href="#" id="link-admin-goals" onclick="navigate('admin-goals')">Metas Corporativas</a></li>
        `;
    } else {
        html += `
            <li class="nav-item"><a class="nav-link" href="#" id="link-vendedor-dashboard" onclick="navigate('vendedor-dashboard')">Mi Dashboard</a></li>
            <li class="nav-item"><a class="nav-link" href="#" id="link-vendedor-thresholds" onclick="navigate('vendedor-thresholds')">Mis Umbrales</a></li>
            <li class="nav-item"><a class="nav-link" href="#" id="link-vendedor-sales" onclick="navigate('vendedor-sales')">Embudo de Ventas</a></li>
        `;
    }
    menuContainer.innerHTML = html;
}

function navigate(viewName) {
    document.querySelectorAll('#sidebar-menu .nav-link').forEach(link => link.classList.remove('active'));
    const targetedLink = document.getElementById(`link-${viewName}`);
    if (targetedLink) targetedLink.classList.add('active');

    const mainContainer = document.getElementById('view-container');
    
    switch(viewName) {
        case 'admin-catalog': renderAdminCatalog(mainContainer); break;
        case 'admin-goals': renderAdminGoals(mainContainer); break;
        case 'vendedor-dashboard': renderVendedorDashboard(mainContainer); break;
        case 'vendedor-thresholds': renderVendedorThresholds(mainContainer); break;
        case 'vendedor-sales': renderVendedorSales(mainContainer); break;
    }
}

function evaluateTrafficLight(percentage, thresholds) {
    if (percentage <= thresholds.redMax) return 'rojo';
    if (percentage <= thresholds.yellowMax) return 'amarillo';
    return 'verde';
}

// ==========================================================================
// RENDERIZADO DE VISTAS (SPA)
// ==========================================================================

function renderVendedorDashboard(container) {
    const filter = document.getElementById('dashboard-time-filter') ? document.getElementById('dashboard-time-filter').value : 'diario';
    let scale = filter === 'semanal' ? 5 : (filter === 'mensual' ? 22 : 1);

    container.innerHTML = `
        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-2">
            <div>
                <h1 class="h2 m-0">Mi Dashboard de Rendimiento</h1>
                <p class="text-muted small m-0">Cálculos automáticos en tiempo real bajo tus umbrales activos.</p>
            </div>
            <select id="dashboard-time-filter" class="form-select form-select-sm w-auto" onchange="navigate('vendedor-dashboard')">
                <option value="diario" ${filter==='diario'?'selected':''}>Vista Diaria</option>
                <option value="semanal" ${filter==='semanal'?'selected':''}>Vista Semanal</option>
                <option value="mensual" ${filter==='mensual'?'selected':''}>Vista Mensual</option>
            </select>
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
        card.className = `col-12 col-sm-6 col-xl-3`;
        card.innerHTML = `
            <div class="card card-semaforo ${lightColor} h-100 p-3">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <span class="text-muted text-uppercase small d-block fw-bold">${goalData.name}</span>
                        <span class="h2 d-block my-1 fw-bold">${count} <span class="fs-6 text-muted fw-normal">de ${targetScaled}</span></span>
                        <span class="badge bg-light text-dark border">${pct}% de la meta</span>
                    </div>
                    <div style="width: 60px; height: 60px;">
                        <svg class="donut-svg" viewBox="0 0 42 42" width="100%" height="100%" aria-hidden="true">
                            <circle class="donut-bg" cx="21" cy="21" r="${radius}"></circle>
                            <circle class="donut-fill" cx="21" cy="21" r="${radius}" 
                                    stroke-dasharray="${circumference}" 
                                    stroke-dashoffset="${strokeDashoffset}"></circle>
                        </svg>
                    </div>
                </div>
                <div class="border-top mt-3 pt-2">
                    <small class="text-secondary d-block">💡 Llevas ${count} objetivos registrados ${filter === 'diario' ? 'hoy' : filter === 'semanal' ? 'esta semana' : 'este mes'}.</small>
                </div>
            </div>
        `;
        grid.appendChild(card);
    }
}

function renderVendedorThresholds(container) {
    container.innerHTML = `
        <h1 class="h2">Personalización de Umbrales Personales</h1>
        <p class="text-muted">Ajusta de forma segura tus niveles de autoexigencia sin alterar las métricas de la empresa.</p>
        <div class="card shadow-sm p-4 bg-white">
            <form id="form-thresholds">
                <div id="thresholds-inputs-container"></div>
                <button type="submit" class="btn btn-emerald text-white fw-bold mt-2">Guardar Mis Límites</button>
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
            <div class="col-12 col-md-3"><strong class="text-navy">${stageId}. ${stageName}</strong></div>
            <div class="col-4 col-md-3">
                <label class="small text-danger fw-bold d-block mb-1">Techo Rojo (%)</label>
                <input type="number" class="form-control form-control-sm" name="red_${stageId}" value="${currentT.redMax}" min="0" max="100" required>
            </div>
            <div class="col-4 col-md-3">
                <label class="small text-warning fw-bold d-block mb-1">Techo Amarillo (%)</label>
                <input type="number" class="form-control form-control-sm" name="yellow_${stageId}" value="${currentT.yellowMax}" min="0" max="100" required>
            </div>
            <div class="col-4 col-md-3">
                <label class="small text-success fw-bold d-block mb-1">Piso Verde (%)</label>
                <input type="number" class="form-control form-control-sm" name="green_${stageId}" value="${currentT.greenMin}" min="0" max="100" required>
            </div>
        `;
        inputsContainer.appendChild(row);
    }

    document.getElementById('form-thresholds').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        for (let stageId = 1; stageId <= 4; stageId++) {
            localDB.vendedorThresholds[stageId] = {
                redMax: parseInt(formData.get(`red_${stageId}`)),
                yellowMax: parseInt(formData.get(`yellow_${stageId}`)),
                greenMin: parseInt(formData.get(`green_${stageId}`))
            };
        }
        alert("Configuración personal guardada exitosamente en memoria local.");
        navigate('vendedor-dashboard');
    });
}

function renderVendedorSales(container) {
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
                <h1 class="h2 m-0">Embudo de Ventas</h1>
                <p class="text-muted small m-0">Perfilado Progresivo obligatorio por etapas secuenciales.</p>
            </div>
            <button class="btn btn-emerald text-white btn-sm fw-bold" data-bs-toggle="collapse" data-bs-target="#new-prospect-box">+ Captura Inicial</button>
        </div>

        <div class="collapse mb-4" id="new-prospect-box">
            <div class="card p-3 shadow-sm border-success bg-white">
                <h2 class="h6 text-success fw-bold mb-2">Fase Inicial Terreno (Baja fricción: 3 campos obligatorios)</h2>
                <form id="form-add-prospect" class="row g-2">
                    <div class="col-md-4"><input type="text" class="form-control form-control-sm" name="name" placeholder="Nombre completo del prospecto" required></div>
                    <div class="col-md-4"><input type="text" class="form-control form-control-sm" name="comuna" placeholder="Comuna de residencia" required></div>
                    <div class="col-md-2"><input type="tel" class="form-control form-control-sm" name="phone" placeholder="+569..." required></div>
                    <div class="col-md-2"><button type="submit" class="btn btn-success btn-sm w-100 fw-bold">Registrar</button></div>
                </form>
            </div>
        </div>

        <div class="pipeline-scroll-wrapper" id="pipeline-columns-container"></div>
    `;

    document.getElementById('form-add-prospect').addEventListener('submit', (e) => {
        e.preventDefault();
        const f = new FormData(e.target);
        localDB.prospects.push({
            id: Date.now(),
            userId: localDB.session.userId,
            stage: 1,
            name: f.get('name'),
            comuna: f.get('comuna'),
            phone: f.get('phone'),
            email: "", rut: "", gender: "", birthdate: "", document: "", assignedItemId: null, finalPrice: null
        });
        alert("Prospecto incorporado en la Etapa 1.");
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
        col.innerHTML = `<h3>${st.title}</h3><div id="box-stage-${st.id}" class="mt-3"></div>`;
        container.appendChild(col);
    });

    localDB.prospects.forEach(p => {
        if(p.userId !== localDB.session.userId) return;

        const box = document.getElementById(`box-stage-${p.stage}`);
        const card = document.createElement('article');
        card.className = "prospect-card";
        
        let innerHTML = `<h4 class="h6 m-0 fw-bold">${p.name}</h4><small class="text-muted">${p.comuna} | Teléfono: ${p.phone}</small>`;

        if (p.stage === 1) {
            innerHTML += `
                <div class="mt-3 pt-2 border-top">
                    <label class="small text-primary fw-bold mb-1" for="mail-${p.id}">Avanzar a Etapa 2 (Exige Email)</label>
                    <input type="email" class="form-control form-control-sm mb-2" id="mail-${p.id}" placeholder="correo@ejemplo.cl" required>
                    <button type="button" class="btn btn-primary btn-sm w-100 font-monospace" style="font-size: 0.75rem" onclick="processAdvanceStage1(${p.id})">Simular Envío Invitación</button>
                </div>
            `;
        } else if (p.stage === 2) {
            innerHTML += `<div class="my-1"><span class="badge bg-light text-dark border">${p.email}</span></div>`;
            innerHTML += `
                <div class="mt-2 pt-2 border-top">
                    <span class="small text-warning fw-bold d-block mb-1">Avanzar a Etapa 3 (Datos Duros)</span>
                    <input type="text" class="form-control form-control-sm mb-1" placeholder="RUT (12345678-9)" id="rut-${p.id}" required>
                    <select class="form-select form-select-sm mb-1" id="gender-${p.id}">
                        <option value="Femenino">Femenino</option><option value="Masculino">Masculino</option><option value="Otro">Otro</option>
                    </select>
                    <input type="date" class="form-control form-control-sm mb-2" id="birth-${p.id}" required>
                    <button type="button" class="btn btn-warning btn-sm w-100 text-dark fw-bold" style="font-size: 0.75rem" onclick="processAdvanceStage2(${p.id})">Marcar Cita Concretada</button>
                </div>
            `;
        } else if (p.stage === 3) {
            innerHTML += `<div class="small text-muted font-monospace my-1">RUT: ${p.rut} | G: ${p.gender}</div>`;
            
            let itemsOptions = '';
            localDB.catalog.filter(i => i.active).forEach(i => {
                itemsOptions += `<option value="${i.id}">${i.name} ($${i.price.toLocaleString('es-CL')})</option>`;
            });

            innerHTML += `
                <div class="mt-2 pt-2 border-top bg-light p-2 rounded">
                    <span class="small text-danger fw-bold d-block mb-1">Etapa 4: Formalización Obligatoria</span>
                    <label class="small text-muted" for="doc-${p.id}">Carga Documental (Cédula/Contrato):</label>
                    <input type="file" class="form-control form-control-sm mb-2" id="doc-${p.id}" required>
                    <label class="small text-muted" for="cat-${p.id}">Asignar Servicio:</label>
                    <select class="form-select form-select-sm mb-2" id="cat-${p.id}">${itemsOptions}</select>
                    
                    <div class="p-2 border bg-white rounded mb-2 shadow-inner" style="font-size:0.75rem;">
                        <span class="d-block text-center fw-bold text-secondary border-bottom pb-1 mb-2">Captura de 3 Referidos Obligatorios</span>
                        <input type="text" class="form-control form-control-sm mb-1" placeholder="Nombre Ref 1" id="refn1-${p.id}" required>
                        <input type="tel" class="form-control form-control-sm mb-2" placeholder="Teléfono Ref 1" id="reft1-${p.id}" required>
                        <input type="text" class="form-control form-control-sm mb-1" placeholder="Nombre Ref 2" id="refn2-${p.id}" required>
                        <input type="tel" class="form-control form-control-sm mb-2" placeholder="Teléfono Ref 2" id="reft2-${p.id}" required>
                        <input type="text" class="form-control form-control-sm mb-1" placeholder="Nombre Ref 3" id="refn3-${p.id}" required>
                        <input type="tel" class="form-control form-control-sm id="reft3-${p.id}" required>
                    </div>
                    <button type="button" class="btn btn-danger btn-sm w-100 fw-bold" style="font-size: 0.75rem" onclick="processAdvanceStage3(${p.id})">Congelar Venta y Cerrar</button>
                </div>
            `;
        } else if (p.stage === 4) {
            const record = localDB.sales.find(s => s.prospectoId === p.id);
            const item = localDB.catalog.find(i => i.id === record.catalogId);
            innerHTML += `
                <div class="mt-2 p-2 bg-success bg-opacity-10 rounded border border-success text-center">
                    <span class="text-success fw-bold d-block small">🎉 VENTA CONTRATADA</span>
                    <span class="d-block small text-muted font-monospace">${item.name}</span>
                    <strong class="text-dark">$${record.precioHistorico.toLocaleString('es-CL')}</strong>
                </div>
            `;
        }

        card.innerHTML = innerHTML;
        box.appendChild(card);
    });
}

function processAdvanceStage1(id) {
    const emailVal = document.getElementById(`mail-${id}`).value;
    if(!emailVal.includes('@')) { alert("Formato de correo electrónico inválido."); return; }

    const prospect = localDB.prospects.find(p => p.id === id);
    prospect.email = emailVal;
    prospect.stage = 2;

    // Simulación técnica transparente de conexión de API Externa exigida por el caso de uso
    console.log(`[API MOCK CALL] Conectando con Google Calendar API...`);
    console.log(`[API PAYLOAD] { guest: "${emailVal}", location: "Teams/Presencial", status: "PENDING" }`);
    alert(`[CONEXIÓN API GOOGLE CALENDAR EXITOSA]\n\n• Reunión agendada de manera nativa.\n• Invitación oficial despachada a: ${emailVal}\n• Alertas de calendario sincronizadas.`);
    navigate('vendedor-sales');
}

function processAdvanceStage2(id) {
    const rut = document.getElementById(`rut-${id}`).value;
    const gender = document.getElementById(`gender-${id}`).value;
    const birth = document.getElementById(`birth-${id}`).value;

    if(!rut || !birth) { alert("Todos los campos de datos duros de identificación son obligatorios."); return; }

    const prospect = localDB.prospects.find(p => p.id === id);
    prospect.rut = rut;
    prospect.gender = gender;
    prospect.birthdate = birth;
    prospect.stage = 3;

    navigate('vendedor-sales');
}

function processAdvanceStage3(id) {
    const file = document.getElementById(`doc-${id}`).files[0];
    const catId = parseInt(document.getElementById(`cat-${id}`).value);
    const rn1 = document.getElementById(`refn1-${id}`).value;
    const rt1 = document.getElementById(`reft1-${id}`).value;
    const rn2 = document.getElementById(`refn2-${id}`).value;
    const rt2 = document.getElementById(`reft2-${id}`).value;
    const rn3 = document.getElementById(`refn3-${id}`).value;
    const rt3 = document.getElementById(`reft3-${id}`).value;

    if(!file || !rn1 || !rt1 || !rn2 || !rt2 || !rn3 || !rt3) {
        alert("Error de Negocio: Se exige obligatoriamente adjuntar el respaldo digital y capturar los 3 referidos comerciales.");
        return;
    }

    const prospect = localDB.prospects.find(p => p.id === id);
    const catalogItem = localDB.catalog.find(i => i.id === catId);

    prospect.stage = 4;
    prospect.document = file.name;
    prospect.assignedItemId = catId;
    prospect.finalPrice = catalogItem.price;

    // Congelar precio histórico de venta exacta solicitado
    localDB.sales.push({
        id: Date.now(),
        prospectoId: id,
        catalogId: catId,
        precioHistorico: catalogItem.price
    });

    // Inyección automatizada de referidos en Cascada a Etapa 1
    const referidos = [{n: rn1, t: rt1}, {n: rn2, t: rt2}, {n: rn3, t: rt3}];
    referidos.forEach((ref, index) => {
        localDB.prospects.push({
            id: Date.now() + index + Math.random(),
            userId: localDB.session.userId,
            stage: 1,
            name: ref.n,
            comuna: prospect.comuna,
            phone: ref.t,
            email: "", rut: "", gender: "", birthdate: "", document: "", assignedItemId: null, finalPrice: null
        });
    });

    alert("🎉 ¡Felicidades! Contrato resguardado con su precio histórico e ingresados los 3 referidos en cadena a tu Etapa 1.");
    navigate('vendedor-sales');
}

// ==========================================================================
// VISTAS PERFIL ADMINISTRADOR
// ==========================================================================

function renderAdminCatalog(container) {
    container.innerHTML = `
        <h1 class="h2">Administración Global del Catálogo</h1>
        <p class="text-muted small">Mantenimiento e integridad referencial de productos y servicios funerarios corporativos.</p>
        
        <div class="card p-3 shadow-sm mb-4 bg-white">
            <h2 class="h6 text-primary fw-bold" id="form-title">Agregar Nuevo Item al Sistema</h2>
            <form id="form-admin-catalog" class="row g-2 mt-1">
                <input type="hidden" id="edit-id" value="">
                <div class="col-md-3"><input type="text" id="cat-name" class="form-control form-control-sm" placeholder="Nombre comercial" required></div>
                <div class="col-md-2">
                    <select id="cat-category" class="form-select form-select-sm">
                        <option value="Producto">Producto</option><option value="Servicio">Servicio</option>
                    </select>
                </div>
                <div class="col-md-2"><input type="number" id="cat-price" class="form-control form-control-sm" placeholder="Precio ($ CLP)" required></div>
                <div class="col-md-5"><input type="text" id="cat-short" class="form-control form-control-sm" placeholder="Descripción breve" required></div>
                <div class="col-12 mt-2"><textarea id="cat-long" class="form-control form-control-sm" rows="2" placeholder="Ficha detallada del contrato"></textarea></div>
                <div class="col-12 text-end mt-2">
                    <button type="submit" class="btn btn-primary btn-sm px-4 fw-bold">Guardar Item</button>
                </div>
            </form>
        </div>

        <div class="card p-3 shadow-sm bg-white">
            <h3 class="h6 fw-bold mb-2">Catálogo de Productos Activos e Inactivos (Integridad Referencial Protegida)</h3>
            <div class="table-responsive">
                <table class="table table-sm table-hover align-middle">
                    <thead class="table-light">
                        <tr><th>Categoría</th><th>Nombre</th><th>Precio Lista</th><th>Estado</th><th>Acciones</th></tr>
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
            <td><strong>${item.name}</strong><br><small class="text-muted">${item.shortDesc}</small></td>
            <td>$${item.price.toLocaleString('es-CL')}</td>
            <td><span class="fw-bold ${item.active?'text-success':'text-danger'}">${item.active?'Activo':'Inactivo'}</span></td>
            <td>
                <button class="btn btn-outline-primary btn-xs py-0 px-2" style="font-size:0.75rem;" onclick="loadCatalogEdit(${item.id})">Editar</button>
                <button class="btn ${item.active?'btn-outline-danger':'btn-outline-success'} btn-xs py-0 px-2" style="font-size:0.75rem;" onclick="toggleCatalogState(${item.id})">
                    ${item.active?'Desactivar (Soft Delete)':'Reactivar'}
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('form-admin-catalog').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-id').value;
        const price = parseInt(document.getElementById('cat-price').value);

        if(id) {
            const item = localDB.catalog.find(i => i.id == id);
            if(item.price !== price) {
                localDB.priceHistory.push({ catalogId: item.id, price: price, date: "2026-05-25" });
                alert("[POLÍTICA DE PRECIOS HISTÓRICOS]\n\nSe detectó variación en la tarifa actual. Se ha guardado el valor anterior en el histórico para salvaguardar los contratos pasados.");
            }
            item.name = document.getElementById('cat-name').value;
            item.category = document.getElementById('cat-category').value;
            item.price = price;
            item.shortDesc = document.getElementById('cat-short').value;
            item.longDesc = document.getElementById('cat-long').value;
        } else {
            const newItem = {
                id: Date.now(),
                name: document.getElementById('cat-name').value,
                category: document.getElementById('cat-category').value,
                price: price,
                shortDesc: document.getElementById('cat-short').value,
                longDesc: document.getElementById('cat-long').value,
                active: true
            };
            localDB.catalog.push(newItem);
        }
        navigate('admin-catalog');
    });
}

function loadCatalogEdit(id) {
    const item = localDB.catalog.find(i => i.id === id);
    document.getElementById('form-title').innerText = `Modificando Item: ${item.name}`;
    document.getElementById('edit-id').value = item.id;
    document.getElementById('cat-name').value = item.name;
    document.getElementById('cat-category').value = item.category;
    document.getElementById('cat-price').value = item.price;
    document.getElementById('cat-short').value = item.shortDesc;
    document.getElementById('cat-long').value = item.longDesc;
}

function toggleCatalogState(id) {
    const item = localDB.catalog.find(i => i.id === id);
    item.active = !item.active;
    alert(`Estado del ítem modificado a: ${item.active ? 'Activo' : 'Inactivo (Ocultado de nuevas ventas sin eliminación física)'}`);
    navigate('admin-catalog');
}

function renderAdminGoals(container) {
    container.innerHTML = `
        <h1 class="h2">Configuración Base de Metas y Semáforos</h1>
        <p class="text-muted small">Establece los mínimos corporativos diarios que regirán a la fuerza de ventas.</p>
        <div class="card p-4 bg-white shadow-sm">
            <form id="form-corporate-goals">
                <div id="goals-rows-container"></div>
                <button type="submit" class="btn btn-primary btn-sm mt-3 fw-bold">Guardar Estándar Global</button>
            </form>
        </div>
    `;

    const rContainer = document.getElementById('goals-rows-container');
    for (let stageId = 1; stageId <= 4; stageId++) {
        const goal = localDB.corporateGoals[stageId];
        const d = document.createElement('div');
        d.className = "row g-2 align-items-center mb-3 border-bottom pb-2";
        d.innerHTML = `
            <div class="col-md-3"><strong>Etapa ${stageId}: ${goal.name}</strong></div>
            <div class="col-md-2">
                <label class="small text-muted d-block">Meta Diaria</label>
                <input type="number" class="form-control form-control-sm" name="target_${stageId}" value="${goal.dailyTarget}" required>
            </div>
            <div class="col-md-2"><label class="small text-muted d-block">Techo Rojo %</label><input type="number" class="form-control form-control-sm" name="red_${stageId}" value="${goal.redMax}" required></div>
            <div class="col-md-2"><label class="small text-muted d-block">Techo Amar. %</label><input type="number" class="form-control form-control-sm" name="yellow_${stageId}" value="${goal.yellowMax}" required></div>
            <div class="col-md-3"><label class="small text-muted d-block">Piso Verde %</label><input type="number" class="form-control form-control-sm" name="green_${stageId}" value="${goal.greenMin}" required></div>
        `;
        rContainer.appendChild(d);
    }

    document.getElementById('form-corporate-goals').addEventListener('submit', (e) => {
        e.preventDefault();
        const f = new FormData(e.target);
        for (let stageId = 1; stageId <= 4; stageId++) {
            localDB.corporateGoals[stageId].dailyTarget = parseInt(f.get(`target_${stageId}`));
            localDB.corporateGoals[stageId].redMax = parseInt(f.get(`red_${stageId}`));
            localDB.corporateGoals[stageId].yellowMax = parseInt(f.get(`yellow_${stageId}`));
            localDB.corporateGoals[stageId].greenMin = parseInt(f.get(`green_${stageId}`));
        }
        alert("Líneas base corporativas actualizadas.");
        navigate('admin-catalog');
    });
}
