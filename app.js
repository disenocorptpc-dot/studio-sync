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
    { id: "h1", name: "Homero", role: "Diseñador Industrial", pending: ["Stand Expo"] },
    { id: "m1", name: "Maite", role: "Diseñador Ind.", pending: ["Empaque Eco"] },
    { id: "x1", name: "Michelle", role: "Diseñadora 3D", pending: ["Animación"] }
];
let team = [];

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

// --- 2. DATA SYNCHRONIZATION (TIME TRACKER: CLOUD NATIVE) ---
// Config provided by user for "Time Tracker" project
const trackerConfig = {
    apiKey: "AIzaSyAjxKauucl1VGHRP2AYCrnZHnEtM3cCg1U",
    authDomain: "timetracker-48916.firebaseapp.com",
    projectId: "timetracker-48916",
    storageBucket: "timetracker-48916.firebasestorage.app",
    messagingSenderId: "970718205478",
    appId: "1:970718205478:web:e2dafab690cd4490f738e7",
    measurementId: "G-LPBXS9MZZ5"
};

// Initialize Secondary App (Named instance to avoid conflict with main app)
try {
    const trackerApp = initializeApp(trackerConfig, "timeTrackerApp");
    const trackerDb = getFirestore(trackerApp);

    // Initial Sync
    syncRealTimeHours(trackerDb);
} catch (e) {
    console.error("Tracker Auth Error:", e);
}

const NAME_MAPPING = {
    "Homero": "Homero",
    "Michelle": "Mitchell",
    "Maite": "Esther"        // Assuming Esther matches Maite based on context
};

import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function syncRealTimeHours(trackerDb) {
    console.log("📡 Conectando con Time Tracker DB...");
    try {
        // We try reading from 'users' collection which is standard. 
        // If the collection is named differently (e.g. 'employees'), this needs to be updated.
        const querySnapshot = await getDocs(collection(trackerDb, "users"));

        let updatesFound = false;

        // Create a map of TrackerName -> Data for O(1) lookup
        const trackerData = {};
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Assuming the doc has 'name' and 'totalMonthlyHours' or similar
            // We'll log the data structure first to be sure in console
            console.log("Tracker Doc:", data);
            if (data.name) trackerData[data.name] = data;
        });

        team.forEach(member => {
            const targetName = NAME_MAPPING[member.name] || member.name;
            const tData = trackerData[targetName];

            if (tData) {
                // Look for a likely field for hours. Adjust 'accumulated_hours' based on real DB field
                // Common schemes: 'hours', 'totalHours', 'monthlyHours'
                // We'll try to find a numeric field that looks like hours
                const foundHours = tData.hours || tData.totalHours || tData.accumulated_hours || 0;

                console.log(`✅ ${member.name} -> ${targetName}: ${foundHours}h`);

                if (member.hours !== foundHours) {
                    member.hours = foundHours;
                    updatesFound = true;
                }
            } else {
                console.warn(`⚠️ ${member.name}: No encontrado en colección 'users' de Tracker.`);
            }
        });

        if (updatesFound) {
            renderApp();
            saveToCloud(team); // Save the fetched hours to our local DB cache
            showToast("Sincronizado con BD Real", false);
        }

    } catch (error) {
        console.error("Error al leer Tracker DB:", error);
        // Fallback: If 'users' fails, maybe try 'employees' or show error
        if (error.code === 'permission-denied') {
            showToast("Error de Permisos en Tracker DB", true);
        } else {
            showToast("Error conectando a Tracker DB", true);
        }
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
                <i class="fa-solid fa-grip-vertical" style="color:rgba(255,255,255,0.2); margin-right:8px; cursor:grab;"></i>
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
if (db) {
    onSnapshot(doc(db, "studiosync", TEAM_DOC_ID), (docSnap) => {
        if (document.getElementById('loading-message'))
            document.getElementById('loading-message').style.display = 'none';

        if (docSnap.exists()) {
            team = docSnap.data().members || [];
            if (team.length === 0) saveToCloud(defaultTeam);
            else {
                renderApp();
                // Trigger sync after load
                syncWithTimeTracker();
            }
        } else {
            saveToCloud(defaultTeam);
            renderApp();
            syncWithTimeTracker();
        }
    });
}
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
