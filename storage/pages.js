async function loadPage(pageName, pushToHistory = true) {
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
            if (typeof initFooterModel === 'function') initFooterModel();
        } else if (pageName === 'map' && typeof initMapDashboard === 'function') {
            initMapDashboard();
            if (typeof initFooterModel === 'function') initFooterModel();
        }

        if (pushToHistory) {
            window.history.pushState({ page: pageName }, "", `?page=${pageName}`);
        }

    } catch (error) {
        contentDiv.innerHTML = `<p>Erreur lors du chargement de la page : ${error.message}</p>`;
    }
}

function getPageFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('page') || 'home';
}

document.addEventListener('DOMContentLoaded', () => {
    const initialPage = getPageFromUrl();
    loadPage(initialPage, false);
});

window.addEventListener('popstate', (event) => {
    if (event.state && event.state.page) {
        loadPage(event.state.page, false);
    } else {
        const page = getPageFromUrl();
        loadPage(page, false);
    }
});