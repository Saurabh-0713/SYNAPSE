// ========== IMPORTS FOR THREE.JS ==========
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';

// ========== API CONFIGURATION ==========
const API_BASE_URL = 'http://localhost:5001/api';

// ========== MOBILE MENU TOGGLE ==========
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navMenu = document.querySelector('.nav-menu');

mobileMenuToggle.addEventListener('click', () => {
  navMenu.classList.toggle('active');
  const isExpanded = navMenu.classList.contains('active');
  mobileMenuToggle.setAttribute('aria-expanded', isExpanded);
  
  const icon = mobileMenuToggle.querySelector('i');
  icon.classList.toggle('fa-bars');
  icon.classList.toggle('fa-times');
});

navMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('active');
    mobileMenuToggle.setAttribute('aria-expanded', 'false');
    const icon = mobileMenuToggle.querySelector('i');
    icon.classList.remove('fa-times');
    icon.classList.add('fa-bars');
  });
});

// ========== SCROLL ANIMATION FOR SECTIONS ==========
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.section').forEach(section => {
  observer.observe(section);
});

// ========== THREE.JS 3D NEURON SETUP ==========
const container = document.getElementById("neuron-canvas");
const loadingText = container.querySelector('.loading-text');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  50, 
  container.clientWidth / container.clientHeight, 
  0.1, 
  1000
);
camera.position.set(0, 0, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.autoRotate = true;
controls.autoRotateSpeed = 1.5;
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 3;
controls.maxDistance = 10;
controls.enablePan = false;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xff4500, 2);
keyLight.position.set(5, 3, 5);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x4488ff, 0.5);
fillLight.position.set(-5, 0, -3);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xff4500, 1.5);
rimLight.position.set(0, -5, -5);
scene.add(rimLight);

let model = null;
let isModelLoaded = false;

function createFallbackNeuron() {
  console.log("Creating fallback neuron visualization");
  
  const group = new THREE.Group();
  
  const bodyGeometry = new THREE.SphereGeometry(1, 32, 32);
  const bodyMaterial = new THREE.MeshPhongMaterial({
    color: 0xff4500,
    emissive: 0xff4500,
    emissiveIntensity: 0.2,
    shininess: 100,
    transparent: true,
    opacity: 0.8
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  group.add(body);
  
  const glowGeometry = new THREE.SphereGeometry(0.9, 32, 32);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xff6347,
    transparent: true,
    opacity: 0.3
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  group.add(glow);
  
  const spikeGeometry = new THREE.ConeGeometry(0.05, 0.5, 8);
  const spikeMaterial = new THREE.MeshPhongMaterial({
    color: 0xff6347,
    emissive: 0xff4500,
    emissiveIntensity: 0.15
  });
  
  for (let i = 0; i < 20; i++) {
    const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
    const phi = Math.acos(-1 + (2 * i) / 20);
    const theta = Math.sqrt(20 * Math.PI) * phi;
    
    spike.position.setFromSphericalCoords(1.25, phi, theta);
    spike.lookAt(0, 0, 0);
    spike.rotateX(Math.PI / 2);
    
    group.add(spike);
  }
  
  const axonGeometry = new THREE.CylinderGeometry(0.08, 0.05, 2, 12);
  const axonMaterial = new THREE.MeshPhongMaterial({
    color: 0xff4500,
    emissive: 0xff4500,
    emissiveIntensity: 0.15
  });
  const axon = new THREE.Mesh(axonGeometry, axonMaterial);
  axon.position.set(0, -1.5, 0);
  group.add(axon);
  
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const terminal = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      axonMaterial
    );
    terminal.position.set(
      Math.cos(angle) * 0.3,
      -2.5,
      Math.sin(angle) * 0.3
    );
    group.add(terminal);
  }
  
  model = group;
  isModelLoaded = true;
  scene.add(group);
  
  if (loadingText) {
    loadingText.innerHTML = '<div>Procedural Neuron Visualization</div>';
    setTimeout(() => {
      loadingText.style.opacity = '0';
      setTimeout(() => {
        loadingText.style.display = 'none';
      }, 500);
    }, 2000);
  }
  
  console.log("✓ Fallback neuron created successfully");
}

