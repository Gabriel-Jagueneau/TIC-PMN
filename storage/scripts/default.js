function manageMenu() {
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = sidebar.querySelector(".menu-toggle");
    
    const isCollapsed = sidebar.classList.toggle("collapsed");
    
    toggleBtn.setAttribute("aria-expanded", !isCollapsed);
}