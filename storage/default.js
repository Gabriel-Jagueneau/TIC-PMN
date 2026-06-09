function manageMenu() {
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = sidebar.querySelector(".menu-toggle");
    
    const isCollapsed = sidebar.classList.toggle("collapsed");
    
    toggleBtn.setAttribute("aria-expanded", !isCollapsed);
}

/* 3D model for footer */
const container3D = document.querySelector('footer');

const viewer = document.createElement('model-viewer');
viewer.setAttribute('src', 'storage/objects/earth_cartoon.glb');
viewer.setAttribute('alt', 'Globe terrestre littoral');
viewer.setAttribute('auto-rotate', '');
viewer.setAttribute('shadow-intensity', '0');
viewer.setAttribute('interaction-prompt', 'none');
viewer.setAttribute('camera-orbit', '0deg 65deg auto');
viewer.setAttribute('auto-rotate-delay', '0');
viewer.setAttribute('rotation-per-second', '10deg');

container3D.appendChild(viewer);