const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 100;
const posArray = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i++) {
  posArray[i] = (Math.random() - 0.5) * 15;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

const particlesMaterial = new THREE.PointsMaterial({
  size: 0.02,
  color: 0xff4500,
  transparent: true,
  opacity: 0.3,
  blending: THREE.AdditiveBlending
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

function animate() {
  requestAnimationFrame(animate);
  
  if (model && isModelLoaded) {
    model.rotation.y += 0.005;
    model.position.y = Math.sin(Date.now() * 0.001) * 0.05;
  }
  
  particlesMesh.rotation.y += 0.0005;
  particlesMesh.rotation.x += 0.0003;
  
  controls.update();
  renderer.render(scene, camera);
}

animate();

const loader = new GLTFLoader();
let modelLoadTimeout = setTimeout(() => {
  console.warn("Model loading timeout (5s) - using fallback");
  createFallbackNeuron();
}, 5000);

const possiblePaths = [
  "assets/neuron.glb",
  "./assets/neuron.glb",
  "../assets/neuron.glb",
  "neuron.glb"
];

let currentPathIndex = 0;

function updateLoadingProgress(percent) {
  if (loadingText) {
    loadingText.innerHTML = `
      <div>Loading 3D Model...</div>
      <div style="margin-top: 0.5rem; font-size: 1.2rem;">${percent}%</div>
    `;
  }
}

function tryLoadModel(path) {
  console.log(`Attempting to load: ${path}`);
  
  loader.load(
    path,
    (gltf) => {
      clearTimeout(modelLoadTimeout);
      console.log("✓ GLB loaded successfully from:", path);
      
      if (loadingText) {
        loadingText.style.opacity = '0';
        setTimeout(() => {
          loadingText.style.display = 'none';
        }, 500);
      }
      
      model = gltf.scene;
      isModelLoaded = true;

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);

      const size = box.getSize(new THREE.Vector3());
      const maxAxis = Math.max(size.x, size.y, size.z);
      model.scale.multiplyScalar(2.5 / maxAxis);

      scene.add(model);
      
      console.log("✓ Model added to scene successfully");
      
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          if (child.material) {
            child.material.emissive = new THREE.Color(0xff4500);
            child.material.emissiveIntensity = 0.1;
          }
        }
      });
    },
    (xhr) => {
      if (xhr.lengthComputable && xhr.total > 0) {
        const percent = Math.floor((xhr.loaded / xhr.total) * 100);
        console.log(`Loading progress: ${percent}%`);
        updateLoadingProgress(percent);
      } else {
        console.log(`Loading: ${xhr.loaded} bytes loaded`);
      }
    },
    (error) => {
      console.error(`✗ Failed to load from ${path}:`, error.message);
      
      currentPathIndex++;
      if (currentPathIndex < possiblePaths.length) {
        tryLoadModel(possiblePaths[currentPathIndex]);
      } else {
        clearTimeout(modelLoadTimeout);
        console.log("All paths exhausted. Using fallback visualization...");
        createFallbackNeuron();
      }
    }
  );
}

tryLoadModel(possiblePaths[currentPathIndex]);

let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }, 100);
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    controls.autoRotate = false;
  } else {
    controls.autoRotate = true;
  }
});

console.log("✓ Three.js scene initialized successfully");

// ========== API FUNCTIONS ==========

async function fetchFromAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

async function getWeeklyLeaderboard() {
  return fetchFromAPI('/leaderboard/weekly');
}

async function getMonthlyLeaderboard() {
  return fetchFromAPI('/leaderboard/monthly');
}

async function addMember(name, avatar = null) {
  return fetchFromAPI('/members', {
    method: 'POST',
    body: JSON.stringify({ name, avatar })
  });
}

async function updateWeeklyStats(memberId, sessions, assessments, bonus) {
  return fetchFromAPI('/leaderboard/weekly/update', {
    method: 'POST',
    body: JSON.stringify({
      member_id: memberId,
      sessions_attended: sessions,
      assessments_submitted: assessments,
      bonus_points: bonus
    })
  });
}

async function updateMonthlyStats(memberId, sessions, assessments, bonus) {
  return fetchFromAPI('/leaderboard/monthly/update', {
    method: 'POST',
    body: JSON.stringify({
      member_id: memberId,
      sessions_attended: sessions,
      assessments_submitted: assessments,
      bonus_points: bonus
    })
  });
}

async function incrementWeekly(memberId, field, increment = 1) {
  return fetchFromAPI('/leaderboard/weekly/increment', {
    method: 'POST',
    body: JSON.stringify({
      member_id: memberId,
      field: field,
      increment: increment
    })
  });
}

async function incrementMonthly(memberId, field, increment = 1) {
  return fetchFromAPI('/leaderboard/monthly/increment', {
    method: 'POST',
    body: JSON.stringify({
      member_id: memberId,
      field: field,
      increment: increment
    })
  });
}

// ========== LEADERBOARD RENDERING ==========

function getRankEmoji(rank) {
  switch(rank) {
    case 1: return '🥇';
    case 2: return '🥈';
    case 3: return '🥉';
    default: return rank;
  }
}

function createLeaderboardItem(member, rank) {
  const animationDelay = (rank - 1) * 0.1;
  
  return `
    <div class="leaderboard-item" style="animation-delay: ${animationDelay}s">
      <div class="rank-badge">${getRankEmoji(rank)}</div>
      <img src="${member.avatar}" alt="${member.name}" class="avatar" loading="lazy">
      <div class="user-info">
        <div class="user-name">${member.name}</div>
        <div class="user-stats">
          <span class="stat-item">
            <i class="fas fa-chalkboard-teacher"></i>
            ${member.sessionsAttended} sessions
          </span>
          <span class="stat-item">
            <i class="fas fa-clipboard-check"></i>
            ${member.assessmentsSubmitted} assessments
          </span>
        </div>
      </div>
      <div class="points-display">
        <div class="points-value">${member.totalPoints}</div>
        <div class="points-label">Points</div>
      </div>
    </div>
  `;
}

