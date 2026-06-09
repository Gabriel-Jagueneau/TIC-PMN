async function loadPage(pageName) {
    const contentDiv = document.getElementById('main-content');
    const url = `storage/pages/${pageName}.html`;

    contentDiv.classList.remove('page-transition');

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }
        
        const html = await response.text();
        contentDiv.innerHTML = html;
        
        void contentDiv.offsetWidth;
        contentDiv.classList.add('page-transition');

        if (pageName === 'home' && typeof initHomeAnimations === 'function') {
            initHomeAnimations();
        }

    } catch (error) {
        contentDiv.innerHTML = `<p>Erreur lors du chargement de la page : ${error.message}</p>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadPage('home');
});