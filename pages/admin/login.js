import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const router = useRouter();

  // Redirection automatique si déjà connecté
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      router.push('/admin/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('adminToken', data.token);
        router.push('/admin/dashboard'); // Rediriger vers le dashboard d'abord
      } else {
        setError(data.error || 'Identifiants incorrects');
      }
    } catch (err) {
      setError('Erreur de connexion serveur');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-700 via-indigo-850 to-indigo-950 p-6">
      {/* Logo décoratif spatial */}
      <div className="flex items-center space-x-2 text-white mb-8">
        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-400/20">
          L
        </div>
        <span className="font-extrabold text-2xl tracking-wider">Léo Admin</span>
      </div>

      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <h1 className="text-2xl font-bold text-slate-800 text-center mb-2">Connexion à la Console</h1>
        <p className="text-slate-400 text-xs text-center mb-8 font-medium">Saisissez vos paramètres d'accès ci-dessous</p>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-150 mb-6 font-semibold text-xs leading-normal">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-2" htmlFor="username">
              Nom d'utilisateur
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-200 bg-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              placeholder="Ex. admin"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-2" htmlFor="password">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 bg-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm shadow-md hover:shadow-lg active:scale-95 transition mt-6"
          >
            Se connecter
          </button>
        </form>
      </div>

      <p className="mt-8 text-xs text-blue-200/50 font-medium">
        © {new Date().getFullYear()} Éditions Galaxie Carton / Léo l'inventeur
      </p>
    </div>
  );
}
