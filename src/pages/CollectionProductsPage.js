import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import axiosInstance from "../axiosInstance";
import "./CollectionProductsPage.css";
import PageLoader from "../components/PageLoader";

;


const CollectionProductsPage = () => {
  const { id } = useParams();
  const [collectionData, setCollectionData] = useState(null);
  const [loading, setLoading] = useState(true)

 useEffect(() => {
  const fetchCollection = async () => {
    try {
      const res = await axiosInstance.get(`/collections/${id}`);
      setCollectionData(res.data);
      document.title = res.data.collection?.name || "Collection";
    } catch (err) {
      console.error("Error fetching collection:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchCollection();
}, [id]);


  if (loading) return <PageLoader text="Loading collection..." />;
  if (!collectionData) return <p>Collection not found.</p>;

  const { collection, products } = collectionData;

  return (
    <div className="collection-products-page">
      <Header />

      <div className="collection-header">
        <h2>{collection.name}</h2>
        <p>{collection.description}</p>
      </div>

      <section className="products-section">
        <div className="grid upgraded-grid">
          {products.length > 0 ? (
            products.map((prod) => {
              const hasDiscount =
                prod.comparePrice && prod.comparePrice > prod.price;
              const discountPercent = hasDiscount
                ? Math.round(
                    ((prod.comparePrice - prod.price) / prod.comparePrice) * 100
                  )
                : 0;

              return (
                <Link
                  to={`/product/${prod._id}`}
                  className="product-card"
                  key={prod._id}
                >
                  <div className="media-wrapper">
                    {prod.video ? (
                      <video
                        src={prod.video}
                        muted
                        autoPlay
                        loop
                        playsInline
                        preload="auto"
                        className="product-video"
                      />
                    ) : (
                      <img
                        src={
                          prod.image ||
                          (prod.images && prod.images[0]) ||
                          "/placeholder.png"
                        }
                        alt={prod.title}
                        className="product-img"
                      />
                    )}

                    {hasDiscount && (
                      <span className="discount-badge">-{discountPercent}%</span>
                    )}
                  </div>

                  <div className="product-info">
                    <h3 className="product-title">{prod.title}</h3>
                    <div className="price-section">
                      <span className="price">₹{prod.price}</span>
                      {hasDiscount && (
                        <span className="compare-price">₹{prod.comparePrice}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <p>No products found in this collection.</p>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CollectionProductsPage;
