import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./CollectionProductsPage.css";
import axiosInstance from "../axiosInstance";

const CollectionProductsPage = () => {
  const { id } = useParams();
  const [collectionData, setCollectionData] = useState(null);

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const res = await axiosInstance.get(`/collections/${id}`); // ✅ no hardcoded localhost
        setCollectionData(res.data);
        document.title = res.data.collection?.name || "Collection";
      } catch (err) {
        console.error("Error fetching collection:", err);
      }
    };

    fetchCollection();
  }, [id]);
  
  if (!collectionData) return <div>Loading...</div>;

  return (
    <div className="collection-products-page">
      <Header />

      <div className="collection-header">
        <h2>{collectionData.collection.name}</h2>
        <p>{collectionData.collection.description}</p>
      </div>

      <div className="products-grid">
        {collectionData.products.length > 0 ? (
          collectionData.products.map((product) => (
            <Link
              key={product._id}
              to={`/product/${product._id}`}
              className="product-card"
            >
              <img
                src={
                  product.images[0] ||
                  "https://via.placeholder.com/300x300?text=No+Image"
                }
                alt={product.title}
              />
              <p className="product-title">{product.title}</p>
              <p className="product-price">₹{product.price}</p>
            </Link>
          ))
        ) : (
          <p>No products found in this collection.</p>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default CollectionProductsPage;
