import React, { useState, useEffect } from "react";
import { Button, Form, Spinner, Table } from "react-bootstrap";
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import db from "../../firebase";
import "../../App.scss";
import Modal from "../Modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash, faEdit, faArrowLeft, faUsers } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [drinks, setDrinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [type, setType] = useState("Beer");
  const [abv, setAbv] = useState("");

  const navigate = useNavigate();
  const drinksRef = collection(db, "drinkDirectory");

  const fetchDrinks = async () => {
    setLoading(true);
    const snapshot = await getDocs(drinksRef);
    const drinksArr = [];
    snapshot.forEach(doc => {
      drinksArr.push({ id: doc.id, ...doc.data() });
    });
    drinksArr.sort((a, b) => a.name.localeCompare(b.name));
    setDrinks(drinksArr);
    setLoading(false);
  };

  useEffect(() => {
    fetchDrinks();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const drinkData = { name, brand, type, abv: parseFloat(abv) };
    
    if (editingId) {
      await updateDoc(doc(db, "drinkDirectory", editingId), drinkData);
    } else {
      await addDoc(drinksRef, drinkData);
    }
    
    setShowModal(false);
    fetchDrinks();
  };

  const handleEdit = (drink) => {
    setEditingId(drink.id);
    setName(drink.name);
    setBrand(drink.brand || "");
    setType(drink.type);
    setAbv(drink.abv);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this drink from the global directory?")) {
      await deleteDoc(doc(db, "drinkDirectory", id));
      fetchDrinks();
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setName("");
    setBrand("");
    setType("Beer");
    setAbv("");
    setShowModal(true);
  };

  return (
    <div className="BacCalc" style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <div className="d-flex justify-content-between mb-3">
        <Button variant="link" onClick={() => navigate('/dashboard')} style={{ color: 'var(--text-secondary)', padding: 0 }}>
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Back to Profile
        </Button>
        <Button variant="link" onClick={() => navigate('/admin/users')} style={{ color: 'var(--primary-color)', padding: 0 }}>
          Manage Users <FontAwesomeIcon icon={faUsers} className="ms-2" />
        </Button>
      </div>
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 style={{ margin: 0, background: "linear-gradient(to right, #fcd34d, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Global Drink Directory
        </h2>
        <Button onClick={openNewModal} style={{ background: 'var(--primary-color)', border: 'none' }}>
          <FontAwesomeIcon icon={faPlus} className="me-2" /> Add Drink
        </Button>
      </div>

      <div className="glass-card" style={{ background: "rgba(30, 41, 59, 0.85)", borderRadius: "16px", padding: "1rem" }}>
        {loading ? (
          <div className="text-center py-5"><Spinner animation="border" variant="light" /></div>
        ) : drinks.length === 0 ? (
          <div className="text-center py-4" style={{ color: 'var(--text-secondary)' }}>No drinks in directory yet.</div>
        ) : (
          <Table hover variant="dark" style={{ background: 'transparent' }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Brand</th>
                <th>Type</th>
                <th>ABV %</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {drinks.map(drink => (
                <tr key={drink.id}>
                  <td>{drink.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{drink.brand}</td>
                  <td>{drink.type}</td>
                  <td>{drink.abv}%</td>
                  <td className="text-end">
                    <Button variant="link" onClick={() => handleEdit(drink)} style={{ color: 'var(--text-secondary)', padding: '0 0.5rem' }}>
                      <FontAwesomeIcon icon={faEdit} />
                    </Button>
                    <Button variant="link" onClick={() => handleDelete(drink.id)} style={{ color: 'var(--danger, #ef4444)', padding: '0 0.5rem' }}>
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
          <h3 className="mb-4">{editingId ? "Edit Drink" : "Add New Drink"}</h3>
          <Form onSubmit={handleSave}>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: 'var(--text-secondary)' }}>Drink Name</Form.Label>
              <Form.Control required value={name} onChange={e => setName(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }} placeholder="e.g. Guinness Draught" />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label style={{ color: 'var(--text-secondary)' }}>Brand / Brewery</Form.Label>
              <Form.Control value={brand} onChange={e => setBrand(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }} placeholder="e.g. Diageo" />
            </Form.Group>

            <div className="row">
              <div className="col-6">
                <Form.Group className="mb-4">
                  <Form.Label style={{ color: 'var(--text-secondary)' }}>Type</Form.Label>
                  <Form.Select value={type} onChange={e => setType(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <option style={{ color: 'black' }}>Beer</option>
                    <option style={{ color: 'black' }}>Wine</option>
                    <option style={{ color: 'black' }}>Liquor</option>
                    <option style={{ color: 'black' }}>Seltzer</option>
                    <option style={{ color: 'black' }}>Cocktail</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-6">
                <Form.Group className="mb-4">
                  <Form.Label style={{ color: 'var(--text-secondary)' }}>ABV (%)</Form.Label>
                  <Form.Control required type="number" step="0.1" value={abv} onChange={e => setAbv(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }} placeholder="4.2" />
                </Form.Group>
              </div>
            </div>

            <Button type="submit" className="w-100" style={{ background: 'var(--success, #10b981)', border: 'none', padding: '0.75rem', fontWeight: '600' }}>
              {editingId ? "Save Changes" : "Add to Directory"}
            </Button>
          </Form>
        </div>
      </Modal>
    </div>
  );
}
