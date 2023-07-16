import React, { useState } from "react";
import "../App.scss";
// import Github from "../images/svg/social-1_logo-github.svg";
// import LinkedIn from "../images/svg/social-1_logo-linkedin.svg";
import { Navbar, Nav, Container } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import { FaMoon, FaSun } from "react-icons/fa";
import CookieConsent from "react-cookie-consent";

export default function PageLayout(props) {
  const currentYear = new Date().getFullYear();
  const [error, setError] = useState("");
  const { currentUser, logout } = useAuth();

  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate("/");
    } catch {
      setError("There was a problem logging out");
    }
  }
  return (
    <div>
      <CookieConsent>
        This website uses cookies to improve user experience and analyze website
        traffic.
      </CookieConsent>
      <div class="container page-content">
        <div class="header page-header">
          <div class="header-content">
            <a href="/" style={{ textDecoration: "none" }}>
              <div class="pageTitle">
                <h1>Realtime BAC Calculator</h1>
              </div>
            </a>
            {error && <p>error</p>}
            {currentUser && (
              <div>
                <Navbar
                  collapseOnSelect
                  expand="sm"
                  class="navbar navbar-expand-lg"
                >
                  <Container>
                    <Navbar.Toggle
                      class="navbar-toggler"
                      type="button"
                      data-toggle="collapse"
                      data-target="#navbarSupportedContent"
                      aria-controls="navbarSupportedContent"
                      aria-expanded="false"
                      aria-label="Toggle navigation"
                    >
                      <span class="mobileMenuIcon navbar-toggler-icon"></span>
                    </Navbar.Toggle>

                    <Navbar.Collapse
                      class="collapse navbar-collapse"
                      id="navbarSupportedContent"
                    >
                      <Nav>
                        <Nav.Link class="nav-item active" href="/">
                          <b>Calculator</b>
                        </Nav.Link>
                        <Nav.Link class="nav-item active" href="/dashboard">
                          <b>Profile</b>
                        </Nav.Link>
                        <Nav.Link
                          class="nav-item active"
                          onClick={handleLogout}
                        >
                          <b>Log Out</b>
                        </Nav.Link>
                      </Nav>
                    </Navbar.Collapse>
                  </Container>
                </Navbar>
              </div>
            )}
          </div>
        </div>
        <div class="current-content">{props.children}</div>
      </div>
      <footer class="footer page-footer text-center block third">
        <br />
        <div class="social-icon-set"></div>
        <br />
        <p>
          Copyright &copy; {currentYear} <a href="/">JakeBates.com</a>
        </p>
      </footer>
    </div>
  );
}
