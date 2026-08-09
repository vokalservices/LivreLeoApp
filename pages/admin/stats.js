import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';
import AdminLayout from '../../components/AdminLayout';

const EUR = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
const GEO_COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4','#84CC16','#F97316','#6366F1'];

function flag(code) {
  if (!code || code.length !== 2) return '🌍';
  return String.fromCodePoint(...code.toUpperCase().split('').map(c => 0x1F1E6 - 65 + c.charCodeAt(0)));
}

function KPI({ label, value, sub, icon, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    amber:  'bg-amber-50 text-amber-600',
    rose:   'bg-rose-50 text-rose-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900 truncate">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5 font-medium">{sub}</p>}
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        {icon}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl">
      <p className="font-bold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#60A5FA' }}>
          {p.name} : {p.name?.includes('€') || p.dataKey === 'revenue' ? EUR(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function Stats() {
  const router = useRouter();
  const [rawData, setRawData] = useState(null);
  const [error, setError]     = useState(null);
  const [timeFilter, setTimeFilter] = useState('all'); // 'today' | '7d' | '30d' | '3m' | '12m' | 'all'
  const [chartPeriod, setChartPeriod] = useState('monthly'); // 'monthly' | 'daily'
  const [expandGeo, setExpandGeo] = useState(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  useEffect(() => {
    if (!token) { router.push('/admin/login'); return; }
    fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error('Erreur chargement'); return r.json(); })
      .then(setRawData)
      .catch(e => setError(e.message));
  }, [token]);

  // Filtre les commandes selon la période sélectionnée
  const filteredOrders = useMemo(() => {
    if (!rawData?.allOrders) return [];
    const now = new Date();
    const cutoff = (() => {
      switch (timeFilter) {
        case 'today': { const d = new Date(now); d.setHours(0,0,0,0); return d; }
        case '7d':    return new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
        case '30d':   return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case '3m':    return new Date(now.getFullYear(), now.getMonth() - 3,  now.getDate());
        case '12m':   return new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
        case 'all':
        default:      return new Date(0);
      }
    })();
    return rawData.allOrders.filter(o => new Date(o.createdAt) >= cutoff);
  }, [rawData, timeFilter]);

  // Recalcule toutes les stats sur les commandes filtrées
  const data = useMemo(() => {
    if (!rawData || !filteredOrders) return null;

    const totalSales   = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((s, o) => s + o.amount, 0);
    const avgOrder     = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Ventes par livre
    const byProduct = {};
    for (const o of filteredOrders) {
      if (!o.product) continue;
      const key = o.productId;
      if (!byProduct[key]) byProduct[key] = { product: o.product, count: 0, revenue: 0 };
      byProduct[key].count++;
      byProduct[key].revenue += o.amount;
    }
    const bestsellers = Object.values(byProduct).sort((a, b) => b.count - a.count);

    // FR vs EN
    const byLang = { fr: { count: 0, revenue: 0 }, en: { count: 0, revenue: 0 }, other: { count: 0, revenue: 0 } };
    for (const o of filteredOrders) {
      const lang = o.product?.lang || 'other';
      const key  = lang === 'fr' ? 'fr' : lang === 'en' ? 'en' : 'other';
      byLang[key].count++;
      byLang[key].revenue += o.amount;
    }

    // Géographie
    const geoMap = {};
    for (const o of filteredOrders) {
      if (!o.country) continue;
      const key = o.countryCode || o.country;
      if (!geoMap[key]) geoMap[key] = { country: o.country, countryCode: o.countryCode, count: 0, revenue: 0, cities: {} };
      geoMap[key].count++;
      geoMap[key].revenue += o.amount;
      if (o.city) geoMap[key].cities[o.city] = (geoMap[key].cities[o.city] || 0) + 1;
    }
    const geoStats = Object.values(geoMap)
      .sort((a, b) => b.count - a.count)
      .map(g => ({
        ...g,
        cities: Object.entries(g.cities)
          .map(([city, count]) => ({ city, count }))
          .sort((a, b) => b.count - a.count),
      }));

    // Distribution horaire
    const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
    for (const o of filteredOrders) {
      const h = new Date(o.createdAt).getHours();
      hourly[h].count++;
    }

    // Tendance mensuelle — reconstruit depuis les commandes filtrées
    const monthlyMap = {};
    for (let i = 11; i >= 0; i--) {
      const d   = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = { label: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }), count: 0, revenue: 0 };
    }
    for (const o of filteredOrders) {
      const d   = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[key]) { monthlyMap[key].count++; monthlyMap[key].revenue += o.amount; }
    }
    const monthlyTrend = Object.values(monthlyMap);

    // Tendance journalière — reconstruit depuis les commandes filtrées
    const dailyMap = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
      const key = d.toISOString().slice(0, 10);
      dailyMap[key] = { label: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), count: 0, revenue: 0 };
    }
    for (const o of filteredOrders) {
      const key = new Date(o.createdAt).toISOString().slice(0, 10);
      if (dailyMap[key]) { dailyMap[key].count++; dailyMap[key].revenue += o.amount; }
    }
    const dailyTrend = Object.values(dailyMap);

    const recentOrders = [...filteredOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

    return {
      totalSales,
      totalRevenue,
      avgOrder,
      bestsellers,
      byLang,
      monthlyTrend,
      dailyTrend,
      geoStats,
      hourly,
      recentOrders,
    };
  }, [rawData, filteredOrders]);

  if (error) return (
    <AdminLayout activeTab="stats">
      <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 font-medium text-sm">Erreur : {error}</div>
    </AdminLayout>
  );

  if (!data) return (
    <AdminLayout activeTab="stats">
      <div className="flex flex-col items-center justify-center py-32">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4" />
        <p className="text-slate-500 font-medium">Chargement des statistiques...</p>
      </div>
    </AdminLayout>
  );

  const trend     = chartPeriod === 'monthly' ? data.monthlyTrend : data.dailyTrend;
  const topBook   = data.bestsellers[0];
  const topCountry= data.geoStats[0];
  const localized = data.geoStats.reduce((s, g) => s + g.count, 0);

  // Répartition FR / EN pour le pie
  const langPie = [
    { name: 'Livres FR', value: data.byLang.fr.count, color: '#3B82F6' },
    { name: 'Livres EN', value: data.byLang.en.count, color: '#8B5CF6' },
  ].filter(l => l.value > 0);

  // Heure de pointe
  const peakHour = data.hourly.reduce((max, h) => h.count > max.count ? h : max, { hour: 0, count: 0 });

  return (
    <AdminLayout activeTab="stats">

      {/* ── En-tête + Filtre période ── */}
      <div className="mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Statistiques</h1>
            <p className="text-slate-500 mt-1">Analyse complète des ventes, de la géographie et du comportement d'achat.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'today', label: "Aujourd'hui" },
              { value: '7d',    label: '7 jours' },
              { value: '30d',   label: '30 jours' },
              { value: '3m',    label: '3 mois' },
              { value: '12m',   label: '12 mois' },
              { value: 'all',   label: 'Tout' },
            ].map(p => (
              <button key={p.value} onClick={() => setTimeFilter(p.value)}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm ${
                  timeFilter === p.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 border border-gray-200 hover:border-blue-300'
                }`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 flex items-center gap-2 text-xs">
          <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p className="text-blue-800 font-medium">
            <strong>Période active :</strong> {
              timeFilter === 'today' ? "Aujourd'hui" :
              timeFilter === '7d' ? '7 derniers jours' :
              timeFilter === '30d' ? '30 derniers jours' :
              timeFilter === '3m' ? '3 derniers mois' :
              timeFilter === '12m' ? '12 derniers mois' : 'Toutes les données'
            } · <strong>{data.totalSales}</strong> commandes · <strong>{EUR(data.totalRevenue)}</strong>
          </p>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        <KPI label="Commandes" value={data.totalSales} sub="Total historique" color="blue"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>} />
        <KPI label="Revenu total" value={EUR(data.totalRevenue)} sub="Toutes commandes" color="green"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>} />
        <KPI label="Panier moyen" value={EUR(data.avgOrder)} sub="Par commande" color="amber"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 7h16v10H4z"/></svg>} />
        <KPI label="Pays atteints" value={data.geoStats.length} sub={`${localized} commandes localisées`} color="violet"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"/></svg>} />
        <KPI label="Heure de pointe" value={`${peakHour.hour}h–${peakHour.hour+1}h`} sub={`${peakHour.count} achats`} color="rose"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>} />
      </div>

      {/* ── Tendance des ventes ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Tendance des ventes</h2>
            <p className="text-slate-400 text-sm mt-0.5">Commandes et revenu dans le temps</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setChartPeriod('daily')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${chartPeriod === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              Jours
            </button>
            <button onClick={() => setChartPeriod('monthly')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${chartPeriod === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              Mois
            </button>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gradCnt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="label" stroke="#9CA3AF" fontSize={10} tickLine={false} />
              <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenu (€)" stroke="#3B82F6" strokeWidth={2} fill="url(#gradRev)" dot={false} />
              <Area type="monotone" dataKey="count"   name="Commandes"   stroke="#10B981" strokeWidth={2} fill="url(#gradCnt)"  dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Ventes par livre + répartition FR/EN ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Barres par livre */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-1">Ventes par livre</h2>
          <p className="text-slate-400 text-sm mb-6">Nombre de commandes et revenu par titre</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.bestsellers.map(b => {
                  const meta = (() => { try { return JSON.parse(b.product?.metadata || '{}'); } catch { return {}; } })();
                  const vol  = meta.series?.volume;
                  return {
                    name:    vol ? `T${vol} ${b.product?.lang?.toUpperCase() || ''}`.trim() : (b.product?.title?.slice(0, 14) || '?'),
                    full:    b.product?.title,
                    ventes:  b.count,
                    revenu:  +b.revenue.toFixed(2),
                  };
                })}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="ventes" name="Ventes" fill="#3B82F6" radius={[4,4,0,0]} barSize={22} />
                <Bar dataKey="revenu" name="Revenu (€)" fill="#10B981" radius={[4,4,0,0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie FR / EN */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 mb-1">FR vs EN</h2>
          <p className="text-slate-400 text-sm mb-4">Répartition des ventes par langue</p>
          <div className="flex-1 flex flex-col justify-center">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={langPie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                    {langPie.map((l, i) => <Cell key={i} fill={l.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor:'#1E293B', borderRadius:'10px', color:'white', border:'none' }}
                    formatter={(v, n) => [`${v} ventes`, n]} />
                  <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-xs text-slate-600 font-medium">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {[
                { label: 'FR', count: data.byLang.fr.count, rev: data.byLang.fr.revenue, color: 'bg-blue-500' },
                { label: 'EN', count: data.byLang.en.count, rev: data.byLang.en.revenue, color: 'bg-violet-500' },
              ].map(l => (
                <div key={l.label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className={`w-2 h-2 rounded-full ${l.color} mx-auto mb-1`} />
                  <p className="text-xs font-bold text-slate-500 uppercase">{l.label}</p>
                  <p className="text-lg font-extrabold text-slate-800">{l.count}</p>
                  <p className="text-[10px] text-slate-400">{EUR(l.rev)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Géographie ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Provenance géographique</h2>
            <p className="text-slate-400 text-sm mt-0.5">{data.geoStats.length} pays · {localized} commandes localisées</p>
          </div>
          {topCountry && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-xl">
              <span className="text-xl">{flag(topCountry.countryCode)}</span>
              <div>
                <p className="text-xs font-bold text-blue-800">{topCountry.country}</p>
                <p className="text-[10px] text-blue-500">{topCountry.count} commandes · {EUR(topCountry.revenue)}</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Camembert géo */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.geoStats.slice(0, 8).map(g => ({ name: g.country || 'Inconnu', value: g.count }))}
                  cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value"
                >
                  {data.geoStats.slice(0, 8).map((_, i) => <Cell key={i} fill={GEO_COLORS[i % GEO_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor:'#1E293B', borderRadius:'10px', color:'white', border:'none' }}
                  formatter={(v, n) => [`${v} commande${v>1?'s':''}`, n]} />
                <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-xs text-slate-600 font-medium">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Liste détaillée */}
          <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
            {data.geoStats.map((geo, i) => (
              <div key={i}>
                <button onClick={() => setExpandGeo(expandGeo === i ? null : i)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3">
                    <span className="text-lg leading-none">{flag(geo.countryCode)}</span>
                    <div className="text-left">
                      <span className="font-bold text-slate-800 text-sm block">{geo.country || 'Inconnu'}</span>
                      {geo.cities.length > 0 && (
                        <span className="text-[10px] text-slate-400">
                          {geo.cities.slice(0, 2).map(c => c.city).join(', ')}{geo.cities.length > 2 ? ` +${geo.cities.length - 2}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div>
                      <div className="h-1.5 w-20 bg-blue-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(geo.count / data.geoStats[0].count) * 100}%` }} />
                      </div>
                      <p className="text-[10px] text-right text-slate-400 mt-0.5">{EUR(geo.revenue)}</p>
                    </div>
                    <span className="text-sm font-extrabold text-slate-700 w-5 text-right">{geo.count}</span>
                    {geo.cities.length > 0 && (
                      <svg className={`w-3.5 h-3.5 text-slate-300 transition-transform ${expandGeo === i ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                </button>
                {expandGeo === i && geo.cities.length > 0 && (
                  <div className="ml-10 mb-1 space-y-0.5">
                    {geo.cities.map((c, j) => (
                      <div key={j} className="flex items-center justify-between px-3 py-1.5 bg-gray-50 rounded-lg">
                        <span className="text-xs text-slate-500 font-medium">📍 {c.city}</span>
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

      {/* ── Distribution horaire ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-1">Distribution horaire des achats</h2>
        <p className="text-slate-400 text-sm mb-6">À quelle heure achètent vos clients (heure locale serveur)</p>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.hourly} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="hour" stroke="#9CA3AF" fontSize={10} tickLine={false}
                tickFormatter={h => h % 3 === 0 ? `${h}h` : ''} />
              <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Achats" radius={[3,3,0,0]} barSize={16}
                fill="#8B5CF6"
                label={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Commandes récentes ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Commandes récentes</h2>
            <p className="text-slate-400 text-sm mt-0.5">
              {data.recentOrders.length} commande{data.recentOrders.length > 1 ? 's' : ''} · {
                timeFilter === 'today' ? "Aujourd'hui" :
                timeFilter === '7d'   ? '7 derniers jours' :
                timeFilter === '30d'  ? '30 derniers jours' :
                timeFilter === '3m'   ? '3 derniers mois' :
                timeFilter === '12m'  ? '12 derniers mois' : 'Toutes les données'
              }
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/70">
              <tr>
                {['#', 'Livre', 'Email', 'Montant', 'Pays', 'Date'].map(h => (
                  <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider py-3 px-5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.recentOrders.map(o => (
                <tr key={o.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-3 px-5 text-sm font-bold text-slate-400">#{o.id}</td>
                  <td className="py-3 px-5 text-sm font-semibold text-slate-800 max-w-[180px] truncate">{o.product?.title || '—'}</td>
                  <td className="py-3 px-5 text-sm text-slate-500">{o.email || '—'}</td>
                  <td className="py-3 px-5 text-sm font-bold text-slate-900">{EUR(o.amount)}</td>
                  <td className="py-3 px-5 text-sm">
                    {o.country
                      ? <span className="flex items-center gap-1.5">{flag(o.countryCode)}<span className="text-slate-600">{o.country}{o.city ? ` · ${o.city}` : ''}</span></span>
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="py-3 px-5 text-xs text-slate-400 font-medium whitespace-nowrap">
                    {new Date(o.createdAt).toLocaleString('fr-FR', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </AdminLayout>
  );
}
