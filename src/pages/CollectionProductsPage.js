import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import axiosInstance from "../axiosInstance";
import "./CollectionProductsPage.css";
import PageLoader from "../components/PageLoader";
import { Helmet } from "react-helmet-async";

const CollectionProductsPage = () => {
  const { id } = useParams();
  const [collectionData, setCollectionData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Extract timestamp accurately from createdAt or MongoDB ObjectId
  const extractTimestamp = (item) => {
    if (item?.createdAt) return new Date(item.createdAt).getTime();
    if (item?._id && typeof item._id === "string" && item._id.length === 24) {
      return parseInt(item._id.substring(0, 8), 16) * 1000;
    }
    return 0;
  };

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const res = await axiosInstance.get(`/collections/${id}`);
        const data = res.data || {};

        // Sort products by most recent drop first
        if (data.products && Array.isArray(data.products)) {
          data.products = [...data.products].sort(
            (a, b) => extractTimestamp(b) - extractTimestamp(a)
          );
        }

        setCollectionData(data);
        document.title = data.collection?.name
          ? `${data.collection.name} | Nxt Gen Fashion Hub`
          : "Collection | Cuztory";
      } catch (err) {
        console.error("Error fetching collection details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [id]);

  if (loading) return <PageLoader text="CURATING EDITORIAL DROP..." />;

  if (!collectionData || !collectionData.collection) {
    return (
      <div className="collection-products-root">
        <Header />
        <main className="not-found-stage">
          <div className="empty-editorial-card">
            <span className="empty-kicker">404 // NOT FOUND</span>
            <h2>Collection Archive Unavailable</h2>
            <p>The selected drop could not be retrieved from the catalog.</p>
            <Link to="/collection" className="editorial-return-btn">
              Back to Collections →
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { collection, products = [] } = collectionData;

  return (
    <div className="collection-products-root">
      <Header />

      <Helmet>
        <title>{`${collection.name} | Cuztory Nxt Gen Fashion Hub`}</title>
        <meta
          name="description"
          content={
            collection.description ||
            `Explore ${collection.name} curated drops and modern street silhouettes at Cuztory.`
          }
        />
        <link
          rel="canonical"
          href={`https://cuztory.in/collection/${collection.slug || id}`}
        />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Cuztory" />
        <meta
          property="og:title"
          content={`${collection.name} | Cuztory Nxt Gen Fashion Hub`}
        />
        <meta
          property="og:description"
          content={
            collection.description ||
            `Discover limited seasonal pieces from ${collection.name} at Cuztory.`
          }
        />
        <meta
          property="og:url"
          content={`https://cuztory.in/collection/${collection.slug || id}`}
        />
        <meta
          property="og:image"
          content={collection.image?.url || "https://cuztory.in/banner.png"}
        />

        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={`${collection.name} | Cuztory Nxt Gen Fashion Hub`}
        />
        <meta
          name="twitter:description"
          content={
            collection.description ||
            `Discover limited seasonal pieces from ${collection.name} at Cuztory.`
          }
        />
        <meta
          name="twitter:image"
          content={collection.image?.url || "https://cuztory.in/banner.png"}
        />
      </Helmet>

      {/* 0.3cm Top Spacing Gap */}
      <main className="collection-details-wrapper">
        <section className="collection-details-stage">
          
          {/* Collection Showcase Billboard Header */}
          <header className="collection-hero-billboard">
            <div className="billboard-visual-bg">
              <img
                src={collection.image?.url || "/placeholder.png"}
                alt={collection.name}
              />
              <div className="billboard-scrim"></div>
            </div>

            <div className="billboard-content-wrap">
              <div className="billboard-meta-strip">
                <Link to="/collection" className="back-directory-pill">
                  ← Collections
                </Link>
                <span className="items-badge">
                  {products.length} {products.length === 1 ? "Piece" : "Pieces"}
                </span>
              </div>

              <div className="billboard-text-block">
                <span className="billboard-kicker">NXT GEN SERIES</span>
                <h1 className="billboard-title">{collection.name}</h1>
                {collection.description && (
                  <p className="billboard-desc">{collection.description}</p>
                )}
              </div>
            </div>
          </header>

          {/* Product Grid Area */}
          <div className="collection-items-section">
            <div className="items-header-bar">
              <div className="items-title-lockup">
                <span className="badge-kicker">EDITORIAL DROPS</span>
                <h2 className="clean-title">Catalog Archive</h2>
              </div>
            </div>

            {products.length > 0 ? (
              <div
                className={`products-adaptive-layout ${
                  products.length === 1 ? "single-product-mode" : "multi-product-mode"
                }`}
              >
                {products.map((prod) => {
                  const hasDiscount =
                    prod.comparePrice && prod.comparePrice > prod.price;
                  const discountPercent = hasDiscount
                    ? Math.round(
                        ((prod.comparePrice - prod.price) / prod.comparePrice) * 100
                      )
                    : 0;

                  return (
                    <div className="premium-product-card" key={prod.slug || prod._id}>
                      <Link
                        to={`/product/${prod.slug || prod._id}`}
                        className="card-media-anchor"
                      >
                        <div className="card-media-wrap">
                          {prod.video ? (
                            <video
                              src={prod.video}
                              muted
                              autoPlay
                              loop
                              playsInline
                              preload="metadata"
                            />
                          ) : (
                            <img
                              src={
                                prod.image ||
                                (prod.images && prod.images[0]) ||
                                "/placeholder.png"
                              }
                              alt={prod.title}
                              loading="lazy"
                            />
                          )}

                          <div className="card-top-badges">
                            <span className="drop-badge">NXT GEN</span>
                            {hasDiscount && (
                              <span className="discount-tag">-{discountPercent}%</span>
                            )}
                          </div>
                        </div>
                      </Link>

                      <div className="card-body">
                        <Link
                          to={`/product/${prod.slug || prod._id}`}
                          className="product-card-title"
                        >
                          {prod.title}
                        </Link>

                        <div className="card-bottom-row">
                          <div className="card-price-matrix">
                            <span className="live-price">₹{prod.price}</span>
                            {hasDiscount && (
                              <span className="strike-price">
                                ₹{prod.comparePrice}
                              </span>
                            )}
                          </div>

                          <Link
                            to={`/product/${prod.slug || prod._id}`}
                            className="card-quick-btn"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-collection-box">
                <span className="empty-icon">⚡</span>
                <h3>Drop in Preparation</h3>
                <p>New silhouettes for this collection will be published shortly.</p>
                <Link to="/collection" className="empty-action-link">
                  Explore Other Drops →
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CollectionProductsPage;