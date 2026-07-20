import React from "react";
import "./PageLoader.css";

const PageLoader = ({ text = "Crafting Tomorrow's Trends" }) => {
  return (
    <div className="page-loader">

      <div className="cloth left"></div>
      <div className="cloth right"></div>

      <div className="loader-center">

        <div className="hanger">
          <div className="hook"></div>
          <div className="hanger-body"></div>
        </div>

        <h1 className="brand">
          CUZTORY
        </h1>

        <p>{text}</p>

      </div>

    </div>
  );
};

export default PageLoader;
