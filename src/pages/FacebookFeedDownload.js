import React, { useEffect } from "react";

const FacebookFeedDownload = () => {
  useEffect(() => {
    // Backend API URL that returns the CSV
    const backendFeedUrl = `${process.env.REACT_APP_API_URL}/products/facebook-feed`;

    // Create a hidden <a> element and auto-click it
    const link = document.createElement("a");
    link.href = backendFeedUrl;
    link.setAttribute("download", "Cuztory-product-details.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, []);

  return (
    <div
      style={{
        textAlign: "center",
        marginTop: "100px",
        fontFamily: "sans-serif",
      }}
    >
      <h3>📦 Preparing your Facebook product feed...</h3>
      <p>If the download doesn’t start automatically, <a href={`${process.env.REACT_APP_API_URL}/products/facebook-feed`}>click here</a>.</p>
    </div>
  );
};

export default FacebookFeedDownload;
