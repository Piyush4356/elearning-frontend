import React, { useState, useEffect } from "react";
import "./header.css";
import { Link } from "react-router-dom";
import { FiSun, FiMoon } from "react-icons/fi";

const Header = ({isAuth}) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [theme]);
  return (
    <header>
        <div className="logo">
          <Link to={"/"}>E-Learning</Link>
        </div>

        <div className="link">
            <Link to={"/"}>Home</Link>
            <Link to={"/courses"}>Courses</Link>
            <Link to={"/about"}>About</Link>
            {isAuth ?(
            <Link to={"/account"}>Account</Link>
            ):(
            <Link to={"/login"}>Login</Link>
            )}
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "20px", display: "flex", alignItems: "center", marginLeft: "10px" }}
              className="theme-btn"
            >
              {theme === "light" ? <FiMoon color="#1e40af" /> : <FiSun color="#60a5fa" />}
            </button>
        </div>
    </header>
  );
};

export default Header;
