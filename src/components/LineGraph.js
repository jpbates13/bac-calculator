import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { format } from "date-fns";
import "../App.scss";

// Custom Tooltip for our glassmorphism UI
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const date = new Date(data.x);
    
    return (
      <div 
        className="custom-tooltip" 
        style={{
          background: 'rgba(30, 41, 59, 0.85)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '12px 16px',
          borderRadius: '12px',
          color: '#f8fafc',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
        }}
      >
        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.2em' }}>
          {data.y.toFixed(3)}%
        </p>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9em' }}>
          {format(date, 'h:mm a')}
        </p>
      </div>
    );
  }

  return null;
};

export default function LineGraph({ bacData }) {
  if (!bacData || bacData.length === 0) {
    return (
      <div id="canvas-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>No BAC data available.</p>
      </div>
    );
  }

  return (
    <div id="canvas-container">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={bacData}
          margin={{
            top: 20,
            right: 10,
            left: -20,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorBac" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="x" 
            tickFormatter={(time) => format(new Date(time), 'HH:mm')}
            stroke="rgba(255,255,255,0.3)"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            minTickGap={20}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.3)"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickFormatter={(value) => value.toFixed(3)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="y"
            stroke="#6366f1"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorBac)"
            isAnimationActive={false} /* Disabled animation for real-time updates so it doesn't flicker every 5s */
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
