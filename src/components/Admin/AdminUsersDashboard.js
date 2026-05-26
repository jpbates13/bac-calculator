import React, { useState, useEffect } from "react";
import { Button, Form, Spinner, Table } from "react-bootstrap";
import { collection, getDocs, deleteDoc, doc, setDoc } from "firebase/firestore";
import db, { auth, firebaseConfig } from "../../firebase";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "../../App.scss";
import Modal from "../Modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash, faEnvelope, faArrowLeft, faBeer } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

export default function AdminUsersDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [sex, setSex] = useState("male");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const usersRef = collection(db, "userCollection");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(usersRef);
      const usersArr = [];
      snapshot.forEach(doc => {
        usersArr.push({ id: doc.id, ...doc.data() });
      });
      // Try to get emails if possible (not possible via Firestore unless we saved them, but we can display the ID)
      setUsers(usersArr);
    } catch (err) {
      console.error("Error fetching users", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    try {
      // Create a secondary Firebase app to prevent logging out the current admin
      const secondaryApp = firebase.initializeApp(firebaseConfig, "SecondaryApp");
      
      const res = await secondaryApp.auth().createUserWithEmailAndPassword(email, password);
      
      // Update profile on secondary auth
      await res.user.updateProfile({ displayName: name });
      
      await setDoc(doc(db, "userCollection", res.user.uid), {
        displayName: name,
        email: email,
        bodyWeight: parseFloat(weight),
        sex: sex,
        isAdmin: false
      });

      // Cleanup
      await secondaryApp.auth().signOut();
      await secondaryApp.delete();
      
      setShowModal(false);
      fetchUsers();
      setEmail("");
      setPassword("");
      setName("");
      setWeight("");
      setSex("male");
    } catch (err) {
      console.error(err);
      setFormError(err.message);
    }
    setIsSubmitting(false);
  };

  const handleResetPassword = async (userEmail) => {
    if (!userEmail) {
      alert("This user does not have an email saved in Firestore.");
      return;
    }
    if (window.confirm(`Send password reset email to ${userEmail}?`)) {
      try {
        await auth.sendPasswordResetEmail(userEmail);
        alert("Password reset email sent!");
      } catch (err) {
        alert("Failed to send reset email: " + err.message);
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Warning: This only deletes their Firestore data, not their Auth account. Proceed?")) {
      try {
        await deleteDoc(doc(db, "userCollection", id));
        fetchUsers();
      } catch (err) {
        alert("Failed to delete user: " + err.message);
      }
    }
  };

  const openNewModal = () => {
    setFormError("");
    setEmail("");
    setPassword("");
    setName("");
    setWeight("");
    setSex("male");
    setShowModal(true);
  };

  return (
    <div className="BacCalc" style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <div className="d-flex justify-content-between mb-3">
        <Button variant="link" onClick={() => navigate('/dashboard')} style={{ color: 'var(--text-secondary)', padding: 0 }}>
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Back to Profile
        </Button>
        <Button variant="link" onClick={() => navigate('/admin')} style={{ color: 'var(--primary-color)', padding: 0 }}>
          Drink Directory <FontAwesomeIcon icon={faBeer} className="ms-2" />
        </Button>
      </div>
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 style={{ margin: 0, background: "linear-gradient(to right, #fcd34d, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          User Management
        </h2>
        <Button onClick={openNewModal} style={{ background: 'var(--primary-color)', border: 'none' }}>
          <FontAwesomeIcon icon={faPlus} className="me-2" /> Create User
        </Button>
      </div>

      <div className="glass-card" style={{ background: "rgba(30, 41, 59, 0.85)", borderRadius: "16px", padding: "1rem" }}>
        {loading ? (
          <div className="text-center py-5"><Spinner animation="border" variant="light" /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-4" style={{ color: 'var(--text-secondary)' }}>No users found.</div>
        ) : (
          <Table hover variant="dark" style={{ background: 'transparent' }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Weight</th>
                <th>Sex</th>
                <th>Admin</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.displayName || "No Name"}</td>
                  <td>{user.email || "No Email"}</td>
                  <td>{user.bodyWeight} lbs</td>
                  <td style={{ textTransform: 'capitalize' }}>{user.sex}</td>
                  <td>
                    {user.isAdmin ? (
                      <span style={{ color: 'var(--warning, #fbbf24)', fontWeight: 'bold' }}>Admin</span>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>User</span>
                    )}
                  </td>
                  <td className="text-end">
                    <Button 
                      variant="link" 
                      onClick={() => handleResetPassword(user.email)} 
                      style={{ color: 'var(--primary-color)', padding: '0 0.5rem' }}
                      title="Send Password Reset (Requires Email field in DB)"
                    >
                      <FontAwesomeIcon icon={faEnvelope} />
                    </Button>
                    <Button 
                      variant="link" 
                      onClick={() => handleDelete(user.id)} 
                      style={{ color: 'var(--danger, #ef4444)', padding: '0 0.5rem' }}
                      title="Delete User Data"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      <Modal isOpen={showModal} handleClose={() => setShowModal(false)}>
        <div style={{ padding: "1rem" }}>
          <h3 className="mb-4">Create New User</h3>
          {formError && <div className="alert alert-danger" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>{formError}</div>}
          <Form onSubmit={handleCreateUser}>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: 'var(--text-secondary)' }}>Email Address</Form.Label>
              <Form.Control required type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }} />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label style={{ color: 'var(--text-secondary)' }}>Temporary Password</Form.Label>
              <Form.Control required type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }} minLength={6} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ color: 'var(--text-secondary)' }}>Display Name</Form.Label>
              <Form.Control required type="text" value={name} onChange={e => setName(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }} />
            </Form.Group>

            <div className="row">
              <div className="col-6">
                <Form.Group className="mb-4">
                  <Form.Label style={{ color: 'var(--text-secondary)' }}>Weight (lbs)</Form.Label>
                  <Form.Control required type="number" value={weight} onChange={e => setWeight(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }} />
                </Form.Group>
              </div>
              <div className="col-6">
                <Form.Group className="mb-4">
                  <Form.Label style={{ color: 'var(--text-secondary)' }}>Sex</Form.Label>
                  <Form.Select value={sex} onChange={e => setSex(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <option style={{ color: 'black' }} value="male">Male</option>
                    <option style={{ color: 'black' }} value="female">Female</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-100" style={{ background: 'var(--success, #10b981)', border: 'none', padding: '0.75rem', fontWeight: '600' }}>
              {isSubmitting ? <Spinner size="sm" animation="border" /> : "Create User"}
            </Button>
          </Form>
        </div>
      </Modal>
    </div>
  );
}
