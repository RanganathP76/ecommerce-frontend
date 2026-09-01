import React, { useEffect, useState } from "react";
import "./CollectionPage.css";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import axiosInstance from "../axiosInstance";
import { Helmet } from "react-helmet-async";
import PageLoader from "../components/PageLoader";

const CollectionPage = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Extract timestamp accurately from createdAt or MongoDB ObjectId
  const extractTimestamp = (item) => {
    if (item?.createdAt) return new Date(item.createdAt).getTime();
    if (item?._id && typeof item._id === 'string' && item._id.length === 24) {
      return parseInt(item._id.substring(0, 8), 16) * 1000;
    }
    return 0;
  };

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const res = await axiosInstance.get("/collections");
        const rawCollections = res.data || [];

        // Sort strictly by most recent drop first
        const sortedCols = [...rawCollections].sort(
          (a, b) => extractTimestamp(b) - extractTimestamp(a)
        );
        setCollections(sortedCols);
      } catch (err) {
        console.error("Error fetching collections:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  if (loading) return <PageLoader text="CURATING FASHION ARCHIVE..." />;

  return (
    <div className="collection-directory-page">
      <Header />

      <Helmet>
        <title>Collections | Cuztory Nxt Gen Fashion Hub</title>
        <meta
          name="description"
          content="Explore all exclusive collections, street edits, and contemporary fashion drops by Cuztory."
        />
        <meta
          name="keywords"
          content="Cuztory, Collections, Streetwear Drops, Nxt Gen Fashion Hub, Fashion Directory"
        />
        <link rel="canonical" href="https://cuztory.in/collection" />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Cuztory" />
        <meta property="og:url" content="https://cuztory.in/collection" />
        <meta
          property="og:title"
          content="Collections | Cuztory Nxt Gen Fashion Hub"
        />
        <meta
          property="og:description"
          content="Explore all exclusive collections, street edits, and contemporary fashion drops by Cuztory."
        />
        <meta property="og:image" content="https://cuztory.in/banner.png" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Collections | Cuztory Nxt Gen Fashion Hub" />
        <meta
          name="twitter:description"
          content="Explore all exclusive collections, street edits, and contemporary fashion drops by Cuztory."
        />
        <meta name="twitter:image" content="https://cuztory.in/banner.png" />

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Cuztory Collections",
            url: "https://cuztory.in/collection",
            description: "Explore all exclusive fashion collections at Cuztory Nxt Gen Fashion Hub.",
            mainEntity: collections.map((col) => ({
              "@type": "Collection",
              name: col.name,
              url: `https://cuztory.in/collection/${col.slug || col._id}`,
              image: col.image?.url || "https://cuztory.in/placeholder.png",
            })),
          })}
        </script>
      </Helmet>

      {/* 0.3cm Calibrated Top Spacing */}
      <main className="directory-wrapper">
        <section className="directory-stage">
          <div className="directory-header-container">
            <div className="directory-title-lockup">
              <div className="meta-kicker-row">
                <span className="kicker-pill">CURATED DROPS</span>
                <span className="volume-counter">
                  {collections.length} {collections.length === 1 ? "COLLECTION" : "COLLECTIONS"}
                </span>
              </div>
              <h1 className="directory-main-title">COLLECTION ARCHIVE</h1>
             
            </div>
          </div>

          {/* Dynamic Adaptive Layout */}
          <div
            className={`directory-grid ${
              collections.length === 1
                ? "single-showcase-mode"
                : collections.length === 2
                ? "dual-showcase-mode"
                : "multi-gallery-mode"
            }`}
          >
            {collections.map((col, index) => (
              <Link
                to={`/collection/${col.slug || col._id}`}
                className="monolith-collection-tile"
                key={col.slug || col._id}
              >
                <div className="tile-image-frame">
                  <img
                    src={col.image?.url || "/placeholder.png"}
                    alt={col.name}
                    loading="lazy"
                  />
                  
                  <div className="tile-floating-hud">
                    <span className="hud-index">DROP // 0{index + 1}</span>
                    {index === 0 && (
                      <span className="hud-latest-tag">LATEST</span>
                    )}
                  </div>

                  <div className="tile-scrim-overlay">
                    <div className="scrim-meta">
                      <span className="edition-callout">NXT GEN ATELIER</span>
                      <h2 className="collection-heading-text">{col.name}</h2>
                    </div>
                    <div className="scrim-action-pill">
                      <span>View Collection</span>
                      <span className="pill-arrow">↗</span>
                    </div>
                  </div>
                </div>

                <div className="tile-footer-caption">
                  <div className="caption-text-block">
                    <h3 className="caption-name">{col.name}</h3>
                    <span className="caption-sub">Explore Catalog</span>
                  </div>
                  <span className="caption-arrow-btn">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CollectionPage;
