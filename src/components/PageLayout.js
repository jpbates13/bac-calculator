import React, { useState } from "react";
import "../App.scss";
// import Github from "../images/svg/social-1_logo-github.svg";
// import LinkedIn from "../images/svg/social-1_logo-linkedin.svg";
import { Navbar, Nav, Container } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import CookieConsent from "react-cookie-consent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalculator,
  faUser,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";

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
        <div class="current-content">{props.children}</div>
      </div>
      <footer class="footer page-footer text-center block third">
        <br />
        <div class="bottom-nav">
          {currentUser && (
            <>
              <div>
                <Nav.Link href="/">
                  <FontAwesomeIcon size="lg" icon={faCalculator} />
                </Nav.Link>
              </div>
              <div>
                <Nav.Link href="/dashboard">
                  <FontAwesomeIcon size="lg" icon={faUser} />
                </Nav.Link>
              </div>
              <div>
                <Nav.Link onClick={handleLogout}>
                  <FontAwesomeIcon size="lg" icon={faRightFromBracket} />
                </Nav.Link>
              </div>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
