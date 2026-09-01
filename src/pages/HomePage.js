import { useEffect, useState, useRef } from 'react';
import axiosInstance from "../axiosInstance";
import Header from '../components/Header';
import Footer from '../components/Footer';
import './HomePage.css';
import { Link } from "react-router-dom";
import PageLoader from "../components/PageLoader";
import { Helmet } from "react-helmet-async";

export default function HomePage() {
  const [collections, setCollections] = useState([]);
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideRef = useRef({ startX: 0 });
  const [loading, setLoading] = useState(true);
  const slideInterval = useRef(null);

  // Helper to accurately extract timestamp from MongoDB ObjectId or createdAt date
  const extractTimestamp = (item) => {
    if (item?.createdAt) return new Date(item.createdAt).getTime();
    if (item?._id && typeof item._id === 'string' && item._id.length === 24) {
      return parseInt(item._id.substring(0, 8), 16) * 1000;
    }
    return 0;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bannerRes, colRes, prodRes] = await Promise.all([
          axiosInstance.get('/banners'),
          axiosInstance.get('/collections'),
          axiosInstance.get('/products'),
        ]);

        setBanners(bannerRes.data || []);

        // Sort Collections strictly: MOST RECENT FIRST
        const rawCollections = colRes.data || [];
        const sortedCols = [...rawCollections].sort(
          (a, b) => extractTimestamp(b) - extractTimestamp(a)
        );
        setCollections(sortedCols);

        // Sort Products strictly: MOST RECENT FIRST
        const rawProducts = prodRes.data || [];
        const sortedProds = [...rawProducts].sort(
          (a, b) => extractTimestamp(b) - extractTimestamp(a)
        );
        setProducts(sortedProds.slice(0, 8));
      } catch (error) {
        console.error("Error loading Nxt Gen fashion ecosystem:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      startAutoSlide();
    }
    return () => stopAutoSlide();
  }, [banners]);

  const startAutoSlide = () => {
    stopAutoSlide();
    slideInterval.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4500);
  };

  const stopAutoSlide = () => {
    if (slideInterval.current) clearInterval(slideInterval.current);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
    startAutoSlide();
  };

  const handleTouchStart = (e) => {
    slideRef.current.startX = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (!slideRef.current.startX) return;
    const endX = e.changedTouches[0].clientX;
    const diff = slideRef.current.startX - endX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      } else {
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
      }
      startAutoSlide();
    }
    slideRef.current.startX = 0;
  };

  if (loading) return <PageLoader text="INITIALIZING NXT-GEN ATELIER..." />;

  return (
    <div className="fashion-hub-page">
      <Header />

      <Helmet>
        <title>Cuztory | Nxt Gen Fashion Hub</title>
        <meta
          name="description"
          content="Modern drops, luxury streetwear, and curated apparel at Cuztory."
        />
        <link rel="canonical" href="https://cuztory.in/" />
      </Helmet>

      {/* Main Container with 0.3cm Top Gap */}
      <main className="page-wrapper">

        {/* ================= 1. SHOP BY COLLECTION (RECENT 1ST) ================= */}
        {collections.length > 0 && (
          <section className="segmented-section">
            <div className="section-container">
              <div className="section-header-bar flex-split">
                <div className="title-lockup">
                  <span className="badge-kicker">CURATED DROPS</span>
                  <h2 className="clean-title">Shop by Collection</h2>
                </div>
                {collections.length > 1 && (
                  <span className="count-pill">{collections.length} Collections</span>
                )}
              </div>

              {/* Dynamic Presentation: Single Hero Mode or Multi Strip Mode */}
              <div
                className={`collection-adaptive-wrap ${
                  collections.length === 1 ? "single-collection-mode" : "multi-collection-mode"
                }`}
              >
                {collections.map((col, idx) => (
                  <Link
                    to={`/collection/${col._id}`}
                    className="collection-item-card"
                    key={col._id}
                  >
                    <div className="collection-photo-frame">
                      <img
                        src={col.image?.url || '/placeholder.png'}
                        alt={col.name}
                        loading="lazy"
                      />
                      {idx === 0 && collections.length > 1 && (
                        <span className="latest-tag">LATEST</span>
                      )}
                      {collections.length === 1 && (
                        <div className="featured-banner-tag">
                          <span>FEATURED COLLECTION</span>
                          <span className="explore-btn">Explore Drop →</span>
                        </div>
                      )}
                    </div>
                    <div className="collection-name-pill">
                      <span className="col-name-text">{col.name}</span>
                      {collections.length > 1 && (
                        <span className="col-subtext">View Drop →</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ================= 2. HERO BANNER SLIDER ================= */}
        {banners.length > 0 && (
          <section className="segmented-section">
            <div className="section-container">
              <div
                className="banner-slider-box"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <div
                  className="banner-slider-track"
                  style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                  {banners.map((banner, idx) => (
                    <a
                      href={banner.link || "#"}
                      key={banner._id || idx}
                      className="banner-slide"
                    >
                      <img
                        src={banner.image?.url || "/placeholder.png"}
                        alt={banner.title || "Featured Collection"}
                      />
                      <div className="banner-bottom-bar">
                        <span className="banner-callout">NXT GEN SEASON DROP</span>
                        <span className="banner-link-btn">Shop Now →</span>
                      </div>
                    </a>
                  ))}
                </div>

                {banners.length > 1 && (
                  <div className="banner-indicators">
                    {banners.map((_, index) => (
                      <button
                        key={index}
                        className={`indicator-dot ${index === currentIndex ? "active" : ""}`}
                        onClick={() => goToSlide(index)}
                        aria-label={`Slide ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ================= 3. FEATURED PRODUCTS (RECENT 1ST) ================= */}
        {products.length > 0 && (
          <section className="segmented-section">
            <div className="section-container">
              <div className="section-header-bar flex-split">
                <div className="title-lockup">
                  <span className="badge-kicker">NEW ARRIVALS</span>
                  <h2 className="clean-title">Trending Drops</h2>
                </div>
                {products.length > 1 && (
                  <Link to="/products" className="header-action-link">
                    View All →
                  </Link>
                )}
              </div>

              <div
                className={`products-adaptive-layout ${
                  products.length === 1 ? "single-product-mode" : "multi-product-mode"
                }`}
              >
                {products.map((prod) => {
                  const hasDiscount = prod.comparePrice && prod.comparePrice > prod.price;
                  const discountPercent = hasDiscount
                    ? Math.round(((prod.comparePrice - prod.price) / prod.comparePrice) * 100)
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
                              <span className="strike-price">₹{prod.comparePrice}</span>
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
            </div>
          </section>
        )}

        {/* ================= 4. OFFICIAL STORE PILLARS ================= */}
        <section className="segmented-section">
          <div className="section-container">
            <div className="service-pillars-box">
              <div className="pillar-entry">
                <div className="pillar-icon">⚡</div>
                <div className="pillar-content">
                  <h4>Quick Dispatch</h4>
                  <p>Orders ship within 24–48 hours across India.</p>
                </div>
              </div>
              <div className="pillar-entry">
                <div className="pillar-icon">💎</div>
                <div className="pillar-content">
                  <h4>Signature Fabric</h4>
                  <p>Heavy GSM combed cotton tailored for everyday drape.</p>
                </div>
              </div>
              <div className="pillar-entry">
                <div className="pillar-icon">🔄</div>
                <div className="pillar-content">
                  <h4>Easy 7-Day Swap</h4>
                  <p>Hassle-free size replacement at your doorstep.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 5. FAQ PANELS ================= */}
        <section className="segmented-section">
          <div className="section-container narrow">
            <div className="section-header-bar center">
              <div className="title-lockup">
                <span className="badge-kicker">CONCIERGE & CARE</span>
                <h2 className="clean-title">Frequently Asked Questions</h2>
              </div>
            </div>

            <div className="faq-segmented-list">
              <div className="faq-panel">
                <h4>How can I track my shipment?</h4>
                <p>Tracking numbers and live links are sent via WhatsApp and SMS right after dispatch.</p>
              </div>
              <div className="faq-panel">
                <h4>What is the return & exchange process?</h4>
                <p>We provide a 7-day doorstep size replacement policy for any fit adjustments.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}