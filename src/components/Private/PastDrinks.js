import React from "react";
import { useState, useEffect } from "react";
import { getDoc, doc } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import db from "../../firebase";
import "../../App.scss";

function PastDrinks() {
  const [drinks, setDrinks] = useState([]);
  const { currentUser, logout } = useAuth();
  const [drinksByDate, setDrinksByDate] = useState({});

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
      {drinks.length > 0 ? (
        <div>
          {Object.keys(drinksByDate)
            .sort((a, b) => {
              return new Date(b) - new Date(a);
            })
            .map((key) => {
              return (
                <>
                  <h3>{key}</h3>
                  <p>Drinks: {drinksByDate[key]}</p>
                </>
              );
            })}
        </div>
      ) : (
        <div>
          <p>You have not recorded any drinks.</p>
        </div>
      )}
    </div>
  );
}

export default PastDrinks;
