export default async function handler(req, res) {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Missing coordinates' });
  }

  const baseURL = "https://re.jrc.ec.europa.eu/api/v5_3/";
  const urlDaily = `${baseURL}seriescalc?lat=${lat}&lon=${lon}&startyear=2020&endyear=2020&outputformat=json&browser=0&usehorizon=1&pvcalculation=0&daily=1`;
  const urlMonthly = `${baseURL}monthlycalc?lat=${lat}&lon=${lon}&outputformat=json&browser=0&usehorizon=1&pvtechchoice=crystSi`;

  try {
    // تجربة جلب البيانات اليومية أولاً
    let response = await fetch(urlDaily);
    let data = await response.json();

    if (data.outputs?.daily?.length > 0) {
      return res.status(200).json({ source: "daily", outputs: data.outputs });
    }

    // إذا فشلت اليومية، تجربة الشهرية
    response = await fetch(urlMonthly);
    data = await response.json();

    if (data.outputs?.monthly?.length > 0) {
      return res.status(200).json({ source: "monthly", outputs: data.outputs });
    }

    return res.status(404).json({ error: "No irradiation data found in both daily and monthly formats." });

  } catch (error) {
    return res.status(500).json({ error: 'Error fetching PVGIS data', details: error.message });
  }
}
