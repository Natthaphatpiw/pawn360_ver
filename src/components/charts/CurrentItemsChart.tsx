
'use client';

import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const CurrentItemsChart = () => {
  const data = {
    labels: ['Laptop', 'Phone', 'Handheld Gaming PC'],
    datasets: [
      {
        data: [36, 50, 14],
        backgroundColor: ['#ef4444', '#3b82f6', '#f97316'],
        borderColor: ['#ef4444', '#3b82f6', '#f97316'],
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
      },
    },
    maintainAspectRatio: false,
  };

  return <Doughnut data={data} options={options} />;
};

export default CurrentItemsChart;
