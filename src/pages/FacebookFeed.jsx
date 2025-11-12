import React from "react";
import axiosInstance from "../axiosInstance";

const FacebookFeed = () => {
  const handleDownload = async () => {
    try {
      // Get CSV from backend
      const res = await axiosInstance.get("/products/facebook-feed", {
        responseType: "blob", // important for files
      });

      // Create a URL and trigger download
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "facebook-feed.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error downloading feed:", err);
      alert("Failed to download Facebook feed");
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h2>Facebook Product Feed</h2>
      <p>Click below to download the CSV feed.</p>
      <button onClick={handleDownload}>Download Feed</button>
    </div>
  );
};

export default FacebookFeed;
