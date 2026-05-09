import { createContext, useContext, useState, useEffect } from 'react';
import Papa from 'papaparse';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [data, setData] = useState({}); // Store data by region
  const [selectedRegion, setSelectedRegion] = useState('Bangalore');
  const [stats, setStats] = useState({
    avg: 0,
    max: 0,
    min: 0,
    currentStatus: 'N/A',
    classification: { Healthy: 0, Moderate: 0, Unhealthy: 0 }
  });
  const [seasonalTrends, setSeasonalTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  const regionSpecs = {
    'Bangalore': { lat: 12.9716, lng: 77.5946 },
    'Kolar': { lat: 13.1363, lng: 78.1291 },
    'Mysore': { lat: 12.2958, lng: 76.6394 }
  };

  const regions = Object.keys(regionSpecs);

  const classifyNDVI = (val) => {
    if (val > 0.6) return 'Healthy';
    if (val >= 0.3) return 'Moderate';
    return 'Unhealthy';
  };

  const calculateClassificationPercentages = (formattedData) => {
    if (!formattedData || formattedData.length === 0) return { Healthy: 0, Moderate: 0, Unhealthy: 0 };
    const counts = { Healthy: 0, Moderate: 0, Unhealthy: 0 };
    formattedData.forEach(row => {
      counts[row.status]++;
    });
    const total = formattedData.length;
    return {
      Healthy: Math.round((counts.Healthy / total) * 100),
      Moderate: Math.round((counts.Moderate / total) * 100),
      Unhealthy: Math.round((counts.Unhealthy / total) * 100)
    };
  };

  const calculateSeasonalTrends = (formattedData) => {
    const months = {};
    formattedData.forEach(row => {
      const month = new Date(row.date).toLocaleString('default', { month: 'short' });
      if (!months[month]) months[month] = [];
      months[month].push(row.ndvi);
    });

    return Object.entries(months).map(([month, values]) => ({
      month,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      count: values.length
    }));
  };

  const fetchRegionData = async (regionName) => {
    const { lat, lng } = regionSpecs[regionName];
    try {
      // Try to fetch from local backend (GEE Bridge)
      const response = await fetch(`http://localhost:3001/api/ndvi?lat=${lat}&lng=${lng}&regionName=${regionName}`);
      if (!response.ok) throw new Error('Backend not reachable');
      
      const geeData = await response.json();
      if (geeData && geeData.length > 0) {
        return geeData;
      }
      throw new Error('No data returned');
    } catch (err) {
      console.warn(`GEE Backend unreachable for ${regionName}. Using local sample fallback.`);
      // Fallback to sample.csv logic
      const response = await fetch('/src/data/sample_ndvi.csv');
      const csvText = await response.text();
      return new Promise((resolve) => {
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            const baseData = results.data
              .map(row => ({
                date: row.Date || row.date,
                ndvi: parseFloat(row.NDVI || row.ndvi),
                status: classifyNDVI(parseFloat(row.NDVI || row.ndvi))
              }))
              .filter(d => !isNaN(d.ndvi));
            
            // Adjust based on region for variety in fallback
            if (regionName === 'Kolar') return resolve(baseData.map(d => ({ ...d, ndvi: Math.max(0, d.ndvi - 0.1), status: classifyNDVI(d.ndvi - 0.1) })));
            if (regionName === 'Mysore') return resolve(baseData.map(d => ({ ...d, ndvi: Math.min(1, d.ndvi + 0.05), status: classifyNDVI(d.ndvi + 0.05) })));
            resolve(baseData);
          }
        });
      });
    }
  };

  const updateStats = (currentRegionData) => {
    if (!currentRegionData || currentRegionData.length === 0) return;

    const ndvis = currentRegionData.map(d => d.ndvi);
    const avg = ndvis.reduce((a, b) => a + b, 0) / ndvis.length;
    const max = Math.max(...ndvis);
    const min = Math.min(...ndvis);
    
    setStats({
      avg: avg.toFixed(2),
      max: max.toFixed(2),
      min: min.toFixed(2),
      currentStatus: classifyNDVI(avg),
      classification: calculateClassificationPercentages(currentRegionData)
    });

    setSeasonalTrends(calculateSeasonalTrends(currentRegionData));
  };

  const generateInsights = () => {
    const currentData = data[selectedRegion];
    if (!currentData || currentData.length < 2) return [{ type: 'info', text: "Initializing data stream..." }];
    
    const insights = [];
    const firstHalf = currentData.slice(0, Math.floor(currentData.length / 2));
    const secondHalf = currentData.slice(Math.floor(currentData.length / 2));
    
    const avg1 = firstHalf.reduce((a, b) => a + b.ndvi, 0) / firstHalf.length;
    const avg2 = secondHalf.reduce((a, b) => a + b.ndvi, 0) / secondHalf.length;

    if (avg2 < avg1) insights.push({ type: 'alert', text: `Attention: ${selectedRegion} health showing a decline trend.` });
    else if (avg2 > avg1) insights.push({ type: 'info', text: `Positive: ${selectedRegion} is showing vegetation recovery.` });

    insights.push({ type: 'info', text: `Status: Current health classification is ${classifyNDVI(stats.avg).toLowerCase()}.` });
    if (stats.min < 0.3) insights.push({ type: 'alert', text: "Critical: Low NDVI detection suggests irrigation issues." });

    return insights;
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      const newData = {};
      // Fetch data for all regions
      for (const region of regions) {
        newData[region] = await fetchRegionData(region);
      }
      setData(newData);
      setLoading(false);
    };
    loadAll();
  }, []);

  useEffect(() => {
    if (data[selectedRegion]) {
      updateStats(data[selectedRegion]);
    }
  }, [selectedRegion, data]);

  return (
    <DataContext.Provider value={{ 
      data: data[selectedRegion] || [], 
      allRegionsData: data,
      stats, 
      selectedRegion, 
      setSelectedRegion,
      regions,
      seasonalTrends,
      loading,
      insights: generateInsights() 
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
