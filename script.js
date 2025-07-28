let map;
let selectedLatLng = null;
let marker = null;

// عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
      initMap();
      setupModeSwitching();
    } else {
      console.warn('عنصر الخريطة غير موجود!');
    }
  }, 100); // تأخير بسيط لضمان تحميل العنصر
});

// تهيئة الخريطة
function initMap() {
  map = L.map('map').setView([28, 2], 6);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // حدث النقر على الخريطة
  map.on('click', async (e) => {
    selectedLatLng = e.latlng;

    if (marker) {
      marker.setLatLng(selectedLatLng);
    } else {
      marker = L.marker(selectedLatLng).addTo(map);
    }

    document.getElementById('selectedLocation').innerText =
      📍 ${selectedLatLng.lat.toFixed(4)}, ${selectedLatLng.lng.toFixed(4)};

    await fetchIrradiation(selectedLatLng.lat, selectedLatLng.lng);
  });
}

// جلب بيانات الإشعاع
async function fetchIrradiation(lat, lon) {
  try {
    const data = await getPVGISData(lat, lon); // يجب أن تكون موجودة في pvgis.js
    if (!data) throw new Error('لا توجد بيانات');

    const { source, avgIrr } = data;
    document.getElementById('irradiationValue').innerText =
      ☀️ ${avgIrr} kWh/m² (${source});
    document.getElementById('irradiationValue').dataset.value = avgIrr;
  } catch (err) {
    console.error('❌ خطأ أثناء جلب بيانات الإشعاع:', err);
    document.getElementById('irradiationValue').innerText =
      '⚠️ تعذّر جلب البيانات، حاول مجددًا';
    document.getElementById('irradiationValue').dataset.value = 5;
  }
}

// وظائف الأجهزة وإدخال الاستهلاك كما هي بدون تغيير
// ...

// إضافة جهاز جديد
function addDevice() {
  const tbody = document.querySelector('#devicesTable tbody');
  const row = tbody.insertRow();
  row.innerHTML = 
    <td><input type="text" placeholder="جهاز" /></td>
    <td><input type="number" placeholder="واط" min="1" /></td>
    <td><input type="number" placeholder="ساعات" min="0" /></td>
    <td><input type="number" placeholder="عدد" min="1" /></td>
    <td><button type="button" onclick="removeDevice(this)">❌</button></td>
  ;
}

// حذف جهاز
function removeDevice(btn) {
  btn.closest('tr').remove();
}

// تبديل طريقة الإدخال
function setupModeSwitching() {
  const radios = document.querySelectorAll('input[name="inputMode"]');
  radios.forEach((r) =>
    r.addEventListener('change', () => {
      const mode = r.value;
      document.getElementById('directInputs').classList.toggle('hide', mode !== 'direct');
      document.getElementById('deviceInputs').classList.toggle('hide', mode !== 'devices');
    })
  );
}

// حساب النظام
function calculate() {
  let energy = 0;
  const mode = document.querySelector('input[name="inputMode"]:checked').value;

  // حساب الاستهلاك
  if (mode === 'direct') {
    const daily = parseFloat(document.getElementById('dailyUsage').value);
    const monthly = parseFloat(document.getElementById('monthlyUsage').value);
    energy = daily || (monthly ? monthly / 30 : 0);
  } else {
    document.querySelectorAll('#devicesTable tbody tr').forEach((row) => {
      const watt = parseFloat(row.children[1].children[0].value) || 0;
      const hours = parseFloat(row.children[2].children[0].value) || 0;
      const count = parseFloat(row.children[3].children[0].value) || 0;
      energy += (watt * hours * count) / 1000;
    });
  }

  if (energy <= 0) {
    alert('يرجى إدخال استهلاك صالح!');
    return;
  }

  // قيم النظام
  const irradiation = parseFloat(document.getElementById('irradiationValue').dataset.value) || 5;
  const systemVoltage = parseFloat(document.getElementById('systemVoltage').value) || 24;

  const panelWatt = parseFloat(document.getElementById('panelWatt').value) || 300;
  const panelVoltage = parseFloat(document.getElementById('panelVoltage').value) || 18;

  const batteryCapacity = parseFloat(document.getElementById('batteryCapacity').value) || 200;
  const batteryVoltage = parseFloat(document.getElementById('batteryVoltage').value) || 12;
  // الحسابات
  const requiredPanels = Math.ceil((energy * 1000) / (irradiation * panelWatt));
  const panelsSeries = Math.ceil(systemVoltage / panelVoltage);
  const panelsParallel = Math.ceil(requiredPanels / panelsSeries);

  const batteryEnergyWh = energy * 1000;
  const batteryWh = batteryCapacity * batteryVoltage;
  const requiredBatteries = Math.ceil(batteryEnergyWh / batteryWh);
  const batteriesSeries = Math.ceil(systemVoltage / batteryVoltage);
  const batteriesParallel = Math.ceil(requiredBatteries / batteriesSeries);

  // عرض النتائج
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = 
    🔋 الاستهلاك اليومي: <strong>${energy.toFixed(2)} kWh</strong><br>
    ☀️ الإشعاع الشمسي: <strong>${irradiation} kWh/m²</strong><br>
    🔆 عدد الألواح الكلي: <strong>${requiredPanels}</strong><br>
    🔌 توزيع الألواح: <strong>${panelsSeries}</strong> على التسلسل × <strong>${panelsParallel}</strong> على التفرع<br>
    🔋 عدد البطاريات الكلي: <strong>${requiredBatteries}</strong><br>
    🔌 توزيع البطاريات: <strong>${batteriesSeries}</strong> على التسلسل × <strong>${batteriesParallel}</strong> على التفرع
  ;
  resultsDiv.classList.remove('hide');
}
