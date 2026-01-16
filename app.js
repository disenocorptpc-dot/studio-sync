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
// --- 2. DATA ---
// RECOVERED DATA FROM SCREENSHOT (16/01/2026)
const defaultTeam = [
    {
        id: "h1", name: "Homero", role: "Diseñador Industrial",
        pending: [
            "Cambios Logos MPPC",
            "Señalización Baglioni",
            "Diseño de Carritos de comida",
            "Señalización Ciudad palace"
        ],
        project: "Sin Asignar", phase: "Dirección N/A", client: "Cliente",
        deadline: new Date().toISOString().split('T')[0],
        hours: 50, // Snapshot value
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Homero" // Placeholder until real URL is restored if available
    },
    {
        id: "m1", name: "Maite", role: "Diseñador Ind.",
        pending: [
            "Señalización Baglioni",
            "Ronda de Buffets MPPC",
            "Señalización Buffet Caribeño",
            "Corrección antifaces LBcab"
        ],
        project: "Sin Asignar", phase: "Dirección N/A", client: "Cliente",
        deadline: new Date().toISOString().split('T')[0],
        hours: 0,
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maite&hair=long&skinColor=brown" // Attempt to match memoji
    },
    {
        id: "x1", name: "Michelle", role: "Diseñadora 3D",
        pending: [
            "Nuevo totem para MPPC Wonderwoods",
            "Diseño de Catrin y nvas Catrinas",
            "Postres Wonderwoods"
        ],
        project: "Sin Asignar", phase: "Dirección N/A", client: "Cliente",
        deadline: new Date().toISOString().split('T')[0],
        hours: 200, // Snapshot value
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michelle&hair=long&skinColor=light" // Attempt to match memoji
    }
];
let team = [];

// (Original onSnapshot removed - using consolidated one below)

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

// --- 2. DATA ---
// ... (defaultTeam definition remains the same)

// Initialize Secondary App (Moved globally but called later)
let trackerDb;
try {
    const trackerApp = initializeApp(trackerConfig, "timeTrackerApp");
    trackerDb = getFirestore(trackerApp);
} catch (e) {
    console.warn("Tracker App Init Warn:", e);
}

