import React from "react";
import { useState, useEffect } from "react";
import { collection, query, getDocs } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import db from "../../firebase";
import "../../App.scss";
import HeatMap from "../HeatMap";
import { format } from "date-fns";

function PastDrinks() {
  const [drinks, setDrinks] = useState([]);
  const { currentUser } = useAuth();
  const [drinksByDate, setDrinksByDate] = useState({});
  const [displayDays, setDisplayDays] = useState(200);
  const [totalDrinks, setTotalDrinks] = useState(0);

  useEffect(() => {
    const fetchDrinks = async () => {
      if (currentUser) {
        const drinksRef = collection(db, "userCollection", currentUser.uid, "drinks");
        const q = query(drinksRef);
        const snapshot = await getDocs(q);
        
        const allDrinks = [];
        snapshot.forEach((doc) => {
          allDrinks.push(doc.data().timestamp);
        });
        
        setDrinks(allDrinks);
      }
    };
    
    fetchDrinks();
  }, [currentUser]);

  useEffect(() => {
    let newDrinksByDate = {};
    drinks.forEach((drink) => {
      let drinkDate = new Date(drink);
      let drinkDateKey = format(drinkDate, 'yyyy-MM-dd');
      
      if (drinkDateKey in newDrinksByDate) {
        newDrinksByDate[drinkDateKey] += 1;
      } else {
        newDrinksByDate[drinkDateKey] = 1;
      }
    });
    setDrinksByDate(newDrinksByDate);
  }, [drinks]);

  return (
    <div className="BacCalc">
      <h1>Drink History</h1>
      <p>
        Display{" "}
        <input
          value={displayDays}
          className="displayDaysInput"
          type="number"
          min="1"
          max="365"
          onChange={(e) => {
            const val = parseInt(e.target.value);
            if (isNaN(val) || val < 1) {
              setDisplayDays('');
            } else if (val <= 365) {
              setDisplayDays(val);
            } else {
              setDisplayDays(365);
            }
          }}
          onBlur={(e) => {
            if (!displayDays || displayDays < 1) setDisplayDays(1);
          }}
        />{" "}
        previous days.
      </p>
      <p>
        Total drinks in this period: {totalDrinks} (
        {(totalDrinks / (displayDays || 1)).toFixed(2)} per day)
      </p>
      <HeatMap
        data={drinksByDate}
        displayDays={displayDays || 1}
        setTotalDrinks={setTotalDrinks}
      />
    </div>
  );
}

export default PastDrinks;
