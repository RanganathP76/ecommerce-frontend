// src/pages/CollectionPage.js
import React, { useEffect, useState } from "react";
import "./CollectionPage.css";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import axiosInstance from "../axiosInstance";
import { Helmet } from "react-helmet-async";

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

      <Helmet>
  {/* ======= Basic SEO ======= */}
  <title>Cuzto Collections | Explore Personalized Gift Categories</title>
  <meta
    name="description"
    content="Explore Cuzto’s personalized gift collections — from custom photo lamps and keychains to name boards and jerseys. Perfect gifts for every occasion!"
  />
  <meta
    name="keywords"
    content="Cuzto collections, personalized gift categories, custom photo lamps, custom keychains, customized gifts, Cuzto store"
  />
  <link rel="canonical" href="https://cuztory.in/collection" />

  {/* ======= Open Graph (for Facebook / WhatsApp) ======= */}
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Cuzto" />
  <meta property="og:url" content="https://cuztory.in/collection" />
  <meta
    property="og:title"
    content="Cuzto Collections | Custom Gifts & Personalized Products"
  />
  <meta
    property="og:description"
    content="Discover unique personalized gift collections — photo lamps, keychains, frames, and more at Cuzto."
  />
  <meta property="og:image" content="https://cuztory.in/banner.png" />

  {/* ======= Twitter Card ======= */}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Cuzto Collections | Personalized Gifts" />
  <meta
    name="twitter:description"
    content="Explore all personalized collections — create gifts that tell your story at Cuzto."
  />
  <meta name="twitter:image" content="https://cuztory.in/banner.png" />

  {/* ======= JSON-LD Structured Data (Dynamic) ======= */}
  <script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Cuzto Collections",
      url: "https://cuztory.in/collection",
      description:
        "Browse all personalized gift collections available at Cuzto.",
      mainEntity: collections.map((col) => ({
        "@type": "Collection",
        name: col.name,
        url: `https://cuztory.in/collection/${col._id}`,
        image: col.image?.url || "https://cuztory.in/placeholder.png",
      })),
    })}
  </script>
</Helmet>


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
