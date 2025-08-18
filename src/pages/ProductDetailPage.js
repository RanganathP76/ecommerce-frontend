import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ProductDetailPage.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaStar } from "react-icons/fa";
import axiosInstance from "../axiosInstance";

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [customInputs, setCustomInputs] = useState({});
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);


  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await axiosInstance.get(`/products/${id}`);
        setProduct(data);

        // Init customization fields
        if (data.isCustomizable && Array.isArray(data.customizationFields)) {
          const initState = {};
          data.customizationFields.forEach((field, idx) => {
            initState[`${field.label}-${idx}`] = field.type === "file" ? null : "";
          });
          setCustomInputs(initState);
        }
      } catch (error) {
        console.error("Failed to fetch product", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);





  // Handle file upload to Cloudinary via backend
  const handleFileUpload = async (key, file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await axiosInstance.post(
        "/upload/temp",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setCustomInputs(prev => ({
        ...prev,
        [key]: {
          type: "file",
          url: data.url,
          public_id: data.public_id
        }
      }));
    } catch (err) {
      console.error("File upload failed:", err);
      alert("Image upload failed");
    }
  };

  // Handle text input change
  const handleInputChange = (key, value) => {
    setCustomInputs(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Validate all customization fields are filled
  const validateCustomization = () => {
    if (!product?.isCustomizable) return true;
    return product.customizationFields.every((field, idx) => {
      const key = `${field.label}-${idx}`;
      return !!customInputs[key];
    });
  };

  // Create cart item object
  const generateCartItem = () => {
    return {
      _id: product._id,
      title: product.title,
      price: product.price,
      image: product.images[0],
      customization: product.customizationFields?.map((field, idx) => {
        const key = `${field.label}-${idx}`;
        const val = customInputs[key];
        return {
          label: field.label,
          type: field.type,
          value: field.type === "file" ? val.url : val, // Store Cloudinary URL
          public_id: field.type === "file" ? val.public_id : null
        };
      })
    };
  };

  // Add to Cart
  const addToCart = () => {
    if (!validateCustomization()) {
      alert("Please fill all customization fields.");
      return;
    }
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.push(generateCartItem());
    localStorage.setItem("cart", JSON.stringify(cart));
    navigate("/cart");
  };

  // Buy Now
  const buyNow = () => {
    if (!validateCustomization()) {
      alert("Please fill all customization fields.");
      return;
    }
    const cartItem = generateCartItem();
    localStorage.setItem("cart", JSON.stringify([cartItem]));
    navigate("/cart");
  };

  // Submit review
  const submitReview = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login to submit a review.");
        return;
      }

      const formData = new FormData();
      formData.append("rating", rating);
      formData.append("comment", comment);
      if (image) formData.append("reviewImages", image);

      await axiosInstance.post(
        `/products/${id}/review`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );
      alert("Review submitted");
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Failed to submit review");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!product) return <p>Product not found</p>;

  return (
    <div>
      <Header />
      <div className="product-detail">
        
    
      {/* IMAGE SLIDER */}
      <div className="product-image-slider">
  <div className="image-slide-wrapper">
    {product.images && product.images.length > 0 ? (
      product.images.map((img, idx) => (
        <img key={idx} src={img} alt={product.title} />
      ))
    ) : (
      <img src="/placeholder.png" alt="No Image" />
    )}
  </div>

  {/* Prev Button */}
  <button
    className="slider-prev-btn"
    onClick={() => {
      document.querySelector(".image-slide-wrapper").scrollBy({
        left: -360,
        behavior: "smooth"
      });
    }}
  >
    ‹
  </button>
</div>




        <div className="product-info">
          <h2>{product.title}</h2>
          <p className="product-price">₹{product.price}</p>

          {/* Customization */}
          {product.isCustomizable && (
            <div className="customization-block">
              <h4>Customization</h4>
              {product.customizationFields.map((field, idx) => (
                <div key={`${field.label}-${idx}`} className="custom-input">
                  <label>{field.label}</label>
                  {field.type === "file" ? (
                    <input
                      type="file"
                      onChange={(e) => handleFileUpload(`${field.label}-${idx}`, e.target.files[0])}
                    />
                  ) : (
                    <input
                      type="text"
                      value={customInputs[`${field.label}-${idx}`] || ""}
                      onChange={(e) =>
                        handleInputChange(`${field.label}-${idx}`, e.target.value)
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Buttons */}
          <div className="action-buttons">
            <button className="buy-now" onClick={buyNow}>
              Buy Now
            </button>
            <button className="add-to-cart" onClick={addToCart}>
              Add to Cart
            </button>
          </div>

          {/* Description */}
          <p className="product-description">{product.description}</p>

          {/* Review Section */}
          <div className="review-section">
            <h3>Give a Review</h3>
            <div className="rating-input">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  color={star <= rating ? "gold" : "#ccc"}
                  onClick={() => setRating(star)}
                  style={{ cursor: "pointer" }}
                />
              ))}
            </div>
            <textarea
              placeholder="Write your comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            ></textarea>
            <input
              type="file"
              onChange={(e) => setImage(e.target.files[0])}
            />
            <button onClick={submitReview}>Submit Review</button>
          </div>

          {/* Existing Reviews */}
          <div className="existing-reviews">
            <h3>Reviews</h3>
            {product.reviews?.length === 0 ? (
              <p>No reviews yet</p>
            ) : (
              <div className="review-list">
                {product.reviews.map((rev, idx) => (
                  <div className="review-card" key={idx}>
                    <p><strong>{rev.name}</strong></p>
                    <p><strong>Rating:</strong> {"★".repeat(rev.rating)}</p>
                    <p><strong>Comment:</strong> {rev.comment}</p>
                    {rev.images?.map((img, imgIdx) => (
                      <img
                        key={imgIdx}
                        src={img}
                        alt="review"
                        className="review-image"
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProductDetailPage;

