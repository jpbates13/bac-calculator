import React from "react";
import { useState, useEffect } from "react";
import { getDoc, doc } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import db from "../../firebase";
import "../../App.scss";
import HeatMap from "../HeatMap";

function PastDrinks() {
  const [drinks, setDrinks] = useState([]);
  const { currentUser, logout } = useAuth();
  const [drinksByDate, setDrinksByDate] = useState({});
  const [displayDays, setDisplayDays] = useState(200);
  const [totalDrinks, setTotalDrinks] = useState(0);

  useEffect(() => {
    const docRef = doc(db, "drinkCollection", currentUser.uid);
    getDoc(docRef).then((result) => {
      if (result.exists()) {
        let previousDrinksData = result.data().previousDrinks;
        let currentDrinksData = result.data().currentDrinks;
        setDrinks([...previousDrinksData, ...currentDrinksData]);
      } else {
        // doc.data() will be undefined in this case
        console.log("No such document!");
      }
    });
  }, []);

  useEffect(() => {
    let newDrinksByDate = {};
    drinks.forEach((drink) => {
      let drinkDate = new Date(drink);
      let drinkDateKey = drinkDate.toLocaleString().split(",")[0];
      console.log(drinkDateKey);
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
            if (displayDays <= 365) {
              setDisplayDays(e.target.value);
            } else {
              setDisplayDays(365);
            }
          }}
        />{" "}
        previous days.
      </p>
      <p>
        Total drinks in this period: {totalDrinks} (
        {(totalDrinks / displayDays).toFixed(2)} per day)
      </p>
      <HeatMap
        data={drinksByDate}
        displayDays={displayDays}
        setTotalDrinks={setTotalDrinks}
      />
    </div>
  );
}

export default PastDrinks;
