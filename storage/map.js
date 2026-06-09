function initMapDashboard() {
    const mapElement = document.getElementById('osm-map');
    if (!mapElement) return;

    const map = L.map('osm-map', {
        zoomControl: false
    }).setView([44.837789, -0.57918], 13);

    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    const baseOsmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    const dummyShpLayer1 = L.layerGroup().addTo(map);
    const dummyShpLayer2 = L.layerGroup();
    const dummyRasterLayer1 = L.layerGroup().addTo(map);
    const dummyRasterLayer2 = L.layerGroup();

    function toggleLayer(checkboxId, layerGroup) {
        const checkbox = document.getElementById(checkboxId);
        if (!checkbox) return;
        
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                map.addLayer(layerGroup);
            } else {
                map.removeLayer(layerGroup);
            }
        });
    }

    toggleLayer('layer-shp-1', dummyShpLayer1);
    toggleLayer('layer-shp-2', dummyShpLayer2);
    toggleLayer('layer-raster-1', dummyRasterLayer1);
    toggleLayer('layer-raster-2', dummyRasterLayer2);

    setTimeout(() => {
        map.invalidateSize();
    }, 400);
}