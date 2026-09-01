import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  FaStar, 
  FaLock, 
  FaShippingFast, 
  FaHeadset, 
  FaShoppingBag, 
  FaBolt, 
  FaArrowRight, 
  FaTimes, 
  FaPlus, 
  FaMinus,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaSpinner,
  FaCalendarAlt
} from "react-icons/fa";
import axiosInstance from "../axiosInstance";
import "./ProductDetailPage.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PageLoader from "../components/PageLoader";
import { Helmet } from "react-helmet-async";
import { trackEvent } from "../utils/facebookPixel";

const getEstimatedDeliveryDateRange = () => {
  const minDays = 3;
  const maxDays = 6;
  const today = new Date();
  
  const startDate = new Date(today);
  startDate.setDate(today.getDate() + minDays);
  
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + maxDays);
  
  const startDay = startDate.getDate();
  const startMonth = startDate.toLocaleDateString("en-IN", { month: "short" });
  
  const endDay = endDate.getDate();
  const endMonth = endDate.toLocaleDateString("en-IN", { month: "short" });

  if (startMonth === endMonth) {
    return `${startDay} - ${endDay} ${startMonth}`;
  }
  return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
};

const extractTimestamp = (item) => {
  if (item?.createdAt) return new Date(item.createdAt).getTime();
  if (item?._id && typeof item._id === "string" && item._id.length === 24) {
    return parseInt(item._id.substring(0, 8), 16) * 1000;
  }
  return 0;
};

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
  const [activeIndex, setActiveIndex] = useState(0);
  const [expandedReviews, setExpandedReviews] = useState({});
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [highlightField, setHighlightField] = useState(null);

  const [shippingPrice, setShippingPrice] = useState(null);
  const [deliveryPincode, setDeliveryPincode] = useState(() => localStorage.getItem("user_pincode") || "");
  const [pincodeChecking, setPincodeChecking] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [pincodeError, setPincodeError] = useState("");

  const [currentQtyInCart, setCurrentQtyInCart] = useState(0);
  const [showFloatingCart, setShowFloatingCart] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);

  const [showCustomizationStep, setShowCustomizationStep] = useState(false);

  // Recommendations state
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedSectionTitle, setRelatedSectionTitle] = useState("MORE FROM THIS COLLECTION");

  useEffect(() => {
    axiosInstance
      .get("/shipping-rates")
      .then((res) => {
        const enabledRates = res.data.filter((rate) => rate.enabled);
        if (enabledRates.length > 0) {
          setShippingPrice(Number(enabledRates[0].rate || 0));
        } else {
          setShippingPrice(0);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch shipping rates", err);
        setShippingPrice(0);
      });
  }, []);

  const checkPincodeServiceability = async (pin) => {
    const targetPin = pin || deliveryPincode;
    if (!/^\d{6}$/.test(targetPin)) {
      setPincodeError("Please enter a valid 6-digit Pincode.");
      setDeliveryInfo(null);
      return;
    }

    try {
      setPincodeChecking(true);
      setPincodeError("");

      const res = await axiosInstance.post("/orders/check-serviceability", {
        delivery_postcode: targetPin,
        weight: product?.weight || 0.5,
      });

      if (res.data?.serviceable) {
        setDeliveryInfo(res.data);
        localStorage.setItem("user_pincode", targetPin);
      } else {
        setDeliveryInfo(null);
        setPincodeError(res.data?.message || "Delivery is currently unavailable to this pincode.");
      }
    } catch (err) {
      console.error("Serviceability check failed:", err);
      setPincodeError("Unable to verify pincode. Please try again.");
      setDeliveryInfo(null);
    } finally {
      setPincodeChecking(false);
    }
  };

  const handlePincodeSubmit = (e) => {
    e.preventDefault();
    checkPincodeServiceability(deliveryPincode);
  };

  useEffect(() => {
    const saved = localStorage.getItem("user_pincode");
    if (saved && /^\d{6}$/.test(saved)) {
      checkPincodeServiceability(saved);
    }
  }, [product?._id]);

  const syncCartSummary = () => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const totalQty = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
      const totalVal = cart.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);
      setCartCount(totalQty);
      setCartTotal(totalVal);
      if (totalQty === 0) setShowFloatingCart(false);
    } catch (e) {
      setCartCount(0);
      setCartTotal(0);
      setShowFloatingCart(false);
    }
  };

  const syncCurrentItemQty = (productId, specs) => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const formattedSpecs = Object.entries(specs).map(([key, value]) => ({ key, value }));
      const found = cart.find(
        (item) =>
          item._id === productId &&
          JSON.stringify(item.specifications || []) === JSON.stringify(formattedSpecs)
      );
      setCurrentQtyInCart(found ? found.quantity : 0);
    } catch (e) {
      setCurrentQtyInCart(0);
    }
  };

  useEffect(() => {
    syncCartSummary();
  }, []);

  useEffect(() => {
    if (product) {
      syncCurrentItemQty(product._id, selectedSpecs);
    }
  }, [selectedSpecs, product]);

  useEffect(() => {
    const handlePopState = () => {
      if (showCustomizationStep) {
        setShowCustomizationStep(false);
      }
    };

    if (showCustomizationStep) {
      window.history.pushState({ step: "customization" }, "");
      window.addEventListener("popstate", handlePopState);
    }

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [showCustomizationStep]);

  useEffect(() => {
    const fetchProductAndRecommendations = async () => {
      try {
        setLoading(true);
        const { data: currentProd } = await axiosInstance.get(`/products/${id}`);
        setProduct(currentProd);

        trackEvent("ViewContent", {
          content_name: currentProd.title,
          content_ids: [currentProd._id],
          value: currentProd.price,
          currency: "INR",
        });

        if (currentProd.isCustomizable && Array.isArray(currentProd.customizationFields)) {
          const initState = {};
          currentProd.customizationFields.forEach((field, idx) => {
            initState[`${field.label}-${idx}`] =
              field.type === "file" ? null : "";
          });
          setCustomInputs(initState);
        }

        const autoSpecs = {};
        if (Array.isArray(currentProd.specifications) && currentProd.specifications.length > 0) {
          currentProd.specifications.forEach((spec) => {
            const firstAvailable = (spec.values || []).find((v) => v.stock > 0);
            if (firstAvailable) {
              autoSpecs[spec.key] = firstAvailable.value;
            }
          });
          setSelectedSpecs(autoSpecs);
        }
        syncCurrentItemQty(currentProd._id, autoSpecs);

        // Fetch related products (From Collection -> Fallback to Latest Products)
        const collectionId = currentProd.collection?._id || currentProd.collection || currentProd.collectionId;

        let itemsFound = [];
        if (collectionId) {
          try {
            const colRes = await axiosInstance.get(`/collections/${collectionId}`);
            const colProds = colRes.data?.products || [];
            itemsFound = colProds
              .filter((p) => String(p._id) !== String(currentProd._id))
              .sort((a, b) => extractTimestamp(b) - extractTimestamp(a));
          } catch (colErr) {
            console.warn("Could not fetch collection products directly, falling back to all products:", colErr);
          }
        }

        if (itemsFound.length > 0) {
          setRelatedProducts(itemsFound.slice(0, 8));
          setRelatedSectionTitle(
            currentProd.collection?.name 
              ? `MORE FROM ${currentProd.collection.name.toUpperCase()}`
              : "MORE FROM THIS COLLECTION"
          );
        } else {
          // Fallback: Fetch latest drops catalog
          try {
            const allProdRes = await axiosInstance.get("/products");
            const allProds = allProdRes.data || [];
            const latestFallback = allProds
              .filter((p) => String(p._id) !== String(currentProd._id))
              .sort((a, b) => extractTimestamp(b) - extractTimestamp(a));
            
            setRelatedProducts(latestFallback.slice(0, 8));
            setRelatedSectionTitle("YOU MIGHT ALSO LIKE (LATEST DROPS)");
          } catch (allErr) {
            console.error("Failed to fetch fallback products:", allErr);
            setRelatedProducts([]);
          }
        }

      } catch (error) {
        console.error("Failed to fetch product", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndRecommendations();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

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

  const calculateTotalPrice = (prod = product, specs = selectedSpecs) => {
    if (!prod) return 0;

    let extra = 0;
    if (prod.specifications && Object.keys(specs).length > 0) {
      prod.specifications.forEach((spec) => {
        const selectedValue = specs[spec.key];
        const specOption = spec.values.find((v) => v.value === selectedValue);
        if (specOption && specOption.extraPrice) {
          extra += Number(specOption.extraPrice);
        }
      });
    }
    return Number(prod.price) + extra;
  };

  const totalPrice = calculateTotalPrice();

  const isSelectionValidAndInStock = () => {
    if (!product) return false;
    if (Array.isArray(product.specifications) && product.specifications.length > 0) {
      for (const spec of product.specifications) {
        const chosenVal = selectedSpecs[spec.key];
        if (!chosenVal) return false;
        const matchedOption = spec.values?.find((v) => v.value === chosenVal);
        if (!matchedOption || matchedOption.stock <= 0) return false;
      }
    }
    return true;
  };

  const verifyLatestStockAndPrice = async (targetQty = 1) => {
    try {
      const { data: latestProduct } = await axiosInstance.get(`/products/${id}`);
      if (!latestProduct) {
        alert("This item is no longer available or has been removed.");
        return null;
      }

      setProduct(latestProduct);

      if (Array.isArray(latestProduct.specifications) && latestProduct.specifications.length > 0) {
        for (const spec of latestProduct.specifications) {
          const chosenVal = selectedSpecs[spec.key];
          const matchedOption = spec.values?.find((v) => v.value === chosenVal);
          if (!matchedOption || matchedOption.stock < targetQty) {
            alert("Sorry, this item or variant is currently out of stock!");
            return null;
          }
        }
      }

      const calculatedLatestPrice = calculateTotalPrice(latestProduct, selectedSpecs);
      if (totalPrice !== calculatedLatestPrice) {
        alert(`Notice: The price has updated to ₹${calculatedLatestPrice}.`);
      }

      return {
        latestProduct,
        latestPrice: calculatedLatestPrice,
      };
    } catch (err) {
      console.error("Stock and price check failed:", err);
      alert("Unable to verify item availability from server. Please try again.");
      return null;
    }
  };

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

  const generateCartItem = (prod, calculatedPrice, qty = 1) => {
    return {
      _id: prod._id,
      title: prod.title,
      price: calculatedPrice,
      comparePrice: prod.comparePrice || null,
      image: prod.images?.[0] || "",
      quantity: qty,
      specifications:
        prod.specifications?.length > 0
          ? Object.entries(selectedSpecs).map(([key, value]) => ({
              key,
              value,
            }))
          : [],
      customization: prod.isCustomizable
        ? prod.customizationFields.map((field, idx) => {
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

  const handleUpdateQuantity = async (delta) => {
    const targetQty = currentQtyInCart + delta;

    let verifiedData = null;
    if (delta > 0) {
      verifiedData = await verifyLatestStockAndPrice(targetQty);
      if (!verifiedData) return;
    }

    let currentCart = [];
    try {
      currentCart = JSON.parse(localStorage.getItem("cart")) || [];
    } catch (e) {
      currentCart = [];
    }

    const currentFormattedSpecs = Object.entries(selectedSpecs).map(([key, value]) => ({ key, value }));

    const existingIndex = currentCart.findIndex(
      (item) =>
        item._id === product._id &&
        JSON.stringify(item.specifications || []) === JSON.stringify(currentFormattedSpecs)
    );

    if (targetQty <= 0) {
      if (existingIndex > -1) {
        currentCart.splice(existingIndex, 1);
      }
      setCurrentQtyInCart(0);
    } else {
      const activeProduct = verifiedData?.latestProduct || product;
      const activePrice = verifiedData?.latestPrice || totalPrice;

      if (existingIndex > -1) {
        currentCart[existingIndex].quantity = targetQty;
        currentCart[existingIndex].price = activePrice;
      } else {
        const newItem = generateCartItem(activeProduct, activePrice, targetQty);
        currentCart.push(newItem);
        trackEvent("AddToCart", {
          content_name: newItem.title,
          content_ids: [newItem._id],
          value: newItem.price,
          currency: "INR",
          quantity: targetQty,
        });
      }
      setCurrentQtyInCart(targetQty);
      setShowFloatingCart(true);
    }

    localStorage.setItem("cart", JSON.stringify(currentCart));
    syncCartSummary();
    window.dispatchEvent(new Event("storage"));
  };

  const handleDirectBuyNow = async () => {
    const verifiedData = await verifyLatestStockAndPrice(1);
    if (!verifiedData) return;

    const buyNowItem = generateCartItem(verifiedData.latestProduct, verifiedData.latestPrice, 1);
    trackEvent("InitiateCheckout", {
      content_name: buyNowItem.title,
      content_ids: [buyNowItem._id],
      value: buyNowItem.price,
      currency: "INR",
      quantity: 1,
    });
    
    navigate("/checkoutStep1", { state: { directBuyItem: buyNowItem } });
  };

  const handleCustomizeClick = async () => {
    const verifiedData = await verifyLatestStockAndPrice(1);
    if (!verifiedData) return;

    setShowCustomizationStep(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackButtonClick = () => {
    if (window.history.state?.step === "customization") {
      window.history.back();
    } else {
      setShowCustomizationStep(false);
    }
  };

  const handleFinalCustomCheckout = () => {
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
    handleDirectBuyNow();
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

  if (loading) return <PageLoader text="Fetching drop details..." />;
  if (!product) return <p>Product not found</p>;

  const slides = [...(product?.images || []), ...(product?.videos || [])];
  const canProceed = isSelectionValidAndInStock();

  return (
    <div className="product-page-root">
      <Header />

      <Helmet>
        <title>{product ? `${product.title} | Nxt Gen Fashion Hub` : "Cuztory"}</title>
        <meta
          name="description"
          content={
            product?.description && typeof product.description === "string"
              ? product.description.substring(0, 155)
              : `Explore ${product?.title || "apparel"} at Cuztory.`
          }
        />
        <link rel="canonical" href={`https://cuztory.in/product/${product?.slug || id}`} />

        <meta property="og:type" content="product" />
        <meta property="og:site_name" content="Cuztory" />
        <meta property="og:title" content={product ? `${product.title} — ₹${totalPrice}` : "Cuztory"} />
        <meta
          property="og:description"
          content={`Order ${product?.title} online at Cuztory. Special price: ₹${totalPrice}. Fast Delivery & Secure Checkout.`}
        />
        <meta property="og:url" content={`https://cuztory.in/product/${product?.slug || id}`} />
        <meta property="og:image" content={product?.images?.[0] || "https://cuztory.in/banner.png"} />
      </Helmet>

      {/* 0.3cm Top Spacing Gap */}
      <main className="product-details-page-wrapper">
        {showCustomizationStep ? (
          <div className="customization-step-wrapper">
            <div className="step-header-bar">
              <button className="step-back-btn" onClick={handleBackButtonClick}>
                ←
              </button>
              <span className="step-title-badge">Product Customization</span>
            </div>

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

            <div className="step-action-bar">
              {isAnyFileUploading ? (
                <p style={{ color: "#007bff", textAlign: "center" }}>
                  Uploading file(s), please wait...
                </p>
              ) : (
                <button className="step-proceed-btn" onClick={handleFinalCustomCheckout}>
                  Confirm and proceed →
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="product-detail">
            {/* Gallery Section */}
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
            </div>

            {/* Product Metadata & Purchasing Section */}
            <div className="product-info">
              <span className="product-kicker">NXT GEN EXCLUSIVE</span>
              <h2 className="tight-title">{product.title}</h2>

              <div className="price-section-container tight-price">
                <div className="price-main-row">
                  <span className="current-price">₹{totalPrice}</span>
                  {product.comparePrice && product.comparePrice > product.price && (
                    <>
                      <span className="original-price">₹{product.comparePrice}</span>
                      <span className="discount-pill">
                        SAVE{" "}
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

                {shippingPrice !== null && (
                  <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    {shippingPrice === 0 ? (
                      <>
                        <span
                          style={{
                            backgroundColor: "#f4fdf7",
                            color: "#16a34a",
                            fontSize: "11px",
                            fontWeight: "800",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            border: "1px solid #bbf7d0",
                          }}
                        >
                          <FaShippingFast /> FREE SHIPPING
                        </span>
                        <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: "600" }}>
                          Free Delivery on this drop
                        </span>
                      </>
                    ) : (
                      <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "500" }}>
                        + ₹{shippingPrice} Shipping Fee
                      </span>
                    )}
                  </div>
                )}

                <div className="price-footer-meta">
                  <p className="inclusive-taxes">Inclusive of all taxes</p>
                  {paymentOptions?.partialPayment?.enabled && advance > 0 && (
                    <div className="advance-highlight-box">
                      <div className="advance-main">Pay only ₹{advance} Now</div>
                      <div className="advance-sub">₹{due} After delivery</div>
                    </div>
                  )}
                </div>
              </div>

              {product.specifications?.length > 0 && (
                <div className="specifications-block compact-specs">
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

              <div className="action-buttons tight-actions">
                {product.isCustomizable ? (
                  <button 
                    className="customize-btn" 
                    onClick={handleCustomizeClick}
                    disabled={!canProceed}
                  >
                    {canProceed ? "✨ Customize and Buy Now" : "Out of Stock"}
                  </button>
                ) : (
                  <div className="single-line-buttons">
                    {currentQtyInCart > 0 ? (
                      <div className="theme-stepper-box">
                        <button 
                          className="stepper-btn" 
                          onClick={() => handleUpdateQuantity(-1)}
                          title="Remove 1"
                        >
                          <FaMinus />
                        </button>
                        <span className="stepper-qty-num">{currentQtyInCart} in Cart</span>
                        <button 
                          className="stepper-btn" 
                          onClick={() => handleUpdateQuantity(1)}
                          disabled={!canProceed}
                          title="Add 1 more"
                        >
                          <FaPlus />
                        </button>
                      </div>
                    ) : (
                      <button 
                        className="custom-add-cart-btn" 
                        onClick={() => handleUpdateQuantity(1)}
                        disabled={!canProceed}
                      >
                        <FaShoppingBag className="btn-icon" /> {canProceed ? "ADD TO CART" : "OUT OF STOCK"}
                      </button>
                    )}

                    <button 
                      className="custom-buy-now-btn" 
                      onClick={handleDirectBuyNow}
                      disabled={!canProceed}
                    >
                      <FaBolt className="btn-icon" /> {canProceed ? "BUY NOW" : "OUT OF STOCK"}
                    </button>
                  </div>
                )}
              </div>

              <div className="shiprocket-delivery-card">
                <div className="delivery-card-header">
                  <FaShippingFast className="delivery-fast-icon" />
                  <div>
                    <h4 className="delivery-heading">Estimated Delivery & Location</h4>
                    <p className="delivery-subheading">Enter pincode for exact date & courier availability</p>
                  </div>
                </div>

                {!deliveryInfo?.serviceable && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: "#f8fafc",
                    border: "1px dashed #cbd5e1",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    marginBottom: "12px",
                    fontSize: "13px",
                    color: "#334155"
                  }}>
                    <FaCalendarAlt style={{ color: "#0284c7" }} />
                    <span>Estimated Delivery by: <strong style={{ color: "#0f172a" }}>{getEstimatedDeliveryDateRange()}</strong></span>
                  </div>
                )}

                <form className="pincode-search-form" onSubmit={handlePincodeSubmit}>
                  <div className="pincode-box-wrap">
                    <FaMapMarkerAlt className="pincode-pin-icon" />
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit Pincode"
                      value={deliveryPincode}
                      onChange={(e) => {
                        setDeliveryPincode(e.target.value.replace(/\D/g, ""));
                        setPincodeError("");
                      }}
                    />
                    <button type="submit" className="pincode-submit-btn" disabled={pincodeChecking}>
                      {pincodeChecking ? <FaSpinner className="spin-icon" /> : "Check"}
                    </button>
                  </div>
                </form>

                {pincodeError && <p className="pincode-error-text">{pincodeError}</p>}

                {deliveryInfo?.serviceable && (
                  <div className="serviceability-success-box" style={{ marginTop: "10px" }}>
                    <div className="edd-highlight">
                      <FaCheckCircle className="check-success-icon" />
                      <span>
                        Delivery by <strong>{deliveryInfo.edd}</strong>
                        {deliveryInfo.city && ` to ${deliveryInfo.city}, ${deliveryInfo.state}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

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

              {/* ================= RELATED / COLLECTION PRODUCTS SECTION ================= */}
              {relatedProducts.length > 0 && (
                <section className="related-drops-section">
                  <div className="related-section-header">
                    <div className="title-lockup">
                      <span className="badge-kicker">CURATED RECOMMENDATIONS</span>
                      <h2 className="clean-title">{relatedSectionTitle}</h2>
                    </div>
                  </div>

                  <div className={`products-adaptive-layout ${relatedProducts.length === 1 ? 'single-product-mode' : 'multi-product-mode'}`}>
                    {relatedProducts.map((relProd) => {
                      const hasDiscount = relProd.comparePrice && relProd.comparePrice > relProd.price;
                      const discountPercent = hasDiscount
                        ? Math.round(((relProd.comparePrice - relProd.price) / relProd.comparePrice) * 100)
                        : 0;

                      return (
                        <div className="premium-product-card" key={relProd.slug || relProd._id}>
                          <Link
                            to={`/product/${relProd.slug || relProd._id}`}
                            className="card-media-anchor"
                          >
                            <div className="card-media-wrap">
                              {relProd.video ? (
                                <video
                                  src={relProd.video}
                                  muted
                                  autoPlay
                                  loop
                                  playsInline
                                  preload="metadata"
                                />
                              ) : (
                                <img
                                  src={
                                    relProd.image ||
                                    (relProd.images && relProd.images[0]) ||
                                    "/placeholder.png"
                                  }
                                  alt={relProd.title}
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
                              to={`/product/${relProd.slug || relProd._id}`}
                              className="product-card-title"
                            >
                              {relProd.title}
                            </Link>

                            <div className="card-bottom-row">
                              <div className="card-price-matrix">
                                <span className="live-price">₹{relProd.price}</span>
                                {hasDiscount && (
                                  <span className="strike-price">₹{relProd.comparePrice}</span>
                                )}
                              </div>

                              <Link
                                to={`/product/${relProd.slug || relProd._id}`}
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
                </section>
              )}

            </div>
          </div>
        )}
      </main>

      {/* Floating Cart Overlay */}
      {showFloatingCart && cartCount > 0 && (
        <div className="floating-cart-overlay">
          <div className="floating-cart-container" onClick={() => navigate("/cart")}>
            <div className="floating-cart-left">
              <div className="floating-img-wrapper">
                <img 
                  src={product.images[0]} 
                  alt={product.title} 
                  className="floating-cart-img" 
                />
                <span className="floating-check-badge">
                  <FaCheckCircle />
                </span>
              </div>
              <div className="floating-cart-info">
                <span className="floating-title">{product.title}</span>
                <span className="floating-specs">
                  {Object.values(selectedSpecs).join(" • ") || "Selected"}
                </span>
              </div>
            </div>

            <div className="floating-cart-right">
              <div className="floating-price-meta">
                <span className="floating-qty-pill">{cartCount} ITEM{cartCount > 1 ? "S" : ""}</span>
                <span className="floating-cart-total">₹{cartTotal}</span>
              </div>
              <button className="floating-cta-btn">
                View Cart <FaArrowRight />
              </button>
              <button 
                className="floating-close-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFloatingCart(false);
                }}
                title="Dismiss"
              >
                <FaTimes />
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

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