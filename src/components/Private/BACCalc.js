import "../../App.scss";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect } from "react";
import { getDoc, setDoc, doc } from "firebase/firestore";
import db from "../../firebase";
import { Button } from "react-bootstrap";
import CountUp from "react-countup";
import ReactVisibilitySensor from "react-visibility-sensor";

function BACCalc() {
  const [drinks, setDrinks] = useState([]);
  const [bac, setBac] = useState(0);
  const { currentUser, logout } = useAuth();
  const [userFields, setUserFields] = useState();
  const [loading, setLoading] = useState(false);
  const [updateBAC, setUpdateBAC] = useState(false);
  const [countStart, setCountStart] = useState(0);
  const [countEnd, setCountEnd] = useState(0);

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

  const addDrink = async (e) => {
    setLoading(true);
    const newDrinks = [...drinks, Date.now()];
    const docRef = doc(db, "drinkCollection", currentUser.uid);
    await getDoc(docRef)
      .then(async (result) => {
        if (result.exists()) {
          await setDoc(docRef, {
            ...result.data(),
            currentDrinks: newDrinks,
          }).then(async () => {
            setDrinks(newDrinks);
            calculateBAC(newDrinks, userFields);
          });
        } else {
          // doc.data() will be undefined in this case
          console.log("No such document!");
        }
      })
      .catch((err) => {
        console.error("Failed to submit drink!");
      });
    setLoading(false);
  };

  const removeDrink = async (e) => {
    setLoading(true);
    const newDrinks = drinks;
    newDrinks.pop();
    const docRef = doc(db, "drinkCollection", currentUser.uid);
    await getDoc(docRef)
      .then(async (result) => {
        if (result.exists()) {
          await setDoc(docRef, {
            ...result.data(),
            currentDrinks: newDrinks,
          }).then(async () => {
            setDrinks(newDrinks);
            calculateBAC(newDrinks, userFields);
          });
        } else {
          // doc.data() will be undefined in this case
          console.log("No such document!");
        }
      })
      .catch((err) => {
        console.error("Failed to submit drink!");
      });
    setLoading(false);
  };

  const calculateBAC = (drinkArr, userData) => {
    const originalBAC = bac;
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
    setCountStart(originalBAC, setCountEnd(newBac, setUpdateBAC(true)));

    // All the alcohol has metabolized
    if (newBac <= 0) {
      newDrinkSession();
    }
  };

  return (
    <div className="App">
      {updateBAC ? (
        <CountUp
          start={countStart}
          end={countEnd}
          duration={2.75}
          separator=" "
          decimals={3}
          decimal="."
          suffix="%"
          onEnd={() => {
            console.log("Ended");
            setUpdateBAC(false);
          }}
          onStart={() => console.log("Started! 💨")}
        >
          {({ countUpRef, start }) => (
            <>
              <ReactVisibilitySensor onChange={start}>
                <div style={{ fontSize: "7em", color: "red" }}>
                  <span ref={countUpRef} />
                </div>
              </ReactVisibilitySensor>
            </>
          )}
        </CountUp>
      ) : (
        <>
          <div style={{ fontSize: "7em" }}>{bac.toFixed(3)}%</div>
        </>
      )}
      <div>Estimated BAC</div>
      <br />
      <Button
        onClick={(e) => {
          calculateBAC(drinks, userFields);
        }}
        disabled={drinks.length == 0 || loading || updateBAC}
        size={"sm"}
      >
        Refresh
      </Button>
      <div style={{ fontSize: "7em" }}>{drinks.length}</div>
      <p>drinks since last sober</p>
      <br></br>
      <Button onClick={removeDrink} size={"lg"} disabled={loading}>
        <div style={{ fontSize: "1em" }}>Remove Drink</div>
      </Button>{" "}
      <Button onClick={addDrink} size={"lg"} disabled={loading}>
        <div style={{ fontSize: "1em" }}>Add Drink</div>
      </Button>
    </div>
  );
}

export default BACCalc;