function renderLeaderboard(containerId, data) {
  const container = document.getElementById(containerId);
  
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }
  
  if (data.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-trophy"></i>
        <p>No data available yet. Add members to get started!</p>
      </div>
    `;
    return;
  }
  
  const html = data
    .map((member, index) => createLeaderboardItem(member, index + 1))
    .join('');
  
  container.innerHTML = html;
}

function updateTimestamp(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    element.textContent = timeString;
  }
}

async function loadWeeklyLeaderboard() {
  const container = document.getElementById('weeklyLeaderboard');
  container.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
  
  try {
    const response = await getWeeklyLeaderboard();
    renderLeaderboard('weeklyLeaderboard', response.data);
    updateTimestamp('weeklyUpdate');
  } catch (error) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Failed to load leaderboard. Please check if the API is running.</p>
        <p style="font-size: 0.85rem; margin-top: 0.5rem;">Error: ${error.message}</p>
      </div>
    `;
  }
}

async function loadMonthlyLeaderboard() {
  const container = document.getElementById('monthlyLeaderboard');
  container.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
  
  try {
    const response = await getMonthlyLeaderboard();
    renderLeaderboard('monthlyLeaderboard', response.data);
    updateTimestamp('monthlyUpdate');
  } catch (error) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Failed to load leaderboard. Please check if the API is running.</p>
        <p style="font-size: 0.85rem; margin-top: 0.5rem;">Error: ${error.message}</p>
      </div>
    `;
  }
}

async function initializeLeaderboards() {
  console.log('Loading leaderboards from database...');
  await Promise.all([
    loadWeeklyLeaderboard(),
    loadMonthlyLeaderboard()
  ]);
  console.log('✓ Leaderboards loaded successfully');
}

function startAutoRefresh() {
  // Refresh every 2 minutes
  setInterval(() => {
    initializeLeaderboards();
  }, 2 * 60 * 1000);
}

// ========== PUBLIC API ==========
window.LeaderboardAPI = {
  // Load data
  refresh: initializeLeaderboards,
  
  // Member management
  addMember: async (name, avatar = null) => {
    try {
      const result = await addMember(name, avatar);
      console.log('Member added:', result.data);
      await initializeLeaderboards();
      return result;
    } catch (error) {
      console.error('Failed to add member:', error);
      throw error;
    }
  },
  
  // Weekly leaderboard
  updateWeekly: async (memberId, sessions, assessments, bonus) => {
    try {
      await updateWeeklyStats(memberId, sessions, assessments, bonus);
      await loadWeeklyLeaderboard();
    } catch (error) {
      console.error('Failed to update weekly stats:', error);
      throw error;
    }
  },
  
  incrementWeekly: async (memberId, field, increment = 1) => {
    try {
      await incrementWeekly(memberId, field, increment);
      await loadWeeklyLeaderboard();
    } catch (error) {
      console.error('Failed to increment weekly stats:', error);
      throw error;
    }
  },
  
  // Monthly leaderboard
  updateMonthly: async (memberId, sessions, assessments, bonus) => {
    try {
      await updateMonthlyStats(memberId, sessions, assessments, bonus);
      await loadMonthlyLeaderboard();
    } catch (error) {
      console.error('Failed to update monthly stats:', error);
      throw error;
    }
  },
  
  incrementMonthly: async (memberId, field, increment = 1) => {
    try {
      await incrementMonthly(memberId, field, increment);
      await loadMonthlyLeaderboard();
    } catch (error) {
      console.error('Failed to increment monthly stats:', error);
      throw error;
    }
  }
};

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing SYNAPSE Leaderboard...');
  initializeLeaderboards();
  startAutoRefresh();
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    initializeLeaderboards();
  }
});

console.log('✓ SYNAPSE website fully initialized');

// Add this to the end of your existing script.js file

// ========== RESOURCES TAB FUNCTIONALITY ==========
document.addEventListener('DOMContentLoaded', () => {
  const resourceTabs = document.querySelectorAll('.resource-tab');
  const resourceContents = document.querySelectorAll('.resources-content');

  resourceTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const category = tab.dataset.category;
      
      // Remove active class from all tabs
      resourceTabs.forEach(t => t.classList.remove('active'));
      
      // Add active class to clicked tab
      tab.classList.add('active');
      
      // Hide all content
      resourceContents.forEach(content => content.classList.remove('active'));
      
      // Show selected content
      const selectedContent = document.querySelector(`[data-content="${category}"]`);
      if (selectedContent) {
        selectedContent.classList.add('active');
      }
    });
  });
});