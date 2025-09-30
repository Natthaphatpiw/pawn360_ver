'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Contract {
  item: {
    type: string;
    brand: string;
    model: string;
  };
  status: string;
}

interface SuspendedItemsChartProps {
  contracts?: Contract[];
}

// Fallback mock data for display in legend
export const suspendedItemsData = [
    { name: 'Electronics', value: 45, color: '#60a5fa' },
    { name: 'Jewelry', value: 25, color: '#a78bfa' },
    { name: 'Musical Instruments', value: 18, color: '#f472b6' },
    { name: 'Tools', value: 12, color: '#fbbf24' },
];

const SuspendedItemsChart = ({ contracts = [] }: SuspendedItemsChartProps) => {
  // Calculate suspended item distribution from real contracts
  const calculateSuspendedDistribution = () => {
    if (!contracts || contracts.length === 0) {
      return {
        labels: ['No data'],
        data: [1],
        colors: ['#e5e7eb']
      };
    }

    // Filter suspended contracts only
    const suspendedContracts = contracts.filter(contract =>
      contract.status === 'suspended'
    );

    if (suspendedContracts.length === 0) {
      return {
        labels: ['No suspended items'],
        data: [1],
        colors: ['#e5e7eb']
      };
    }

    // Count items by type
    const itemTypeCounts: { [key: string]: number } = {};
    suspendedContracts.forEach(contract => {
      const itemType = contract.item.type || 'Other';
      itemTypeCounts[itemType] = (itemTypeCounts[itemType] || 0) + 1;
    });

    // Sort by count and take top categories
    const sortedTypes = Object.entries(itemTypeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 4); // Show top 4 categories

    const total = suspendedContracts.length;
    const labels = sortedTypes.map(([type]) => type);
    const data = sortedTypes.map(([, count]) => Math.round((count / total) * 100));

    // Predefined colors for different item types
    const colorMap: { [key: string]: string } = {
      'Smartphone': '#60a5fa',
      'Laptop': '#a78bfa',
      'Tablet': '#f472b6',
      'Phone': '#60a5fa',
      'Gaming': '#fbbf24',
      'Electronics': '#60a5fa',
      'Jewelry': '#a78bfa',
      'Watch': '#f472b6',
      'Musical': '#fbbf24',
      'Tools': '#fbbf24',
      'Other': '#9ca3af'
    };

    const colors = labels.map(label => {
      // Find matching color or use default
      const matchingKey = Object.keys(colorMap).find(key =>
        label.toLowerCase().includes(key.toLowerCase())
      );
      return matchingKey ? colorMap[matchingKey] : colorMap['Other'];
    });

    return { labels, data, colors };
  };

  const { labels, data: chartData, colors } = calculateSuspendedDistribution();

  const data = {
    labels,
    datasets: [
      {
        label: 'Suspended Items',
        data: chartData,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    elements: {
      bar: {
        borderWidth: 2,
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.parsed.x}%`;
          }
        }
      },
    },
    scales: {
        x: {
            display: false,
            grid: {
                display: false
            }
        },
        y: {
            display: false,
            grid: {
                display: false
            }
        }
    }
  };

  // Export the calculated data for use in the legend
  const calculatedSuspendedItemsData = labels.map((label, index) => ({
    name: label,
    value: chartData[index],
    color: colors[index]
  }));

  return <Bar options={options} data={data} />;
};

// Export the function to get calculated data for legend display
export const getSuspendedItemsData = (contracts: Contract[] = []) => {
  const suspendedContracts = contracts.filter(contract =>
    contract.status === 'suspended'
  );

  if (suspendedContracts.length === 0) {
    return suspendedItemsData; // Return fallback mock data
  }

  const itemTypeCounts: { [key: string]: number } = {};
  suspendedContracts.forEach(contract => {
    const itemType = contract.item.type || 'Other';
    itemTypeCounts[itemType] = (itemTypeCounts[itemType] || 0) + 1;
  });

  const sortedTypes = Object.entries(itemTypeCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 4);

  const total = suspendedContracts.length;

  const colorMap: { [key: string]: string } = {
    'Smartphone': '#60a5fa',
    'Laptop': '#a78bfa',
    'Tablet': '#f472b6',
    'Phone': '#60a5fa',
    'Gaming': '#fbbf24',
    'Electronics': '#60a5fa',
    'Jewelry': '#a78bfa',
    'Watch': '#f472b6',
    'Musical': '#fbbf24',
    'Tools': '#fbbf24',
    'Other': '#9ca3af'
  };

  return sortedTypes.map(([type, count]) => {
    const matchingKey = Object.keys(colorMap).find(key =>
      type.toLowerCase().includes(key.toLowerCase())
    );
    return {
      name: type,
      value: Math.round((count / total) * 100),
      color: matchingKey ? colorMap[matchingKey] : colorMap['Other']
    };
  });
};

export default SuspendedItemsChart;
