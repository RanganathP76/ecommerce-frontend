import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import axiosInstance from "../axiosInstance";
import "./ProductDetailPage.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

// ✅ Import Pixel tracking function
import { trackEvent } from "../utils/facebookPixel";

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [customInputs, setCustomInputs] = useState({});
  const [selectedSpecs, setSelectedSpecs] = useState({});
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0); // For image slider
  const [expandedReviews, setExpandedReviews] = useState({}); // Track expanded reviews

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await axiosInstance.get(`/products/${id}`);
        setProduct(data);

        // ✅ Fire ViewContent event
        trackEvent("ViewContent", {
          content_name: data.title,
          content_ids: [data._id],
          value: data.price,
          currency: "INR",
        });

        // Init customization fields
        if (data.isCustomizable && Array.isArray(data.customizationFields)) {
          const initState = {};
          data.customizationFields.forEach((field, idx) => {
            initState[`${field.label}-${idx}`] =
              field.type === "file" ? null : "";
          });
          setCustomInputs(initState);
        }

         // ✅ Auto-select first available spec option
      if (Array.isArray(data.specifications) && data.specifications.length > 0) {
        const autoSpecs = {};
        data.specifications.forEach((spec) => {
          const firstAvailable = (spec.values || []).find(v => v.stock > 0);
          if (firstAvailable) {
            autoSpecs[spec.key] = firstAvailable.value;
          }
        });
        setSelectedSpecs(autoSpecs);
      }

      } catch (error) {
        console.error("Failed to fetch product", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // Handle spec change
  const handleSpecChange = (key, value) => {
    setSelectedSpecs((prev) => ({ ...prev, [key]: value }));
  };

  // Handle file upload
  const handleFileUpload = async (key, file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await axiosInstance.post("/upload/temp", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setCustomInputs((prev) => ({
        ...prev,
        [key]: {
          type: "file",
          url: data.url,
          public_id: data.public_id,
        },
      }));
    } catch (err) {
      console.error("File upload failed:", err);
      alert("Image upload failed");
    }
  };

  // Handle text input
  const handleInputChange = (key, value) => {
    setCustomInputs((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Validate customization + specs
  const validateSelections = () => {
    if (product?.isCustomizable) {
      const allFilled = product.customizationFields.every((field, idx) => {
        const key = `${field.label}-${idx}`;
        return !!customInputs[key];
      });
      if (!allFilled) return false;
    }

    if (product?.specifications?.length > 0) {
      const allSpecsChosen = product.specifications.every(
        (spec) => !!selectedSpecs[spec.key]
      );
      if (!allSpecsChosen) return false;
    }

    return true;
  };

  // Generate cart item
  const generateCartItem = () => {
    return {
      _id: product._id,
      title: product.title,
      price: product.price,
      comparePrice: product.comparePrice || null,
      image: product.images[0],
      quantity: 1,
      specifications:
        product.specifications?.length > 0
          ? Object.entries(selectedSpecs).map(([key, value]) => ({
              key,
              value,
            }))
          : [],
      customization: product.isCustomizable
        ? product.customizationFields.map((field, idx) => {
            const key = `${field.label}-${idx}`;
            const val = customInputs[key];
            return {
              label: field.label,
              type: field.type,
              value: field.type === "file" ? val?.url : val,
              public_id: field.type === "file" ? val?.public_id : null,
            };
          })
        : [],
    };
  };

  // Add to cart
  const addToCart = () => {
    if (!validateSelections()) {
      alert(
        "Please complete all required selections (customization & specifications)."
      );
      return;
    }

    const newItem = generateCartItem();

    // ✅ Track AddToCart event
    trackEvent("AddToCart", {
      content_name: newItem.title,
      content_ids: [newItem._id],
      value: newItem.price,
      currency: "INR",
      quantity: 1,
    });

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.push(newItem);
    localStorage.setItem("cart", JSON.stringify(cart));
    navigate("/cart");
  };

  // Buy now
  const buyNow = () => {
    if (!validateSelections()) {
      alert(
        "Please complete all required selections (customization & specifications)."
      );
      return;
    }

    const cartItem = generateCartItem();

    // ✅ Track AddToCart for Buy Now as well (optional)
    trackEvent("AddToCart", {
      content_name: cartItem.title,
      content_ids: [cartItem._id],
      value: cartItem.price,
      currency: "INR",
      quantity: 1,
    });

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

      await axiosInstance.post(`/products/${id}/review`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      alert("Review submitted");
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Failed to submit review");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!product) return <p>Product not found</p>;

  const handleWhatsAppOrder = () => {
  // Your product name
  const productName = product?.title;

  // Current product page URL (optional, you can also use a specific link)
  const productLink = window.location.href;

  // Pre-filled message
  const message = `Hi, I would like to order this product: ${productName}. Here is the link: ${productLink}`;

  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message);

  // WhatsApp URL (replace country code if needed)
  const whatsappURL = `https://wa.me/918050084991?text=${encodedMessage}`;

  // Open WhatsApp
  window.open(whatsappURL, "_blank");
};


  return (
    <div>
      <Header />
      <div className="product-detail">
        {/* IMAGE SLIDER */}
        <div className="product-image-slider-container">
          <div
            className="image-slide-wrapper"
            onScroll={(e) => {
              const scrollLeft = e.target.scrollLeft;
              const width = e.target.clientWidth;
              const currentIndex = Math.round(scrollLeft / width);
              setActiveIndex(currentIndex);
            }}
          >
            {product.images?.map((img, idx) => (
              <img key={idx} src={img} alt={product.title} />
            ))}
          </div>

          {/* Dots */}
          <div className="slider-dots">
            {product.images?.map((_, idx) => (
              <span
                key={idx}
                className={`dot ${activeIndex === idx ? "active" : ""}`}
                onClick={() => {
                  const slider = document.querySelector(".image-slide-wrapper");
                  slider.scrollTo({
                    left: idx * slider.clientWidth,
                    behavior: "smooth",
                  });
                }}
              ></span>
            ))}
          </div>
        </div>

        {/* PRODUCT INFO */}
        <div className="product-info">
          <h2>{product.title}</h2>

          {/* Price with Compare Price */}
<p className="product-price">
  {product.comparePrice && product.comparePrice > product.price ? (
    <>
      <span className="current-price">₹{product.price}</span>
      <span className="compare-price">₹{product.comparePrice}</span>
    </>
  ) : (
    <span className="current-price">₹{product.price}</span>
  )}
</p>

{/* ✅ Add below price info */}
<div className="extra-product-info">
  <p className="delivery-info">🚚 Free Delivery</p>
  <p className="cod-info">💰 Partial COD Available</p>
</div>


          {/* Specifications */}
          {product.specifications?.length > 0 && (
            <div className="specifications-block">
              <h4>Select Specifications</h4>
              {product.specifications.map((spec, idx) => (
                <div key={idx} className="spec-group">
                  <p className="spec-label">{spec.key}:</p>
                  <div className="spec-options">
                    {spec.values.map((option, vIdx) => (
                      <label key={vIdx} className="spec-option">
                        <input
                          type="radio"
                          name={spec.key}
                          value={option.value}
                          checked={selectedSpecs[spec.key] === option.value}
                          disabled={option.stock <= 0}
                          onChange={() =>
                            handleSpecChange(spec.key, option.value)
                          }
                        />
                        <span className="spec-option-text">{option.value}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

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
                      onChange={(e) =>
                        handleFileUpload(`${field.label}-${idx}`, e.target.files[0])
                      }
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

{/* WhatsApp button below */}
  <div className="whatsapp-button-container">
    <button className="whatsapp-order" onClick={handleWhatsAppOrder}>
      Order via WhatsApp
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
            <input type="file" onChange={(e) => setImage(e.target.files[0])} />
            <button onClick={submitReview}>Submit Review</button>
          </div>

          {/* Existing Reviews */}
          <div className="existing-reviews">
            <h3>Reviews</h3>
            {product.reviews?.length === 0 ? (
              <p>No reviews yet</p>
            ) : (
              <div className="review-list">
                {product.reviews.map((rev, idx) => {
                  const isExpanded = expandedReviews[idx];
                  const toggleExpand = () => {
                    setExpandedReviews((prev) => ({
                      ...prev,
                      [idx]: !prev[idx],
                    }));
                  };
                  return (
                    <div className="review-card" key={idx}>
                      <p><strong>{rev.name}</strong></p>
                      <p><strong>Rating:</strong> {"★".repeat(rev.rating)}</p>
                      <p className={`review-comment ${isExpanded ? "expanded" : ""}`}>
                        {rev.comment}
                      </p>
                      {rev.comment.length > 100 && (
                        <span className="read-more" onClick={toggleExpand}>
                          {isExpanded ? "Show less" : "Read more"}
                        </span>
                      )}
                      {rev.images?.map((img, imgIdx) => (
                        <img
                          key={imgIdx}
                          src={img}
                          alt="review"
                          className="review-image"
                        />
                      ))}
                    </div>
                  );
                })}
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
