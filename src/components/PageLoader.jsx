import React from "react";
import "./PageLoader.css";

const PageLoader = ({ text = "Crafting your order..." }) => {
  return (
    <div className="page-loader">
      {/* Dynamic Background Geometry */}
      <div className="bg-grid"></div>
      <div className="radial-glow"></div>

      {/* Main Graphics Container */}
      <div className="loader-stage">
        
        {/* Floating Tailoring Lines / Orbiting Threads */}
        <div className="thread-orbit orbit-1"></div>
        <div className="thread-orbit orbit-2"></div>

        {/* 3D Isometric Fabric Layers */}
        <div className="fabric-stack">
          <div className="layer layer-3"></div>
          <div className="layer layer-2"></div>
          <div className="layer layer-1">
            {/* Laser Precision Scan Light */}
            <div className="laser-beam"></div>

            {/* Central Custom Apparel SVG */}
            <svg
              className="graphic-svg"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Geometric Silhouette */}
              <path
                d="M30 25 L50 15 L70 25 L85 38 L72 48 L65 42 L65 80 L35 80 L35 42 L28 48 L15 38 Z"
                className="path-bg"
              />
              <path
                d="M30 25 L50 15 L70 25 L85 38 L72 48 L65 42 L65 80 L35 80 L35 42 L28 48 L15 38 Z"
                className="path-animated"
              />

              {/* Collar Detail */}
              <path
                d="M38 21 C42 28, 58 28, 62 21"
                stroke="#0066ff"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Central Precision Target Crosshair */}
              <circle cx="50" cy="50" r="4" fill="#3d3d8b" className="core-dot" />
            </svg>
          </div>
        </div>

        {/* Brand Reveal & Dynamic Typography */}
        <div className="brand-block">
          <div className="brand-wrapper">
            <h1 className="brand-name">CUZTORY</h1>
            <span className="brand-glow">CUZTORY</span>
          </div>
          
          <div className="meter-bar">
            <div className="meter-fill"></div>
          </div>
          
          <p className="loader-text">{text}</p>
        </div>

      </div>
    </div>
  );
};

export default PageLoader;