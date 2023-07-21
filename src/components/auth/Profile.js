import React, { useState, useEffect } from "react";
import { Card, Button, Alert } from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { collection, doc, getDoc, updateDoc } from "firebase/firestore";
import db from "../../firebase";
import "../../App.scss"

export default function Dashboard() {
  const [error, setError] = useState("");
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

  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch {
      setError("There was a problem logging out");
    }
  }

  return (
    <div class="BacCalc">
      <Card>
        <Card.Body>
          <h2 className="textcenter mb-4">Profile</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <strong>Email: </strong> {currentUser.email}
          <br />
          <strong>Name: </strong> {currentUser.displayName}
          <br />
          <strong>Body Weight: </strong> {userFields?.bodyWeight}
          <br />
          <strong>Sex: </strong> {userFields?.sex}
        </Card.Body>
      </Card>
      <div className="w-100 text-center mt-2">
        <Button variant="link" onClick={handleLogout}>
          Log out
        </Button>
      </div>
    </div>
  );
}
