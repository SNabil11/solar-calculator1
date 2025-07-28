// pvgis.js – تصحيح جلب البيانات مباشرة من المتصفح
// ------------------------------------------------------------------
// يُستدعى من script.js عبر getPVGISData(lat, lon)

const PROXY = 'https://cors-anywhere.herokuapp.com/'; // يمكنك استبداله بأي proxy CORS صالح
const BASE = 'https://re.jrc.ec.europa.eu/api/v5_3/';

// دالة رئيسية
export async function getPVGISData(lat, lon) {
  const urls = [
    ${BASE}seriescalc?lat=${lat}&lon=${lon}&startyear=2020&endyear=2020&outputformat=json&daily=1,
    ${BASE}monthlycalc?lat=${lat}&lon=${lon}&outputformat=json
  ];

  for (const url of urls) {
    try {
      const res = await fetch(PROXY + url);
      if (!res.ok) continue;

      const data = await res.json();
      const daily = data.outputs?.daily;
      const monthly = data.outputs?.monthly;

      let arr, source;
      if (daily && daily.length) {
        arr = daily;
        source = 'daily';
      } else if (monthly && monthly.length) {
        arr = monthly;
        source = 'monthly';
      } else continue;

      // مفتاح الإشعاع (H(h)_d أو G(h)_d أو G(i)_d ...)
      const key = Object.keys(arr[0]).find(k => /G $i$_d|G $h$_d|H $h$_d/i.test(k));
      if (!key) continue;

      const total = arr.reduce((sum, d) => sum + (parseFloat(d[key]) || 0), 0);
      const avgIrr = (total / arr.length).toFixed(2);

      return { source, avgIrr };
    } catch (e) {
      console.warn('فشل جلب البيانات من: ' + url, e);
    }
  }

  // Fallback: قيمة افتراضية
  return { source: 'default', avgIrr: 5.0 };
}

// لأننا نستخدم ES Module، نحتاج إلى تعريفها عالميًا إذا لم تكن تستخدم Webpack/vite
// (للتوافق مع <script type="module">)
window.getPVGISData = getPVGISData;
