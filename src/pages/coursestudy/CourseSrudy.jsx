import React, { useEffect } from "react";
import "./coursestudy.css";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CourseData } from "../../context/CourseContext";
import { server } from "../../main";

const CourseStudy = ({ user }) => {
  const params = useParams();

  const { fetchCourse, course } = CourseData();
  const navigate = useNavigate();

  if (user && user.role !== "admin" && !user.subscription.includes(params.id))
    return navigate("/");

  useEffect(() => {
    fetchCourse(params.id);
  }, []);
  
  return (
    <>
      {course && (
        <div className="course-study-page">
          <div className="course-study-card">
            <div className="course-image-container">
              <img src={`${server}/${course.image}`} alt={course.title} />
            </div>
            
            <div className="course-info-container">
               <div className="course-header">
                 <h2>{course.title}</h2>
                 <p className="course-creator">by <strong>{course.createdBy}</strong></p>
               </div>
               
               <div className="course-description">
                 <p>{course.description}</p>
               </div>
               
               <div className="course-meta">
                 <div className="meta-item">
                   <span className="meta-label">Duration</span>
                   <span className="meta-value">{course.duration} weeks</span>
                 </div>
                 <div className="meta-item">
                   <span className="meta-label">Format</span>
                   <span className="meta-value">Online Video</span>
                 </div>
               </div>

               <Link to={`/lectures/${course._id}`} className="common-btn lecture-btn">
                 Go to Lectures
               </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CourseStudy;