import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import './MenuItemDetail.css';
import { useCart } from '../context/CartContext';

const API = 'http://localhost:8081/api/v2';

const MenuItemDetail = () => {
  const params = useParams();
  // support multiple possible param names coming from routes or links
  const rawId = params.id ?? params.menuid ?? params.menuId ?? params._id ?? null;
  // keep id as string unless it's clearly numeric — backend may accept string ids
  const menuId = rawId != null && !Number.isNaN(Number(rawId)) ? String(Number(rawId)) : rawId;
  const { add } = useCart();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        if (menuId == null) {
          setError('Invalid menu id');
          setLoading(false);
          return;
        }

        const res = await fetch(`${API}/getmenu/${encodeURIComponent(menuId)}`);
        if (res.status === 404) {
          setError('Menu item not found');
          return;
        }
        if (!res.ok) throw new Error('Failed to fetch menu item');

        const data = await res.json();
        setItem(data);
      } catch (err) {
        console.error(err);
        setError('Menu item not found');
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [menuId]);

  const displayImage = (img) => {
    if (!img) return null;
    if (img.startsWith('data:')) return img;
    return `data:image/png;base64,${img}`;
  };

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (error) return <div style={{ padding: 24 }}>{error} <Link to="/menu">Back to menu</Link></div>;
  if (!item) return <div style={{ padding: 24 }}>Item not found. <Link to="/menu">Back to menu</Link></div>;

  return (
    <div className="detail-page">
      <div className="detail-container">
        <div className="detail-media">
          {item.image ? (
            <img src={displayImage(item.image)} alt={item.name} />
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f4f4', color: '#666' }}>
              No Image
            </div>
          )}
        </div>

        <div className="detail-info">
          <h2>{item.name}</h2>
          <p className="category">{item.category}</p>
          <p className="desc">{item.description}</p>
          <div className="meta">
            <div className="price">₨{Number(item.price || 0).toFixed(2)}</div>
            <div>
              <button className="btn primary" onClick={() => add(item)}>Add to cart</button>
              <Link to="/menu" className="btn ghost" style={{ marginLeft: 10 }}>Back</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuItemDetail;
