import "../../App.scss";
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
    const userDocRef = doc(db, "userCollection", currentUser.uid);
    getDoc(userDocRef).then((userDoc) => {
      if (userDoc.exists()) {
        setUserFields(userDoc.data());
        const drinkDocRef = doc(db, "drinkCollection", currentUser.uid);
        getDoc(drinkDocRef).then((drinkDoc) => {
          if (drinkDoc.exists()) {
            setDrinks(drinkDoc.data().currentDrinks);
            calculateBAC(drinkDoc.data().currentDrinks, userDoc.data());
          } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
            const docRef = doc(db, "drinkCollection", currentUser.uid);
            setDoc(docRef, { currentDrinks: [], previousDrinks: [] });
          }
        });
      } else {
        // doc.data() will be undefined in this case
        console.log("No such document!");
      }
    });
  }, [currentUser]);

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

    const docRef = doc(db, "drinkCollection", currentUser.uid);
    getDoc(docRef).then((result) => {
      if (result.exists()) {
        setDoc(docRef, { ...result.data(), currentDrinks: newDrinks }).then(
          () => {
            setDrinks(newDrinks);
            calculateBAC(newDrinks, userFields);
          }
        );
      } else {
        // doc.data() will be undefined in this case
        console.log("No such document!");
      }
    });
  };

  const removeDrink = (e) => {
    const newDrinks = drinks;
    newDrinks.pop();
    const docRef = doc(db, "drinkCollection", currentUser.uid);
    getDoc(docRef).then((result) => {
      if (result.exists()) {
        setDoc(docRef, { ...result.data(), currentDrinks: newDrinks }).then(
          () => {
            setDrinks(newDrinks);
            calculateBAC(newDrinks, userFields);
          }
        );
      } else {
        // doc.data() will be undefined in this case
        console.log("No such document!");
      }
    });
  };

  const calculateBAC = (drinkArr, userData) => {
    if (drinkArr.length == 0) {
      setBac(0);
      return;
    }
    const startTime = drinkArr[0];
    const hoursSince = Math.floor((new Date() - startTime) / 1000) / 60 / 60;
    const alcoholGrams = 14 * drinkArr.length;
    const bodyWeight = userData.bodyWeight * 453.592;
    const distributionRatio = userData.sex == "male" ? 0.68 : 0.55;

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
          calculateBAC(drinks, userFields);
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
