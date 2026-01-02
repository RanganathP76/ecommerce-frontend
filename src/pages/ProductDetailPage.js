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
  const [showPopup, setShowPopup] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
const [highlightField, setHighlightField] = useState(null);
const [firstEmptyField, setFirstEmptyField] = useState(null);


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

 // 🕒 Persistent Urgency Timer
const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

useEffect(() => {
  // Check if an offer end time already exists
  const savedEndTime = localStorage.getItem("offerEndTime");

 let offerEnd;
if (savedEndTime) {
  offerEnd = new Date(savedEndTime);
} else {
  offerEnd = new Date();
  offerEnd.setDate(offerEnd.getDate() + 1);   // +1 day
  offerEnd.setMinutes(offerEnd.getMinutes() + 25); // +25 minutes

  localStorage.setItem("offerEndTime", offerEnd.toISOString());
}

  const timer = setInterval(() => {
    const now = new Date().getTime();
    const distance = offerEnd.getTime() - now;

    if (distance <= 0) {
      clearInterval(timer);
      localStorage.removeItem("offerEndTime"); // Remove when finished
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
  axiosInstance.get("/payment-config/get")
    .then(res => setPaymentOptions(res.data))
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


  // Utility: Get estimated delivery range (e.g., 3–7 days)
const getEstimatedDelivery = () => {
  const today = new Date();
  const startDate = new Date(today);
  const endDate = new Date(today);

  // e.g., deliver between 3–7 business days
  startDate.setDate(today.getDate() + 5);
  endDate.setDate(today.getDate() + 8);

  const formatDate = (date) =>
    date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });

  return `Between ${formatDate(startDate)} – ${formatDate(endDate)}`;
};

const handleThumbnailClick = (idx) => {
  setActiveIndex(idx);

  const mainSlider = document.querySelector(".image-slide-wrapper");
  const thumbScroll = document.getElementById("thumbnailScroll");
  const thumbnails = thumbScroll.querySelectorAll(".thumbnail");

  // Scroll the main image slider
  mainSlider.scrollTo({
    left: idx * mainSlider.clientWidth,
    behavior: "smooth",
  });

  // ✅ Smart auto-scroll preview behavior
  const thumb = thumbnails[idx];
  const thumbRect = thumb.getBoundingClientRect();
  const containerRect = thumbScroll.getBoundingClientRect();

  const buffer = 20; // small margin so it’s not flush
  const visibleRight = containerRect.right - buffer;
  const visibleLeft = containerRect.left + buffer;

  if (thumbRect.right > visibleRight) {
    // move scroll slightly so user sees next items
    thumbScroll.scrollBy({
      left: thumbRect.right - visibleRight + 40,
      behavior: "smooth",
    });
  } else if (thumbRect.left < visibleLeft) {
    // scroll back if user clicks earlier thumbnail
    thumbScroll.scrollBy({
      left: thumbRect.left - visibleLeft - 40,
      behavior: "smooth",
    });
  }
};


  // Handle spec change
  const handleSpecChange = (key, value) => {
    setSelectedSpecs((prev) => ({ ...prev, [key]: value }));
  };

  // Handle file upload
  const handleFileUpload = async (key, file) => {
  try {
    // mark as uploading
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
    // mark as uploaded
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
      setShowPopup(true); // open the popup instead of alert
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
    setShowPopup(true); // open the popup instead of alert
    return;
  }

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

  if (loading) return <PageLoader text="Fetching product details..." />;

  if (!product) return <p>Product not found</p>;

  
const slides = [
  ...(product?.images || []),
  ...(product?.videos || [])
];


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
        : "Shop customized gifts from Cuztory — Personalized lamps, keychains, and more."
    }
  />

  <meta
    name="keywords"
    content={`${product?.title || ""}, custom gifts, personalized gifts, ${
      product?.category || ""
    }, Cuztory`}
  />
  <link rel="canonical" href={`https://cuztory.in/product/${product?._id}`} />

  {/* ✅ Open Graph (Facebook, WhatsApp) */}
  <meta property="og:type" content="product" />
  <meta property="og:title" content={`${product?.title || "Cuztory Product"} | Cuztory`} />
  <meta
    property="og:description"
    content={
      typeof product?.description === "string"
        ? product.description.substring(0, 150)
        : "Shop personalized products at Cuztory."
    }
  />
  <meta property="og:image" content={product?.images?.[0]} />
  <meta property="og:url" content={`https://cuztory.in/product/${product?._id}`} />

  {/* ✅ Twitter Card */}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={`${product?.title || "Cuzto Product"} | Cuztory`} />
  <meta
    name="twitter:description"
    content={
      typeof product?.description === "string"
        ? product.description.substring(0, 150)
        : "Shop personalized products at Cuztory."
    }
  />
  <meta name="twitter:image" content={product?.images?.[0]} />

  {/* ✅ JSON-LD structured data for SEO */}
  <script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org/",
      "@type": "Product",
      name: product?.title,
      image: product?.images,
      description:
        typeof product?.description === "string"
          ? product.description
          : "Personalized product from Cuztory.",
      brand: { "@type": "Brand", name: "Cuztory" },
      offers: {
        "@type": "Offer",
        url: `https://cuztory.in/product/${product?._id}`,
        priceCurrency: "INR",
        price: product?.price,
        availability: "https://schema.org/InStock",
      },
    })}
  </script>
