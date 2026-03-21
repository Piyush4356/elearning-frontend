import React from "react";
import { MdDashboard } from "react-icons/md";
import "./account.css";
import { IoMdLogOut } from "react-icons/io";
import { UserData } from "../../context/UserContext";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Dashbord from "../dashboard/Dashboard";

const Account = ({ user }) => {
  const { setIsAuth, setUser, updateProfilePic, deleteAccount } = UserData();

  const navigate = useNavigate();

  const logoutHandler = () => {
    localStorage.clear();
    setUser([]);
    setIsAuth(false);
    toast.success("Logged Out");
    navigate("/login");
  };

  const deleteHandler = () => {
    if (window.confirm("Are you absolutely sure you want to delete your account? This will permanently wipe all your progress, testimonials, and history!")) {
      deleteAccount(navigate);
    }
  };
  return (
    <div>
      {user && (
        <div className="profile">
          <div className="profile-header">
            <div className="profile-avatar" style={{ position: "relative", overflow: "hidden", cursor: "pointer" }} title="Click to update Profile Picture">
              {user.image ? (
                <img 
                  src={`${server}/${user.image.replace(/\\/g, '/')}`} 
                  alt="Avatar" 
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                />
              ) : (
                <span>{user.name ? user.name.charAt(0).toUpperCase() : "U"}</span>
              )}
              
              <input 
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files[0]) {
                    updateProfilePic(e.target.files[0]);
                  }
                }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  opacity: 0,
                  cursor: "pointer",
                }}
              />
            </div>
            <h2>My Profile</h2>
          </div>
          
          <div className="profile-info">
            <div className="user-details">
              <h3>{user.name}</h3>
              <p className="email">{user.email}</p>
            </div>

            <div className="profile-actions">
              {user.role === "admin" && (
                <button
                  onClick={() => navigate(`/admin/dashboard`)}
                  className="common-btn admin-btn"
                >
                  <MdDashboard />
                  Admin Dashboard
                </button>
              )}

              <button
                onClick={logoutHandler}
                className="common-btn logout-btn"
              >
                <IoMdLogOut />
                Logout
              </button>

              <button
                onClick={deleteHandler}
                className="common-btn logout-btn"
                style={{ background: "linear-gradient(135deg, #ef4444, #b91c1c)", marginTop: "15px" }}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {user && <Dashbord />}
    </div>
  );
};

export default Account;