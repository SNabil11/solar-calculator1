import axios from 'axios';

export default async function handler(req, res) {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Missing coordinates' });
  }

  const url = `https://re.jrc.ec.europa.eu/api/v5_3/seriescalc?lat=${lat}&lon=${lon}&startyear=2020&endyear=2020&outputformat=json&browser=0&usehorizon=1&pvcalculation=0`;

  try {
    const response = await axios.get(url);
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching from PVGIS', details: error.message });
  }
}
