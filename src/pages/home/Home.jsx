import React, { use } from "react";
import {useNavigate} from "react-router-dom";
import "./home.css";
import Testimonials from "../../components/testimonials/Testimonials";

const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="home">
      <div className="home-content">
        <h1>Welcome to E-Learning Platform</h1>
        <p>Your journey to knowledge starts here.</p>
        <button onClick={()=>navigate("/courses")} className="common-btn">Get Started
        </button>
      </div>
      <Testimonials/>
    </div>
  );
}

export default Home;
