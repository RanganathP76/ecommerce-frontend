import React from "react";
import "./PageLoader.css";

const PageLoader = ({ text = "Crafting your experience..." }) => {
  return (
    <div className="page-loader" aria-label="Loading page">
      <div className="loader-container">
        {/* Glow backdrop behind the graphic */}
        <div className="aura-glow"></div>

        {/* Dynamic Apparel Stitch & Scanner Graphic */}
        <div className="apparel-graphic-wrapper">
          <svg
            className="apparel-svg"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background dashed outline ring */}
            <circle
              cx="60"
              cy="60"
              r="52"
              stroke="rgba(0, 102, 255, 0.1)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              className="ring-bg"
            />

            {/* Rotating accent orbit */}
            <circle
              cx="60"
              cy="60"
              r="52"
              stroke="url(#gradient-accent)"
              strokeWidth="2"
              strokeLinecap="round"
              className="ring-orbit"
            />

            {/* Glowing Hanger Silhouette */}
            <path
              d="M60 28 C60 24, 65 22, 65 26 C65 30, 60 32, 60 35 L60 40 M32 50 L60 40 L88 50 C90 51, 88 54, 85 53 L35 53 C32 54, 30 51, 32 50 Z"
              stroke="#3d3d8b"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="hanger-path"
            />

            {/* Animated Thread-Formed Jersey Outline */}
            <path
              d="M38 52 L26 62 L32 72 L40 66 L40 88 C40 90, 42 92, 44 92 L76 92 C78 92, 80 90, 80 88 L80 66 L88 72 L94 62 L82 52 C74 58, 46 58, 38 52 Z"
              stroke="url(#gradient-thread)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="jersey-stitch-path"
            />

            {/* --- SCANNER GRAPHICS --- */}
            {/* Scanner Line over the Hanger */}
            <line
              x1="45"
              y1="35"
              x2="75"
              y2="35"
              stroke="#0066ff"
              strokeWidth="1.5"
              className="hanger-scan-line"
            />

            {/* Scanning Laser Sweep over T-shirt */}
            <rect
              x="36"
              y="54"
              width="48"
              height="2"
              fill="#0066ff"
              className="tshirt-scan-laser"
              style={{ filter: "drop-shadow(0 0 6px #0066ff)" }}
            />

            {/* --- INTEGRATED CZ T-SHIRT LOGO --- */}
            <g className="cz-logo-group" style={{ filter: "drop-shadow(0 0 4px rgba(0, 102, 255, 0.8))" }}>
              {/* Vector Path for C */}
              <path
                d="M55 67 C50 67, 47 70, 47 74 C47 78, 50 81, 55 81"
                stroke="#0066ff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="cz-path-c"
              />
              {/* Vector Path for Z */}
              <path
                d="M63 67 L73 67 L63 81 L73 81"
                stroke="#0066ff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="cz-path-z"
              />
            </g>

            {/* Gradients */}
            <defs>
              <linearGradient id="gradient-thread" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3d3d8b" />
                <stop offset="50%" stopColor="#0066ff" />
                <stop offset="100%" stopColor="#3d3d8b" />
              </linearGradient>

              <linearGradient id="gradient-accent" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0066ff" stopOpacity="0" />
                <stop offset="50%" stopColor="#0066ff" stopOpacity="1" />
                <stop offset="100%" stopColor="#3d3d8b" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Brand Name with Shimmer Sweep */}
        <div className="brand-section">
          <h1 className="brand-name">CUZTORY</h1>
          <div className="shimmer-line"></div>
        </div>

        {/* Dynamic Status Text */}
        <p className="loader-text">{text}</p>
      </div>
    </div>
  );
};

export default PageLoader;