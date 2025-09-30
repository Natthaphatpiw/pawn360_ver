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

export const suspendedItemsData = [
    { name: 'Electronics', value: 45, color: '#60a5fa' },
    { name: 'Jewelry', value: 25, color: '#a78bfa' },
    { name: 'Musical Instruments', value: 18, color: '#f472b6' },
    { name: 'Tools', value: 12, color: '#fbbf24' },
];

const SuspendedItemsChart = () => {
  const data = {
    labels: suspendedItemsData.map(item => item.name),
    datasets: [
      {
        label: 'Suspended Items',
        data: suspendedItemsData.map(item => item.value),
        backgroundColor: suspendedItemsData.map(item => item.color),
        borderColor: suspendedItemsData.map(item => item.color),
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

  return <Bar options={options} data={data} />;
};

export default SuspendedItemsChart;
