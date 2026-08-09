import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout.jsx';

const TYPE_LABELS = { percent: '%', fixed: '€ fixe' };

const EMPTY_FORM = {
  code: '', type: 'percent', value: '', description: '',
  active: true, usageLimit: '', expiresAt: '',
};

export default function CouponsAdmin() {
  const router = useRouter();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [formError, setFormError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  useEffect(() => {
    if (!token) { router.push('/admin/login'); return; }
    fetchCoupons();
  }, [token]);

  async function fetchCoupons() {
    setLoading(true);
    try {
      const res = await fetch('/api/coupons', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function startEdit(coupon) {
    setEditId(coupon.id);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      description: coupon.description || '',
      active: coupon.active,
      usageLimit: coupon.usageLimit != null ? String(coupon.usageLimit) : '',
      expiresAt: coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '',
    });
    setFormError('');
    setShowForm(true);
  }

  function cancelForm() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.code || !form.value) { setFormError('Code et valeur sont obligatoires.'); return; }
    if (form.type === 'percent' && (parseFloat(form.value) <= 0 || parseFloat(form.value) > 100)) {
      setFormError('La valeur en pourcentage doit être entre 1 et 100.'); return;
    }
    setSaving(true); setFormError('');
    const payload = {
      code: form.code,
      type: form.type,
      value: parseFloat(form.value),
      description: form.description || null,
      active: form.active,
      usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
      expiresAt: form.expiresAt || null,
    };
    try {
      const method = editId ? 'PATCH' : 'POST';
      const body = editId ? { id: editId, ...payload } : payload;
      const res = await fetch('/api/coupons', {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || 'Erreur serveur.'); return; }
      await fetchCoupons();
      cancelForm();
    } catch (e) { setFormError('Erreur de connexion.'); }
    finally { setSaving(false); }
  }

  async function toggleActive(coupon) {
    setActionLoading(coupon.id + 'toggle');
    try {
      await fetch('/api/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: coupon.id, active: !coupon.active }),
      });
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, active: !c.active } : c));
    } finally { setActionLoading(null); }
  }

  async function deleteCoupon(id) {
    if (!confirm('Supprimer ce coupon définitivement ?')) return;
    setActionLoading(id + 'del');
    try {
      await fetch('/api/coupons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      });
      setCoupons(prev => prev.filter(c => c.id !== id));
    } finally { setActionLoading(null); }
  }

  return (
    <AdminLayout activeTab="coupons">
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Codes Promo</h1>
          <p className="text-slate-500 mt-1">Créez, activez ou désactivez vos codes de réduction.</p>
        </div>
        {!showForm && (
          <button onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); }}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition active:scale-95 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Nouveau coupon
          </button>
        )}
      </div>

      {/* Formulaire création/édition */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-blue-100 rounded-2xl p-6 shadow-sm mb-8 space-y-4">
          <h2 className="font-bold text-slate-800 text-base">{editId ? 'Modifier le coupon' : 'Nouveau coupon'}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Code promo *</label>
              <input type="text" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="EX: NOEL25" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Description</label>
              <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Promo de Noël, code influenceur..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Type *</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="percent">Pourcentage (%)</option>
                <option value="fixed">Montant fixe (€)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Valeur * {form.type === 'percent' ? '(1–100%)' : '(€)'}</label>
              <input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                min="0" max={form.type === 'percent' ? 100 : undefined} step="0.01"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={form.type === 'percent' ? 'ex: 10' : 'ex: 2.00'} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Limite d'utilisation (vide = illimitée)</label>
              <input type="number" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))}
                min="1" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ex: 100" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Date d'expiration (vide = jamais)</label>
              <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setForm(f => ({ ...f, active: !f.active }))}
              className={`relative w-10 h-6 rounded-full transition ${f => f.active ? 'bg-green-500' : 'bg-gray-300'} ${form.active ? 'bg-green-500' : 'bg-gray-300'}`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.active ? 'left-5' : 'left-1'}`} />
            </button>
            <span className="text-sm font-semibold text-slate-600">{form.active ? 'Actif' : 'Inactif'}</span>
          </div>

          {formError && <p className="text-xs text-red-500 font-medium">{formError}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition disabled:opacity-50 active:scale-95">
              {saving ? 'Enregistrement...' : editId ? 'Mettre à jour' : 'Créer le coupon'}
            </button>
            <button type="button" onClick={cancelForm}
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-6 py-2.5 rounded-xl text-sm transition active:scale-95">
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Liste des coupons */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border shadow-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mb-4" />
          <p className="text-slate-500 font-medium">Chargement...</p>
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <p className="text-slate-400 font-semibold">Aucun coupon créé pour l'instant.</p>
          <p className="text-slate-300 text-sm mt-1">Cliquez sur "Nouveau coupon" pour commencer.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map(coupon => {
            const expired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
            const busy = actionLoading?.startsWith(String(coupon.id));
            return (
              <div key={coupon.id} className={`bg-white rounded-2xl border shadow-sm p-5 flex items-center justify-between gap-4 flex-wrap transition ${expired ? 'opacity-60' : ''} ${!coupon.active ? 'border-gray-100' : 'border-gray-200'}`}>
                <div className="flex items-center gap-4 min-w-0">
                  <span className={`text-lg font-black font-mono tracking-wider px-3 py-1.5 rounded-xl ${coupon.active && !expired ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400 line-through'}`}>
                    {coupon.code}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-extrabold ${coupon.type === 'percent' ? 'text-green-700' : 'text-blue-700'}`}>
                        -{coupon.value}{coupon.type === 'percent' ? '%' : '€'}
                      </span>
                      {coupon.description && <span className="text-xs text-slate-400 truncate">{coupon.description}</span>}
                      {expired && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Expiré</span>}
                      {!coupon.active && !expired && <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Inactif</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-400">
                      <span>{coupon.usageCount} utilisation{coupon.usageCount !== 1 ? 's' : ''}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ' (illimité)'}</span>
                      {coupon.expiresAt && <span>Expire le {new Date(coupon.expiresAt).toLocaleDateString('fr-FR')}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleActive(coupon)} disabled={!!busy}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition disabled:opacity-50 ${coupon.active ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                    {coupon.active ? 'Désactiver' : 'Activer'}
                  </button>
                  <button onClick={() => startEdit(coupon)} disabled={!!busy}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition disabled:opacity-50">
                    Modifier
                  </button>
                  <button onClick={() => deleteCoupon(coupon.id)} disabled={!!busy}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-50">
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
