import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- 1. CONFIGURACIÓN FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyB5AO9mkc3qs3KZT0ZsqxcEIdHrrG7jPMw",
    authDomain: "studiosync-71756.firebaseapp.com",
    projectId: "studiosync-71756",
    storageBucket: "studiosync-71756.firebasestorage.app",
    messagingSenderId: "484459543444",
    appId: "1:484459543444:web:dbdb8af70d1ca7a6fe6d81",
    measurementId: "G-B8Q67D0SVR"
};

let app, db;
const TEAM_DOC_ID = "main_team";

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (error) {
    console.error("Firebase Error:", error);
}

// --- 2. DATA ---
const defaultTeam = [
    {
        id: "h1",
        name: "Homero",
        role: "Diseñador Industrial",
        hours: 0,
        currentProject: { title: "Stand Expo", status: "En Diseño", deadline: "15 Ene", tags: ["Diseño"], urgency: "NORMAL" },
        pendingTasks: ["Planos Técnicos", "Cotización Materiales"]
    },
    {
        id: "m1",
        name: "Maite",
        role: "Diseñador Ind.",
        hours: 0,
        currentProject: { title: "Empaque Eco", status: "Prototipado", deadline: "20 Ene", tags: ["Empaque"], urgency: "URGENTE" },
        pendingTasks: ["Renderizado"]
    },
    {
        id: "x1",
        name: "Michelle",
        role: "Diseñadora 3D",
        hours: 0,
        currentProject: { title: "Animación", status: "Rendering", deadline: "30 Ene", tags: ["3D"], urgency: "NORMAL" },
        pendingTasks: ["Modelado Personaje"]
    }
];
let team = [];

if (db) {
    onSnapshot(doc(db, "studiosync", TEAM_DOC_ID), (docSnap) => {
        if (document.getElementById('loading-message'))
            document.getElementById('loading-message').style.display = 'none';

        if (docSnap.exists()) {
            team = docSnap.data().members || [];
            if (team.length === 0) saveToCloud(defaultTeam);
            else {
                // Ensure legacy data has correct structure
                team.forEach(m => {
                    if (!m.currentProject) m.currentProject = { title: "Sin Asignar", status: "N/A", deadline: "", tags: [], urgency: "NORMAL" };
                    if (!m.pendingTasks) m.pendingTasks = m.pending || [];
                });
                renderApp();
            }
        } else {
            saveToCloud(defaultTeam);
        }
    });
}


// --- helper: Circular Progress SVG Generator (Vanilla Port) ---
function getCircleProgressHTML(percentage, size = 50) {
    const radius = 15.9155;
    // const circumference = 2 * Math.PI * radius; // ~100
    const color = percentage > 90 ? '#22c55e' : percentage > 50 ? '#eab308' : '#ef4444';

    return `
    <div class="progress-circle" style="width: ${size}px; height: ${size}px; position: relative; display: flex; align-items: center; justify-content: center;">
        <svg viewBox="0 0 36 36" style="display: block; width: 100%; height: 100%; transform: rotate(-90deg);">
            <path stroke="#30363d" stroke-width="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path stroke="${color}" stroke-width="3" stroke-dasharray="${percentage}, 100" stroke-linecap="round" fill="none" class="progress-path"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                  style="transition: stroke-dasharray 1s ease-out;" />
        </svg>
        <div style="position: absolute; color: white; font-family: monospace; font-weight: bold; font-size: ${size * 0.25}px;">
            ${Math.round(percentage)}%
        </div>
    </div>
    `;
}

// --- 2. DATA SYNCHRONIZATION (TIME TRACKER: SINGLE DOC ARCHITECTURE) ---
const trackerConfig = {
    apiKey: "AIzaSyAjxKauucl1VGHRP2AYCrnZHnEtM3cCg1U",
    authDomain: "timetracker-48916.firebaseapp.com",
    projectId: "timetracker-48916",
    storageBucket: "timetracker-48916.firebasestorage.app",
    messagingSenderId: "970718205478",
    appId: "1:970718205478:web:e2dafab690cd4490f738e7",
    measurementId: "G-LPBXS9MZZ5"
};

// Initialize Secondary App
try {
    const trackerApp = initializeApp(trackerConfig, "timeTrackerApp");
    const trackerDb = getFirestore(trackerApp);
    syncRealTimeHours(trackerDb);
} catch (e) {
    console.warn("Tracker App Init Warn:", e);
}

