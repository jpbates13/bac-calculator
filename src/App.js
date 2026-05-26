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
import AdminRoute from "./components/AdminRoute";
import AdminDashboard from "./components/Admin/AdminDashboard";
import AdminUsersDashboard from "./components/Admin/AdminUsersDashboard";
import BeerBubbles from "./components/BeerBubbles";

function App() {
  return (
    <div className="App" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <BeerBubbles />
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
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminUsersDashboard />
                </AdminRoute>
              }
            />
          </Routes>
        </PageLayout>
      </AuthProvider>
    </div>
  );
}

export default App;
