"use client"

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowRight, FaLightbulb, FaAccessibleIcon, FaRobot, FaLanguage, FaHeadset } from "react-icons/fa";
import "./Home.css";

const Home = ({ darkMode }) => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [animateHero, setAnimateHero] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const authToken = sessionStorage.getItem("auth-token")
    setIsLoggedIn(!!authToken)

    // Trigger animation after component mounts
    setTimeout(() => {
      setAnimateHero(true);
    }, 100)
  }, [])

  const handleGetStarted = () => {
    if (isLoggedIn) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  }

  return (
    <div className={`home-container ${darkMode ? "dark-mode" : ""}`}>
      {/* Hero Section */}
      <section className={`hero-section ${animateHero ? "animate" : ""}`}>
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="hero-title-prefix">Meet</span>
            <span className="hero-title-main">TRAVIS</span>
          </h1>
          <h2 className="hero-subtitle">Transformer-based Assistant for Service Agents</h2>
          <p className="hero-description">
            Empowering bank representatives with AI-driven assistance to provide exceptional customer
            service
          </p>
          <div className="hero-buttons">
            <button className="primary-button" onClick={handleGetStarted}>
              {isLoggedIn ? "Go to Dashboard" : "Get Started"} <FaArrowRight className="button-icon" />
            </button>
            <button className="secondary-button" onClick={() => navigate("/about")}>
              Learn More
            </button>
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-image-container">
            <div className="hero-image-circle"></div>
            <div className="hero-image-dots"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Key Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <FaRobot />
            </div>
            <h3 className="feature-title">AI-Powered Assistance</h3>
            <p className="feature-description">
              Advanced transformer-based AI system that processes customer queries with high accuracy
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FaAccessibleIcon />
            </div>
            <h3 className="feature-title">Accessibility Focused</h3>
            <p className="feature-description">
              Designed specifically for bank representatives to navigate with ease
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FaLanguage />
            </div>
            <h3 className="feature-title">Multilingual Support</h3>
            <p className="feature-description">
              Translates responses into local languages to better serve diverse customer bases
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FaHeadset />
            </div>
            <h3 className="feature-title">Voice Assistance</h3>
            <p className="feature-description">
              Converts text responses to speech for seamless communication with customers
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3 className="step-title">Query Processing</h3>
            <p className="step-description">Customer queries are processed by our transformer-based AI system</p>
          </div>
          <div className="step-connector"></div>
          <div className="step">
            <div className="step-number">2</div>
            <h3 className="step-title">Classification</h3>
            <p className="step-description">Queries are categorized into standardized formats for accurate responses</p>
          </div>
          <div className="step-connector"></div>
          <div className="step">
            <div className="step-number">3</div>
            <h3 className="step-title">Translation</h3>
            <p className="step-description">Responses are translated into the preferred language when needed</p>
          </div>
          <div className="step-connector"></div>
          <div className="step">
            <div className="step-number">4</div>
            <h3 className="step-title">Voice Conversion</h3>
            <p className="step-description">
              Text is converted to speech for the representative to communicate with customers
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="benefits-content">
          <h2 className="section-title">Why Choose TRAVIS?</h2>
          <ul className="benefits-list">
            <li className="benefit-item">
              <FaLightbulb className="benefit-icon" />
              <div>
                <h3 className="benefit-title">Enhanced Productivity</h3>
                <p className="benefit-description">
                  Enables service agents to handle customer queries efficiently
                </p>
              </div>
            </li>
            <li className="benefit-item">
              <FaLightbulb className="benefit-icon" />
              <div>
                <h3 className="benefit-title">Improved Accuracy</h3>
                <p className="benefit-description">
                  Reduces errors in customer interactions with AI-powered assistance
                </p>
              </div>
            </li>
            <li className="benefit-item">
              <FaLightbulb className="benefit-icon" />
              <div>
                <h3 className="benefit-title">Inclusive Workplace</h3>
                <p className="benefit-description">
                  Creates opportunities for individuals in customer service
                </p>
              </div>
            </li>
            <li className="benefit-item">
              <FaLightbulb className="benefit-icon" />
              <div>
                <h3 className="benefit-title">Customer Satisfaction</h3>
                <p className="benefit-description">
                  Delivers prompt and accurate responses to enhance customer experience
                </p>
              </div>
            </li>
          </ul>
        </div>
        <div className="benefits-image">
          <div className="benefits-image-container"></div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Transform Customer Service?</h2>
          <p className="cta-description">
            Join us in empowering service agents with cutting-edge AI technology
          </p>
          <button className="primary-button cta-button" onClick={handleGetStarted}>
            {isLoggedIn ? "Access Dashboard" : "Get Started Now"} <FaArrowRight className="button-icon" />
          </button>
        </div>
      </section>
    </div>
  )
}

export default Home;