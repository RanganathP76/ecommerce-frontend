import React, { useState, useEffect } from "react";
import "./PageLoader.css";

const FABRIC_STAGES = [
  "CRAFTING BESPOKE PIECES...",
  "PRECISION TAILORING...",
  "LIMITED EDITION SELECTION...",
  "SETTING THE TREND..."
];

const PageLoader = () => {
  const [stageIndex, setStageIndex] = useState(0);

  // Cycle through brand tagline status messages
  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % FABRIC_STAGES.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page-loader" aria-label="Loading Cuztory Studio">
      <div className="loader-stage">
        
        {/* Ambient Glowing Background Orb */}
        <div className="light-aura"></div>

        {/* Dynamic Fashion Graphic Container */}
        <div className="fashion-graphic">
          
          {/* Laser Scanner Line (Represents Custom Sizing & Precision) */}
          <div className="laser-scanner"></div>

          {/* Limited Edition Stamp Accent */}
          <div className="limited-badge">
            <span>LTD</span>
            <div className="badge-dot"></div>
          </div>

          <svg
            className="fashion-svg"
            viewBox="0 0 140 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer Geometric Frame */}
            <rect
              x="10"
              y="10"
              width="120"
              height="120"
              rx="24"
              stroke="url(#frameGlow)"
              strokeWidth="2"
              className="atelier-frame"
            />

            {/* Corner Precision Marks */}
            <path d="M10 25 V10 H25" stroke="#0066ff" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M115 10 H130 V25" stroke="#0066ff" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M130 115 V130 H115" stroke="#3d3d8b" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M25 130 H10 V115" stroke="#3d3d8b" strokeWidth="2.5" strokeLinecap="round" />

            {/* Couture Mannequin / Form Lines */}
            {/* Neck & Shoulders */}
            <path
              d="M62 32 H78 M70 32 V38 M50 48 L70 42 L90 48"
              stroke="#3d3d8b"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mannequin-top"
            />

            {/* Avant-Garde Draped Corset / Torso Lines */}
            <path
              d="M50 48 L56 75 L62 102 M90 48 L84 75 L78 102"
              stroke="url(#bodyGlow)"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="mannequin-body"
            />

            {/* Floating Custom Tailoring Curves */}
            <path
              d="M42 60 C58 52, 82 68, 98 60"
              stroke="#0066ff"
              strokeWidth="2"
              strokeDasharray="4 4"
              className="measure-tape-1"
            />
            <path
              d="M46 80 C62 72, 78 88, 94 80"
              stroke="#0066ff"
              strokeWidth="2"
              strokeDasharray="4 4"
              className="measure-tape-2"
            />

            {/* Central Precision Accent */}
            <circle cx="70" cy="72" r="3" fill="#0066ff" className="center-pulse" />

            {/* SVG Gradients */}
            <defs>
              <linearGradient id="frameGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0066ff" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#3d3d8b" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#3d3d8b" stopOpacity="0.8" />
              </linearGradient>

              <linearGradient id="bodyGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3d3d8b" />
                <stop offset="50%" stopColor="#0066ff" />
                <stop offset="100%" stopColor="#3d3d8b" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Branding & Status */}
        <div className="brand-header">
          <span className="brand-tagline">NEW GEN ATELIER</span>
          <h1 className="brand-title">CUZTORY</h1>
          <div className="brand-indicator-bar">
            <div className="indicator-progress"></div>
          </div>
        </div>

        {/* Animated Dynamic Text */}
        <div className="status-text-wrapper">
          <p className="status-text" key={stageIndex}>
            {FABRIC_STAGES[stageIndex]}
          </p>
        </div>

      </div>
    </div>
  );
};

export default PageLoader;