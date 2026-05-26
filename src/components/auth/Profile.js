import React, { useState, useEffect } from "react";
import { Button, Alert, Form, Spinner } from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import db from "../../firebase";
import "../../App.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faSave, faTimes } from "@fortawesome/free-solid-svg-icons";

export default function Profile() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { currentUser, logout } = useAuth();
  const [userFields, setUserFields] = useState(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bodyWeight, setBodyWeight] = useState("");
  const [sex, setSex] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const docRef = doc(db, "userCollection", currentUser.uid);
    getDoc(docRef).then((result) => {
      if (result.exists()) {
        const data = result.data();
        setUserFields(data);
        setBodyWeight(data.bodyWeight || "");
        setSex(data.sex || "");
        setIsAdmin(data.isAdmin || false);
        setDisplayName(currentUser.displayName || "");
      }
    });
  }, [currentUser]);

  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch {
      setError("There was a problem logging out");
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!displayName || !bodyWeight || !sex) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    try {
      // Update Firebase Auth
      await currentUser.updateProfile({
        displayName: displayName
      });

      // Update Firestore user document
      const docRef = doc(db, "userCollection", currentUser.uid);
      await updateDoc(docRef, {
        bodyWeight: Number(bodyWeight),
        sex: sex
      });

      setUserFields({ bodyWeight: Number(bodyWeight), sex: sex });
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setError("Failed to update profile.");
    }

    setLoading(false);
  }

  return (
    <div className="BacCalc profile-container" style={{ paddingTop: '2rem' }}>
      <div 
        className="glass-card" 
        style={{ 
          maxWidth: "500px", 
          margin: "0 auto", 
          padding: "2rem", 
          borderRadius: "16px",
          background: "var(--card-bg)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)"
        }}
      >
        <h2 className="text-center mb-4" style={{ 
            color: "var(--primary-color)", 
            fontWeight: "700" 
        }}>
          Your Profile
        </h2>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {!isEditing ? (
          <div className="profile-details" style={{ fontSize: "1.1rem", color: "var(--text-primary)", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Email</strong>
              <span>{currentUser.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Name</strong>
              <span>{currentUser.displayName || "Not set"}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Body Weight</strong>
              <span>{userFields?.bodyWeight ? `${userFields.bodyWeight} lbs` : "Not set"}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Sex</strong>
              <span style={{ textTransform: 'capitalize' }}>{userFields?.sex || "Not set"}</span>
            </div>

            <Button 
              className="mt-3 w-100" 
              style={{ background: 'var(--primary-color)', border: 'none', padding: '0.75rem', fontWeight: '600', transition: 'transform 0.2s' }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
              onClick={() => {
                setDisplayName(currentUser.displayName || "");
                setBodyWeight(userFields?.bodyWeight || "");
                setSex(userFields?.sex || "");
                setIsEditing(true);
                setSuccess("");
              }}
            >
              <FontAwesomeIcon icon={faEdit} className="me-2" /> Edit Profile
            </Button>

            {isAdmin && (
              <Button 
                variant="outline-warning"
                className="mt-2 w-100" 
                onClick={() => navigate('/admin')}
                style={{ border: '1px solid var(--warning, #fbbf24)', color: 'var(--warning, #fbbf24)', padding: '0.5rem', fontWeight: '500', background: 'transparent' }}
              >
                Go to Admin Dashboard
              </Button>
            )}
          </div>
        ) : (
          <Form onSubmit={handleSave} className="profile-form">
            <Form.Group className="mb-3">
              <Form.Label style={{ color: 'var(--text-secondary)' }}>Name</Form.Label>
              <Form.Control
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ color: 'var(--text-secondary)' }}>Body Weight (lbs)</Form.Label>
              <Form.Control
                type="number"
                required
                value={bodyWeight}
                onChange={(e) => setBodyWeight(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label style={{ color: 'var(--text-secondary)' }}>Sex</Form.Label>
              <Form.Select
                required
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <option value="" disabled style={{ color: 'black' }}>Select...</option>
                <option value="male" style={{ color: 'black' }}>Male</option>
                <option value="female" style={{ color: 'black' }}>Female</option>
              </Form.Select>
            </Form.Group>

            <div className="d-flex gap-2">
              <Button 
                variant="secondary" 
                className="w-50"
                onClick={() => setIsEditing(false)}
                disabled={loading}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '0.75rem', fontWeight: '500', transition: 'transform 0.2s' }}
                onMouseOver={(e) => !loading && (e.target.style.transform = 'scale(1.02)')}
                onMouseOut={(e) => !loading && (e.target.style.transform = 'scale(1)')}
              >
                <FontAwesomeIcon icon={faTimes} className="me-2" /> Cancel
              </Button>
              <Button 
                type="submit" 
                className="w-50"
                disabled={loading}
                style={{ background: 'var(--success, #10b981)', border: 'none', padding: '0.75rem', fontWeight: '600', transition: 'transform 0.2s' }}
                onMouseOver={(e) => !loading && (e.target.style.transform = 'scale(1.02)')}
                onMouseOut={(e) => !loading && (e.target.style.transform = 'scale(1)')}
              >
                {loading ? <Spinner size="sm" animation="border" /> : <><FontAwesomeIcon icon={faSave} className="me-2" /> Save</>}
              </Button>
            </div>
          </Form>
        )}
      </div>

      <div className="w-100 text-center mt-4">
        <Button 
          variant="link" 
          onClick={handleLogout} 
          style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: '500' }}
        >
          Log Out
        </Button>
      </div>
    </div>
  );
}
