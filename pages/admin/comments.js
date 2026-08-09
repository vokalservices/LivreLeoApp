import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout.jsx';

const STATUS_LABELS = {
  pending: { label: 'En attente', color: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approuvé', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Refusé', color: 'bg-red-100 text-red-700' },
};

function StarRating({ rating }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= rating ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

export default function CommentsModeration() {
  const router = useRouter();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  useEffect(() => {
    if (!token) { router.push('/admin/login'); return; }
    fetchComments();
  }, [token]);

  async function fetchComments() {
    setLoading(true);
    try {
      const res = await fetch('/api/comments?admin=1', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur chargement');
      const data = await res.json();
      setComments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, status) {
    setActionLoading(id + status);
    try {
      const res = await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setComments(prev => prev.map(c => c.id === id ? { ...c, status } : c));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteComment(id) {
    if (!confirm('Supprimer définitivement ce commentaire ?')) return;
    setActionLoading(id + 'delete');
    try {
      const res = await fetch('/api/comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      });
      if (res.ok) setComments(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = comments.filter(c => filter === 'all' ? true : c.status === filter);
  const counts = {
    all: comments.length,
    pending: comments.filter(c => c.status === 'pending').length,
    approved: comments.filter(c => c.status === 'approved').length,
    rejected: comments.filter(c => c.status === 'rejected').length,
  };

  return (
    <AdminLayout activeTab="comments">
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Commentaires</h1>
          <p className="text-slate-500 mt-1">Modérez les avis laissés par les lecteurs sur vos livres.</p>
        </div>
        <button onClick={fetchComments}
          className="inline-flex items-center gap-2 bg-white border border-gray-200 text-slate-600 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-gray-50 transition shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Rafraîchir
        </button>
      </div>

      {/* Onglets de filtre */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: 'pending', label: 'En attente', color: 'amber' },
          { key: 'approved', label: 'Approuvés', color: 'green' },
          { key: 'rejected', label: 'Refusés', color: 'red' },
          { key: 'all', label: 'Tous', color: 'slate' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
              filter === tab.key
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white border border-gray-200 text-slate-500 hover:bg-gray-50'
            }`}>
            {tab.label}
            <span className={`text-xs font-extrabold px-1.5 py-0.5 rounded-md ${
              filter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-slate-600'
            }`}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border shadow-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-500 font-medium">Chargement des commentaires...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <p className="text-slate-400 font-semibold">Aucun commentaire dans cette catégorie.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(comment => {
            const s = STATUS_LABELS[comment.status] || STATUS_LABELS.pending;
            const busy = actionLoading?.startsWith(String(comment.id));
            return (
              <div key={comment.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition ${
                comment.status === 'pending' ? 'border-amber-200' : 'border-gray-200'
              }`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-extrabold text-slate-800 text-sm">{comment.author}</span>
                      {comment.email && (
                        <span className="text-xs text-slate-400 font-mono">{comment.email}</span>
                      )}
                      <StarRating rating={comment.rating} />
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2 font-medium">
                      {comment.product?.title} &nbsp;·&nbsp;
                      {new Date(comment.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-slate-700 text-sm leading-relaxed">{comment.body}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    {comment.status !== 'approved' && (
                      <button
                        onClick={() => updateStatus(comment.id, 'approved')}
                        disabled={!!busy}
                        className="inline-flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 font-bold text-xs px-3 py-2 rounded-xl transition disabled:opacity-50"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        Approuver
                      </button>
                    )}
                    {comment.status !== 'rejected' && (
                      <button
                        onClick={() => updateStatus(comment.id, 'rejected')}
                        disabled={!!busy}
                        className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs px-3 py-2 rounded-xl transition disabled:opacity-50"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Refuser
                      </button>
                    )}
                    <button
                      onClick={() => deleteComment(comment.id)}
                      disabled={!!busy}
                      className="inline-flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-500 font-bold text-xs px-3 py-2 rounded-xl transition disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Supprimer
                    </button>
                    {comment.status !== 'pending' && (
                      <button
                        onClick={() => updateStatus(comment.id, 'pending')}
                        disabled={!!busy}
                        className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs px-3 py-2 rounded-xl transition disabled:opacity-50"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Remettre en attente
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
