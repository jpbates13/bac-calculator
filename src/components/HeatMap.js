import React from "react";
import "../App.scss";
import { useState, useEffect } from "react";
import { Tooltip } from "@mui/material";
import { format } from "date-fns";

const HeatMap = ({ data, displayDays, setTotalDrinks }) => {
  const [heatmapDays, setHeatmapDays] = useState([]);
  const [openToolTip, setOpenToolTip] = useState(null);

  useEffect(() => {
    const currentDate = new Date();
    const numDaysAgo = new Date();
    numDaysAgo.setDate(numDaysAgo.getDate() - (displayDays - 1));

    const totalDays = Math.round(
      (currentDate - numDaysAgo) / (1000 * 60 * 60 * 24) + 1
    );

    const updatedHeatmapDays = [];
    let updatedTotalDrinks = 0;
    
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(numDaysAgo);
      date.setDate(date.getDate() + i);

      const dateString = format(date, 'yyyy-MM-dd');
      const value = data[dateString] !== undefined ? data[dateString] : 0;
      updatedTotalDrinks += value;

      updatedHeatmapDays.push({ date: dateString, value, originalDate: date });
    }
    
    setHeatmapDays(updatedHeatmapDays.reverse());
    setTotalDrinks(updatedTotalDrinks);
  }, [data, displayDays, setTotalDrinks]);

  return (
    <div className="heatmap-container">
      {heatmapDays.map((day) => (
        <div
          key={day.date}
          onClick={() => {
            if (openToolTip != null) {
              setOpenToolTip(null);
            }
          }}
        >
          <Tooltip
            placement="top"
            title={
              <p style={{ margin: 0 }}>
                {format(day.originalDate, 'MMM do, yyyy')}<br />
                Drinks: {day.value}
              </p>
            }
            open={day.date === openToolTip}
          >
            <div
              className="heatmap-dot"
              style={{
                backgroundColor: `rgba(255, 0, 0, ${Math.min(1, day.value / 8)})`,
              }}
              onClick={() => {
                setOpenToolTip(day.date);
              }}
            />
          </Tooltip>
        </div>
      ))}
    </div>
  );
};

export default HeatMap;
