import React, { memo } from 'react';
import './About.css'; // Make sure to create this CSS file
import { FaArrowRight } from 'react-icons/fa';

const About = memo(() => {
  return (
    <div className="about-page">
      <div className="about-container">
        <div className="about-header">
          <h1>About TRAVIS</h1>
          <p className="about-subtitle">Transformer-based Assistant for Service agents</p>
        </div>
        
        <div className="about-content">
          <div className="about-card">
            <div className="card-icon mission-icon">
              <i className="fas fa-bullseye"></i>
            </div>
            <div className="card-content">
              <h2>Our Mission</h2>
              <p>
                TRAVIS is designed to empower banking professionals with cutting-edge AI technology, 
                enabling them to provide exceptional customer service with confidence and efficiency.
              </p>
            </div>
          </div>
          
          <div className="about-card">
            <div className="card-icon features-icon">
              <i className="fas fa-cogs"></i>
            </div>
            <div className="card-content">
              <h2>What We Do</h2>
              <p>
                Our transformer-based AI system processes customer queries in real-time, accurately classifies them 
                into standardized categories, and provides representatives with appropriate responses. These responses 
                can be translated into local languages and converted to speech, creating a seamless communication experience.
              </p>
            </div>
          </div>
          
          <div className="about-card">
            <div className="card-icon tech-icon">
              <i className="fas fa-laptop-code"></i>
            </div>
            <div className="card-content">
              <h2>Technology</h2>
              <p>
                Built on the MERN stack (MongoDB, Express, React, Node.js) and integrated with state-of-the-art 
                generative AI and text-to-speech technologies, TRAVIS represents the intersection of accessibility 
                and innovation in financial services.
              </p>
            </div>
          </div>
          
          <div className="about-card">
            <div className="card-icon vision-icon">
              <i className="fas fa-eye"></i>
            </div>
            <div className="card-content">
              <h2>Our Vision</h2>
              <p>
                TRAVIS demonstrates our commitment to developing technology that expands employment opportunities 
                and enhances workplace accessibility for all individuals.
              </p>
            </div>
          </div>
        </div>
        
        <div className="about-metrics">
          <div className="metric-item">
            <span className="metric-value">98%</span>
            <span className="metric-label">Query Accuracy</span>
          </div>
          <div className="metric-item">
            <span className="metric-value">15+</span>
            <span className="metric-label">Supported Languages</span>
          </div>
          <div className="metric-item">
            <span className="metric-value">3x</span>
            <span className="metric-label">Efficiency Improvement</span>
          </div>
        </div>
        
        <div className="about-cta">
          <h3>Experience the TRAVIS Advantage</h3>
          <p>Discover how our AI-powered solution is transforming customer service capabilities for banking professionals.</p>
          <button className="primary-button cta-button">Request Demo <FaArrowRight className="button-icon" /></button>
        </div>
      </div>
    </div>
  );
});

export default About;