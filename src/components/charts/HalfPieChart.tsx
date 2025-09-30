'use client';

import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface HalfPieChartProps {
  data: ChartData[];
}

export default function HalfPieChart({ data }: HalfPieChartProps) {
  const chartData = {
    labels: data.map(item => item.name),
    datasets: [
      {
        data: data.map(item => item.value),
        backgroundColor: data.map(item => item.color),
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    circumference: Math.PI, // Half circle (180 degrees)
    rotation: Math.PI, // Start from bottom
    plugins: {
      legend: {
        display: false, // We'll create custom legend
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.parsed}%`;
          }
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 0
      }
    },
    layout: {
      padding: 0
    }
  };

  return (
    <div className="flex gap-4 items-center">
      <div className="w-40 h-20 flex-shrink-0">
        <Pie data={chartData} options={options} />
      </div>
      <div className="space-y-2 text-xs">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span 
              className="w-3 h-3 rounded-full flex-shrink-0" 
              style={{ backgroundColor: item.color }}
            ></span>
            <span className="text-xs">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}