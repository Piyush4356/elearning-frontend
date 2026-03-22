import React from "react";
import {useNavigate} from "react-router-dom";
import "./home.css";
import Testimonials from "../../components/testimonials/Testimonials";

const Home = () => {
  const navigate = useNavigate();
  return (
    <>
      <div className="home">
        <div className="home-content">
          <span className="eyebrow">🎓 India's Premier EdTech Platform</span>
          <h1>Master In-Demand Skills</h1>
          <p>Unlock your potential with world-class instructors. Access 500+ expert-led courses and start your journey to knowledge today.</p>

          <div className="hero-stats">
            <div className="stat">
              <strong>50,000+</strong>
              <span>Students</span>
            </div>
            <div className="stat">
              <strong>500+</strong>
              <span>Courses</span>
            </div>
            <div className="stat">
              <strong>4.8★</strong>
              <span>Rating</span>
            </div>
          </div>

          <button onClick={()=>navigate("/courses")} className="common-btn hero-btn">
            Explore Courses →
          </button>
        </div>
      </div>
      <Testimonials/>
    </>
  );
}

export default Home;
