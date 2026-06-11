function initMapDashboard() {
    const mapElement = document.getElementById('osm-map');
    if (!mapElement) return;

    const baseLayers = {
        osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }),
        satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19,
            attribution: 'Tiles © Esri'
        }),
        topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            maxZoom: 17,
            attribution: '© OpenTopoMap'
        })
    };

    const map = L.map('osm-map', {
        zoomControl: false
    }).setView([44.837789, -0.57918], 13);

    baseLayers.osm.addTo(map);

    let currentBaseLayerKey = 'osm';
    let rawFeaturesData = []; 
    let activeMarkers = L.layerGroup().addTo(map);
    let activePolylines = L.layerGroup().addTo(map);

    function getColorByInterface(code) {
        if (!code || code === 'AUCUN') return '#3388ff';
        switch (code.toUpperCase().trim()) {
            case 'HP': return '#e65c00';
            case 'BI': return '#009933';
            case 'BG': return '#9900cc';
            case 'BLH': return '#0066ff';
            case 'H': return '#cc0000';
            default: return '#3388ff';
        }
    }

    function getDescriptionByInterface(code) {
        if (!code || code === 'AUCUN') return 'Non spécifiée';
        switch (code.toUpperCase().trim()) {
            case 'HP': return 'Haut de plage / Plage';
            case 'BI': return 'Bas de plage / Zone intertidale';
            case 'BG': return 'Bas de dune / Bermes';
            case 'BLH': return 'Limite haute de la plage';
            case 'H': return 'Haut de structure / Dune';
            default: return `Interface (${code})`;
        }
    }

    async function loadAllShapefiles() {
        try {
            const dataFolderUrl = '/storage/data/';
            const response = await fetch(dataFolderUrl);
            if (!response.ok) return;
            
            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            
            const links = Array.from(doc.querySelectorAll('a'))
                .map(link => link.getAttribute('href'))
                .filter(Boolean)
                .map(href => decodeURIComponent(href.split('/').pop().toLowerCase()));
            
            const shpFiles = Array.from(doc.querySelectorAll('a'))
                .map(link => link.getAttribute('href'))
                .filter(href => href && href.toLowerCase().endsWith('.shp'));

            rawFeaturesData = [];

            for (const fileName of shpFiles) {
                try {
                    const decodedFileName = decodeURIComponent(fileName.split('/').pop());
                    const baseName = decodedFileName.substring(0, decodedFileName.lastIndexOf('.'));
                    const baseNameLower = baseName.toLowerCase();
                    
                    const shpUrl = `${dataFolderUrl}${encodeURIComponent(baseName)}.shp`;
                    const dbfUrl = `${dataFolderUrl}${encodeURIComponent(baseName)}.dbf`;
                    const prjUrl = `${dataFolderUrl}${encodeURIComponent(baseName)}.prj`;

                    const shpRes = await fetch(shpUrl);
                    if (!shpRes.ok) continue;
                    const shpBuffer = await shpRes.arrayBuffer();

                    let propertiesList = [];
                    if (links.includes(`${baseNameLower}.dbf`)) {
                        const dbfRes = await fetch(dbfUrl).catch(() => null);
                        if (dbfRes && dbfRes.ok) {
                            const dbfBuffer = await dbfRes.arrayBuffer();
                            propertiesList = shp.parseDbf(dbfBuffer);
                        }
                    }

                    let prjText = '';
                    if (links.includes(`${baseNameLower}.prj`)) {
                        const prjRes = await fetch(prjUrl).catch(() => null);
                        if (prjRes && prjRes.ok) prjText = await prjRes.text();
                    }

                    if (!prjText && (baseNameLower.includes('porge') || baseNameLower.includes('mimizan') || baseNameLower.includes('point') || baseNameLower.includes('gr'))) {
                        prjText = 'PROJCS["RGF93_Lambert_93",GEOGCS["GCS_RGF93",DATUM["D_RGF93",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Lambert_Conformal_Conic"],PARAMETER["false_easting",700000.0],PARAMETER["false_northing",6600000.0],PARAMETER["central_meridian",3.0],PARAMETER["standard_parallel_1",44.0],PARAMETER["standard_parallel_2",49.0],PARAMETER["latitude_of_origin",46.5],UNIT["Meter",1.0]]';
                    }

                    const geometries = shp.parseShp(shpBuffer, prjText);

                    if (geometries && geometries.length > 0) {
                        parseAndStoreArrays(geometries, propertiesList, baseName);
                    }
                } catch (fileError) {
                    console.error(fileError);
                }
            }

            populateProfileSelect();
            restoreFiltersFromStorage();
            applyFilters();
        } catch (error) {
            console.error(error);
        }
    }

    function parseAndStoreArrays(geometries, propertiesList, fileName) {
        geometries.forEach((geom, index) => {
            if (!geom) return;

            let lon, lat;
            if (geom.coordinates) {
                lon = geom.coordinates[0];
                lat = geom.coordinates[1];
            } else if (geom.geometry && geom.geometry.coordinates) {
                lon = geom.geometry.coordinates[0];
                lat = geom.geometry.coordinates[1];
            } else {
                return;
            }

            if (isNaN(lat) || isNaN(lon) || lat === 0 || lon === 0) return;
            if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return;

            const originalProps = (propertiesList && propertiesList[index]) ? propertiesList[index] : {};
            const props = {};
            for (const key in originalProps) {
                if (Object.prototype.hasOwnProperty.call(originalProps, key)) {
                    props[key.toUpperCase()] = originalProps[key];
                }
            }
            
            let id = props.NAME || props.ROWID || props.ID || props.ROW_ID || props.OBJECTID || '';
            if (!id) id = `PT${String(index + 1).padStart(2, '0')}-Inconnu`;
            if (String(id).startsWith(';')) return;

            const elv = props._ELEVATION || props.ELEVATION || props.ELV || props.Z || 'N/A';
            const accH = props._H_ACC || props.ACCURACY_H || props.H_ACC || props.ACC_H || 0;

            const idStr = String(id);
            const idParts = idStr.split('-');
            const prefix = idParts[0] || ''; 
            let groupProfile = idParts[1] || ''; 
            
            if ((!groupProfile || groupProfile.toUpperCase() === 'IPH') && fileName.toLowerCase().includes('groupe')) {
                const match = fileName.match(/groupe\s*(\d+)/i);
                if (match) groupProfile = 'G' + match[1] + '1';
            }
            if (!groupProfile) groupProfile = 'Inconnu';

            let interfaceCode = 'AUCUN';
            if (idParts.length > 1) {
                const lastPart = idParts[idParts.length - 1].toUpperCase().trim();
                if (lastPart !== '' && lastPart !== prefix.toUpperCase()) interfaceCode = lastPart;
            }

            let siteLetter = 'AUTRE';
            const cleanFileName = fileName.toLowerCase();
            if (prefix.toUpperCase().startsWith('M') || cleanFileName.includes('mimizan')) {
                siteLetter = 'M';
            } else if (prefix.toUpperCase().startsWith('P') || cleanFileName.includes('porge')) {
                siteLetter = 'P';
            }

            const pointNum = parseInt(prefix.replace(/^[A-Za-z]+/, ''), 10) || 0;
            let accuracyH = parseFloat(String(accH).replace(',', '.'));
            if (isNaN(accuracyH)) accuracyH = 0;

            rawFeaturesData.push({
                latLng: [lat, lon],
                id: idStr,
                sourceFile: fileName,
                siteLetter: siteLetter,
                groupProfile: groupProfile,
                interfaceCode: interfaceCode,
                pointNum: pointNum,
                elv: elv,
                accuracyH: accuracyH
            });
        });
    }

    function populateProfileSelect() {
        const select = document.getElementById('filter-profile');
        if (!select) return;

        const currentSelection = select.value;
        while (select.options.length > 1) select.remove(1);

        const profiles = [...new Set(rawFeaturesData.map(pt => pt.groupProfile))].filter(Boolean).sort();
        profiles.forEach(prof => {
            const option = document.createElement('option');
            option.value = prof;
            option.textContent = `Profil ${prof}`;
            select.appendChild(option);
        });

        select.value = (currentSelection && profiles.includes(currentSelection)) ? currentSelection : 'all';
    }

    function saveFiltersToStorage() {
        const config = {
            baseLayer: document.getElementById('map-base-layer')?.value || 'osm',
            sites: Array.from(document.querySelectorAll('.filter-site')).map(cb => ({ value: cb.value, checked: cb.checked })),
            interfaces: Array.from(document.querySelectorAll('.filter-interface')).map(cb => ({ value: cb.value, checked: cb.checked })),
            profile: document.getElementById('filter-profile')?.value || 'all',
            precision: document.getElementById('filter-precision')?.value || '20'
        };
        localStorage.setItem('gnss_map_filters', JSON.stringify(config));
    }

    function restoreFiltersFromStorage() {
        const savedData = localStorage.getItem('gnss_map_filters');
        
        const precisionSlider = document.getElementById('filter-precision');
        const precisionValue = document.getElementById('precision-value');
        if (precisionSlider) {
            precisionSlider.value = '20';
            if (precisionValue) precisionValue.textContent = '20';
        }

        if (!savedData) return;

        try {
            const config = JSON.parse(savedData);

            if (config.baseLayer) {
                const baseLayerSelect = document.getElementById('map-base-layer');
                if (baseLayerSelect) {
                    baseLayerSelect.value = config.baseLayer;
                    baseLayerSelect.dispatchEvent(new Event('change'));
                }
            }

            if (config.sites) {
                config.sites.forEach(savedCb => {
                    const el = document.querySelector(`.filter-site[value="${savedCb.value}"]`);
                    if (el) el.checked = savedCb.checked;
                });
            }

            if (config.interfaces) {
                config.interfaces.forEach(savedCb => {
                    const el = document.querySelector(`.filter-interface[value="${savedCb.value}"]`);
                    if (el) el.checked = savedCb.checked;
                });
            }

            const profileSelect = document.getElementById('filter-profile');
            if (profileSelect && config.profile && Array.from(profileSelect.options).map(o => o.value).includes(config.profile)) {
                profileSelect.value = config.profile;
            }

            if (precisionSlider && config.precision) {
                precisionSlider.value = config.precision;
                if (precisionValue) precisionValue.textContent = config.precision;
            }
        } catch (e) {
            console.error(e);
        }
    }

    function resetFilters() {
        document.querySelectorAll('.filter-site, .filter-interface').forEach(cb => cb.checked = true);
        
        const profileSelect = document.getElementById('filter-profile');
        if (profileSelect) profileSelect.value = 'all';

        const precisionSlider = document.getElementById('filter-precision');
        const precisionValue = document.getElementById('precision-value');
        if (precisionSlider) {
            precisionSlider.value = '20';
            if (precisionValue) precisionValue.textContent = '20';
        }

        saveFiltersToStorage();
        applyFilters();
    }

    function applyFilters() {
        activeMarkers.clearLayers();
        activePolylines.clearLayers();

        const selectedSites = Array.from(document.querySelectorAll('.filter-site:checked')).map(cb => cb.value);
        const selectedInterfaces = Array.from(document.querySelectorAll('.filter-interface:checked')).map(cb => cb.value);
        const selectedProfile = document.getElementById('filter-profile')?.value || 'all';
        const maxPrecision = parseFloat(document.getElementById('filter-precision')?.value);

        const filteredPoints = rawFeaturesData.filter(pt => {
            const matchSite = selectedSites.includes(pt.siteLetter);
            let matchInterface = selectedInterfaces.includes(pt.interfaceCode);
            if (!matchInterface && !['HP', 'BI', 'BG', 'BLH', 'H'].includes(pt.interfaceCode)) {
                matchInterface = selectedInterfaces.includes('AUCUN');
            }
            const matchProfile = (selectedProfile === 'all' || selectedProfile === '' || pt.groupProfile === selectedProfile);
            const matchPrecision = isNaN(maxPrecision) || pt.accuracyH <= maxPrecision;

            return matchSite && matchInterface && matchProfile && matchPrecision;
        });

        const profilesGroup = {};

        filteredPoints.forEach(pt => {
            const markerColor = getColorByInterface(pt.interfaceCode);
            const interfaceDesc = getDescriptionByInterface(pt.interfaceCode);

            const marker = L.circleMarker(pt.latLng, {
                radius: 8,
                fillColor: markerColor,
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.9
            });

            marker.bindPopup(`
                <strong>Point ID:</strong> ${pt.id}<br>
                <strong>Nature / Interface:</strong> ${interfaceDesc}<br>
                <strong>Altitude:</strong> ${pt.elv || 'N/A'} m<br>
                <strong>Précision H:</strong> ${pt.accuracyH} m
            `);

            marker.addTo(activeMarkers);

            const pKey = `${pt.siteLetter}_${pt.sourceFile}_${pt.groupProfile}`;
            if (!profilesGroup[pKey]) profilesGroup[pKey] = [];
            profilesGroup[pKey].push(pt);
        });

        for (const key in profilesGroup) {
            const linePoints = profilesGroup[key];
            if (linePoints.length > 1) {
                linePoints.sort((a, b) => a.pointNum - b.pointNum);
                const coords = linePoints.map(pt => pt.latLng);

                L.polyline(coords, {
                    color: '#475569',
                    weight: 2,
                    dashArray: '5, 5',
                    opacity: 0.75
                }).addTo(activePolylines);
            }
        }

        if (filteredPoints.length > 0) {
            const bounds = filteredPoints.map(pt => pt.latLng);
            map.fitBounds(bounds, { 
                paddingTopLeft: [50, 50],
                paddingBottomRight: [360, 50]
            });
        }
    }

    const initEventListeners = () => {
        const baseLayerSelect = document.getElementById('map-base-layer');
        if (baseLayerSelect) {
            baseLayerSelect.addEventListener('change', function() {
                const selectedKey = this.value;
                if (baseLayers[selectedKey] && selectedKey !== currentBaseLayerKey) {
                    map.removeLayer(baseLayers[currentBaseLayerKey]);
                    baseLayers[selectedKey].addTo(map);
                    currentBaseLayerKey = selectedKey;
                    saveFiltersToStorage();
                }
            });
        }

        document.querySelectorAll('.filter-site, .filter-interface').forEach(cb => {
            cb.addEventListener('change', () => {
                saveFiltersToStorage();
                applyFilters();
            });
        });

        document.getElementById('filter-profile')?.addEventListener('change', () => {
            saveFiltersToStorage();
            applyFilters();
        });

        const precisionSlider = document.getElementById('filter-precision');
        const precisionValue = document.getElementById('precision-value');
        if (precisionSlider && precisionValue) {
            precisionSlider.addEventListener('input', (e) => {
                precisionValue.textContent = e.target.value;
                saveFiltersToStorage();
                applyFilters();
            });
        }

        document.getElementById('btn-reset-filters')?.addEventListener('click', resetFilters);

        document.getElementById('btn-recenter-map')?.addEventListener('click', () => {
            const selectedSites = Array.from(document.querySelectorAll('.filter-site:checked')).map(cb => cb.value);
            const selectedInterfaces = Array.from(document.querySelectorAll('.filter-interface:checked')).map(cb => cb.value);
            const selectedProfile = document.getElementById('filter-profile')?.value || 'all';
            const maxPrecision = parseFloat(document.getElementById('filter-precision')?.value);
        
            const filteredPoints = rawFeaturesData.filter(pt => {
                const matchSite = selectedSites.includes(pt.siteLetter);
                let matchInterface = selectedInterfaces.includes(pt.interfaceCode);
                if (!matchInterface && !['HP', 'BI', 'BG', 'BLH', 'H'].includes(pt.interfaceCode)) {
                    matchInterface = selectedInterfaces.includes('AUCUN');
                }
                const matchProfile = (selectedProfile === 'all' || selectedProfile === '' || pt.groupProfile === selectedProfile);
                const matchPrecision = isNaN(maxPrecision) || pt.accuracyH <= maxPrecision;
        
                return matchSite && matchInterface && matchProfile && matchPrecision;
            });
        
            if (filteredPoints.length > 0) {
                const bounds = filteredPoints.map(pt => pt.latLng);
                map.fitBounds(bounds, { 
                    paddingTopLeft: [50, 50],
                    paddingBottomRight: [360, 50]
                });
            }
        });
    };

    initEventListeners();
    loadAllShapefiles();

    setTimeout(() => {
        map.invalidateSize();
    }, 400);
}