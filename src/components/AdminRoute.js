import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import db from "../firebase";
import { Spinner } from "react-bootstrap";

export default function AdminRoute({ children }) {
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    if (currentUser) {
      const docRef = doc(db, "userCollection", currentUser.uid);
      getDoc(docRef).then((result) => {
        if (result.exists()) {
          setIsAdmin(result.data().isAdmin === true);
        } else {
          setIsAdmin(false);
        }
      }).catch(() => setIsAdmin(false));
    } else {
      setIsAdmin(false);
    }
  }, [currentUser]);

  if (isAdmin === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '5rem' }}>
        <Spinner animation="border" variant="light" />
      </div>
    );
  }

  return isAdmin ? children : <Navigate to="/" />;
}
