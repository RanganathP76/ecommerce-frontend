import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaStar, FaLock, FaShippingFast, FaHeadset } from "react-icons/fa";
import axiosInstance from "../axiosInstance";
import "./ProductDetailPage.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PageLoader from "../components/PageLoader";
import { Helmet } from "react-helmet-async";

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
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [highlightField, setHighlightField] = useState(null);

  // 🔄 VIEW SWITCHER STATE
  const [showCustomizationStep, setShowCustomizationStep] = useState(false);

  // 📱 HANDLE MOBILE HARDWARE / GESTURE BACK BUTTON
  useEffect(() => {
    const handlePopState = (e) => {
      // If customization screen is open and user hits physical back button
      if (showCustomizationStep) {
        setShowCustomizationStep(false);
      }
    };

    if (showCustomizationStep) {
      // Push dummy entry into history stack so browser back button triggers popstate
      window.history.pushState({ step: "customization" }, "");
      window.addEventListener("popstate", handlePopState);
    }

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [showCustomizationStep]);

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

        setEstimatedDelivery(getEstimatedDelivery());

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
            const firstAvailable = (spec.values || []).find((v) => v.stock > 0);
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

  // 🕒 Persistent Urgency Timer
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const savedEndTime = localStorage.getItem("offerEndTime");
    let offerEnd;
    if (savedEndTime) {
      offerEnd = new Date(savedEndTime);
    } else {
      offerEnd = new Date();
      offerEnd.setDate(offerEnd.getDate() + 1);
      offerEnd.setMinutes(offerEnd.getMinutes() + 25);
      localStorage.setItem("offerEndTime", offerEnd.toISOString());
    }

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = offerEnd.getTime() - now;

      if (distance <= 0) {
        clearInterval(timer);
        localStorage.removeItem("offerEndTime");
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const [paymentOptions, setPaymentOptions] = useState(null);

  useEffect(() => {
    axiosInstance
      .get("/payment-config/get")
      .then((res) => setPaymentOptions(res.data))
      .catch(console.error);
  }, []);

  const productPrice = product?.price ? Number(product.price) : 0;

  const getAdvance = () => {
    if (paymentOptions?.partialPayment?.enabled) {
      const { partialType, partialValue } = paymentOptions.partialPayment;
      return partialType === "percent"
        ? Math.round((productPrice * partialValue) / 100)
        : Math.round(partialValue);
    }
    return 0;
  };

  const advance = getAdvance();
  const due = productPrice - advance;

  const getEstimatedDelivery = () => {
    const today = new Date();
    const startDate = new Date(today);
    const endDate = new Date(today);

    startDate.setDate(today.getDate() + 3);
    endDate.setDate(today.getDate() + 5);

    const formatDate = (date) =>
      date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });

    return `By ${formatDate(startDate)} – ${formatDate(endDate)}`;
  };

  const calculateTotalPrice = () => {
    if (!product) return 0;

    let extra = 0;
    if (product.specifications && Object.keys(selectedSpecs).length > 0) {
      product.specifications.forEach((spec) => {
        const selectedValue = selectedSpecs[spec.key];
        const specOption = spec.values.find((v) => v.value === selectedValue);
        if (specOption && specOption.extraPrice) {
          extra += Number(specOption.extraPrice);
        }
      });
    }
    return Number(product.price) + extra;
  };

  const totalPrice = calculateTotalPrice();

  const handleThumbnailClick = (idx) => {
    setActiveIndex(idx);

    const mainSlider = document.querySelector(".image-slide-wrapper");
    const thumbScroll = document.getElementById("thumbnailScroll");
    if (!mainSlider || !thumbScroll) return;

    const thumbnails = thumbScroll.querySelectorAll(".thumbnail");

    mainSlider.scrollTo({
      left: idx * mainSlider.clientWidth,
      behavior: "smooth",
    });

    const thumb = thumbnails[idx];
    if (!thumb) return;

    const thumbRect = thumb.getBoundingClientRect();
    const containerRect = thumbScroll.getBoundingClientRect();

    const buffer = 20;
    const visibleRight = containerRect.right - buffer;
    const visibleLeft = containerRect.left + buffer;

    if (thumbRect.right > visibleRight) {
      thumbScroll.scrollBy({
        left: thumbRect.right - visibleRight + 40,
        behavior: "smooth",
      });
    } else if (thumbRect.left < visibleLeft) {
      thumbScroll.scrollBy({
        left: thumbRect.left - visibleLeft - 40,
        behavior: "smooth",
      });
    }
  };

  const handleSpecChange = (key, value) => {
    setSelectedSpecs((prev) => ({ ...prev, [key]: value }));
    const currentSpec = product.specifications.find((s) => s.key === key);
    const specOption = currentSpec?.values.find((v) => v.value === value);

    if (specOption?.linkedImage) {
      const imageIndex = slides.indexOf(specOption.linkedImage);
      if (imageIndex !== -1) {
        handleThumbnailClick(imageIndex);
      }
    }
  };

  const handleFileUpload = async (key, file) => {
    try {
      setUploadingFiles((prev) => ({ ...prev, [key]: true }));

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
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [key]: false }));
    }
  };

  const isAnyFileUploading = Object.values(uploadingFiles).some(Boolean);

  const removeFile = (key) => {
    setCustomInputs((prev) => ({
      ...prev,
      [key]: null,
    }));
  };

  const handleInputChange = (key, value) => {
    setCustomInputs((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const generateCartItem = () => {
    return {
      _id: product._id,
      title: product.title,
      price: totalPrice,
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

  // Switch view to customization step or go directly to cart
  const handleProceedClick = () => {
    if (product?.isCustomizable || product?.specifications?.length > 0) {
      setShowCustomizationStep(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      buyNowDirect();
    }
  };

  // Trigger manual back button on top bar
  const handleBackButtonClick = () => {
    if (window.history.state?.step === "customization") {
      window.history.back(); // Triggers popstate listener
    } else {
      setShowCustomizationStep(false);
    }
  };

  const buyNowDirect = () => {
    const cartItem = generateCartItem();
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

  const handleFinalCheckout = () => {
    const missing = [];
    if (product.isCustomizable) {
      product.customizationFields.forEach((field, idx) => {
        const key = `${field.label}-${idx}`;
        if (!customInputs[key]) {
          missing.push(key);
        }
      });
    }

    if (missing.length > 0) {
      const first = missing[0];
      setHighlightField(first);
      const el = document.getElementById(`field-${first}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.querySelector("input")?.focus();
      }
      return;
    }

    setHighlightField(null);
    buyNowDirect();
  };

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

  if (loading) return <PageLoader text="Fetching product details..." />;
  if (!product) return <p>Product not found</p>;

  const slides = [...(product?.images || []), ...(product?.videos || [])];

  return (
    <div>
      <Header />
      <Helmet>
        <title>{product?.title ? `${product.title} | Cuztory` : "Cuztory Product"}</title>
        <meta
          name="description"
          content={
            typeof product?.description === "string"
              ? `${product.description.substring(0, 150)}...`
              : "Shop customized gifts from Cuztory."
          }
        />
      </Helmet>

      {/* ===================================================================
          VIEW SWITCHER
         =================================================================== */}
      {showCustomizationStep ? (
        /* SCREEN 2: CUSTOMIZATION & SPECIFICATION PAGE VIEW */
        <div className="customization-step-wrapper">
          <div className="step-header-bar">
            <button
              className="step-back-btn"
              onClick={handleBackButtonClick}
            >
              ←
            </button>
            <span className="step-title-badge">Product Customization</span>
          </div>

          {/* Product Summary Header Box */}
          <div className="step-product-summary">
            <img
              src={product.images[0]}
              alt={product.title}
              className="step-product-thumb"
            />
            <div className="step-product-meta">
              <h3 className="step-product-title">{product.title}</h3>
              <div className="step-product-price">
                <span className="step-current-price">₹{totalPrice}</span>
                {product.comparePrice && product.comparePrice > product.price && (
                  <span className="step-original-price">₹{product.comparePrice}</span>
                )}
              </div>
            </div>
          </div>

          {/* Specifications Selection Block */}
          {product.specifications?.length > 0 && (
            <div className="step-section-box">
              <h4 className="step-section-heading">1. Select Specifications</h4>
              {product.specifications.map((spec, idx) => (
                <div key={idx} className="spec-group">
                  <p className="spec-label">{spec.key}:</p>
                  <div className="spec-options">
                    {spec.values.map((option, vIdx) => (
                      <label key={vIdx} className="spec-option">
                        <input
                          type="radio"
                          name={`step-${spec.key}`}
                          value={option.value}
                          checked={selectedSpecs[spec.key] === option.value}
                          disabled={option.stock <= 0}
                          onChange={() => handleSpecChange(spec.key, option.value)}
                        />
                        <span className="spec-option-text">
                          <span className="spec-main-value">{option.value}</span>
                          {option.extraPrice > 0 && (
                            <span className="extra-price-tag">
                              (+₹{option.extraPrice})
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Customization Inputs Block */}
          {product.isCustomizable && (
            <div className="step-section-box">
              <h4 className="step-section-heading">
                {product.specifications?.length > 0
                  ? "2. Fill Customization Details"
                  : "1. Fill Customization Details"}
              </h4>

              {product.customizationFields.map((field, idx) => (
                <div
                  key={`${field.label}-${idx}`}
                  id={`field-${field.label}-${idx}`}
                  className={`popup-input ${
                    highlightField === `${field.label}-${idx}`
                      ? "highlight-required"
                      : ""
                  }`}
                >
                  <label>{field.label}</label>

                  {field.type === "file" ? (
                    <div className="file-upload-wrapper">
                      {!customInputs[`${field.label}-${idx}`] ? (
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
                        <div className="file-info-line">
                          <img
                            src={customInputs[`${field.label}-${idx}`].url}
                            alt="preview"
                            className="tiny-preview"
                          />
                          <span className="file-name">
                            {customInputs[`${field.label}-${idx}`].url
                              .split("/")
                              .pop()}
                          </span>
                          <button
                            type="button"
                            className="remove-file-btn"
                            onClick={() => removeFile(`${field.label}-${idx}`)}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder={`Enter ${field.label}`}
                      value={customInputs[`${field.label}-${idx}`] || ""}
                      onChange={(e) =>
                        handleInputChange(`${field.label}-${idx}`, e.target.value)
                      }
                    />
                  )}

                  {highlightField === `${field.label}-${idx}` && (
                    <small className="error-hint">Please fill this field</small>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Final Proceed Action Box */}
          <div className="step-action-bar">
            {isAnyFileUploading ? (
              <p style={{ color: "#007bff", textAlign: "center" }}>
                Uploading file(s), please wait...
              </p>
            ) : (
              <button className="step-proceed-btn" onClick={handleFinalCheckout}>
                Confirm and proceed →
              </button>
            )}
          </div>
        </div>
      ) : (
        /* SCREEN 1: MAIN PRODUCT DETAIL PAGE VIEW */
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
              {slides.map((item, idx) =>
                product.images?.includes(item) ? (
                  <img key={`img-${idx}`} src={item} alt={product.title} />
                ) : (
                  <video
                    key={`vid-${idx}`}
                    src={item}
                    controls
                    className="product-video"
                  />
                )
              )}
            </div>

            {/* Dots */}
            <div className="slider-dots">
              {slides.map((_, idx) => (
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

          {/* Swipeable Thumbnail Gallery */}
          <div className="thumbnail-container">
            <div className="thumbnail-scroll" id="thumbnailScroll">
              {slides.map((item, idx) => (
                <div
                  key={idx}
                  className={`thumbnail ${activeIndex === idx ? "active" : ""}`}
                  onClick={() => handleThumbnailClick(idx)}
                >
                  {item.endsWith(".mp4") ? (
                    <video src={item} muted playsInline />
                  ) : (
                    <img src={item} alt={`thumb-${idx}`} loading="lazy" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* PRODUCT INFO */}
          <div className="product-info">
            <h2>{product.title}</h2>

            <div className="price-section-container enhanced">
              <div className="price-main-row">
                <span className="current-price">₹{totalPrice}</span>
                {product.comparePrice && product.comparePrice > product.price && (
                  <>
                    <span className="original-price">₹{product.comparePrice}</span>
                    <span className="discount-pill">
                      Save{" "}
                      {Math.round(
                        ((product.comparePrice - product.price) /
                          product.comparePrice) *
                          100
                      )}
                      %
                    </span>
                  </>
                )}
              </div>

              <div className="price-footer-meta">
                <p className="inclusive-taxes">Inclusive of all taxes</p>

                {paymentOptions?.partialPayment?.enabled && advance > 0 && (
                  <div className="advance-highlight-box">
                    <div className="advance-main">Pay only ₹{advance} Now</div>
                    <div className="advance-sub">₹{due} After delivery</div>
                  </div>
                )}

                <div className="delivery-estimate-pill">
                  <FaShippingFast className="truck-icon" />
                  <span>
                    Estimated Delivery <strong>{estimatedDelivery}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="action-buttons">
              {product.isCustomizable ? (
                <button className="customize-btn" onClick={handleProceedClick}>
                  ✨ Customize and Buy Now
                </button>
              ) : (
                <>
                  <button className="buy-now" onClick={handleProceedClick}>
                    Buy Now
                  </button>
                </>
              )}
            </div>

            {/* Specifications Preview Block */}
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
                          <span className="spec-option-text">
                            <span className="spec-main-value">{option.value}</span>
                            {option.extraPrice > 0 && (
                              <span className="extra-price-tag">
                                (+₹{option.extraPrice})
                              </span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Trust Badges */}
            <div className="trust-badges-section">
              <div className="trust-badge">
                <FaLock className="trust-icon" />
                <p>Secure Payments</p>
              </div>
              <div className="trust-badge">
                <FaShippingFast className="trust-icon" />
                <p>Fast Shipping</p>
              </div>
              <div className="trust-badge">
                <FaHeadset className="trust-icon" />
                <p>24/7 Support</p>
              </div>
            </div>

            {/* Description */}
            {Array.isArray(product.description) && product.description.length > 0 ? (
              <DescriptionSections parts={product.description} />
            ) : (
              <p
                className="product-description"
                dangerouslySetInnerHTML={{
                  __html: (product.description || "").replace(/\n/g, "<br/><br/>"),
                }}
              ></p>
            )}

            {/* Reviews Section */}
            <div className="existing-reviews">
              <h2>Customer Reviews</h2>
              {!product.reviews || product.reviews.length === 0 ? (
                <p>No reviews yet</p>
              ) : (
                <>
                  {product.reviews.map((rev, idx) => (
                    <div key={idx} className="review-card">
                      <div className="review-header">
                        <strong>{rev.name}</strong>
                        <div className="review-rating">
                          {[...Array(5)].map((_, i) => (
                            <FaStar
                              key={i}
                              color={i < rev.rating ? "gold" : "#ccc"}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="review-comment">
                        {rev.comment.length > 200
                          ? `${rev.comment.slice(0, 200)}...`
                          : rev.comment}
                      </p>

                      {rev.images?.length > 0 && (
                        <div className="review-images">
                          {rev.images.map((img, imgIdx) => (
                            <img
                              key={imgIdx}
                              src={img}
                              alt="review"
                              className="review-image"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {product.reviews.length > 5 && (
                    <button
                      className="show-more-reviews-btn"
                      onClick={() =>
                        setExpandedReviews((prev) => ({
                          ...prev,
                          showAll: !prev.showAll,
                        }))
                      }
                    >
                      {expandedReviews.showAll ? "Show Less" : "Show More Reviews"}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Submit Review */}
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
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

// Subcomponent for Expandable Descriptions
const DescriptionSections = ({ parts }) => {
  const [expandedIndex, setExpandedIndex] = useState(0);

  const handleToggle = (index) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="product-description-section">
      {parts.map((part, index) => {
        const isExpanded = expandedIndex === index;
        return (
          <div key={index} className="desc-wrapper">
            <div className="desc-header" onClick={() => handleToggle(index)}>
              <h3 className="desc-headline">
                {part.headline || `Section ${index + 1}`}
              </h3>
              <span className={`arrow ${isExpanded ? "up" : "down"}`}>
                {isExpanded ? "▲" : "▼"}
              </span>
            </div>

            <div className={`desc-content ${isExpanded ? "show" : "hide"}`}>
              {part.video && (
                <video controls playsInline preload="metadata" className="desc-video">
                  <source src={part.video} type="video/mp4" />
                  Your browser does not support video.
                </video>
              )}

              {part.text && (
                <p
                  className="desc-text"
                  dangerouslySetInnerHTML={{
                    __html: (part.text || "").replace(/\n/g, "<br/><br/>"),
                  }}
                ></p>
              )}

              {part.image && (
                <img
                  src={part.image}
                  alt={part.headline || `desc-${index}`}
                  className="desc-image"
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductDetailPage;