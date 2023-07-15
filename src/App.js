import logo from "./logo.svg";
import "./App.css";
import { useState } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import Profile from "./components/auth/Profile";
import { Route, Routes } from "react-router";
import BACCalc from "./components/Private/BACCalc";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Routes>
          <Route path="/" element={<BACCalc />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Profile />} />
        </Routes>
      </AuthProvider>
    </div>
  );
}

export default App;
