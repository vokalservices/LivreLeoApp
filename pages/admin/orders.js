import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';

export default function Orders() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [emailFilter, setEmailFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit] = useState(10);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  useEffect(() => {
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchOrders();
  }, [token, page]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders_paginated?page=${page}&limit=${limit}&email=${emailFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur chargement commandes');
      const data = await res.json();
      setOrders(data.orders);
      setTotalCount(data.totalCount);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleFilterSubmit(e) {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  }

  function handlePrev() {
    if (page > 1) setPage(page - 1);
  }

  function handleNext() {
    if (page < Math.ceil(totalCount / limit)) setPage(page + 1);
  }

  return (
    <AdminLayout activeTab="orders">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Commandes</h1>
          <p className="text-slate-500 mt-1">Consultez et recherchez parmi toutes les ventes de livres.</p>
        </div>

        <div className="mt-4 md:mt-0 flex gap-2 flex-wrap">
          {/* Export CSV */}
          <a
            href="/api/export-orders"
            onClick={e => {
              e.preventDefault();
              const a = document.createElement('a');
              a.href = '/api/export-orders';
              a.setAttribute('download', '');
              // Passer le token via fetch puis créer un blob
              fetch('/api/export-orders', { headers: { Authorization: `Bearer ${token}` } })
                .then(r => r.blob())
                .then(blob => {
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `commandes_${new Date().toISOString().slice(0,10)}.csv`;
                  link.click();
                  URL.revokeObjectURL(url);
                });
            }}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm shadow-sm transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exporter CSV
          </a>

          {/* Filtrage */}
          <form onSubmit={handleFilterSubmit} className="flex gap-2">
            <div className="relative">
              <input
                type="email"
                placeholder="Email client..."
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                className="border border-gray-200 bg-white px-4 py-2.5 rounded-xl w-60 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              {emailFilter && (
                <button
                  type="button"
                  onClick={() => { setEmailFilter(''); setPage(1); setTimeout(() => fetchOrders(), 0); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm shadow-sm transition"
            >
              Filtrer
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 mb-6 font-medium text-sm">
          Erreur : {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border shadow-sm p-16 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-gray-400 text-sm mt-4 font-medium">Chargement de la liste des commandes...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/75">
                <tr>
                  <th className="text-left text-xs font-bold text-slate-450 uppercase tracking-wider py-4 px-6">ID</th>
                  <th className="text-left text-xs font-bold text-slate-450 uppercase tracking-wider py-4 px-6">Livre</th>
                  <th className="text-left text-xs font-bold text-slate-450 uppercase tracking-wider py-4 px-6">Email client</th>
                  <th className="text-left text-xs font-bold text-slate-450 uppercase tracking-wider py-4 px-6">Montant</th>
                  <th className="text-left text-xs font-bold text-slate-450 uppercase tracking-wider py-4 px-6">Pays</th>
                  <th className="text-left text-xs font-bold text-slate-450 uppercase tracking-wider py-4 px-6">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                      Aucune commande enregistrée
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-6 text-sm font-bold text-slate-900">#{order.id}</td>
                      <td className="py-4 px-6 text-sm">
                        <span className="font-semibold text-slate-800">{order.product?.title || 'Livre inconnu'}</span>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600 font-medium">{order.email || '—'}</td>
                      <td className="py-4 px-6 text-sm font-bold text-slate-900">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(order.amount)}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-500 font-medium">
                        {order.country ? (
                          <span className="flex items-center gap-1.5">
                            <span>{order.countryCode?.length === 2
                              ? String.fromCodePoint(...order.countryCode.toUpperCase().split('').map(c => 0x1F1E6 - 65 + c.charCodeAt(0)))
                              : '🌍'}
                            </span>
                            <span>{order.country}</span>
                            {order.city && <span className="text-slate-400">· {order.city}</span>}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-500 font-medium">
                        {new Date(order.createdAt).toLocaleString('fr-FR', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalCount > limit && (
            <div className="bg-gray-50/50 px-6 py-4 border-t flex items-center justify-between">
              <span className="text-sm text-slate-500 font-medium">
                Page <strong className="text-slate-800">{page}</strong> sur <strong className="text-slate-800">{Math.ceil(totalCount / limit)}</strong>
              </span>

              <div className="flex gap-2">
                <button
                  onClick={handlePrev}
                  disabled={page <= 1}
                  className="bg-white hover:bg-gray-50 border border-gray-200 disabled:opacity-40 disabled:hover:bg-white text-gray-700 font-bold px-4 py-2 rounded-xl text-sm transition shadow-sm"
                >
                  Précédent
                </button>
                <button
                  onClick={handleNext}
                  disabled={page >= Math.ceil(totalCount / limit)}
                  className="bg-white hover:bg-gray-50 border border-gray-200 disabled:opacity-40 disabled:hover:bg-white text-gray-700 font-bold px-4 py-2 rounded-xl text-sm transition shadow-sm"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