</Helmet>



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
      <video key={`vid-${idx}`} src={item} controls className="product-video" />
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

{/* ✅ Swipeable Thumbnail Gallery */}
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
    <span className="current-price">₹{product.price}</span>
    {product.comparePrice && product.comparePrice > product.price && (
      <>
        <span className="original-price">₹{product.comparePrice}</span>
        <span className="discount-pill">
          Save {Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}%
        </span>
      </>
    )}
  </div>

  {/* Trust & Conversion Boosters */}
  <div className="price-footer-meta">
    <p className="inclusive-taxes">Inclusive of all taxes</p>
    
    {timeLeft.days === 0 && timeLeft.hours < 24 && (
      <div className="urgency-timer-inline">
        <span className="fire-icon">🔥</span> 
        Offer ends in: <strong>{timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s</strong>
      </div>
    )}

    <div className="delivery-estimate-pill">
      <FaShippingFast className="truck-icon" />
      <span>FREE Delivery by <strong>{estimatedDelivery.split('–')[1]}</strong></span>
    </div>
  </div>
</div>



    {/* Buttons */}
  <div className="action-buttons">
  {isAnyFileUploading ? (
    <p style={{ color: "#007bff" }}>Uploading file(s)...</p>
  ) : product.isCustomizable ? (
    // ✅ If customizable, show only "Customize" button
    <button
      className="customize-btn"
      onClick={() => {
  setShowPopup(true);

  // Focus after popup opens
  setTimeout(() => {
    const firstField = document.querySelector(".popup-input input[type='text']");
    if (firstField) firstField.focus();
  }, 300);
}}

    >
      ✨ Customize and Buy Now
    </button>
  ) : (
    // ✅ Otherwise show normal Buy Now / Add to Cart
    <>
      <button className="buy-now" onClick={buyNow}>
        Buy Now
      </button>
      <button className="add-to-cart" onClick={addToCart}>
        Add to Cart
      </button>
    </>
  )}
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
 
 
 {/* ✅ TRUST BADGES SECTION */}
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
         {/* ✅ Multi-Part Product Description with Expand-on-Click */}
{/* ✅ Multi-Part Product Description with Expand-on-Click (No Hook Error) */}
{Array.isArray(product.description) && product.description.length > 0 ? (
  <DescriptionSections parts={product.description} />
) : (
  <p
  className="product-description"
  dangerouslySetInnerHTML={{
    __html: (product.description || "").replace(/\n/g, "<br/><br/>")
  }}
></p>

)}


          {/* ✅ REVIEWS SECTION — show 5 first, then show more */}
<div className="existing-reviews">
  <h2>Customer Reviews</h2>

  {(!product.reviews || product.reviews.length === 0) ? (
    <p>No reviews yet</p>
  ) : (
    <>
      {product.reviews
        .slice(0, expandedReviews.showAll ? product.reviews.length : 5)
        .map((rev, idx) => (
          <div key={idx} className="review-card">
            <div className="review-header">
              <strong>{rev.name}</strong>
              <div className="review-rating">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} color={i < rev.rating ? "gold" : "#ccc"} />
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

      {/* Show More / Show Less Button */}
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

        </div>
      </div>
      <Footer />

    {showPopup && (
  <div className="popup-overlay">
    <div className="popup-content">
      <h3>Complete Your Selections</h3>

      {product.specifications?.length > 0 && (
        <div className="popup-section">
          <h4>Specifications</h4>
          {product.specifications.map((spec, idx) => (
            <div key={idx} className="popup-spec">
              <p>{spec.key}:</p>
              <div className="popup-options">
                {spec.values.map((option, vIdx) => (
                  <label key={vIdx} className="popup-option">
                    <input
                      type="radio"
                      name={`popup-${spec.key}`}
                      value={option.value}
                      checked={selectedSpecs[spec.key] === option.value}
                      disabled={option.stock <= 0}
                      onChange={() =>
                        handleSpecChange(spec.key, option.value)
                      }
                    />
                    <span>{option.value}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {product.isCustomizable && (
  <div className="popup-section">
    <h4>Customization</h4>
    {product.customizationFields.map((field, idx) => (
      <div
  key={`${field.label}-${idx}`}
  id={`field-${field.label}-${idx}`}
  className={`popup-input ${highlightField === `${field.label}-${idx}` ? "highlight-required" : ""}`}
>
        <label>{field.label}</label>

        {field.type === "file" ? (
          <div className="file-upload-wrapper">
            {!customInputs[`${field.label}-${idx}`] ? (
              <input
                type="file"
                onChange={(e) =>
                  handleFileUpload(`${field.label}-${idx}`, e.target.files[0])
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
                  {customInputs[`${field.label}-${idx}`].url.split("/").pop()}
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
            value={customInputs[`${field.label}-${idx}`] || ""}
            onChange={(e) =>
              handleInputChange(`${field.label}-${idx}`, e.target.value)
            }
          />
        )}
        {highlightField === `${field.label}-${idx}` && (
  <small className="error-hint">Please fill this</small>
)}

      </div>
    ))}
  </div>
)}


      <div className="popup-buttons">
  {isAnyFileUploading ? (
    <p style={{ color: "#007bff" }}>Uploading file(s), please wait...</p>
  ) : (
    <>
      <button
        className="popup-continue"
        onClick={() => {
  const missing = [];

  // Check customization fields
  if (product.isCustomizable) {
    product.customizationFields.forEach((field, idx) => {
      const key = `${field.label}-${idx}`;
      if (!customInputs[key]) {
        missing.push(key);
      }
    });
  }

  // If missing fields
  if (missing.length > 0) {
    const first = missing[0];
    setHighlightField(first);

    // Auto scroll to the field
    const el = document.getElementById(`field-${first}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.querySelector("input")?.focus();
    }
    return; // Stop continue
  }

  // No errors → proceed
  setHighlightField(null);
  setShowPopup(false);
  buyNow();
}}

      >
        Continue
      </button>
      <button className="popup-cancel" onClick={() => setShowPopup(false)}>
        Cancel
      </button>
    </>
  )}
</div>

    </div>
  </div>
)}

    </div>
  );
};

// ✅ Subcomponent for Expandable Descriptions
const DescriptionSections = ({ parts }) => {
  const [expandedIndex, setExpandedIndex] = useState(0); // First open by default

  const handleToggle = (index) => {
    setExpandedIndex(prev => (prev === index ? null : index));
  };

  return (
    <div className="product-description-section">
      {parts.map((part, index) => {
        const isExpanded = expandedIndex === index;
        return (
          <div key={index} className="desc-wrapper">
            <div
              className="desc-header"
              onClick={() => handleToggle(index)}
            >
              <h3 className="desc-headline">{part.headline || `Section ${index + 1}`}</h3>
              <span className={`arrow ${isExpanded ? "up" : "down"}`}>
                {isExpanded ? "▲" : "▼"}
              </span>
            </div>

            {/* ✅ Keep content mounted but hide via CSS to prevent flicker */}
            <div className={`desc-content ${isExpanded ? "show" : "hide"}`}>
              {part.text && <p
  className="desc-text"
  dangerouslySetInnerHTML={{
    __html: (part.text || "").replace(/\n/g, "<br/><br/>")
  }}
></p>
}

              {part.image && (
                <img
                  src={part.image}
                  alt={part.headline || `desc-${index}`}
                  className="desc-image"
                />
              )}

              {part.video && (
                <video
                  src={part.video}
                  controls
                  preload="metadata"
                  playsInline
                  crossOrigin="anonymous"
                  className="desc-video"
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
