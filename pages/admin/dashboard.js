import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import AdminLayout from '../../components/AdminLayout.jsx';

// Palette de couleurs pour le graphique pays
const GEO_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

// Drapeau emoji depuis le code pays ISO 2
function countryFlag(code) {
  if (!code || code.length !== 2) return '🌍';
  return String.fromCodePoint(
    ...code.toUpperCase().split('').map(c => 0x1F1E6 - 65 + c.charCodeAt(0))
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [expandedCountry, setExpandedCountry] = useState(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  useEffect(() => {
    if (!token) { router.push('/admin/login'); return; }
    fetchStats();
  }, [token]);

  async function fetchStats() {
    try {
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur chargement données');
      const data = await res.json();
      setStats(data);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <AdminLayout activeTab="dashboard">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Tableau de bord</h1>
        <p className="text-slate-500 mt-1">Consultez l'état de vos ventes et statistiques de livres en temps réel.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 mb-6 font-medium text-sm">
          Erreur : {error}
        </div>
      )}

      {!stats ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border shadow-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-500 font-medium">Chargement des données analytiques...</p>
        </div>
      ) : (
        <div className="space-y-8">

          {/* KPI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
              <div>
                <span className="text-slate-400 font-bold text-xs uppercase tracking-wider block mb-1">Commandes</span>
                <span className="text-3xl font-extrabold text-slate-900 block">{stats.totalSales}</span>
                <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded mt-2 inline-block">Historique complet</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
              <div>
                <span className="text-slate-400 font-bold text-xs uppercase tracking-wider block mb-1">Revenu total</span>
                <span className="text-3xl font-extrabold text-slate-900 block">{stats.totalRevenue.toFixed(2)} €</span>
                <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded mt-2 inline-block">Fonds garantis</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-xl pointer-events-none" />
              <div>
                <span className="text-slate-400 font-bold text-xs uppercase tracking-wider block mb-1">Pays atteints</span>
                <span className="text-3xl font-extrabold text-slate-900 block">{stats.geoStats?.length || 0}</span>
                <span className="text-xs text-violet-600 font-semibold bg-violet-50 px-2 py-0.5 rounded mt-2 inline-block">Portée internationale</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Graphique ventes par livre */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Volumes de vente par livre</h3>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.bestsellers.map(b => {
                    const meta = (() => { try { return JSON.parse(b.product?.metadata || '{}'); } catch { return {}; } })();
                    const vol  = meta.series?.volume;
                    const short = b.product?.title?.replace(/Léo et le Voleur d[e']/i, 'T').replace(/Leo and the /i, 'T') || b.product?.title || '?';
                    return { name: vol ? `T${vol}` : short, full: b.product?.title, ventes: b.count };
                  })}
                  margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', color: 'white', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#60A5FA' }}
                  />
                  <Bar dataKey="ventes" barSize={32} fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Provenance clients */}
          {stats.geoStats && stats.geoStats.length > 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Provenance des clients</h3>
                  <p className="text-slate-400 text-sm mt-0.5">Géolocalisation par adresse IP à la commande</p>
                </div>
                <span className="text-xs bg-blue-50 text-blue-700 font-bold px-3 py-1.5 rounded-full">
                  {stats.geoStats.reduce((s, g) => s + g.count, 0)} commandes localisées
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Graphique camembert */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.geoStats.slice(0, 8).map(g => ({ name: g.country || 'Inconnu', value: g.count }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {stats.geoStats.slice(0, 8).map((_, i) => (
                          <Cell key={i} fill={GEO_COLORS[i % GEO_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1E293B', borderRadius: '10px', color: 'white', border: 'none' }}
                        formatter={(val, name) => [`${val} commande${val > 1 ? 's' : ''}`, name]}
                      />
                      <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-slate-600 font-medium">{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Liste pays + villes */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {stats.geoStats.map((geo, i) => (
                    <div key={i}>
                      <button
                        onClick={() => setExpandedCountry(expandedCountry === i ? null : i)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 transition group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl leading-none">{countryFlag(geo.countryCode)}</span>
                          <div className="text-left">
                            <span className="font-bold text-slate-800 text-sm block">{geo.country || 'Inconnu'}</span>
                            {geo.cities.length > 0 && (
                              <span className="text-xs text-slate-400">{geo.cities.slice(0, 2).map(c => c.city).join(', ')}{geo.cities.length > 2 ? ` +${geo.cities.length - 2}` : ''}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 rounded-full bg-blue-100 w-20 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-blue-500"
                                style={{ width: `${(geo.count / stats.geoStats[0].count) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-extrabold text-slate-700 w-6 text-right">{geo.count}</span>
                          </div>
                          {geo.cities.length > 0 && (
                            <svg
                              className={`w-4 h-4 text-slate-400 transition-transform ${expandedCountry === i ? 'rotate-180' : ''}`}
                              fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </div>
                      </button>

                      {/* Détail villes */}
                      {expandedCountry === i && geo.cities.length > 0 && (
                        <div className="ml-10 mb-2 space-y-1">
                          {geo.cities.map((c, j) => (
                            <div key={j} className="flex items-center justify-between px-3 py-1.5 bg-gray-50 rounded-lg">
                              <span className="text-xs text-slate-600 font-medium">📍 {c.city}</span>
                              <span className="text-xs font-bold text-slate-500">{c.count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-slate-400 font-medium text-sm">Aucune donnée de provenance disponible.</p>
              <p className="text-slate-300 text-xs mt-1">Les nouvelles commandes seront géolocalisées automatiquement.</p>
            </div>
          )}

        </div>
      )}
    </AdminLayout>
  );
}
