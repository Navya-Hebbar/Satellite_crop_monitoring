import ee from '@google/earthengine';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
app.get('/api/ndvi', async (req, res) => {
  const { lat, lng, regionName, startDate, endDate, buffer } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and Longitude are required' });
  }

  // Use provided params or defaults
  const start = startDate || '2023-01-01';
  const end = endDate || '2024-01-01';
  const bufferRadius = parseInt(buffer) || 1000;

  console.log(`[GEE] Fetching: ${regionName || 'Custom'} [${lat}, ${lng}] Area: ${bufferRadius}m Dates: ${start} to ${end}`);

  try {
    const point = ee.Geometry.Point([parseFloat(lng), parseFloat(lat)]);
    const area = point.buffer(bufferRadius);

    const collection = ee.ImageCollection("COPERNICUS/S2_SR")
      .filterBounds(area)
      .filterDate(start, end)
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

app.post('/api/generate-report', async (req, res) => {
  try {
    const { stats, selectedRegions, data } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not set in backend/.env' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an expert agronomist AI analyzing satellite crop data (NDVI).
    The user is monitoring the following regions: ${selectedRegions.join(', ')}.
    
    Overall stats for the primary region (${selectedRegions[0]}):
    - Average NDVI: ${stats.avg}
    - Max NDVI: ${stats.max}
    - Min NDVI: ${stats.min}
    - Status: ${stats.currentStatus}
    
    Recent data points (last 5 readings): 
    ${JSON.stringify((data || []).slice(-5))}
    
    Write a short, highly professional 2-paragraph report analyzing this data. 
    1. First paragraph: Summarize the crop health and any anomalies or trends.
    2. Second paragraph: Provide actionable recommendations (e.g., irrigation, field inspection) based on the data.
    Do not use markdown formatting like ** or *, just plain text paragraphs. Make it sound very scientific and authoritative.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    res.json({ report: responseText });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: 'Failed to generate AI report.' });
  }
});

app.listen(PORT, () => {
  console.log(`--- SATELLITE BACKEND RUNNING ON PORT ${PORT} ---`);
  console.log(`Endpoints: 
  - GET http://localhost:${PORT}/api/ndvi
  - POST http://localhost:${PORT}/api/generate-report`);
});
