
'use client';

import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Contract {
  item: {
    type: string;
    brand: string;
    model: string;
  };
  status: string;
}

interface CurrentItemsChartProps {
  contracts?: Contract[];
}

const CurrentItemsChart = ({ contracts = [] }: CurrentItemsChartProps) => {
  // Calculate item type distribution from real contracts
  const calculateItemDistribution = () => {
    if (!contracts || contracts.length === 0) {
      return {
        labels: ['No data'],
        data: [100],
        colors: ['#e5e7eb']
      };
    }

    // Filter active contracts only
    const activeContracts = contracts.filter(contract =>
      contract.status === 'active'
    );

    if (activeContracts.length === 0) {
      return {
        labels: ['No active items'],
        data: [100],
        colors: ['#e5e7eb']
      };
    }

    // Count items by type
    const itemTypeCounts: { [key: string]: number } = {};
    activeContracts.forEach(contract => {
      const itemType = contract.item.type || 'Other';
      itemTypeCounts[itemType] = (itemTypeCounts[itemType] || 0) + 1;
    });

    // Sort by count and take top categories
    const sortedTypes = Object.entries(itemTypeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6); // Show top 6 categories

    const total = activeContracts.length;
    const labels = sortedTypes.map(([type]) => type);
    const data = sortedTypes.map(([, count]) => Math.round((count / total) * 100));

    // Predefined colors for different item types
    const colorMap: { [key: string]: string } = {
      'Smartphone': '#3b82f6',
      'Laptop': '#ef4444',
      'Tablet': '#f97316',
      'Phone': '#3b82f6',
      'Gaming': '#8b5cf6',
      'Electronics': '#06b6d4',
      'Jewelry': '#ec4899',
      'Watch': '#84cc16',
      'Other': '#6b7280'
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

  const { labels, data: chartData, colors } = calculateItemDistribution();

  const data = {
    labels,
    datasets: [
      {
        data: chartData,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1,
      },
    ],
  };

  const options = {
    rotation: -90,
    circumference: 180,
    cutout: '30%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.parsed}%`;
          }
        }
      },
    },
    maintainAspectRatio: false,
  };

  return <Doughnut data={data} options={options} />;
};

export default CurrentItemsChart;
