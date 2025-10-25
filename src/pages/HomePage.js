import { useEffect, useState, useRef } from 'react';
import axiosInstance from "../axiosInstance";
import Header from '../components/Header';
import Footer from '../components/Footer';
import './HomePage.css';

export default function HomePage() {
  const [collections, setCollections] = useState([]);
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideRef = useRef(null);
  const slideInterval = useRef(null);

  

  useEffect(() => {
    const fetchData = async () => {
      try {
         // Fetch banners
        const bannerRes = await axiosInstance.get('/banners');
        setBanners(bannerRes.data);

        // Fetch collections
       const colRes = await axiosInstance.get('/collections');
        setCollections(colRes.data);

        // Fetch products and sort by createdAt (newest first)
        const prodRes =await axiosInstance.get('/products');
        const sorted = prodRes.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setProducts(sorted.slice(0, 4)); // Only latest 4
      } catch (error) {
        console.error('Error fetching homepage data', error);
      }
    };
    fetchData();
  }, []);

  // Auto-slide every 4s
  useEffect(() => {
    startAutoSlide();
    return () => stopAutoSlide();
  }, [banners]);

  const startAutoSlide = () => {
    stopAutoSlide(); // prevent multiple intervals
    slideInterval.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
  };

  const stopAutoSlide = () => {
    if (slideInterval.current) clearInterval(slideInterval.current);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
    startAutoSlide();
  };

  // Handle swipe gestures
  const handleTouchStart = (e) => {
    slideRef.current.startX = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (!slideRef.current.startX) return;
    const endX = e.changedTouches[0].clientX;
    const diff = slideRef.current.startX - endX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swipe left
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      } else {
        // Swipe right
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
      }
      startAutoSlide();
    }
    slideRef.current.startX = null;
  };

  return (
    <div className="homepage">
      <Header />

    {/* Collections */}
      <section className="hero">
  <h2>Shop by Collection</h2>
  <div className="collection-carousel">
    {collections.map((col) => (
      <div className="collection-item" key={col._id}>
        <img src={col.image?.url || '/placeholder.png'} alt={col.name} />
        <div className="collection-item-text">{col.name}</div>
      </div>
    ))}
  </div>
</section>


       {/* === Banner Slider === */}
      {banners.length > 0 && (
        <section
          className="hero-banner"
          ref={slideRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="hero-banner-wrapper"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
            }}
          >
            {banners.map((banner) => (
              <a
                href={banner.link || "#"}
                key={banner._id}
                className="hero-banner-slide"
              >
                <img
                  src={banner.image?.url || "/placeholder.png"}
                  alt={banner.title}
                />
                <div className="hero-banner-text">
                  <h2>{banner.title}</h2>
                  <p>{banner.subtitle}</p>
                </div>
              </a>
            ))}
          </div>

          {/* Dots */}
          <div className="banner-dots">
            {banners.map((_, index) => (
              <span
                key={index}
                className={`dot ${index === currentIndex ? "active" : ""}`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="featured">
        <h2> Featured products</h2>
        <div className="grid">
          {products.map((prod) => (
            <a href={`/product/${prod._id}`} className="card" key={prod._id}>
              <div className="card-image">
                <img
                  src={prod.image || (prod.images && prod.images[0]) || '/placeholder.png'}
                  alt={prod.title}
                />
              </div>
              <h3>{prod.title}</h3>
              <p>₹{prod.price}</p>
            </a>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="faq">
        <h2>FAQs</h2>
        <ul>
          <li>
            <strong>Q:</strong> How do I track my order?<br />
            <strong>A:</strong> Visit the Track Order page and enter your order ID.
          </li>
          <li>
            <strong>Q:</strong> Can I return my product?<br />
            <strong>A:</strong> Yes, within 7 days of delivery.
          </li>
        </ul>
      </section>

      <Footer />
    </div>
  );
}
