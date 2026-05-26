import "../../App.scss";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect, useState } from "react";
import { getDoc, setDoc, doc, collection, writeBatch, query, where, getDocs, addDoc, deleteDoc } from "firebase/firestore";
import db from "../../firebase";
import { Button, Fade, Form } from "react-bootstrap";
import CountUp from "react-countup";
import ReactVisibilitySensor from "react-visibility-sensor";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faMinus,
  faInfoCircle,
  faSearch,
  faGlassMartiniAlt,
  faHistory
} from "@fortawesome/free-solid-svg-icons";
import Modal from "../Modal";
import LineGraph from "../LineGraph";
import { useInterval } from "../../hooks/useInterval";
import { format } from "date-fns";

function BACCalc() {
  const [drinks, setDrinks] = useState([]); // Array of { id, timestamp, alcoholGrams }
  const [bac, setBac] = useState(0);
  const { currentUser } = useAuth();
  const [userFields, setUserFields] = useState();
  const [loading, setLoading] = useState(false);
  
  // Modals
  const [showInfo, setShowInfo] = useState(false);
  const [showBackdate, setShowBackdate] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  
  // Search State
  const [drinkDirectory, setDrinkDirectory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDirectoryDrink, setSelectedDirectoryDrink] = useState(null);
  const [drinkSizeOz, setDrinkSizeOz] = useState("");
  
  // Custom Drink State
  const [customAbv, setCustomAbv] = useState("");
  const [customOz, setCustomOz] = useState("");
  
  const [customMinutes, setCustomMinutes] = useState("");
  const [pendingBackdateMinutes, setPendingBackdateMinutes] = useState(null);
  
  const [updateBAC, setUpdateBAC] = useState(false);
  const [countStart, setCountStart] = useState(0);
  const [countEnd, setCountEnd] = useState(0);
  
  const [bacData, setBacData] = useState([]);
  const [soberAt, setSoberAt] = useState(null);

  const calculateAlcoholGrams = (oz, abv) => {
    return (oz * 29.5735) * (abv / 100) * 0.789;
  };

  // Helper function to calculate current BAC right now
  const calculateCurrentBac = (drinkArr, userData) => {
    if (drinkArr.length === 0) return 0;
    const bodyWeight = userData.bodyWeight * 453.592;
    const distributionRatio = userData.sex === "male" ? 0.68 : 0.55;
    
    let currentBac = 0;
    const sortedDrinks = [...drinkArr].sort((a, b) => a.timestamp - b.timestamp);
    let lastTime = sortedDrinks[0].timestamp;
    
    for (let i = 0; i < sortedDrinks.length; i++) {
      const drinkTime = sortedDrinks[i].timestamp;
      const hoursSinceLast = (drinkTime - lastTime) / (1000 * 60 * 60);
      currentBac = Math.max(0, currentBac - 0.015 * hoursSinceLast);
      
      const grams = sortedDrinks[i].alcoholGrams || 14;
      const bacPerDrink = (grams / (bodyWeight * distributionRatio)) * 100;
      currentBac += bacPerDrink;
      
      lastTime = drinkTime;
    }
    
    const hoursSinceLastDrink = (Date.now() - lastTime) / (1000 * 60 * 60);
    return Math.max(0, currentBac - 0.015 * hoursSinceLastDrink);
  };

  // Generates predictive curve into the future
  const generatePredictiveCurve = (drinkArr, userData) => {
    if (drinkArr.length === 0) return { curve: [], soberTime: null };

    const bodyWeight = userData.bodyWeight * 453.592;
    const distributionRatio = userData.sex === "male" ? 0.68 : 0.55;

    let curve = [];
    let currentBac = 0;
    const sortedDrinks = [...drinkArr].sort((a, b) => a.timestamp - b.timestamp);
    let lastTime = sortedDrinks[0].timestamp;
    
    curve.push({ x: lastTime - 1, y: 0 });

    for (let i = 0; i < sortedDrinks.length; i++) {
      const drinkTime = sortedDrinks[i].timestamp;
      const hoursSinceLast = (drinkTime - lastTime) / (1000 * 60 * 60);
      
      if (hoursSinceLast > 0) {
        const timeToZero = (currentBac / 0.015) * 1000 * 60 * 60;
        if (timeToZero < drinkTime - lastTime) {
          curve.push({ x: lastTime + timeToZero, y: 0 });
          curve.push({ x: drinkTime, y: 0 }); 
          currentBac = 0;
        } else {
          currentBac = currentBac - 0.015 * hoursSinceLast;
          curve.push({ x: drinkTime, y: currentBac }); 
        }
      }
      
      const grams = sortedDrinks[i].alcoholGrams || 14;
      const bacPerDrink = (grams / (bodyWeight * distributionRatio)) * 100;
      currentBac += bacPerDrink;
      
      curve.push({ x: drinkTime + 1, y: currentBac }); 
      lastTime = drinkTime;
    }

    const timeToZero = (currentBac / 0.015) * 1000 * 60 * 60;
    const soberTime = lastTime + timeToZero;
    
    let t = lastTime + 30 * 60 * 1000;
    while (t < soberTime) {
      const hours = (t - lastTime) / (1000 * 60 * 60);
      curve.push({ x: t, y: currentBac - 0.015 * hours });
      t += 30 * 60 * 1000;
    }
    
    curve.push({ x: soberTime, y: 0 });
    return { curve, soberTime };
  };

  useEffect(() => {
    const loadUserData = async () => {
      const userDocRef = doc(db, "userCollection", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setUserFields(userDoc.data());
        
        const oldDrinkDocRef = doc(db, "drinkCollection", currentUser.uid);
        const oldDrinkDoc = await getDoc(oldDrinkDocRef);
        const drinksRef = collection(db, "userCollection", currentUser.uid, "drinks");
        
        if (oldDrinkDoc.exists() && oldDrinkDoc.data().migrated !== true) {
          const batch = writeBatch(db);
          const data = oldDrinkDoc.data();
          
          if (data.previousDrinks) {
            data.previousDrinks.forEach(timestamp => {
              const newDrinkRef = doc(drinksRef);
              batch.set(newDrinkRef, { timestamp, status: 'previous', alcoholGrams: 14, name: "Standard Drink" });
            });
          }
          
          let currentDrinksArr = [];
          if (data.currentDrinks) {
            data.currentDrinks.forEach(timestamp => {
              const newDrinkRef = doc(drinksRef);
              batch.set(newDrinkRef, { timestamp, status: 'current', alcoholGrams: 14, name: "Standard Drink" });
              currentDrinksArr.push({ id: newDrinkRef.id, timestamp, alcoholGrams: 14, name: "Standard Drink" });
            });
          }
          
          batch.update(oldDrinkDocRef, { migrated: true });
          await batch.commit();
          
          setDrinks(currentDrinksArr);
          return;
        }
        
        const q = query(drinksRef, where("status", "==", "current"));
        const querySnapshot = await getDocs(q);
        const currentDrinksArr = [];
        querySnapshot.forEach((doc) => {
          currentDrinksArr.push({ 
            id: doc.id, 
            timestamp: doc.data().timestamp, 
            alcoholGrams: doc.data().alcoholGrams || 14,
            name: doc.data().name || "Standard Drink"
          });
        });
        
        setDrinks(currentDrinksArr);
      } else {
        setShowInfo(true);
      }
    };
    if (currentUser) {
      loadUserData();
    }
  }, [currentUser]);

  // Fetch directory only when modal opens
  useEffect(() => {
    if (showSearchModal && drinkDirectory.length === 0) {
      const fetchDir = async () => {
        const snap = await getDocs(collection(db, "drinkDirectory"));
        const dir = [];
        snap.forEach(d => dir.push({ id: d.id, ...d.data() }));
        dir.sort((a,b) => a.name.localeCompare(b.name));
        setDrinkDirectory(dir);
      };
      fetchDir();
    }
  }, [showSearchModal]);

  useEffect(() => {
    if (userFields && drinks.length > 0) {
      const { curve, soberTime } = generatePredictiveCurve(drinks, userFields);
      setBacData(curve);
      setSoberAt(soberTime);
      
      const newBac = calculateCurrentBac(drinks, userFields);
      if (bac.toFixed(3) !== newBac.toFixed(3)) {
        setCountStart(bac);
        setCountEnd(newBac);
        setUpdateBAC(true);
      }
      setBac(newBac);
      
      if (newBac <= 0) {
        newDrinkSession();
      }
    } else {
      setBacData([]);
      setSoberAt(null);
      setBac(0);
    }
  }, [drinks, userFields]);

  useInterval(() => {
    if (userFields && drinks.length > 0) {
      const current = calculateCurrentBac(drinks, userFields);
      if (current <= 0) {
        newDrinkSession();
      } else {
        setBac(current); 
      }
    }
  }, 10000);

  const newDrinkSession = async () => {
    setBac(0);
    const batch = writeBatch(db);
    const drinksRef = collection(db, "userCollection", currentUser.uid, "drinks");
    
    drinks.forEach(drink => {
      const drinkDocRef = doc(drinksRef, drink.id);
      batch.update(drinkDocRef, { status: 'previous' });
    });
    
    await batch.commit();
    setDrinks([]);
  };

  const addDrink = async (alcoholGrams = 14, name = "Standard Drink") => {
    setLoading(true);
    let timestamp = Date.now();
    if (pendingBackdateMinutes) {
      timestamp -= (pendingBackdateMinutes * 60 * 1000);
    }
    const drinksRef = collection(db, "userCollection", currentUser.uid, "drinks");
    
    try {
      const docRef = await addDoc(drinksRef, { timestamp, status: 'current', alcoholGrams, name });
      setDrinks([...drinks, { id: docRef.id, timestamp, alcoholGrams, name }]);
      
      // Reset search modal state
      setShowSearchModal(false);
      setSelectedDirectoryDrink(null);
      setDrinkSizeOz("");
      setCustomAbv("");
      setCustomOz("");
      setPendingBackdateMinutes(null);
    } catch (err) {
      console.error("Failed to submit drink!", err);
    }
    setLoading(false);
  };

  const quickAddLastDrink = () => {
    if (drinks.length === 0) return;
    const lastDrink = drinks[drinks.length - 1];
    addDrink(lastDrink.alcoholGrams, lastDrink.name || "Standard Drink");
  };

  const startBackdatedFlow = (minutesAgo) => {
    if (!minutesAgo || isNaN(minutesAgo) || minutesAgo <= 0) return;
    setPendingBackdateMinutes(minutesAgo);
    setShowBackdate(false);
    setCustomMinutes("");
    setShowSearchModal(true);
  };

  const removeDrink = async () => {
    if (drinks.length === 0) return;
    setLoading(true);
    
    const drinkToRemove = drinks[drinks.length - 1];
    const drinkDocRef = doc(db, "userCollection", currentUser.uid, "drinks", drinkToRemove.id);
    
    try {
      await deleteDoc(drinkDocRef);
      setDrinks(drinks.slice(0, -1));
    } catch (err) {
      console.error("Failed to remove drink!", err);
    }
    setLoading(false);
  };

  const formatTimeToSober = (ms) => {
    if (ms <= 0) return "Sober";
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  };

  const filteredDirectory = drinkDirectory.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.brand.toLowerCase().includes(searchQuery.toLowerCase()));

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
              onClick={() => setShowSearchModal(true)}
              className={"control " + (loading ? "loading-control" : "")}
            >
              <FontAwesomeIcon size="lg" icon={faPlus} />
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            {drinks.length > 0 && (
              <Button 
                size="sm" 
                variant="outline-light" 
                onClick={quickAddLastDrink}
                disabled={loading}
                style={{ 
                  borderRadius: '20px', 
                  fontSize: '0.8em', 
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.05)'
                }}
              >
                <FontAwesomeIcon icon={faHistory} className="me-2" /> Quick Add: {drinks[drinks.length - 1].name || 'Last Drink'}
              </Button>
            )}
            <a
              style={{ fontSize: "0.85em", color: "var(--text-secondary)", cursor: "pointer", textDecoration: "underline" }}
              onClick={() => setShowBackdate(true)}
            >
              Forgot to log a drink?
            </a>
          </div>
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
              onEnd={() => setUpdateBAC(false)}
            >
              {({ countUpRef, start }) => (
                <ReactVisibilitySensor onChange={start}>
                  <div style={{ fontSize: "3em", fontWeight: '700', color: "var(--primary-color)" }}>
                    <span ref={countUpRef} />
                  </div>
                </ReactVisibilitySensor>
              )}
            </CountUp>
          ) : (
            <div style={{ fontSize: "3em", fontWeight: '700', color: "var(--primary-color)" }}>
              {bac.toFixed(3)}%
            </div>
          )}
          <div className={"bacLabel"}>
            estimated real-time BAC{" "}
            <a
              style={{cursor: 'pointer'}}
              onClick={() => setShowInfo(true)}
            >
              <FontAwesomeIcon icon={faInfoCircle} />
            </a>
          </div>
        </div>
        
        <div className="textStat">
          <div style={{ fontSize: "3em", fontWeight: '700', color: 'var(--success, #10b981)' }}>
            {soberAt && soberAt > Date.now() ? formatTimeToSober(soberAt - Date.now()) : "Sober"}
          </div>
          <div className={"bacLabel"}>
            time to sober
          </div>
          {soberAt && soberAt > Date.now() && (
            <div style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>
              Sober at {format(new Date(soberAt), 'h:mm a')}
            </div>
          )}
        </div>
      </div>
      
      <LineGraph bacData={bacData} />

      {/* Add Drink Modal */}
      <Modal isOpen={showSearchModal} handleClose={() => {
        setShowSearchModal(false);
        setPendingBackdateMinutes(null);
      }}>
        <div style={{ padding: "0.5rem", minHeight: "400px" }}>
          {!selectedDirectoryDrink ? (
            <>
              <h2 style={{ marginBottom: "1.5rem", fontSize: "1.6rem", paddingRight: "1.5rem" }}>
                {pendingBackdateMinutes ? `What did you drink ${pendingBackdateMinutes} mins ago?` : "What are you drinking?"}
              </h2>
              
              <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-secondary)' }} />
                <Form.Control 
                  type="text" 
                  placeholder="Search beers, wines..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', paddingLeft: '35px' }}
                />
              </div>

              <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {filteredDirectory.map(drink => (
                  <div 
                    key={drink.id} 
                    onClick={() => setSelectedDirectoryDrink(drink)}
                    style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <div style={{ fontWeight: 'bold' }}>{drink.name}</div>
                    <div style={{ fontSize: '0.85em', color: 'var(--text-secondary)' }}>{drink.brand} • {drink.abv}% ABV</div>
                  </div>
                ))}
                {filteredDirectory.length === 0 && (
                  <div className="text-center" style={{ color: 'var(--text-secondary)', padding: '1rem' }}>No matching drinks found.</div>
                )}
              </div>

              <hr style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
              
              <div style={{ marginTop: '1rem' }}>
                <h5 style={{ color: 'var(--text-secondary)', fontSize: '0.9em', marginBottom: '1rem' }}>OR LOG CUSTOM</h5>
                <Button 
                  onClick={() => addDrink(14, "Standard Drink")}
                  className="w-100 mb-2"
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '0.75rem' }}
                >
                  <FontAwesomeIcon icon={faGlassMartiniAlt} className="me-2" /> Log 1 Standard Drink (14g)
                </Button>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <Form.Control type="number" placeholder="ABV %" value={customAbv} onChange={e => setCustomAbv(e.target.value)} style={{ flex: '1 1 45%', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Form.Control type="number" placeholder="Size (oz)" value={customOz} onChange={e => setCustomOz(e.target.value)} style={{ flex: '1 1 45%', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Button 
                    disabled={!customAbv || !customOz || loading}
                    onClick={() => addDrink(calculateAlcoholGrams(parseFloat(customOz), parseFloat(customAbv)), `Custom Drink (${customOz}oz, ${customAbv}%)`)}
                    style={{ flex: '1 1 100%', background: 'var(--primary-color)', border: 'none', padding: '0.75rem' }}
                  >
                    Log
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 style={{ marginBottom: "0.5rem", fontSize: "1.6rem", paddingRight: "1.5rem" }}>{selectedDirectoryDrink.name}</h2>
              <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>{selectedDirectoryDrink.abv}% ABV • Select Size</p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <Button 
                  disabled={loading}
                  onClick={() => addDrink(calculateAlcoholGrams(12, selectedDirectoryDrink.abv), `12oz ${selectedDirectoryDrink.name}`)}
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '1rem' }}
                >
                  12oz Can / Bottle
                </Button>
                <Button 
                  disabled={loading}
                  onClick={() => addDrink(calculateAlcoholGrams(16, selectedDirectoryDrink.abv), `16oz ${selectedDirectoryDrink.name}`)}
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '1rem' }}
                >
                  16oz Pint
                </Button>
                <Button 
                  disabled={loading}
                  onClick={() => addDrink(calculateAlcoholGrams(5, selectedDirectoryDrink.abv), `5oz ${selectedDirectoryDrink.name}`)}
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '1rem' }}
                >
                  5oz Standard Glass
                </Button>
                <Button 
                  disabled={loading}
                  onClick={() => addDrink(calculateAlcoholGrams(1.5, selectedDirectoryDrink.abv), `1.5oz ${selectedDirectoryDrink.name}`)}
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '1rem' }}
                >
                  1.5oz Shot
                </Button>
                
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
                  <Form.Control 
                    type="number" 
                    placeholder="Custom oz..." 
                    value={drinkSizeOz}
                    onChange={(e) => setDrinkSizeOz(e.target.value)}
                    style={{ flex: '1 1 60%', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '0.75rem' }}
                  />
                  <Button 
                    disabled={loading || !drinkSizeOz}
                    onClick={() => addDrink(calculateAlcoholGrams(parseFloat(drinkSizeOz), selectedDirectoryDrink.abv), `${drinkSizeOz}oz ${selectedDirectoryDrink.name}`)}
                    style={{ flex: '1 1 30%', background: 'var(--primary-color)', border: 'none', padding: '0.75rem' }}
                  >
                    Log
                  </Button>
                </div>

                <Button 
                  variant="link" 
                  onClick={() => setSelectedDirectoryDrink(null)}
                  style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}
                >
                  Back to Search
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal isOpen={showInfo} handleClose={() => setShowInfo(false)}>
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
            <br /><br />
            This equation is not 100% accurate, and your actual blood alcohol
            content can vary based on a number of factors. Regardless, you
            should use your own judgement to drink responsibily.{" "}
            <b>Please do not drink and drive</b> regardless of any value
            produced by this app.
          </p>
        </div>
      </Modal>

      <Modal isOpen={showBackdate} handleClose={() => setShowBackdate(false)}>
        <div style={{ padding: "0.5rem" }}>
          <h2 style={{ marginBottom: "1rem" }}>Log Past Drink</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            When did you start drinking your forgotten drink?
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Button 
              disabled={loading}
              onClick={() => startBackdatedFlow(15)}
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              15 mins ago
            </Button>
            <Button 
              disabled={loading}
              onClick={() => startBackdatedFlow(30)}
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              30 mins ago
            </Button>
            <Button 
              disabled={loading}
              onClick={() => startBackdatedFlow(60)}
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              1 hour ago
            </Button>
            
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
              <input 
                type="number" 
                placeholder="Custom mins..." 
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                style={{ flex: '1 1 60%', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', padding: '0.75rem' }}
              />
              <Button 
                disabled={loading || !customMinutes}
                onClick={() => startBackdatedFlow(parseInt(customMinutes))}
                style={{ flex: '1 1 30%', background: 'var(--primary-color)', border: 'none', padding: '0.75rem' }}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default BACCalc;
