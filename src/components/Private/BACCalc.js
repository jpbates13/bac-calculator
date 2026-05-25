import "../../App.scss";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect, useState } from "react";
import { getDoc, setDoc, doc, collection, writeBatch, query, where, getDocs, addDoc, deleteDoc } from "firebase/firestore";
import db from "../../firebase";
import { Button, Fade } from "react-bootstrap";
import CountUp from "react-countup";
import ReactVisibilitySensor from "react-visibility-sensor";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faMinus,
  faInfoCircle,
  faClose,
} from "@fortawesome/free-solid-svg-icons";
import Modal from "../Modal";
import LineGraph from "../LineGraph";
import { useInterval } from "../../hooks/useInterval";

function BACCalc() {
  const [drinks, setDrinks] = useState([]); // Array of { id, timestamp }
  const [bac, setBac] = useState(0);
  const { currentUser, logout } = useAuth();
  const [userFields, setUserFields] = useState();
  const [loading, setLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [updateBAC, setUpdateBAC] = useState(false);
  const [countStart, setCountStart] = useState(0);
  const [countEnd, setCountEnd] = useState(0);
  const [bacData, setBacData] = useState([]);

  useEffect(() => {
    const loadUserData = async () => {
      const userDocRef = doc(db, "userCollection", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setUserFields(userDoc.data());
        
        // Check for old drinkCollection to migrate
        const oldDrinkDocRef = doc(db, "drinkCollection", currentUser.uid);
        const oldDrinkDoc = await getDoc(oldDrinkDocRef);
        const drinksRef = collection(db, "userCollection", currentUser.uid, "drinks");
        
        if (oldDrinkDoc.exists() && oldDrinkDoc.data().migrated !== true) {
          console.log("Migrating old drinks...");
          const batch = writeBatch(db);
          const data = oldDrinkDoc.data();
          
          if (data.previousDrinks) {
            data.previousDrinks.forEach(timestamp => {
              const newDrinkRef = doc(drinksRef);
              batch.set(newDrinkRef, { timestamp, status: 'previous' });
            });
          }
          
          let currentDrinksArr = [];
          if (data.currentDrinks) {
            data.currentDrinks.forEach(timestamp => {
              const newDrinkRef = doc(drinksRef);
              batch.set(newDrinkRef, { timestamp, status: 'current' });
              currentDrinksArr.push({ id: newDrinkRef.id, timestamp });
            });
          }
          
          batch.update(oldDrinkDocRef, { migrated: true });
          await batch.commit();
          
          setDrinks(currentDrinksArr);
          calculateBAC(currentDrinksArr, userDoc.data(), 0, bacData);
          return;
        }
        
        // Normal load from subcollection
        const q = query(drinksRef, where("status", "==", "current"));
        const querySnapshot = await getDocs(q);
        const currentDrinksArr = [];
        querySnapshot.forEach((doc) => {
          currentDrinksArr.push({ id: doc.id, timestamp: doc.data().timestamp });
        });
        
        setDrinks(currentDrinksArr);
        calculateBAC(currentDrinksArr, userDoc.data(), 0, bacData);
      } else {
        setShowInfo(true);
      }
    };
    if (currentUser) {
      loadUserData();
    }
  }, [currentUser]);

  useInterval(() => {
    if (userFields) {
      calculateBAC(drinks, userFields, bac, bacData);
    }
  }, 5000);

  const newDrinkSession = async () => {
    setBac(0);
    const batch = writeBatch(db);
    const drinksRef = collection(db, "userCollection", currentUser.uid, "drinks");
    
    // Set all current drinks to previous
    drinks.forEach(drink => {
      const drinkDocRef = doc(drinksRef, drink.id);
      batch.update(drinkDocRef, { status: 'previous' });
    });
    
    await batch.commit();
    setDrinks([]);
  };

  const addDrink = async (e) => {
    setLoading(true);
    const timestamp = Date.now();
    const drinksRef = collection(db, "userCollection", currentUser.uid, "drinks");
    
    try {
      const docRef = await addDoc(drinksRef, { timestamp, status: 'current' });
      const newDrinks = [...drinks, { id: docRef.id, timestamp }];
      setDrinks(newDrinks);
      calculateBAC(newDrinks, userFields, bac, bacData);
    } catch (err) {
      console.error("Failed to submit drink!", err);
    }
    setLoading(false);
  };

  const removeDrink = async (e) => {
    if (drinks.length === 0) return;
    setLoading(true);
    
    const drinkToRemove = drinks[drinks.length - 1];
    const newDrinks = drinks.slice(0, -1);
    const drinkDocRef = doc(db, "userCollection", currentUser.uid, "drinks", drinkToRemove.id);
    
    try {
      await deleteDoc(drinkDocRef);
      setDrinks(newDrinks);
      calculateBAC(newDrinks, userFields, bac, bacData);
    } catch (err) {
      console.error("Failed to remove drink!", err);
    }
    setLoading(false);
  };

  const calculateBAC = (drinkArr, userData, originalBAC, currentBacData) => {
    if (drinkArr.length === 0) {
      setBac(0);
      if (originalBAC !== 0) {
        setCountStart(originalBAC);
        setCountEnd(0);
        setUpdateBAC(true);
      }
      return;
    }

    const bodyWeight = userData.bodyWeight * 453.592;
    const distributionRatio = userData.sex === "male" ? 0.68 : 0.55;
    const alcoholGrams = 14;
    const bacPerDrink = (alcoholGrams / (bodyWeight * distributionRatio)) * 100;

    let newBac = 0;
    const sortedDrinks = [...drinkArr].map(d => d.timestamp).sort((a, b) => a - b);
    let lastTime = sortedDrinks[0];

    for (let i = 0; i < sortedDrinks.length; i++) {
      const drinkTime = sortedDrinks[i];
      const hoursSinceLast = (drinkTime - lastTime) / (1000 * 60 * 60);
      
      // Metabolize alcohol since the last calculation
      newBac = Math.max(0, newBac - 0.015 * hoursSinceLast);
      
      // Add the new drink
      newBac += bacPerDrink;
      
      lastTime = drinkTime;
    }

    // Metabolize alcohol since the very last drink to the current time
    const hoursSinceLastDrink = (new Date() - lastTime) / (1000 * 60 * 60);
    newBac = Math.max(0, newBac - 0.015 * hoursSinceLastDrink);

    setBac(newBac);

    let newBacData = currentBacData || [];
    newBacData = [...newBacData, { x: new Date(), y: newBac }];
    setBacData(newBacData);

    if (originalBAC.toFixed(3) !== newBac.toFixed(3)) {
      setCountStart(originalBAC);
      setCountEnd(newBac);
      setUpdateBAC(true);
    }

    // All the alcohol has metabolized
    if (newBac <= 0) {
      newDrinkSession();
    }
  };

  return (
    <div className="BacCalc">
      <div className="textStats">
        <div className="textStat">
          <div className="drinkControls">
            <div
              onClick={loading ? null : removeDrink}
              className={"control " + (loading ? "loading-control" : "")}
            >
              <FontAwesomeIcon size="lg" icon={faMinus} />
            </div>
            <div className="drinks">{drinks.length}</div>{" "}
            <div
              onClick={loading ? null : addDrink}
              className={"control " + (loading ? "loading-control" : "")}
            >
              <FontAwesomeIcon size="lg" icon={faPlus} />
            </div>
          </div>
          <p className={"bacLabel drinkLabel"}>
            standard drink{drinks.length !== 1 && "s"} since last sober
          </p>
        </div>
        <div className="textStat">
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
                setUpdateBAC(false);
              }}
            >
              {({ countUpRef, start }) => (
                <>
                  <ReactVisibilitySensor onChange={start}>
                    <div style={{ fontSize: "3em", color: "var(--primary-color, #337ab7)" }}>
                      <span ref={countUpRef} />
                    </div>
                  </ReactVisibilitySensor>
                </>
              )}
            </CountUp>
          ) : (
            <>
              <div style={{ fontSize: "3em" }}>{bac.toFixed(3)}%</div>
            </>
          )}
          <div className={"bacLabel"}>
            estimated real-time BAC{" "}
            <a
              style={{cursor: 'pointer'}}
              onClick={() => {
                setShowInfo(true);
              }}
            >
              <FontAwesomeIcon icon={faInfoCircle} />
            </a>
          </div>
        </div>
      </div>
      <LineGraph bacData={bacData} />
      <Modal
        isOpen={showInfo}
        handleClose={() => {
          setShowInfo(false);
        }}
      >
        <div>
          <h2>Disclaimer</h2>
          <p style={{ fontSize: "1em" }}>
            This <i>estimated</i> value is calculated using your body weight,
            sex, and timing of your drinks in the{" "}
            <a href="https://alcohol.iupui.edu/calculators/bac.html" target="_blank" rel="noreferrer">
              Widmark Equation
            </a>
            . Each time you click the add drink button a drink is timestamped.
            The BAC value is updated automatically over time.
            <br />
            <br />
            This equation is not 100% accurate, and your actual blood alcohol
            content can vary based on a number of factors. Regardless, you
            should use your own judgement to drink responsibily.{" "}
            <b>Please do not drink and drive</b> regardless of any value
            produced by this app.
          </p>
        </div>
      </Modal>
    </div>
  );
}

export default BACCalc;
