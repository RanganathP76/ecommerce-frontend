import { useEffect, useState } from "react";

export default function SitemapPage() {
  const [sitemap, setSitemap] = useState("");

  useEffect(() => {
    const fetchSitemap = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/sitemap.xml`);
        const text = await res.text();
        setSitemap(text);
      } catch (err) {
        console.error("Error fetching sitemap:", err);
      }
    };
    fetchSitemap();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Sitemap Preview</h1>
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "#f3f3f3", padding: "1rem" }}>
        {sitemap || "Loading..."}
      </pre>
    </div>
  );
}
