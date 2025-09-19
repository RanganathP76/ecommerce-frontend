import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import axiosInstance from "../axiosInstance";
import "./ProductDetailPage.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

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
            initState[`${field.label}-${idx}`] =
              field.type === "file" ? null : "";
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

  // ✅ Build a proper cart item (specifications are passed directly as [{key,value}])
  const generateCartItem = () => {
    return {
      _id: product._id,
      title: product.title,
      price: product.price,
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
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const newItem = generateCartItem();
    cart.push(newItem);
    localStorage.setItem("cart", JSON.stringify(cart));
    console.log("🛒 Added to cart:", newItem); // ✅ Debug
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
    localStorage.setItem("cart", JSON.stringify([cartItem]));
    console.log("⚡ Buy now cart:", cartItem); // ✅ Debug
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
          <button
            className="slider-prev-btn"
            onClick={() => {
              document.querySelector(".image-slide-wrapper").scrollBy({
                left: -360,
                behavior: "smooth",
              });
            }}
          >
            ‹
          </button>
        </div>

        {/* PRODUCT INFO */}
        <div className="product-info">
          <h2>{product.title}</h2>
          <p className="product-price">₹{product.price}</p>

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
                        {option.value}{" "}
                        {option.stock <= 0 && "(Out of stock)"}
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
                        handleFileUpload(
                          `${field.label}-${idx}`,
                          e.target.files[0]
                        )
                      }
                    />
                  ) : (
                    <input
                      type="text"
                      value={customInputs[`${field.label}-${idx}`] || ""}
                      onChange={(e) =>
                        handleInputChange(
                          `${field.label}-${idx}`,
                          e.target.value
                        )
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
                {product.reviews.map((rev, idx) => (
                  <div className="review-card" key={idx}>
                    <p>
                      <strong>{rev.name}</strong>
                    </p>
                    <p>
                      <strong>Rating:</strong> {"★".repeat(rev.rating)}
                    </p>
                    <p>
                      <strong>Comment:</strong> {rev.comment}
                    </p>
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
