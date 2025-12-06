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
  const [reviewSuccess, setReviewSuccess] = useState('');

  function resolveUserId(u) {
    if (!u) return null;
    const id = String(u.id ?? u._id ?? u.userId ?? u.userid ?? u.user_id ?? '').trim();
    return id === '' ? null : (Number(id).toString() === id ? Number(id) : id);
  }

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

  const submitReview = async (e) => {
    e.preventDefault();
    const { rating, comment } = reviewForm;
    if (!comment) return alert('Please provide a comment');

    // include logged-in user id when available (resolve multiple possible keys)
    let userId = null;
    try {
      const rawUser = localStorage.getItem('user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        userId = resolveUserId(u);
      }
    } catch (e) {
      // fallback to legacy keys
      const alt = localStorage.getItem('userId') || localStorage.getItem('user_id') || null;
      if (alt) {
        const maybe = String(alt).trim();
        userId = maybe === '' ? null : (Number(maybe).toString() === maybe ? Number(maybe) : maybe);
      }
    }

    const payload = {
      menuId: menuId,
      userId,
      name: 'Anonymous',
      rating: Number(rating) || 0,
      comment: String(comment || ''),
    };

    // Try POSTing to server; fall back to localStorage on failure
    try {
      // Debug: print payload and user id to console so developer can verify
      console.log('Submitting review payload to /api/v2/addreview:', payload);
      console.log('Resolved userId:', payload.userId);

      const res = await fetch('http://localhost:8081/api/v2/addreview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // backend may return the saved review or a wrapper
        const data = await res.json().catch(() => null);
        console.log('Add review response (server):', data || 'no-json');
        let saved = null;
        if (data) {
          // try common shapes
          if (data.review) saved = data.review;
          else if (Array.isArray(data) && data.length > 0) saved = data[0];
          else if (typeof data === 'object') saved = data;
        }

        const r = saved && typeof saved === 'object'
          ? ({ id: saved.id || Date.now(), name: saved.name || payload.name, rating: saved.rating || payload.rating, comment: saved.comment || payload.comment, date: saved.date || new Date().toISOString() })
          : ({ id: Date.now(), name: payload.name, rating: payload.rating, comment: payload.comment, date: new Date().toISOString() });

        saveReviews([r, ...reviews]);
        setReviewSuccess('Review added successfully');
        setTimeout(() => setReviewSuccess(''), 3000);
      } else {
        const txt = await res.text().catch(() => '');
        console.warn('Add review failed:', res.status, txt);
        console.log('Server rejected review payload:', payload);
        // fallback to local
        const r = { id: Date.now(), name: payload.name, rating: payload.rating, comment: payload.comment, date: new Date().toISOString() };
        saveReviews([r, ...reviews]);
        setReviewSuccess('Review saved locally');
        setTimeout(() => setReviewSuccess(''), 3000);
      }
    } catch (err) {
      console.warn('Failed to post review, saving locally', err);
      console.log('Review payload on network error:', payload);
      const r = { id: Date.now(), name: payload.name, rating: payload.rating, comment: payload.comment, date: new Date().toISOString() };
      saveReviews([r, ...reviews]);
    } finally {
      setShowReviewModal(false);
    }
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

              {reviewSuccess && <div className="review-success">{reviewSuccess}</div>}

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
