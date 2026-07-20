import React from "react";
import "./PageLoader.css";

const PageLoader = ({ text = "INITIALIZING STYLES..." }) => {
  return (
    <div className="neon-loader-wrapper">
      {/* Laser-guided Split Curtains */}
      <div className="laser-curtain curtain-left">
        <div className="laser-edge-right"></div>
      </div>
      <div className="laser-curtain curtain-right">
        <div className="laser-edge-left"></div>
      </div>

      {/* Cyber Grid Background Effect */}
      <div className="cyber-grid"></div>

      {/* Central Hologram Stage */}
      <div className="holo-stage">
        {/* Glowing Orbit Rings (Simulating 3D Fabric Weave) */}
        <div className="orbit-ring ring-1"></div>
        <div className="orbit-ring ring-2"></div>
        <div className="orbit-ring ring-3"></div>

        {/* Dynamic Holographic Apparel SVG */}
        <div className="apparel-glow-box">
          <svg
            className="neon-apparel-svg"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer Silhouette */}
            <path
              className="glow-path main-body"
              d="M18 10L26 18C28 20 36 20 38 18L46 10L58 18L52 30L46 27V54H18V27L12 30L6 18L18 10Z"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Neon Fabric Fold Lines */}
            <path
              className="glow-path fold-line-1"
              d="M26 18V54"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
            <path
              className="glow-path fold-line-2"
              d="M38 18V54"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
            <path
              className="glow-path collar-glow"
              d="M26 18C28 22 36 22 38 18"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* Futuristic Neon Text */}
        <div className="neon-text-container">
          <p className="neon-text" data-text={text}>
            {text}
          </p>
        </div>

        {/* Dual High-Voltage Progress Bars */}
        <div className="neon-progress-track">
          <div className="neon-progress-bar"></div>
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
