import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";
import { CodeIcon, HamburgetMenuClose, HamburgetMenuOpen } from "./Icons";
import { toast, Toaster } from 'react-hot-toast';
import axios from 'axios';
import {  useNavigate } from 'react-router-dom';
import { useUser } from "../user-context";

function NavbarAfterLogin() {
  const {user, logout } = useUser();
  const [click, setClick] = useState(false);
  const navigate = useNavigate();
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  const logOut = () => {
    if (user) {
      const logoutEndpoint = `${apiBaseUrl}/user/logout`;
      axios.get(logoutEndpoint)
        .then((result) => {
          console.log(result);
          if (result.data.success === true) {
            console.log(`logged out Successfully ${user.role}`);
            toast.success("Logging Out", { duration: 1000 });
            setTimeout(function() {
              logout();
              navigate("/");
            }, 1000); 

          } else {
            toast.error("Unable to Logout", { duration: 1000 });
          } 
        })
        .catch(error => {
          console.error('Error:', error.message);
          toast.error(error.message, { duration: 1000 });
        });  
    }
  }
  
  const handleClick = () => setClick(!click);

  return (
    <>
    {user &&(
      <nav className="navbar">
        <div className="nav-container">
          <Toaster />
          <NavLink exact to="/" className="nav-logo">
            <span>V Place</span>
            <span className="icon">
              <CodeIcon />
            </span>
            <span>  {user.role}</span>
          </NavLink>
          <ul className={click ? "nav-menu active" : "nav-menu"}>
            {user.role === "Student" ? (
              <li className="nav-item">
                <NavLink
                  exact
                  to="/studentHome"
                  activeClassName="active"
                  className="nav-links"
                  onClick={handleClick}
                >
                  Home
                </NavLink>
              </li>
              ):(
                <li className="nav-item">
                <NavLink
                  exact
                  to="/adminHome"
                  activeClassName="active"
                  className="nav-links"
                  onClick={handleClick}
                >
                  Home
                </NavLink>
                </li>
              )
            }
            <li className="nav-item">
              <NavLink
                activeClassName="active"
                className="nav-links"
                onClick={handleClick}
              >
                {user.name}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                activeClassName="active"
                className="nav-links"
                onClick={logOut}
              >
                Logout
              </NavLink>
            </li>
          </ul>
          <div className="nav-icon" onClick={handleClick}>
            {click ? (
              <span className="icon">
                <HamburgetMenuOpen />{" "}
              </span>
            ) : (
              <span className="icon"> 
                <HamburgetMenuClose />
              </span>
            )}
          </div>
        </div>
      </nav>
    )}
    </>
  );
}

export default NavbarAfterLogin;
