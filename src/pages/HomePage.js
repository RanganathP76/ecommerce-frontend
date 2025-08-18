import { useEffect, useState } from 'react';
import api from '../api/axios';
import axiosInstance from "../axiosInstance";
import Header from '../components/Header';
import Footer from '../components/Footer';
import './HomePage.css';

export default function HomePage() {
  const [collections, setCollections] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
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

  return (
    <div className="homepage">
      <Header />

      {/* Collections */}
      <section className="hero">
        <h2>Shop by Collection</h2>
        <div className="grid">
          {collections.map((col) => (
            <a href={`/collection/${col._id}`} className="card" key={col._id}>
              <div className="card-image">
                <img
                  src={col.image?.url || '/placeholder.png'}
                  alt={col.name}
               />
              </div>
              <h3>{col.name}</h3>
            </a>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured">
        <h2>Recently Added</h2>
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
