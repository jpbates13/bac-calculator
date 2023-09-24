import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import { enUS } from "date-fns/locale";

export default function LineGraph({ bacData }) {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
  );

  const options = {
    scales: {
      x: {
        adapters: {
          date: {
            locale: enUS,
          },
        },
        type: "time",
        time: {
          unit: "minute",
          displayFormats: {
            minute: "HH:mm",
          },
        },
      },
      y: {
        beginAtZero: true,
      },
    },
    plugins: {
      title: {
        display: true,
        text: "BAC over time",
      },
    },
    maintainAspectRatio: false,
  };

  console.log("Bac data in graph " + JSON.stringify(bacData));

  const data = {
    labels: bacData.map((data) => data.x),
    datasets: [
      {
        label: "BAC over time",
        data: bacData.map((data) => data.y),
        fill: false,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  };
  return (
    <div id="canvas-container">
      <Line options={options} data={data} height={50} />
    </div>
  );
}
