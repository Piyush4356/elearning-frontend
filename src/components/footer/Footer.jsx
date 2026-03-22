import React from "react";
import "./footer.css";
import {
  AiFillFacebook,
  AiFillInstagram,
} from "react-icons/ai";
import { FaXTwitter } from "react-icons/fa6";

const Footer = () => {
  return (
    <footer>
      <div className="footer-content">
        <p>
          &copy; 2025 Your E-Learning Platform. All rights reserved. <br />
          Made with ❤️ by <a href="">Piyush Sharma</a>
        </p>
        <div className="social-links">
          <a href="">
            <AiFillFacebook />
          </a>
          <a href="">
            <FaXTwitter />
          </a>
          <a href="">
            <AiFillInstagram />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;