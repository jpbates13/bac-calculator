import "../../App.css";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect } from "react";
import { getDoc, setDoc, doc } from "firebase/firestore";
import db from "../../firebase";
import { Button } from "react-bootstrap";

function BACCalc() {
  const [drinks, setDrinks] = useState([]);
  const [bac, setBac] = useState(0);
  const { currentUser, logout } = useAuth();
  const [userFields, setUserFields] = useState();

  useEffect(() => {
    const docRef = doc(db, "userCollection", currentUser.uid);
    getDoc(docRef).then((result) => {
      if (result.exists()) {
        setUserFields(result.data());
      } else {
        // doc.data() will be undefined in this case
        console.log("No such document!");
      }
    });
  }, [currentUser]);

  useEffect(() => {
    const docRef = doc(db, "drinkCollection", currentUser.uid);
    getDoc(docRef).then((result) => {
      if (result.exists()) {
        setDrinks(result.data().currentDrinks);
      } else {
        // doc.data() will be undefined in this case
        console.log("No such document!");
        const docRef = doc(db, "drinkCollection", currentUser.uid);
        setDoc(docRef, { currentDrinks: [], previousDrinks: [] });
      }
    });
  }, []);

  useEffect(() => {
    if (drinks.length > 0) {
      calculateBAC(drinks);
    }
  }, [drinks]);

  const newDrinkSession = () => {
    setBac(0);
    let previousDrinks = [];
    const docRef = doc(db, "drinkCollection", currentUser.uid);
    getDoc(docRef).then((result) => {
      if (result.exists()) {
        previousDrinks = result.data().previousDrinks;
        previousDrinks = [...previousDrinks, ...drinks];
        setDoc(docRef, { currentDrinks: [], previousDrinks: previousDrinks });
        setDrinks([]);
      } else {
        // doc.data() will be undefined in this case
        console.log("No such document!");
      }
    });
  };

  const addDrink = (e) => {
    const newDrinks = [...drinks, Date.now()];
    setDrinks(newDrinks);
    const docRef = doc(db, "drinkCollection", currentUser.uid);
    getDoc(docRef).then((result) => {
      if (result.exists()) {
        setDoc(docRef, { ...result.data(), currentDrinks: newDrinks });
      } else {
        // doc.data() will be undefined in this case
        console.log("No such document!");
      }
    });
    calculateBAC(newDrinks);
  };

  const removeDrink = (e) => {
    const newDrinks = drinks;
    newDrinks.pop();
    setDrinks(newDrinks);
    const docRef = doc(db, "drinkCollection", currentUser.uid);
    getDoc(docRef).then((result) => {
      if (result.exists()) {
        setDoc(docRef, { ...result.data(), currentDrinks: newDrinks });
      } else {
        // doc.data() will be undefined in this case
        console.log("No such document!");
      }
    });
    calculateBAC(newDrinks);
  };

  const calculateBAC = (drinkArr) => {
    if (drinkArr.length == 0) {
      setBac(0);
      return;
    }
    const startTime = drinkArr[0];
    const hoursSince = Math.floor((new Date() - startTime) / 1000) / 60 / 60;
    const alcoholGrams = 14 * drinkArr.length;
    const bodyWeight = userFields.bodyWeight * 453.592;
    const distributionRatio = userFields.sex == "male" ? 0.68 : 0.55;

    const newBac =
      (alcoholGrams / (bodyWeight * distributionRatio)) * 100 -
      0.015 * hoursSince;

    setBac(newBac);

    // All the alcohol has metabolized
    if (newBac <= 0) {
      newDrinkSession();
    }
  };

  return (
    <div className="App">
      <h1>Realtime BAC Calculator</h1>
      <Button onClick={removeDrink} size={"lg"}>
        -
      </Button>{" "}
      <Button onClick={addDrink} size={"lg"}>
        +
      </Button>
      <br />
      <p></p>
      <Button
        onClick={(e) => {
          calculateBAC(drinks);
        }}
        disabled={drinks.length == 0}
        size={"sm"}
      >
        Refresh
      </Button>
      <p></p>
      <p>Estimated BAC: {bac.toFixed(3)}%</p>
      <p>Number of drinks in this session: {drinks.length}</p>
    </div>
  );
}

export default BACCalc;