// Mapping: Studio Sync Name -> Time Tracker Key
const NAME_MAPPING = {
    "Homero": "Homero Hernandez",
    "Michelle": "Mitchell Pous",
    "Maite": "Esther Franco"
};

// We don't need to re-import doc/getDoc if they are already imported at the top of the file.
// However, since we are using ES modules via CDN URL imports in this file structure,
// let's just make sure we use the ones likely already available or import them cleaner.
// Checking previous file content, it seems we import 'doc' for the main app logic too.
// Let's assume we need to import them here but avoid 'const doc = ...' conflict if it was blindly pasted.
// Actually, the error is likely due to "import { doc ... }" appearing twice in the same scope/module type.

// FIX: Remove the second import line entirely and rely on the TOP of the file import,
// OR rename the import if this is a script tag module.
// Since I can't see the top of the file right now, I will use a safe dynamic import approach or just assume
// we should consolidate.
// Better yet: I will use the fully qualified names from the existing firebase import or just remove this line
// if I'm sure it's up there.
// Let's try removing it and adding it to the TOP if missing, but for now, just removing the colliding line.

// (Attempting to use the already imported functions, or re-importing with alias if needed)
import { doc as docRefGen, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function syncRealTimeHours(trackerDb) {
    if (!trackerDb) return;

    console.log("📡 Conectando con TimeTracker...");

    try {
        // Fetch Single Document Architecture
        const dRef = docRefGen(trackerDb, "studio_tracker_v3", "main_db");
        const docSnap = await getDoc(dRef);

        if (!docSnap.exists()) {
            console.warn("⚠️ No se encontró la DB de TimeTracker");
            return;
        }

        const data = docSnap.data();
        const allTasksMap = data.tasks || {};

        // 2. Calculate Hours per Team Member
        // Dynamic Month Calculation could be added here later
        const currentMonthName = "Enero";

        let updatesFound = false;

        team.forEach(member => {
            const trackerKey = NAME_MAPPING[member.name];
            if (!trackerKey) return;

            const userTasks = allTasksMap[trackerKey] || [];

            // Filter by Month
            const monthTasks = userTasks.filter(t => t.month === currentMonthName);

            // Sum Hours
            const totalHours = monthTasks.reduce((acc, t) => {
                const h = parseFloat(String(t.hours || 0));
                return acc + (isNaN(h) ? 0 : h);
            }, 0);

            // Update only if changed to avoid unnecessary re-renders
            if (member.hours !== totalHours) {
                console.log(`📊 Actualizando horas de ${member.name}: ${totalHours.toFixed(1)}h`);
                member.hours = totalHours;
                updatesFound = true;
            }
        });

        if (updatesFound) {
            renderApp();
            saveToCloud(team);
            showToast("Horas Sincronizadas", false);
        }

    } catch (error) {
        console.error("Sync Error:", error);
        // Silent fail for user experience unless critical
    }
}

// --- 3. RENDER UI ---
// --- 3. RENDER UI ---
function renderApp() {
    const container = document.getElementById('designerGrid');
    if (!container) return; // Silent fail if DOM not ready

    container.innerHTML = '';

    team.forEach((member, index) => {
        const diff = new Date(member.currentProject.deadline) - new Date().setHours(0, 0, 0, 0);
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

        let status = { color: 'alert-green', text: `${days} días`, icon: 'fa-regular fa-clock' };
        if (days < 0) status = { color: 'alert-red', text: 'ATRASADO', icon: 'fa-solid fa-triangle-exclamation' };
        else if (days <= 2) status = { color: 'alert-yellow', text: 'URGENTE', icon: 'fa-solid fa-hourglass-half' };

        // Progress Calculation using REAL HOURS fetched from Cloud
        const loggedHours = member.hours || 0;
        const percentage = Math.min((loggedHours / 160) * 100, 100);
        const progressHTML = getCircleProgressHTML(percentage);

        const card = document.createElement('div');
        card.className = 'glass-panel card-hover';
        card.innerHTML = `
            <div class="card-header">
                <div style="display: flex; gap: 15px; align-items: center;">
                    <div class="avatar-ring">
                        <img src="${member.avatar}" alt="${member.name}" class="avatar">
                    </div>
                    <div>
                        <h2 class="text-xl font-bold">${member.name}</h2>
                        <p class="text-xs text-gray-400 uppercase tracking-wider">${member.role}</p>
                    </div>
                </div>
                <div style="display: flex; gap: 15px; align-items: center;">
                    <div class="flex flex-col items-center" style="display:flex; flex-direction:column; align-items:center;">
                        ${progressHTML}
                        <span style="font-size:10px; color:#6b7280; margin-top:4px; font-family:monospace;">${loggedHours.toFixed(0)}h</span>
                    </div>
                    <button class="edit-btn" onclick="window.openModal('${member.id}')"><i class="fa-solid fa-pen"></i></button>
                </div>
            </div>

            <div class="project-status mb-6">
                <p class="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wide">PROYECTO ACTUAL (CLICK PARA EDITAR)</p>
                <div class="project-title-editor" onclick="window.editProjectTitle('${member.id}')">
                    <h3 class="text-xl font-bold text-[#00f2ff] mb-2 truncate">${member.currentProject.title}</h3>
                    <i class="fa-solid fa-pencil text-gray-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity"></i>
                </div>
                <div class="flex flex-wrap gap-2 mb-3">
                    ${member.currentProject.tags.map(tag =>
            `<span class="px-2 py-1 rounded text-xs font-bold bg-[#0d1117] text-[#00f2ff] border border-[#00f2ff]/30">${tag}</span>`
        ).join('')}
                </div>
                
                <div class="grid grid-cols-2 gap-4 text-xs text-gray-400">
                    <div>
                        <span class="block text-gray-600 mb-1">Dirección</span>
                        ${member.currentProject.status}
                    </div>
                    <div class="text-right">
                         <span class="block text-gray-600 mb-1">ENTREGA</span>
                        <span class="${member.currentProject.urgency === 'URGENTE' ? 'text-black bg-[#eab308] px-2 py-0.5 rounded font-bold' : 'text-white'}">
                            ${member.currentProject.urgency === 'URGENTE' ? '<i class="fa-solid fa-hourglass-half mr-1"></i>URGENTE' : member.currentProject.deadline}
                        </span>
                    </div>
                </div>
            </div>

            <div class="pending-section">
                <div class="flex justify-between items-center mb-3">
                    <p class="text-xs text-gray-500 font-bold uppercase tracking-wide">PENDIENTES (ARRASTRAR PARA ORDENAR)</p>
                    <button class="text-blue-400 hover:text-blue-300 transition-colors" onclick="window.addPendingTask('${member.id}')">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                </div>
                
                <div class="space-y-2 min-h-[50px]" ondrop="window.handleDrop(event, '${member.id}')" ondragover="window.handleDragOver(event)">
                    ${member.pendingTasks.map((task, i) => `
                        <div class="pending-item bg-[#0d1117] p-3 rounded border border-[#30363d] flex justify-between items-center group draggable" 
                             draggable="true" 
                             ondragstart="window.handleDragStart(event, '${member.id}', ${i})"
                             data-member-id="${member.id}"
                             data-index="${i}">
                             
                            <div class="flex items-center gap-3 overflow-hidden">
                                <i class="fa-solid fa-grip-vertical text-gray-700 cursor-grab"></i>
                                
                                <!-- PROMOTE BUTTON (NEW) -->
                                <button onclick="window.promoteTask('${member.id}', ${i})" 
                                        class="text-gray-600 hover:text-[#00f2ff] transition-colors" 
                                        title="Promover a Proyecto Actual">
                                    <i class="fa-solid fa-arrow-up-from-bracket"></i>
                                </button>
                                
                                <span class="truncate text-gray-300 text-sm">${task}</span>
                            </div>
                            
                            <button onclick="window.removePendingTask('${member.id}', ${i})" 
                                    class="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}
// Minimal toast function to avoid errors
function showToast(message, isError) {
    console.log("Toast:", message, isError ? "(Error)" : "");
    // In a real app, you'd display a UI element here
}

// --- 4. GLOBAL HELPERS ---
async function saveToCloud(newData) {
    try { await setDoc(doc(db, "studiosync", TEAM_DOC_ID), { members: newData }); }
    catch (e) { console.error(e); }
}

window.updateField = async (id, field, value) => {
    const idx = team.findIndex(m => m.id === id);
    if (idx > -1 && team[idx][field] !== value.trim()) {
        team[idx][field] = value.trim();
        await saveToCloud(team);
    }
};

// --- 5. INTERACTION HANDLERS (CORRECT SCEMA) ---

// Drag & Drop
window.handleDragStart = (e, mId, idx) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ mId, idx }));
    e.target.style.opacity = '0.4';
};
window.handleDragOver = (e) => e.preventDefault();
window.handleDragEnter = (e) => e.target.classList.add('over');
window.handleDragLeave = (e) => e.target.classList.remove('over');
window.handleDrop = async (e, targetMId) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    // Simple verification
    if (data.mId !== targetMId) return;

    // For now, simpler reorder: Move to end (since we don't track drop index precisely in container drop)
    // Ideally we'd drop on a specific item to swap.
    // Let's implement specific swap if needed, but for now appends.
    const member = team.find(m => m.id === targetMId);
    const item = member.pendingTasks.splice(data.index, 1)[0];
    member.pendingTasks.push(item);

    await saveToCloud(team);
    renderApp();
};

