import "../../App.scss";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect, useRef, useState } from "react";
import { getDoc, setDoc, doc } from "firebase/firestore";
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

function BACCalc() {
  const [drinks, setDrinks] = useState([]);
  const drinksRef = useRef(drinks);
  drinksRef.current = drinks;

  const [bac, setBac] = useState(0);
  const bacRef = useRef(bac);
  bacRef.current = bac;

  const { currentUser, logout } = useAuth();

  const [userFields, setUserFields] = useState();
  const userFieldsRef = useRef(userFields);
  userFieldsRef.current = userFields;

  const [loading, setLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [updateBAC, setUpdateBAC] = useState(false);
  const [countStart, setCountStart] = useState(0);
  const [countEnd, setCountEnd] = useState(0);

  const [bacData, setBacData] = useState([]);
  const bacDataRef = useRef(bacData);
  bacDataRef.current = bacData;

  useEffect(() => {
    const userDocRef = doc(db, "userCollection", currentUser.uid);
    getDoc(userDocRef).then((userDoc) => {
      if (userDoc.exists()) {
        setUserFields(userDoc.data());
        const drinkDocRef = doc(db, "drinkCollection", currentUser.uid);
        getDoc(drinkDocRef).then((drinkDoc) => {
          if (drinkDoc.exists()) {
            setDrinks(drinkDoc.data().currentDrinks);
            calculateBAC(drinkDoc.data().currentDrinks, userDoc.data(), 0);
          } else {
            // doc.data() will be undefined in this case, we have a new user
            setShowInfo(true);
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

  useEffect(() => {
    const interval = setInterval(
      () =>
        calculateBAC(
          drinksRef.current,
          userFieldsRef.current,
          bacRef.current,
          bacDataRef.current
        ),
      5000
    );
    return () => {
      clearInterval(interval);
    };
  }, []);

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
            calculateBAC(newDrinks, userFields, bac);
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
            calculateBAC(newDrinks, userFields, bac);
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

  const calculateBAC = (drinkArr, userData, originalBAC, bacData) => {
    if (drinkArr.length == 0) {
      setBac(0);
      if (originalBAC != 0) {
        setCountStart(originalBAC, setCountEnd(0, setUpdateBAC(true)));
      }
      return;
    }

    const bodyWeight = userData.bodyWeight * 453.592;
    const distributionRatio = userData.sex == "male" ? 0.68 : 0.55;

    let newBac = 0;
    for (let i = 0; i < drinkArr.length; i++) {
      const drinkTime = drinkArr[i];
      const hoursSince = Math.floor((new Date() - drinkTime) / 1000) / 60 / 60;
      const alcoholGrams = 14;
      newBac +=
        (alcoholGrams / (bodyWeight * distributionRatio)) * 100 -
        0.015 * hoursSince;
    }

    setBac(newBac);

    let newBacData = null;
    if (bacDataRef.current == undefined) {
      newBacData = [{ x: new Date(), y: newBac }];
    } else {
      newBacData = [...bacDataRef.current, { x: new Date(), y: newBac }];
    }
    setBacData(newBacData);

    if (originalBAC.toFixed(3) != newBac.toFixed(3)) {
      setCountStart(originalBAC, setCountEnd(newBac, setUpdateBAC(true)));
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
          <div class="drinkControls">
            <div
              onClick={loading ? null : removeDrink}
              class={"control " + (loading ? "loading-control" : "")}
            >
              <FontAwesomeIcon size="lg" icon={faMinus} />
            </div>
            <div class="drinks">{drinks.length}</div>{" "}
            <div
              onClick={loading ? null : addDrink}
              class={"control " + (loading ? "loading-control" : "")}
            >
              <FontAwesomeIcon size="lg" icon={faPlus} />
            </div>
          </div>
          <p class={"bacLabel drinkLabel"}>
            standard drink{drinks.length != 1 && "s"} since last sober
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
                    <div style={{ fontSize: "3em", color: "#337ab7" }}>
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
          <div class={"bacLabel"}>
            estimated real-time BAC{" "}
            <a
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
            <a href="https://alcohol.iupui.edu/calculators/bac.html">
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
