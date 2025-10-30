import React from "react";
import "./PageLoader.css";

const PageLoader = ({ text = "Loading..." }) => {
  return (
    <div className="page-loader">
      <div className="spinner-ring">
        <div className="dot"></div>
      </div>
      <p className="loader-text">{text}</p>
    </div>
  );
};

export default PageLoader;