if (db) {
    onSnapshot(doc(db, "studiosync", TEAM_DOC_ID), (docSnap) => {
        if (document.getElementById('loading-message'))
            document.getElementById('loading-message').style.display = 'none';

        if (docSnap.exists()) {
            // FORCE RESTORE: Ignore Cloud Data for now, overwrite with Recovered Data
            // team = docSnap.data().members || [];
            team = defaultTeam;
            saveToCloud(team); // FORCE PUSH TO CLOUD

            renderApp();

            // CRITICAL FIX: Sync hours ONLY after team data is loaded
            if (trackerDb) syncRealTimeHours(trackerDb);

        } else {
            console.warn("No cloud data found. Using local defaults.");
            team = defaultTeam;
            // ONE-TIME RESTORE: Saving recovered data to cloud
            saveToCloud(defaultTeam);
            renderApp();
        }
    }, (error) => {
        console.error("Error reading Cloud Data:", error);
        showToast("Error de conexión", true);
    });
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
function renderApp() {
    const grid = document.getElementById('designerGrid');
    if (!grid) return;

    let html = '';
    team.forEach((member, index) => {
        const diff = new Date(member.deadline) - new Date().setHours(0, 0, 0, 0);
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

        let status = { color: 'alert-green', text: `${days} días`, icon: 'fa-regular fa-clock' };
        if (days < 0) status = { color: 'alert-red', text: 'ATRASADO', icon: 'fa-solid fa-triangle-exclamation' };
        else if (days <= 2) status = { color: 'alert-yellow', text: 'URGENTE', icon: 'fa-solid fa-hourglass-half' };

        // Progress Calculation using REAL HOURS fetched from Cloud
        const loggedHours = member.hours || 0;
        const percentage = Math.min((loggedHours / 160) * 100, 100);
        const progressHTML = getCircleProgressHTML(percentage);

        // Pending List (Drag & Drop)
        const pending = Array.isArray(member.pending) ? member.pending : [];
        const pendingHtml = pending.map((p, i) => `
            <li class="pending-item" 
                draggable="true"
                ondragstart="window.dragStart(event, '${member.id}', ${i})"
                ondragover="window.dragOver(event)"
                ondrop="window.dragDrop(event, '${member.id}', ${i})"
                ondragenter="this.classList.add('drag-over')"
                ondragleave="this.classList.remove('drag-over')"
            >
                <div style="display:flex; align-items:center;">
                    <i class="fa-solid fa-grip-vertical" style="color:rgba(255,255,255,0.2); margin-right:8px; cursor:grab;"></i>
                    <button onclick="window.promoteTask('${member.id}', ${i})" 
                            title="Promover a Proyecto Actual" 
                            style="background:none; border:none; color:#4b5563; cursor:pointer; margin-right:8px;"
                            onmouseover="this.style.color='#00f2ff'" onmouseout="this.style.color='#4b5563'">
                        <i class="fa-solid fa-arrow-up-from-bracket"></i>
                    </button>
                </div>
                <span contenteditable="true" 
                      onblur="window.updatePendingText('${member.id}', ${i}, this.innerText)"
                      onkeydown="if(event.key==='Enter'){event.preventDefault(); this.blur();}"
                      style="flex:1; margin-right:8px;">${p}</span> 
                <button class="delete-task-btn" onclick="window.deletePending('${member.id}', ${i})" title="Eliminar">
                    <i class="fa-solid fa-times"></i>
                </button>
            </li>
        `).join('');

        // Vacation
        let vacationHtml = '';
        if (member.vacationStart && member.vacationEnd) {
            const start = new Date(member.vacationStart + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
            const end = new Date(member.vacationEnd + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
            vacationHtml = `<div style="margin-top:16px; padding:10px; background:rgba(59,130,246,0.1); border-radius:8px; font-size:13px; color:#93c5fd;">
                 <i class="fa-solid fa-plane"></i> Vacaciones: ${start} al ${end}
             </div>`;
        }

        html += `
        <article class="designer-card" id="card-${member.id}">
            <div class="card-header-flex">
                <div class="user-info-group">
                    <img src="${member.avatar || 'https://api.dicebear.com/7.x/avataaars/svg'}" class="avatar">
                    <div class="user-text">
                        <h2>${member.name}</h2>
                        <p>${member.role}</p>
                    </div>
                </div>
                
                <!-- PROGRESS & EDIT CONTAINER -->
                <div style="display: flex; gap: 15px; align-items: center;">
                    <div class="flex flex-col items-center" style="display:flex; flex-direction:column; align-items:center;">
                        ${progressHTML}
                        <span style="font-size:10px; color:#6b7280; margin-top:4px; font-family:monospace;">${loggedHours}h</span>
                    </div>
                    <button class="edit-btn" onclick="window.openModal('${member.id}')"><i class="fa-solid fa-pen"></i></button>
                </div>
            </div>

            <div class="work-box" style="margin-top:15px">
                <span class="section-label">PROYECTO ACTUAL (CLICK PARA EDITAR)</span>
                <div class="project-title" contenteditable="true" 
                     onblur="window.updateField('${member.id}', 'project', this.innerText)">${member.project || 'Sin Asignar'}</div>
                
                <span class="pill" contenteditable="true"
                      onblur="window.updateField('${member.id}', 'phase', this.innerText)">${member.phase || 'N/A'}</span>
                
                <p class="client-name" contenteditable="true"
                   onblur="window.updateField('${member.id}', 'client', this.innerText)">${member.client || 'Cliente'}</p>

                <div style="display:flex; justify-content:space-between; margin-top:10px; align-items:center;">
                    <span class="section-label">ENTREGA</span>
                    <div class="alert-badge ${status.color}" onclick="window.openModal('${member.id}')" style="cursor:pointer">
                        <i class="${status.icon}"></i> ${status.text}
                    </div>
                </div>
            </div>

            <div style="margin-top:15px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="section-label">PENDIENTES (ARRASTRAR PARA ORDENAR)</span>
                    <button onclick="window.addPending('${member.id}')" style="color:#3b82f6; background:none; border:none; cursor:pointer;">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                </div>
                <ul class="pending-list">${pendingHtml}</ul>
            </div>
            ${vacationHtml}
        </article>
        `;
    });

    grid.innerHTML = html;
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

if (db) {
    onSnapshot(doc(db, "studiosync", TEAM_DOC_ID), (docSnap) => {
        if (document.getElementById('loading-message'))
            document.getElementById('loading-message').style.display = 'none';

        if (docSnap.exists()) {
            team = docSnap.data().members || [];
            if (team.length === 0) saveToCloud(defaultTeam);
            else renderApp();
        } else {
            saveToCloud(defaultTeam);
        }
    });
}
// Minimal toast function to avoid errors
function showToast(message, isError) {
    console.log("Toast:", message, isError ? "(Error)" : "");
    // In a real app, you'd display a UI element here
}
// (Duplicate onSnapshot removed)
// --- DRAG & DROP LOGIC ---
let draggedItem = null;
window.dragStart = (e, mId, idx) => { draggedItem = { mId, idx }; e.target.classList.add('dragging'); };
window.dragOver = (e) => { e.preventDefault(); };
window.dragDrop = async (e, tId, tIdx) => {
    e.preventDefault();
    document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));

    if (!draggedItem || draggedItem.mId !== tId || draggedItem.idx === tIdx) return;

    const idx = team.findIndex(m => m.id === tId);
    const newPending = [...team[idx].pending];
    const item = newPending.splice(draggedItem.idx, 1)[0];
    newPending.splice(tIdx, 0, item);

    team[idx].pending = newPending;
    await saveToCloud(team);
    draggedItem = null;
};

// --- Modal & Other actions ---
// --- Modal & Other actions ---
window.updatePendingText = async (id, i, txt) => {
    const idx = team.findIndex(m => m.id === id);
    if (idx > -1) { team[idx].pending[i] = txt.trim(); await saveToCloud(team); }
};
window.deletePending = async (id, i) => {
    if (!confirm('¿Borrar?')) return;
    const idx = team.findIndex(m => m.id === id);
    team[idx].pending.splice(i, 1);
    await saveToCloud(team);
};
window.addPending = async (id) => {
    const txt = prompt("Nueva tarea:");
    if (txt) {
        const idx = team.findIndex(m => m.id === id);
        if (!team[idx].pending) team[idx].pending = [];
        team[idx].pending.push(txt);
        await saveToCloud(team);
    }
};

// NEW: Promote Task Feature
window.promoteTask = async (id, i) => {
    const idx = team.findIndex(m => m.id === id);
    if (idx > -1) {
        const member = team[idx];
        const taskToPromote = member.pending[i];
        const oldProject = member.project;

        // 1. Remove from pending
        member.pending.splice(i, 1);

        // 2. Set as new project module
        member.project = taskToPromote;

        // 3. Move old project to top of pending (if valid)
        if (oldProject && oldProject !== 'Sin Asignar' && oldProject.trim() !== '') {
            member.pending.unshift(oldProject);
        }

        await saveToCloud(team);
    }
};

// Modal Logic
window.openModal = (id) => {
    const m = team.find(x => x.id === id);
    if (!m) return;
    document.getElementById('editId').value = m.id;
    document.getElementById('editProject').value = m.project;
    document.getElementById('editPhase').value = m.phase || '';
    document.getElementById('editClient').value = m.client;
    document.getElementById('editDate').value = m.deadline;
    document.getElementById('editVacationStart').value = m.vacationStart || '';
    document.getElementById('editVacationEnd').value = m.vacationEnd || '';
    document.getElementById('editModal').style.display = 'flex';
    setTimeout(() => document.getElementById('editModal').classList.add('active'), 10);
};
window.closeModal = () => {
    document.getElementById('editModal').classList.remove('active');
    setTimeout(() => document.getElementById('editModal').style.display = 'none', 200);
};
window.handleSave = async (e) => {
    e.preventDefault();
    const id = document.getElementById('editId').value;
    const idx = team.findIndex(m => m.id === id);
    if (idx > -1) {
        team[idx].project = document.getElementById('editProject').value;
        team[idx].phase = document.getElementById('editPhase').value;
        team[idx].client = document.getElementById('editClient').value;
        team[idx].deadline = document.getElementById('editDate').value;
        team[idx].vacationStart = document.getElementById('editVacationStart').value;
        team[idx].vacationEnd = document.getElementById('editVacationEnd').value;
        await saveToCloud(team);
        window.closeModal();
    }
};