// Pending Tasks
window.addPendingTask = async (id) => {
    const txt = prompt("Nueva tarea:");
    if (!txt) return;
    const idx = team.findIndex(m => m.id === id);
    if (!team[idx].pendingTasks) team[idx].pendingTasks = [];
    team[idx].pendingTasks.push(txt);
    await saveToCloud(team);
    renderApp();
};

window.removePendingTask = async (id, i) => {
    if (!confirm("¿Eliminar tarea?")) return;
    const idx = team.findIndex(m => m.id === id);
    team[idx].pendingTasks.splice(i, 1);
    await saveToCloud(team);
    renderApp();
};

window.promoteTask = async (memberId, taskIndex) => {
    const member = team.find(m => m.id === memberId);
    if (!member) return;

    const taskToPromote = member.pendingTasks[taskIndex];
    if (!taskToPromote) return;

    // Swap: Old Project Title -> Top of Pending
    if (member.currentProject.title && member.currentProject.title !== "Proyecto Actual") {
        member.pendingTasks.unshift(member.currentProject.title);
        // The task to promote was at taskIndex.
        // If we unshifted, the array length increased by 1.
        // Effectively the task at taskIndex is now at taskIndex + 1
        taskIndex++;
    }

    member.currentProject.title = taskToPromote;
    member.pendingTasks.splice(taskIndex, 1);

    await saveToCloud(team);
    renderApp();
    showToast("Tarea promovida");
};

