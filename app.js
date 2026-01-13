import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, arrayUnion, writeBatch, query, orderBy } from "firebase/firestore";

const firebaseConfig = { /* ... config ... */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// SCISSORING RENDERER CORE
const canvas = document.querySelector('#multiview-canvas');
const sidebar = document.querySelector('#sidebar'); // Mock selection if needed
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
const scenes = [];

function initSceneForCard(card, proj) {
    const el = card.querySelector('.viewer-3d-container');
    const sc = new THREE.Scene();

    // Tech Light Setup
    const l1 = new THREE.DirectionalLight(0xffffff, 2); l1.position.set(5, 10, 7); sc.add(l1);
    sc.add(new THREE.AmbientLight(0x555555));

    const cam = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 0.1, 100);
    cam.position.set(0, 1.5, 6);
    cam.lookAt(0, 0, 0);

    // BLUEPRINT STYLE: Dual-Mesh Group (Occlusion + Wireframe)
    const matSolid = new THREE.MeshBasicMaterial({
        color: 0x050505, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1
    });
    const matWire = new THREE.MeshBasicMaterial({
        color: 0x00f3ff, wireframe: true, transparent: true, opacity: 0.4
    });

    const geometry = new THREE.BoxGeometry(1, 1, 1);

    const meshSolid = new THREE.Mesh(geometry, matSolid);
    normalizeScale(meshSolid);

    const meshWire = new THREE.Mesh(geometry, matWire);
    meshWire.scale.copy(meshSolid.scale);

    const group = new THREE.Group();
    group.add(meshSolid); group.add(meshWire);
    sc.add(group);

    scenes.push({ scene: sc, camera: cam, element: el, mesh: group, projectId: proj.id });
}

function normalizeScale(m) {
    m.scale.set(1, 1, 1);
    m.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(m);
    const s = new THREE.Vector3(); b.getSize(s);
    const max = Math.max(s.x, s.y, s.z);
    if (max > 0) m.scale.setScalar(3.5 / max);
}

/* FLOATING STATUS BADGE (Mobile-Optimized) */
const style = document.createElement('style');
style.textContent = `
    #db-status { 
        position: fixed; top: 20px; right: 20px; z-index: 9999; 
        display: flex; align-items: center; gap: 8px; font-family: 'Rajdhani'; 
        font-weight: bold; background: rgba(0,0,0,0.8); padding: 5px 10px; 
        border-radius: 20px; border: 1px solid #333; 
    }
    @media (max-width: 768px) {
        #db-status { top: auto; bottom: 20px; right: 20px; font-size: 0.7rem; padding: 4px 8px; }
    }
`;
document.head.appendChild(style);
