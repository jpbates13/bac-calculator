import React, { useContext, useState, useEffect } from "react";
import { auth } from "../firebase";
import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import db from "../firebase";
const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function signup(email, password, fullName, bodyWeight, sex) {
    await auth
      .createUserWithEmailAndPassword(email, password)
      .then(async (result) => {
        console.log(result.user.uid);
        await setDoc(doc(db, "userCollection", result.user.uid), {
          sex: sex,
          bodyWeight: bodyWeight,
        });
        return result.user.updateProfile({
          displayName: fullName,
        });
      })
      .catch((error) => {
        throw error;
      });
  }

  function login(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
  }

  function logout() {
    return auth.signOut();
  }

  const value = { currentUser, signup, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
