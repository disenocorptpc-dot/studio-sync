
// State Management
let teamData = [];

// Defaults
const DEFAULT_DATA = [
    {
        id: '1',
        name: 'Ana Silva',
        role: 'Senior Industrial Designer',
        photo: 'https://ui-avatars.com/api/?name=Ana+Silva&background=0D8ABC&color=fff',
        status: 'active',
        currentProject: {
            title: 'Muebles MX - Silla Ergo',
            phase: 'Modelado 3D',
            deadline: '2026-01-15',
            notes: 'Ajustando curvatura del respaldo según feedback de ingeniería.'
        },
        pipeline: [
            { project: 'Lámpara Desk V2', phase: 'Bocetaje' },
            { project: 'Stand Expo', phase: 'Render' }
        ]
    },
    {
        id: '2',
        name: 'Carlos Ruiz',
        role: '3D Generalist',
        photo: 'https://ui-avatars.com/api/?name=Carlos+Ruiz&background=A371F7&color=fff',
        status: 'active',
        currentProject: {
            title: 'Render Comercial - Audífonos',
            phase: 'Renderizado',
            deadline: '2026-01-13',
            notes: 'Configurando iluminación de estudio para tomas macro.'
        },
        pipeline: [
            { project: 'Case Protector', phase: 'Texturizado' }
        ]
    }
];

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Load from local storage or use defaults
    const stored = localStorage.getItem('studioSync_data');
    if (stored) {
        teamData = JSON.parse(stored);
    } else {
        teamData = DEFAULT_DATA;
        saveToLocal();
    }

    renderApp();
    setupEventListeners();
}

// Rendering
function renderApp() {
    const grid = document.getElementById('designer-grid');
    grid.innerHTML = '';

    teamData.forEach(designer => {
        grid.innerHTML += createCardHTML(designer);
    });
}

function createCardHTML(designer) {
    const { id, name, role, photo, currentProject, pipeline } = designer;
    const daysLeft = calculateDaysLeft(currentProject.deadline);
    const deadlineClass = getDeadlineClass(daysLeft);
    const statusColor = getStatusColor(designer.status);

    const pipelineHTML = pipeline.map(p => `
        <div class="pipeline-item">
            <span>${p.project}</span>
            <span>${p.phase}</span>
        </div>
    `).join('');

    return `
        <article class="card" id="card-${id}">
            <div class="card-header">
                <div class="card-avatar" style="--status-color: ${statusColor}">
                    <img src="${photo}" alt="${name}">
                </div>
                <div class="card-identity">
                    <h3>${name}</h3>
                    <p>${role}</p>
                </div>
                <button class="edit-btn" onclick="window.openEditModal('${id}')">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
            </div>

            <div class="current-project">
                <div class="project-meta">
                    <span class="badge">${currentProject.phase}</span>
                    <span class="deadline-tracker">
                        <i class="fa-regular fa-clock"></i>
                        <span class="${deadlineClass}">${formatDaysText(daysLeft)}</span>
                    </span>
                </div>
                <h4 class="project-title">${currentProject.title}</h4>
                <div class="bitacora-preview" style="font-size: 0.8rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    <i class="fa-solid fa-align-left" style="font-size: 0.7rem; margin-right: 5px;"></i> ${currentProject.notes || 'Sin notas recientes'}
                </div>
            </div>

            <div class="pipeline">
                <h4>Siguiente en Cola</h4>
                ${pipelineHTML}
            </div>
        </article>
    `;
}

// Helper Logic
function calculateDaysLeft(dateString) {
    if (!dateString) return 999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateString + 'T00:00:00'); // Fix Timezone issues

    const diffTime = target - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getDeadlineClass(days) {
    if (days < 0) return 'text-danger urgent-pulse';
    if (days <= 2) return 'text-danger';
    if (days <= 5) return 'text-warning';
    return 'text-success';
}

function formatDaysText(days) {
    if (days < 0) return `${Math.abs(days)}d de retraso`;
    if (days === 0) return 'Entrega HOY';
    if (days === 1) return 'Mañana';
    return `${days} días`;
}

function getStatusColor(status) {
    return status === 'active' ? 'var(--success)' : 'var(--text-secondary)';
}

// Actions (Attached to Window for global access from HTML)
window.openEditModal = (id) => {
    const designer = teamData.find(d => d.id === id);
    if (!designer) return;

    // Populate Form
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-name').value = designer.name;
    document.getElementById('edit-project').value = designer.currentProject.title;
    document.getElementById('edit-phase').value = designer.currentProject.phase;
    document.getElementById('edit-deadline').value = designer.currentProject.deadline;
    document.getElementById('edit-log').value = designer.currentProject.notes || '';

    // Show
    document.getElementById('edit-modal').classList.add('active');
};

window.closeModal = () => {
    document.getElementById('edit-modal').classList.remove('active');
};

window.deleteCard = () => {
    const id = document.getElementById('edit-id').value;
    if (confirm('¿Eliminar a este diseñador del tablero?')) {
        teamData = teamData.filter(d => d.id !== id);
        saveToLocal();
        renderApp();
        window.closeModal();
    }
}

window.addNewCard = () => {
    const name = prompt("Nombre del nuevo diseñador:");
    if (!name) return;

    const newId = Date.now().toString();
    const newCard = {
        id: newId,
        name: name,
        role: 'Designer',
        photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        status: 'active',
        currentProject: {
            title: 'Nuevo Proyecto',
            phase: 'Bocetaje',
            deadline: new Date().toISOString().split('T')[0],
            notes: ''
        },
        pipeline: []
    };

    teamData.push(newCard);
    saveToLocal();
    renderApp();
};

window.toggleView = () => {
    alert("Vista de cronograma aún no implementada en MVP Local.");
}

// Form Handling
function setupEventListeners() {
    const form = document.getElementById('edit-form');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const id = document.getElementById('edit-id').value;
        const designer = teamData.find(d => d.id === id);

        if (designer) {
            designer.currentProject.title = document.getElementById('edit-project').value;
            designer.currentProject.phase = document.getElementById('edit-phase').value;
            designer.currentProject.deadline = document.getElementById('edit-deadline').value;
            designer.currentProject.notes = document.getElementById('edit-log').value;

            saveToLocal();
            renderApp();
            window.closeModal();
        }
    });

    // Close modal on outside click
    document.getElementById('edit-modal').addEventListener('click', (e) => {
        if (e.target.id === 'edit-modal') window.closeModal();
    });
}

function saveToLocal() {
    localStorage.setItem('studioSync_data', JSON.stringify(teamData));
    showSyncStatus();
}

function showSyncStatus() {
    const statusEl = document.getElementById('sync-status');
    statusEl.innerHTML = '<i class="fa-solid fa-check"></i> <span class="status-text">Guardado</span>';
    setTimeout(() => {
        statusEl.innerHTML = '<i class="fa-solid fa-cloud"></i> <span class="status-text">Local</span>';
    }, 2000);
}
