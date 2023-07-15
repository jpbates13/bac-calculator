import React, { useRef, useState } from "react";
import { Form, Button, Card, Alert } from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet";

export default function Signup() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const passwordConfirmRef = useRef();
  const firstNameRef = useRef();
  const lastNameRef = useRef();
  const bodyWeightRef = useRef();
  const sexRef = useRef();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signup, currentUser } = useAuth();

  const navigate = useNavigate();

  if (currentUser) {
    return <Navigate to="/dashboard" />;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (passwordRef.current.value !== passwordConfirmRef.current.value) {
      return setError("Passwords do not match");
    }

    try {
      setError("");
      setLoading(true);
      await signup(
        emailRef.current.value,
        passwordRef.current.value,
        firstNameRef.current.value + " " + lastNameRef.current.value,
        bodyWeightRef.current.value,
        sexRef.current.value
      );
      navigate("/dashboard");
    } catch {
      setError("Failed to create an account");
    }

    setLoading(false);
  }

  return (
    <div>
      <Helmet>
        <title>JakeBates.com | Signup</title>
      </Helmet>
      <Card>
        <Card.Body>
          <h2 className="textcenter mb-4">Sign Up</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group id="email">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" ref={emailRef} required />
            </Form.Group>
            <Form.Group id="firstName">
              <Form.Label>First Name</Form.Label>
              <Form.Control type="text" ref={firstNameRef} required />
            </Form.Group>
            <Form.Group id="lastName">
              <Form.Label>Last Name</Form.Label>
              <Form.Control type="text" ref={lastNameRef} required />
            </Form.Group>
            <Form.Group id="bodyWeight">
              <Form.Label>Body Weight (lbs)</Form.Label>
              <Form.Control type="number" ref={bodyWeightRef} required />
            </Form.Group>
            <Form.Group id="sex">
              <Form.Label>Sex</Form.Label>
              <Form.Select ref={sexRef} required>
                <option>Choose a sex...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </Form.Select>
            </Form.Group>
            <Form.Group id="password">
              <Form.Label>Password</Form.Label>
              <Form.Control type="password" ref={passwordRef} required />
            </Form.Group>
            <Form.Group id="password-confirm">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control type="password" ref={passwordConfirmRef} required />
            </Form.Group>
            <br />
            <Button disabled={loading} className="w-100" type="submit">
              Sign Up
            </Button>
          </Form>
        </Card.Body>
      </Card>
      <div className="w-100 text-center mt-2">
        Already have an account? <Link to="/login"> Log in </Link>
      </div>
    </div>
  );
}
