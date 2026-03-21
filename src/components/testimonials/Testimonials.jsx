import React, { useState, useEffect } from "react";
import "./testimonial.css";
import axios from "axios";
import { server } from "../../main";
import { UserData } from "../../context/UserContext";
import toast from "react-hot-toast";

const Testimonials = () => {
  const defaultTestimonials = [
    {
      _id: 1,
      name: "John Doe",
      position: "Student",
      message: "This platform helped me learn so effectively. The courses are amazing and the instructors are top-notch.",
    },
    {
      _id: 2,
      name: "Jane Smith",
      position: "Student",
      message: "I've learned more here than in any other place. The interactive lessons and quizzes make learning enjoyable.",
    },
    {
      _id: 3,
      name: "John Doe",
      position: "Student",
      message: "This platform helped me learn so effectively. The courses are amazing and the instructors are top-notch.",
    },
    {
      _id: 4,
      name: "Jane Smith",
      position: "Student",
      message: "I've learned more here than in any other place. The interactive lessons and quizzes make learning enjoyable.",
    },
  ];

  const [testimonials, setTestimonials] = useState(defaultTestimonials);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const { isAuth, user } = UserData();

  const fetchTestimonials = async () => {
    try {
      const { data } = await axios.get(`${server}/api/testimonials`);
      if (data.testimonials && data.testimonials.length > 0) {
        setTestimonials(data.testimonials);
      } else {
        setTestimonials(defaultTestimonials);
      }
    } catch (error) {
      console.log(error);
      setTestimonials(defaultTestimonials);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const submitTestimonial = async (e) => {
    e.preventDefault();
    if (!message) return toast.error("Please enter a message!");
    
    try {
      const { data } = await axios.post(
        `${server}/api/testimonial/add`,
        { message, position: user?.role === "admin" ? "Admin" : "Student" },
        {
          headers: {
            token: localStorage.getItem("token"),
          },
        }
      );
      toast.success(data.message);
      setMessage("");
      setShowForm(false);
      fetchTestimonials(); 
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong.");
    }
  };

  return (
    <section className="testimonials">
      <h2>What Our Students Say</h2>
      
      {!showForm && isAuth && (
        <button className="common-btn" onClick={() => setShowForm(true)} style={{ marginBottom: "30px" }}>
          Share Your Experience
        </button>
      )}

      {showForm && (
        <div className="testimonial-form-container">
          <form onSubmit={submitTestimonial} className="testimonial-form">
            <textarea
              placeholder="What did you think of the courses? Write your review here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            ></textarea>
            <div className="form-buttons">
              <button type="submit" className="common-btn">Submit Review</button>
              <button 
                type="button" 
                className="common-btn" 
                style={{ background: "linear-gradient(135deg, #ef4444, #b91c1c)" }} 
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="testimonial-cards">
        {testimonials && testimonials.length > 0 ? (
          testimonials.map((e) => (
            <div className="testimonial-card" key={e._id}>
                <p className="message">{e.message}</p>
                <div className="info" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    <div className="testimonial-avatar" style={{
                      width: "50px", height: "50px", minWidth: "50px", borderRadius: "50%", background: "#3b82f6", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", overflow: "hidden", fontWeight: "bold"
                    }}>
                      {e.user?.image ? (
                        <img 
                          src={`${server}/${e.user.image.replace(/\\/g, '/')}`} 
                          alt={e.name} 
                          style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                        />
                      ) : (e.name ? e.name.charAt(0).toUpperCase() : "👤")}
                    </div>
                    <div>
                      <p className="name" style={{ margin: 0, fontWeight: "bold", fontSize: "16px" }}>{e.name}</p>
                      <p className="position" style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>{e.position}</p>
                    </div>
                </div>
            </div>
          ))
        ) : (
          <p>No testimonials yet. Be the first to add one!</p>
        )}
       </div>
    </section>
  );
};

export default Testimonials;
