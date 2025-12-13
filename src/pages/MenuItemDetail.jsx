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
  const [editingReview, setEditingReview] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  function resolveUserId(u) {
    if (!u) return null;
    const id = String(u.id ?? u._id ?? u.userId ?? u.userid ?? u.user_id ?? '').trim();
    return id === '' ? null : (Number(id).toString() === id ? Number(id) : id);
  }

  function resolveReviewId(r) {
    if (!r) return null;
    const raw = r.reviewId ?? r.reviewid ?? r.id ?? r._id ?? r.review_id ?? null;
    if (raw == null) return null;
    const str = String(raw).trim();
    if (!str) return null;
    return Number(str).toString() === str ? Number(str) : str;
  }

  function loadReviews() {
    if (!menuId) return;
    try {
      fetch(`${API}/reviews/${encodeURIComponent(menuId)}`)
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          const arr = Array.isArray(data) ? data : [];
          setReviews(arr);
        })
        .catch(err => {
          console.warn('Failed to load reviews from API', err);
          setReviews([]);
        });
    } catch (e) {
      console.warn('Failed to load reviews', e);
      setReviews([]);
    }
  }

  const openAddReview = () => {
    setEditingReview(null);
    setReviewForm({ name: '', rating: 5, comment: '' });
    setShowReviewModal(true);
  };

  const openEditReview = (review) => {
    const resolvedId = resolveReviewId(review);
    if (!resolvedId) {
      console.warn('Could not resolve review id for editing', review);
      alert('Unable to edit this review because its id is missing.');
      return;
    }
    setEditingReview({ ...review, _resolvedId: resolvedId });
    setReviewForm({ rating: review.rating || 5, comment: review.comment || '' });
    setShowReviewModal(true);
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    const resolvedId = resolveReviewId({ reviewId, id: reviewId }) ?? reviewId;
    if (resolvedId == null || String(resolvedId).trim() === '') {
      alert('Review id missing, cannot delete.');
      console.warn('Attempted to delete review with invalid id', reviewId);
      return;
    }
    
    try {
      const res = await fetch(`${API}/deletreview/${encodeURIComponent(resolvedId)}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setReviewSuccess('Review deleted successfully');
        setTimeout(() => setReviewSuccess(''), 3000);
        loadReviews();
      } else {
        setReviewSuccess('Failed to delete review');
        setTimeout(() => setReviewSuccess(''), 3000);
      }
    } catch (err) {
      console.warn('Failed to delete review', err);
      setReviewSuccess('Failed to delete review');
      setTimeout(() => setReviewSuccess(''), 3000);
    }
  };

  useEffect(() => {
    // Get current user ID
    try {
      const rawUser = localStorage.getItem('user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        const userId = resolveUserId(u);
        setCurrentUserId(userId);
      }
    } catch (e) {
      const alt = localStorage.getItem('userId') || localStorage.getItem('user_id') || null;
      if (alt) {
        const maybe = String(alt).trim();
        const userId = maybe === '' ? null : (Number(maybe).toString() === maybe ? Number(maybe) : maybe);
        setCurrentUserId(userId);
      }
    }

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
      // load reviews from API for this item
      loadReviews();
    }, [menuId]);

  const submitReview = async (e) => {
    e.preventDefault();
    const { rating, comment } = reviewForm;
    if (!comment) return alert('Please provide a comment');

    // If editing, call update endpoint
    if (editingReview) {
      try {
        const reviewId = resolveReviewId(editingReview) ?? editingReview?._resolvedId ?? null;
        if (!reviewId) {
          alert('Review id missing, cannot update.');
          return;
        }

        const updatePayload = {
          rating: Number(rating) || 0,
          comment: String(comment || ''),
        };

        console.log('Updating review:', reviewId, updatePayload);

        const res = await fetch(`http://localhost:8081/api/v2/updatereview/${encodeURIComponent(reviewId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(updatePayload),
        });

        if (res.ok) {
          setReviewSuccess('Review updated successfully');
          setTimeout(() => setReviewSuccess(''), 3000);
          loadReviews();
        } else {
          const txt = await res.text().catch(() => '');
          console.warn('Update review failed:', res.status, txt);
          setReviewSuccess('Failed to update review');
          setTimeout(() => setReviewSuccess(''), 3000);
        }
      } catch (err) {
        console.warn('Failed to update review', err);
        setReviewSuccess('Failed to update review');
        setTimeout(() => setReviewSuccess(''), 3000);
      } finally {
        setShowReviewModal(false);
        setEditingReview(null);
      }
      return;
    }

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
      createdAt: new Date().toISOString(),
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
        setReviewSuccess('Review added successfully');
        setTimeout(() => setReviewSuccess(''), 3000);
        // Reload reviews from API
        loadReviews();
      } else {
        const txt = await res.text().catch(() => '');
        console.warn('Add review failed:', res.status, txt);
        console.log('Server rejected review payload:', payload);
        setReviewSuccess('Failed to add review');
        setTimeout(() => setReviewSuccess(''), 3000);
      }
    } catch (err) {
      console.warn('Failed to post review', err);
      console.log('Review payload on network error:', payload);
      setReviewSuccess('Failed to add review');
      setTimeout(() => setReviewSuccess(''), 3000);
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
            <h3>{editingReview ? 'Edit Review' : 'Add Review'}</h3>
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
              {reviews.map((r, idx) => {
                const reviewUserId = resolveUserId({ id: r.userId, _id: r.userId, userId: r.userId, userid: r.userId, user_id: r.userId });
                const reviewId = resolveReviewId(r);
                const isOwnReview = currentUserId && reviewUserId && String(currentUserId) === String(reviewUserId);
                
                return (
                  <div className="review-item" key={reviewId ?? `review-${idx}`}>
                    <div className="review-meta">
                      <div className="review-name">{r.name}</div>
                      <div className="review-rating">{Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={i < (r.rating||0) ? 'star filled' : 'star'}>★</span>
                      ))}</div>
                    </div>
                    <div className="review-comment">{r.comment}</div>
                    {r.date && !isNaN(new Date(r.date).getTime()) && <div className="review-date">{new Date(r.date).toLocaleString()}</div>}
                    {isOwnReview && (
                      <div className="review-actions">
                        <button className="btn-review-action btn-edit" onClick={() => openEditReview(r)}>Edit</button>
                        <button
                          className="btn-review-action btn-delete"
                          onClick={() => {
                            if (!reviewId) {
                              alert('Review id missing, cannot delete this review.');
                              console.warn('Missing review id for delete', r);
                              return;
                            }
                            deleteReview(reviewId);
                          }}
                        >Delete</button>
                      </div>
                    )}
                  </div>
                );
              })}
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
