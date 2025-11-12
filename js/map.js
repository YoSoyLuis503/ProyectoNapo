// map.js - simple Leaflet map to add persistent alerts with three states
// Alerts are stored in localStorage under key 'alerts'.

(function(){
  if(typeof L === 'undefined') return console.warn('Leaflet not loaded');

  const map = L.map('map', { zoomControl: true }).setView([0, 0], 2);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const stateColors = {
    danger: 'red',       // Peligro/Cerrado
    alert: 'orange',     // Alerta/Precaución
    ok: 'green'          // Bien/Tranquilo
  };

  const storageKey = 'alerts';

  function loadAlerts(){
    const raw = localStorage.getItem(storageKey);
    try{ return raw? JSON.parse(raw): [] }catch(e){ return [] }
  }

  function saveAlerts(alerts){
    localStorage.setItem(storageKey, JSON.stringify(alerts));
  }

  function makeIcon(color){
    return L.divIcon({
      className: 'alert-marker',
      html: `<span style="background:${color};width:16px;height:16px;display:block;border-radius:50%;border:2px solid white"></span>`,
      iconSize: [20,20],
      iconAnchor: [10,10]
    });
  }

  function addMarker(alert, save=true){
    const icon = makeIcon(stateColors[alert.state] || 'gray');
    const m = L.marker([alert.lat, alert.lng], { icon }).addTo(map);
    m.bindPopup(`<strong>${alert.state}</strong><br>${alert.text || ''}<br><button class="btn btn-sm btn-danger" data-id="${alert.id}">Eliminar</button>`);
    m.on('popupopen', ()=>{
      const btn = document.querySelector(`button[data-id='${alert.id}']`);
      if(btn) btn.addEventListener('click', ()=>{
        removeAlert(alert.id);
      });
    });
    if(save){
      const alerts = loadAlerts();
      alerts.push(alert);
      saveAlerts(alerts);
    }
  }

  function removeAlert(id){
    let alerts = loadAlerts();
    alerts = alerts.filter(a=>a.id!==id);
    saveAlerts(alerts);
    renderAll();
  }

  function clearAll(){
    localStorage.removeItem(storageKey);
    renderAll();
  }

  function renderAll(){
    // remove all non-tile layers
    map.eachLayer(layer=>{
      if(layer instanceof L.Marker) map.removeLayer(layer);
    });
    const alerts = loadAlerts();
    alerts.forEach(a=> addMarker(a, false));
  }

  // initial load
  renderAll();

  // map click to add alert
  map.on('click', function(e){
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    // simple prompt flow: state + text
    const state = prompt('Estado de la alerta: escribe "danger" (Peligro), "alert" (Precaución) o "ok" (Tranquilo)', 'danger');
    if(!state) return;
    if(!['danger','alert','ok'].includes(state)) return alert('Estado inválido');
    const text = prompt('Descripción (opcional)');
    const id = 'a_'+Date.now();
    const alertObj = { id, lat, lng, state, text };
    addMarker(alertObj, true);
  });

  // locate button
  const locateBtn = document.getElementById('locate-btn');
  if(locateBtn){
    locateBtn.addEventListener('click', ()=>{
      map.locate({setView:true, maxZoom:14});
    });
  }

  // clear button
  const clearBtn = document.getElementById('clear-btn');
  if(clearBtn){
    clearBtn.addEventListener('click', ()=>{
      if(confirm('Borrar todas las alertas guardadas?')) clearAll();
    });
  }

})();
