import { createContext, useContext, useState, useEffect } from 'react';
import Papa from 'papaparse';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [data, setData] = useState({}); 
  const [selectedRegions, setSelectedRegions] = useState(['Bangalore']);
  const [stats, setStats] = useState({
    avg: 0, max: 0, min: 0, currentStatus: 'N/A',
    classification: { Healthy: 0, Moderate: 0, Unhealthy: 0 }
  });
  const [seasonalTrends, setSeasonalTrends] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mission Settings
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState('2024-01-01');
  const [bufferSize, setBufferSize] = useState(1000);

  const regionDatabase = {
    'Bangalore': { lat: 12.9716, lng: 77.5946 },
    'Kolar': { lat: 13.1363, lng: 78.1291 },
    'Mysore': { lat: 12.2958, lng: 76.6394 },
    'Hubli': { lat: 15.3647, lng: 75.1240 },
    'Mangalore': { lat: 12.9141, lng: 74.8560 },
    'Belgaum': { lat: 15.8497, lng: 74.4977 },
    'Gulbarga': { lat: 17.3297, lng: 76.8343 },
    'Davanagere': { lat: 14.4644, lng: 75.9218 },
    'Shimoga': { lat: 13.9299, lng: 75.5681 },
    'Tumkur': { lat: 13.3392, lng: 77.1140 }
  };

  const allCities = Object.keys(regionDatabase);

  const classifyNDVI = (val) => {
    if (val > 0.6) return 'Healthy';
    if (val >= 0.3) return 'Moderate';
    return 'Unhealthy';
  };

  const fetchRegionData = async (regionName, start, end, buff) => {
    const { lat, lng } = regionDatabase[regionName];
    try {
      const response = await fetch(`http://localhost:3001/api/ndvi?lat=${lat}&lng=${lng}&regionName=${regionName}&startDate=${start}&endDate=${end}&buffer=${buff}`);
      if (!response.ok) throw new Error('Backend offline');
      return await response.json();
    } catch (err) {
      console.warn(`GEE offline for ${regionName}. Simulating...`);
      return Array.from({ length: 12 }, (_, i) => {
        const val = 0.3 + Math.random() * 0.5;
        return {
          date: `${start.split('-')[0]}-${String(i + 1).padStart(2, '0')}-01`,
          ndvi: val,
          status: classifyNDVI(val)
        };
      });
    }
  };

  const updateStats = (regionData) => {
    if (!regionData || regionData.length === 0) return;
    const ndvis = regionData.map(d => d.ndvi);
    const avg = ndvis.reduce((a, b) => a + b, 0) / ndvis.length;
    
    setStats({
      avg: avg.toFixed(2),
      max: Math.max(...ndvis).toFixed(2),
      min: Math.min(...ndvis).toFixed(2),
      currentStatus: classifyNDVI(avg),
      classification: calculateClassificationPercentages(regionData)
    });
    setSeasonalTrends(calculateSeasonalTrends(regionData));
  };

  const calculateClassificationPercentages = (formattedData) => {
    if (!formattedData || formattedData.length === 0) return { Healthy: 0, Moderate: 0, Unhealthy: 0 };
    const counts = { Healthy: 0, Moderate: 0, Unhealthy: 0 };
    formattedData.forEach(row => counts[row.status]++);
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
      avg: values.reduce((a, b) => a + b, 0) / values.length
    }));
  };

  useEffect(() => {
    const loadSelected = async () => {
      setLoading(true);
      const newMap = {};
      
      for (const region of selectedRegions) {
        newMap[region] = await fetchRegionData(region, startDate, endDate, bufferSize);
      }

      setData(newMap);
      setLoading(false);
    };
    loadSelected();
  }, [selectedRegions, startDate, endDate, bufferSize]);

  useEffect(() => {
    if (selectedRegions.length > 0 && data[selectedRegions[0]]) {
      updateStats(data[selectedRegions[0]]);
    }
  }, [selectedRegions, data]);

  return (
    <DataContext.Provider value={{ 
      data: data[selectedRegions[0]] || [], 
      allRegionsData: data,
      stats, 
      selectedRegions, 
      setSelectedRegions,
      allCities,
      seasonalTrends,
      loading,
      startDate, setStartDate,
      endDate, setEndDate,
      bufferSize, setBufferSize,
      insights: [] 
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
