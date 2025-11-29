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
  const [reviews, setReviews] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  function loadReviews() {
    try {
      const key = `reviews:${menuId}`;
      const raw = localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      setReviews(Array.isArray(arr) ? arr : []);
    } catch (e) {
      console.warn('Failed to load reviews', e);
      setReviews([]);
    }
  }

  function saveReviews(arr) {
    try {
      const key = `reviews:${menuId}`;
      localStorage.setItem(key, JSON.stringify(arr));
      setReviews(arr);
    } catch (e) {
      console.warn('Failed to save reviews', e);
    }
  }

  const openAddReview = () => {
    setReviewForm({ name: '', rating: 5, comment: '' });
    setShowReviewModal(true);
  };

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
      // load reviews stored locally for this item
      try { loadReviews(); } catch (e) { /* ignore */ }
    }, [menuId]);

  const submitReview = (e) => {
    e.preventDefault();
    const { rating, comment } = reviewForm;
    if (!comment) return alert('Please provide a comment');
    const r = { id: Date.now(), name: 'Anonymous', rating: Number(rating) || 0, comment, date: new Date().toISOString() };
    const next = [r, ...reviews];
    saveReviews(next);
    setShowReviewModal(false);
  };

  function ReviewModal() {
    if (!showReviewModal) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Add Review</h3>
            <button className="close-btn" onClick={() => setShowReviewModal(false)}>✕</button>
          </div>
          <form className="admin-form review-modal-form" onSubmit={submitReview} style={{padding: '8px 0'}}>
            <label className="label">Rating</label>
            <div className="star-input" role="radiogroup" aria-label="Rating">
              {Array.from({ length: 5 }).map((_, i) => {
                const idx = i + 1;
                return (
                  <button
                    type="button"
                    key={idx}
                    className={`star-btn ${idx <= (reviewForm.rating || 0) ? 'filled' : ''}`}
                    onClick={() => setReviewForm({ ...reviewForm, rating: idx })}
                    aria-pressed={idx <= (reviewForm.rating || 0)}
                    aria-label={`${idx} star`}
                  >
                    ★
                  </button>
                );
              })}
            </div>

            <label className="label">Comment</label>
            <textarea className="textarea" rows={4} value={reviewForm.comment} onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})} />

            <div style={{display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8}}>
              <button type="button" className="btn outline" onClick={() => setShowReviewModal(false)}>Cancel</button>
              <button className="btn primary" type="submit">Submit</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const displayImage = (img) => {
    if (!img) return null;
    if (img.startsWith('data:')) return img;
    return `data:image/png;base64,${img}`;
  };

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (error) return <div style={{ padding: 24 }}>{error} <Link to="/menu">Back to menu</Link></div>;
  if (!item) return <div style={{ padding: 24 }}>Item not found. <Link to="/menu">Back to menu</Link></div>;

  return (
    <>
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
              <button className="btn primary" onClick={() => add(item, 1)}>Add to cart</button>
              <Link to="/menu" className="btn ghost" style={{ marginLeft: 10 }}>Back</Link>
            </div>
          </div>

          <div className="reviews-section">
            <div className="reviews-header">
              <h3>Reviews <span className="reviews-count">({reviews.length})</span></h3>
              <div>
                <button className="btn outline" onClick={openAddReview}>Add Review</button>
              </div>
            </div>

            {reviews.length === 0 && <p className="muted">No reviews yet. Be the first to review!</p>}

            <div className="reviews-list">
              {reviews.map((r) => (
                <div className="review-item" key={r.id}>
                  <div className="review-meta">
                    <div className="review-name">{r.name}</div>
                    <div className="review-rating">{Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < (r.rating||0) ? 'star filled' : 'star'}>★</span>
                    ))}</div>
                  </div>
                  <div className="review-comment">{r.comment}</div>
                  <div className="review-date">{new Date(r.date).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
      </div>
      <ReviewModal />
    </>
  );
};

export default MenuItemDetail;
