import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';

export default function Admin() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [author, setAuthor] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  useEffect(() => {
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchProducts();
  }, [token]);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await fetch('/api/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur chargement produits');
      const data = await res.json();
      setProducts(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const body = {
      title,
      description,
      price: parseFloat(price),
      imageUrl,
      author: author || 'Théo Arven',
      ageGroup: ageGroup || '6-8'
    };

    let url = '/api/products';
    let method = 'POST';
    if (editId !== null) {
      method = 'PUT';
      body.id = editId;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur lors de la soumission');
      }

      await fetchProducts();
      resetForm();
    } catch (e) {
      setError(e.message);
    }
  }

  function resetForm() {
    setTitle('');
    setDescription('');
    setPrice('');
    setImageUrl('');
    setAuthor('');
    setAgeGroup('');
    setEditId(null);
  }

  function handleEdit(product) {
    setTitle(product.title);
    setDescription(product.description);
    setPrice(product.price.toString());
    setImageUrl(product.imageUrl);
    setAuthor(product.author || '');
    setAgeGroup(product.ageGroup || '');
    setEditId(product.id);
  }

  async function handleDelete(id) {
    setError(null);
    if (!confirm('Confirmer la suppression de ce produit ?')) return;

    try {
      const res = await fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur suppression');
      }

      await fetchProducts();
      resetForm();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <AdminLayout activeTab="products">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Gestion des livres</h1>
        <p className="text-slate-500 mt-1">Créez, modifiez ou supprimez les livres de votre catalogue.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 mb-6 font-medium text-sm">
          Erreur : {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Formulaire */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative">
          <h2 className="text-lg font-bold text-slate-800 mb-6 border-b pb-3">
            {editId ? 'Modifier' : 'Ajouter'} un livre
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Titre</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-200 bg-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Auteur</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Théo Arven"
                  className="w-full border border-gray-200 bg-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tranche d'âge</label>
                <input
                  type="text"
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  placeholder="6-8"
                  className="w-full border border-gray-200 bg-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-200 bg-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                rows={4}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Prix (€)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                step="0.01"
                min="0"
                className="w-full border border-gray-200 bg-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">URL de l'image de couverture</label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full border border-gray-200 bg-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                required
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition shadow-sm"
              >
                {editId ? 'Sauvegarder' : 'Ajouter au catalogue'}
              </button>

              {editId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-xl text-sm transition border"
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Tableau */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <h2 className="text-lg font-bold text-slate-800 p-6 border-b">
            Catalogue actuel ({products.length})
          </h2>

          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
              <p className="text-gray-400 text-xs mt-3 font-medium">Chargement des livres...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/75">
                  <tr>
                    <th className="text-left text-xs font-bold text-slate-450 uppercase tracking-wider py-4 px-6">Livre</th>
                    <th className="text-left text-xs font-bold text-slate-450 uppercase tracking-wider py-4 px-6">Prix</th>
                    <th className="text-right text-xs font-bold text-slate-450 uppercase tracking-wider py-4 px-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-12 text-slate-400 font-medium">
                        Aucun livre dans le catalogue
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-4 px-6 flex items-center space-x-3">
                          <img
                            src={p.imageUrl}
                            alt={p.title}
                            className="w-10 h-14 object-cover rounded shadow-sm border border-gray-200"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block text-sm">{p.title}</span>
                            <span className="text-xs text-slate-400 font-medium">
                              Par {p.author || 'Théo Arven'} • {p.ageGroup || '6-8'} ans
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm font-bold text-slate-900">
                          {p.price.toFixed(2)} €
                        </td>
                        <td className="py-4 px-6 text-right text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEdit(p)}
                            className="bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold py-1.5 px-3 rounded-lg text-xs transition"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="bg-red-50 text-red-600 hover:bg-red-100 font-bold py-1.5 px-3 rounded-lg text-xs transition"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
