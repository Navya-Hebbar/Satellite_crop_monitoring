import ee from '@google/earthengine';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const KEY_PATH = path.join(__dirname, 'gee-key.json');

// Initialize GEE
const initializeGEE = () => {
  if (!fs.existsSync(KEY_PATH)) {
    console.error('CRITICAL: gee-key.json not found in backend folder!');
    return;
  }

  const privateKey = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));

  console.log('--- GEE AUTHENTICATION START ---');
  ee.data.authenticateViaPrivateKey(
    privateKey,
    () => {
      ee.initialize(null, null, () => {
        console.log('SUCCESS: Google Earth Engine Initialized.');
      }, (err) => {
        console.error('GEE Initialization Error:', err);
      });
    },
    (err) => {
      console.error('GEE Authentication Error:', err);
    }
  );
};

initializeGEE();

// API Endpoint to fetch NDVI
app.get('/api/ndvi', (req, res) => {
  const { lat, lng, start, end, regionName } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and Longitude are required.' });
  }

  console.log(`Fetching NDVI for ${regionName || 'Custom Region'} [${lat}, ${lng}]...`);

  try {
    const point = ee.Geometry.Point([parseFloat(lng), parseFloat(lat)]);
    const area = point.buffer(1000).bounds(); // 1km buffer

    const collection = ee.ImageCollection("COPERNICUS/S2_SR")
      .filterBounds(area)
      .filterDate(start || '2024-01-01', end || '2024-12-31')
      .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20));

    const ndviSeries = collection.map((img) => {
      const ndvi = img.normalizedDifference(['B8', 'B4']).rename('ndvi');
      const stats = ndvi.reduceRegion({
        reducer: ee.Reducer.mean(),
        geometry: area,
        scale: 10,
        maxPixels: 1e9
      });
      return ee.Feature(null, {
        date: img.date().format('YYYY-MM-dd'),
        ndvi: stats.get('ndvi')
      });
    });

    ndviSeries.getInfo((data) => {
      if (!data || !data.features) {
        return res.json([]);
      }
      const results = data.features.map(f => ({
        date: f.properties.date,
        ndvi: f.properties.ndvi,
        status: f.properties.ndvi > 0.6 ? 'Healthy' : f.properties.ndvi >= 0.3 ? 'Moderate' : 'Unhealthy'
      })).filter(f => f.ndvi !== null);
      
      res.json(results);
    });
  } catch (error) {
    console.error('GEE Processing Error:', error);
    res.status(500).json({ error: 'Internal Server Error during GEE processing.' });
  }
});

app.listen(PORT, () => {
  console.log(`--- SATELLITE BACKEND RUNNING ON PORT ${PORT} ---`);
  console.log(`Endpoint: http://localhost:${PORT}/api/ndvi`);
});
