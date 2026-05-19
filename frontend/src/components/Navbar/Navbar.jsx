import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaUserCircle, FaBars, FaTimes, FaSun, FaMoon, FaHome, FaTachometerAlt, FaInfoCircle,  } from "react-icons/fa";
import './Navbar.css';
import axios from 'axios';
import API_URL from '../../utils/apiConfig';

const Navbar = ({ darkMode, setDarkMode }) => {
    const navigate = useNavigate();
    const location = useLocation();
    // const [isPending, startTransition] = useTransition();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userName, setUserName] = useState(sessionStorage.getItem("username") || "");

    useEffect(() => {
        const fetchUserDetails = async () => {
          const authToken = sessionStorage.getItem("auth-token");
          if (authToken) {
            try {
              const response = await axios.post(`${API_URL}/api/auth/getuser`, {}, {
                headers: { 'auth-token': authToken }
              });
              setUserName(response.data.name);
              sessionStorage.setItem("username", response.data.name); // cache for next load
            } catch (error) {
              console.error("Error fetching the User Details: ", error);
            }
          }
        };
      
        fetchUserDetails();
      }, []);
      

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            const navContainer = document.querySelector('.nav-container');
            const menuToggle = document.querySelector('.menu-toggle');
            
            if (isMenuOpen && navContainer && !navContainer.contains(event.target) && !menuToggle.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    // Close menu when route changes
    useEffect(() => {
        setIsMenuOpen(false);
    }, [location]);

    const handleLogout = () => {
        sessionStorage.removeItem('auth-token');
        sessionStorage.removeItem("username");
        navigate('/login');
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    const toggleDarkMode = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        localStorage.setItem('darkMode', newDarkMode);
        
        if (newDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    };

    useEffect(() => {
        if (darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, [darkMode]);

    return (
        <nav className={`navbar ${darkMode ? "dark-mode" : ""}`}>
            <div className="navbar-container">
                {/* Logo and Brand */}
                <Link to="/" className="logo-container">
                    <span className="logo-text">Mr.Travis</span>
                    <span className="tagline">AI Assistant</span>
                </Link>

                {/* Theme Toggle Button for Mobile */}
                <button 
                    className="theme-toggle" 
                    onClick={toggleDarkMode} 
                    aria-label="Toggle dark mode"
                >
                    {darkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
                </button>

                {/* Mobile Menu Toggle */}
                <button 
                    className="menu-toggle" 
                    onClick={toggleMenu}
                    aria-label="Toggle navigation menu"
                >
                    {isMenuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
                </button>

                {/* Navigation Links and User Actions */}
                <div className={`nav-container ${isMenuOpen ? 'active' : ''}`}>
                    {/* Navigation Links */}
                    <ul className="nav-links">
                        <li className="nav-item">
                            <Link 
                                to="/"
                                className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
                                onClick={closeMenu}
                            >
                                <FaHome className='nav-link-icon' style={{ marginRight: '8px' }} /> Home
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link 
                                to="/dashboard"
                                className={`nav-link ${location.pathname === "/dashboard" ? "active" : ""}`}
                                onClick={closeMenu}
                            >
                                <FaTachometerAlt className='nav-link-icon' style={{ marginRight: '8px' }} /> Dashboard
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link 
                                to="/about"
                                className={`nav-link ${location.pathname === "/about" ? "active" : ""}`}
                                onClick={closeMenu}
                            >
                                <FaInfoCircle className='nav-link-icon' style={{ marginRight: '8px' }} /> About
                            </Link>
                        </li>
                    </ul>

                    {/* Auth Section */}
                    <div className="auth-section">
                        {/* Dark Mode Toggle for Desktop - Hidden on mobile */}
                        <button className="theme-toggle desktop-only" onClick={toggleDarkMode} aria-label="Toggle dark mode">
                            {darkMode ? <FaSun size={24} /> : <FaMoon size={24} />}
                        </button>
                        
                        {sessionStorage.getItem('auth-token') ? (
                            <div className="user-section">
                                <Link to="/profile" className="profile-link">
                                    <FaUserCircle className="user-icon" />
                                    <span className="user-name">{userName ? `${userName}` : "Agent Athreya"}</span>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="logout-button"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="auth-buttons">
                                <Link
                                    to="/login"
                                    className="login-page-button"
                                    onClick={closeMenu}
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/signup"
                                    className="signup-page-button"
                                    onClick={closeMenu}
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;