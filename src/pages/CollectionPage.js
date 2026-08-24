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
  <title>Cuztory Collections</title>
  <meta
    name="description"
    content="Explore Cuztory’s | Nxt Gen Fashion Hub |"
  />
  <meta
    name="keywords"
    content="Cuztory | Nxt Gen Fashion Hub |"
  />
  <link rel="canonical" href="https://cuztory.in/collection" />

  {/* ======= Open Graph (for Facebook / WhatsApp) ======= */}
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Cuzto" />
  <meta property="og:url" content="https://cuztory.in/collection" />
  <meta
    property="og:title"
    content="Cuztory Collections | Nxt Gen Fashion Hub |"
  />
  <meta
    property="og:description"
    content="Explore Cuztory’s | Nxt Gen Fashion Hub |"
  />
  <meta property="og:image" content="https://cuztory.in/banner.png" />

  {/* ======= Twitter Card ======= */}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Cuztory Collections | Nxt Gen Fashion Hub |" />
  <meta
    name="twitter:description"
    content="Explore Cuztory’s | Nxt Gen Fashion Hub |"
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
        "Explore Cuztory’s | Nxt Gen Fashion Hub |",
      mainEntity: collections.map((col) => ({
        "@type": "Collection",
        name: col.name,
        url: `https://cuztory.in/collection/${col.slug || col._id}`,
        image: col.image?.url || "https://cuztory.in/placeholder.png",
      })),
    })}
  </script>
</Helmet>


      <section className="content">
        <h2>All Collections</h2>
        <div className="grid">
          {collections.map((col) => (
            <Link to={`/collection/${col.slug || col._id}`} className="card" key={col.slug || col._id}>
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
