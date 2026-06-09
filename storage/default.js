function manageMenu(yes) {
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = sidebar.querySelector(".menu-toggle");
    if (yes && sidebar.classList.contains("collapsed")) {
        return;
    }
    const isCollapsed = sidebar.classList.toggle("collapsed");
    toggleBtn.setAttribute("aria-expanded", !isCollapsed);
}

function initFooterModel() {
    const container3D = document.querySelector('.shape-4');

    if (container3D) {
        container3D.innerHTML = '';

        const viewer = document.createElement('model-viewer');
        viewer.setAttribute('src', 'storage/objects/earth_cartoon_2.glb');
        viewer.setAttribute('alt', 'Globe terrestre littoral');
        viewer.setAttribute('auto-rotate', '');
        viewer.setAttribute('shadow-intensity', '0');
        viewer.setAttribute('interaction-prompt', 'none');
        viewer.setAttribute('camera-orbit', '0deg 65deg auto');
        viewer.setAttribute('auto-rotate-delay', '0');
        viewer.setAttribute('rotation-per-second', '10deg');

        container3D.appendChild(viewer);
    }
}