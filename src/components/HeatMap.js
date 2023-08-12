import React from "react";
import "../App.scss";
import { useState, useEffect } from "react";
import { Tooltip } from "@mui/material";

const HeatMap = ({ data, displayDays }) => {
  const [heatmapDays, setHeatmapDays] = useState([]);

  useEffect(() => {
    const currentDate = new Date();
    const numDaysAgo = new Date();
    numDaysAgo.setDate(numDaysAgo.getDate() - displayDays);

    const totalDays =
      Math.round((currentDate - numDaysAgo) / (1000 * 60 * 60 * 24)) + 1;

    const updatedHeatmapDays = [];
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(numDaysAgo);
      date.setDate(date.getDate() + i);

      const dateString = date.toLocaleString().split(",")[0];
      const value = data[dateString] !== undefined ? data[dateString] : 0;

      updatedHeatmapDays.push({ date: dateString, value });
    }
    setHeatmapDays(updatedHeatmapDays.reverse());
  }, [data, displayDays]);

  return (
    <div className="heatmap-container">
      {heatmapDays.map((day) => (
        <Tooltip placement="top-start" title="Hello">
          <div
            key={day.date}
            className="heatmap-dot"
            style={{
              backgroundColor: `rgba(255, 0, 0, ${day.value / 10})`,
            }}
          />
        </Tooltip>
      ))}
    </div>
  );
};

export default HeatMap;
