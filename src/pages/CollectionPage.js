// src/pages/CollectionPage.js
import React, { useEffect, useState } from "react";
import "./CollectionPage.css";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import axiosInstance from "../axiosInstance";

const CollectionPage = () => {
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const res = await axiosInstance.get("/collections"); // ✅ Only endpoint
        setCollections(res.data);
      } catch (err) {
        console.error("Error fetching collections:", err);
      }
    };

    fetchCollections();
  }, []);

  return (
    <div className="collection-page">
      <Header />

      <section className="content">
        <h2>All Collections</h2>
        <div className="grid">
          {collections.map((col) => (
            <Link to={`/collection/${col._id}`} className="card" key={col._id}>
                <img
                  src={col.image?.url || '/placeholder.png'}
                  alt={col.name}
               />
  <h3>{col.name}</h3>
</Link>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default CollectionPage;
