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
  const [allRegionsStats, setAllRegionsStats] = useState({});
  const [seasonalTrends, setSeasonalTrends] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showYoY, setShowYoY] = useState(false);
  const [yoyDataMap, setYoyDataMap] = useState({});

  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  // Mission Settings
  const [startDate, setStartDate] = useState(oneYearAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [bufferSize, setBufferSize] = useState(1000);

  const [regionDatabase, setRegionDatabase] = useState({
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
  });

  const allCities = Object.keys(regionDatabase);

  const addCustomRegion = (name, lat, lng) => {
    setRegionDatabase(prev => ({ ...prev, [name]: { lat, lng } }));
  };

  const classifyNDVI = (val) => {
    if (val > 0.6) return 'Healthy';
    if (val >= 0.3) return 'Moderate';
    return 'Unhealthy';
  };

  const fetchRegionData = async (regionName, start, end, buff) => {
    const { lat, lng } = regionDatabase[regionName];
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/ndvi?lat=${lat}&lng=${lng}&regionName=${regionName}&startDate=${start}&endDate=${end}&buffer=${buff}`);
      if (!response.ok) throw new Error('Backend offline');
      return await response.json();
    } catch (err) {
      console.warn(`GEE offline for ${regionName}. Simulating...`);
      return Array.from({ length: 12 }, (_, i) => {
        const val = 0.3 + Math.random() * 0.5;
        return {
          date: `${start.split('-')[0]}-${String(i + 1).padStart(2, '0')}-01`,
          ndvi: val,
          temperature: 22 + Math.random() * 12,
          rainfall: Math.random() * 80,
          status: classifyNDVI(val)
        };
      });
    }
  };

  const updateStats = (regionData) => {
    if (!regionData || regionData.length === 0) return null;
    const ndvis = regionData.map(d => d.ndvi).filter(v => v != null && !isNaN(v));
    if (ndvis.length === 0) return {
      avg: '0.00',
      max: '0.00',
      min: '0.00',
      maxDate: 'N/A',
      minDate: 'N/A',
      currentStatus: 'N/A',
      classification: { Healthy: 0, Moderate: 0, Unhealthy: 0 }
    };
    const avg = ndvis.reduce((a, b) => a + b, 0) / ndvis.length;
    const maxVal = Math.max(...ndvis);
    const minVal = Math.min(...ndvis);

    const maxEntry = regionData.find(d => d.ndvi === maxVal);
    const minEntry = regionData.find(d => d.ndvi === minVal);

    return {
      avg: avg.toFixed(2),
      max: maxVal.toFixed(2),
      min: minVal.toFixed(2),
      maxDate: maxEntry ? maxEntry.date : 'N/A',
      minDate: minEntry ? minEntry.date : 'N/A',
      currentStatus: classifyNDVI(avg),
      classification: calculateClassificationPercentages(regionData)
    };
  };

  const calculateClassificationPercentages = (formattedData) => {
    if (!formattedData || formattedData.length === 0) return { Healthy: 0, Moderate: 0, Unhealthy: 0 };
    const counts = { Healthy: 0, Moderate: 0, Unhealthy: 0 };
    const validData = formattedData.filter(d => d.status && counts[d.status] !== undefined);
    validData.forEach(row => counts[row.status]++);
    const total = validData.length || 1;
    return {
      Healthy: Math.round((counts.Healthy / total) * 100),
      Moderate: Math.round((counts.Moderate / total) * 100),
      Unhealthy: Math.round((counts.Unhealthy / total) * 100)
    };
  };

  const calculateSeasonalTrends = (formattedData) => {
    const months = {};
    formattedData.forEach(row => {
      if (row.ndvi != null && !isNaN(row.ndvi)) {
        const month = new Date(row.date).toLocaleString('default', { month: 'short' });
        if (!months[month]) months[month] = [];
        months[month].push(row.ndvi);
      }
    });
    return Object.entries(months).map(([month, values]) => ({
      month,
      avg: values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
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
    const loadYoY = async () => {
      if (!showYoY) return;
      
      const pStart = new Date(startDate); pStart.setFullYear(pStart.getFullYear() - 1);
      const pEnd = new Date(endDate); pEnd.setFullYear(pEnd.getFullYear() - 1);
      
      const newYoyMap = {};
      for (const region of selectedRegions) {
        newYoyMap[region] = await fetchRegionData(
           region, 
           pStart.toISOString().split('T')[0], 
           pEnd.toISOString().split('T')[0], 
           bufferSize
        );
      }
      setYoyDataMap(newYoyMap);
    };
    loadYoY();
  }, [showYoY, selectedRegions, startDate, endDate, bufferSize]);

  useEffect(() => {
    if (selectedRegions.length > 0) {
      const newAllStats = {};
      let aggregatedData = [];

      selectedRegions.forEach(region => {
        if (data[region]) {
           newAllStats[region] = updateStats(data[region]);
           aggregatedData = aggregatedData.concat(data[region]);
        }
      });
      
      setAllRegionsStats(newAllStats);

      if (aggregatedData.length > 0) {
        const aggregateStats = updateStats(aggregatedData);
        if (aggregateStats) {
          setStats(aggregateStats);
          setSeasonalTrends(calculateSeasonalTrends(aggregatedData));
        }
      }
    }
  }, [selectedRegions, data]);

  return (
    <DataContext.Provider value={{
      data: data[selectedRegions[0]] || [],
      allRegionsData: data,
      stats,
      allRegionsStats,
      selectedRegions,
      setSelectedRegions,
      allCities,
      addCustomRegion,
      seasonalTrends,
      loading,
      startDate, setStartDate,
      endDate, setEndDate,
      bufferSize, setBufferSize,
      showYoY, setShowYoY,
      yoyDataMap,
      insights: []
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
