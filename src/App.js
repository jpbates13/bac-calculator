import logo from "./logo.svg";
import "./App.scss";
import { useState } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import Profile from "./components/auth/Profile";
import { Route, Routes } from "react-router";
import BACCalc from "./components/Private/BACCalc";
import PageLayout from "./components/PageLayout";
import PrivateRoute from "./PrivateRoute";
import PastDrinks from "./components/Private/PastDrinks";

function App() {
  return (
    <div className="App" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <AuthProvider>
        <PageLayout>
          <Routes>
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <BACCalc />
                </PrivateRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <PrivateRoute>
                  <PastDrinks />
                </PrivateRoute>
              }
            />
          </Routes>
        </PageLayout>
      </AuthProvider>
    </div>
  );
}

export default App;
