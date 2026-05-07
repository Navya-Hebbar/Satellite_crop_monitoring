import { createContext, useContext, useState, useEffect } from 'react';
import Papa from 'papaparse';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({
    avg: 0,
    max: 0,
    min: 0,
    currentStatus: 'N/A'
  });

  const findKey = (row, possibilities) => {
    const keys = Object.keys(row);
    return keys.find(k => possibilities.includes(k.toLowerCase()));
  };

  const processData = (rawData) => {
    if (!rawData || rawData.length === 0) return;

    const formattedData = rawData
      .map(row => {
        const dateKey = findKey(row, ['date', 'timestamp', 'time']);
        const ndviKey = findKey(row, ['ndvi', 'value', 'index']);
        
        if (dateKey && ndviKey && row[dateKey] && row[ndviKey]) {
          return {
            date: row[dateKey],
            ndvi: parseFloat(row[ndviKey]),
            status: classifyNDVI(parseFloat(row[ndviKey]))
          };
        }
        return null;
      })
      .filter(row => row !== null && !isNaN(row.ndvi));

    if (formattedData.length > 0) {
      const ndvis = formattedData.map(d => d.ndvi);
      const avg = ndvis.reduce((a, b) => a + b, 0) / ndvis.length;
      const max = Math.max(...ndvis);
      const min = Math.min(...ndvis);
      
      setData(formattedData);
      setStats({
        avg: avg,
        max: max,
        min: min,
        currentStatus: classifyNDVI(avg)
      });
    }
  };

  const classifyNDVI = (val) => {
    if (val > 0.6) return 'Healthy';
    if (val >= 0.3) return 'Moderate';
    return 'Unhealthy';
  };

  const generateInsights = () => {
    if (data.length < 2) return [{ type: 'info', text: "Insufficient data for analysis." }];
    
    const insights = [];
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    
    const avg1 = firstHalf.reduce((a, b) => a + b.ndvi, 0) / firstHalf.length;
    const avg2 = secondHalf.reduce((a, b) => a + b.ndvi, 0) / secondHalf.length;

    if (avg2 < avg1) {
      insights.push({ 
        type: 'alert', 
        text: "Vegetation health showed a decreasing trend in the latter period." 
      });
    } else if (avg2 > avg1) {
      insights.push({ 
        type: 'info', 
        text: "Recovery observed in the later months with improving NDVI scores." 
      });
    }

    insights.push({ 
      type: 'info', 
      text: `Overall vegetation is currently ${classifyNDVI(stats.avg).toLowerCase()}.` 
    });
    
    if (stats.min < 0.3) {
      insights.push({ 
        type: 'alert', 
        text: "Significant stress events detected during the monitoring period." 
      });
    }

    return insights;
  };

  useEffect(() => {
    // Load sample data on init
    fetch('/src/data/sample_ndvi.csv')
      .then(response => response.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            processData(results.data);
          }
        });
      });
  }, []);

  return (
    <DataContext.Provider value={{ data, stats, setData: processData, insights: generateInsights() }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