// Modals & Editing
window.openModal = (id) => {
    const m = team.find(x => x.id === id);
    if (!m) return;
    const modal = document.getElementById('editModal');
    if (!modal) return;

    document.getElementById('editId').value = m.id;
    document.getElementById('editProject').value = m.currentProject?.title || '';
    document.getElementById('editPhase').value = (m.currentProject?.tags || []).join(', ');
    document.getElementById('editClient').value = m.role;
    document.getElementById('editDate').value = m.currentProject?.deadline || '';

    // Vacation fields if they exist in schema
    if (document.getElementById('editVacationStart')) {
        document.getElementById('editVacationStart').value = m.vacationStart || '';
        document.getElementById('editVacationEnd').value = m.vacationEnd || '';
    }

    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
};

window.closeModal = () => {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 200);
    }
};

window.handleSave = async (e) => {
    e.preventDefault();
    const id = document.getElementById('editId').value;
    const idx = team.findIndex(m => m.id === id);
    if (idx > -1) {
        team[idx].currentProject.title = document.getElementById('editProject').value;
        const tags = document.getElementById('editPhase').value.split(',').map(s => s.trim()).filter(s => s);
        team[idx].currentProject.tags = tags;
        team[idx].currentProject.deadline = document.getElementById('editDate').value;

        // Vacation
        if (document.getElementById('editVacationStart')) {
            team[idx].vacationStart = document.getElementById('editVacationStart').value;
            team[idx].vacationEnd = document.getElementById('editVacationEnd').value;
        }

        await saveToCloud(team);
        window.closeModal();
        renderApp();
    }
};

window.editProjectTitle = async (id) => {
    const newTitle = prompt("Editar Título del Proyecto:");
    if (newTitle) {
        const idx = team.findIndex(m => m.id === id);
        team[idx].currentProject.title = newTitle;
        await saveToCloud(team);
        renderApp();
    }
}
