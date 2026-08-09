import React from 'react';
import Link from 'next/link';
import { eur } from '../lib/translations';

const Book = ({ id, title, description, price, imageUrl, author, ageGroup, metadata }) => {
  let series = null;
  let pageCount = 0;

  if (metadata) {
    try {
      const parsed = JSON.parse(metadata);
      series = parsed.series;
      if (parsed.pages) pageCount = parsed.pages.length;
    } catch (e) {}
  }

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-indigo-200 transition-all duration-300 hover:shadow-xl flex flex-col justify-between h-full max-w-sm">
      {/* Couverture — cliquable vers la page d'achat */}
      <Link href={`/books/${id}`} className="relative bg-gradient-to-b from-indigo-50 to-slate-50 flex items-center justify-center p-6 h-72 overflow-hidden border-b border-gray-100 cursor-pointer">
        <div className="relative transition-transform duration-500 group-hover:scale-105 group-hover:rotate-1">
          <img
            className="w-40 h-56 object-cover rounded-md shadow-[8px_12px_24px_rgba(0,0,0,0.15),_1px_2px_4px_rgba(0,0,0,0.1)] border border-gray-200"
            src={imageUrl}
            alt={title}
          />
          {/* Tranche brillance 3D */}
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-r from-white/30 to-transparent pointer-events-none rounded-l-md" />

          {/* Tome + âge discrets */}
          {(series?.volume || ageGroup) && (
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 py-1 bg-black/30 backdrop-blur-sm rounded-b-md">
              {series?.volume ? (
                <span className="text-[10px] font-semibold text-white/80 tracking-wide">Tome {series.volume}</span>
              ) : <span />}
              {ageGroup && (
                <span className="text-[10px] font-semibold text-white/60">{ageGroup} ans</span>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* Infos */}
      <div className="p-5 flex flex-col flex-grow justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <span className="font-semibold text-indigo-600">{author || 'Théo Arven'}</span>
            {pageCount > 0 && <><span>·</span><span>{pageCount} pages</span></>}
          </div>
          <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-700 transition-colors line-clamp-1 mb-2">
            {title}
          </h3>
          <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xl font-extrabold text-indigo-900">{eur(price)}</span>
              <span className="text-xs text-gray-400 ml-1.5 font-medium">/ tome</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
              Disponible
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Link href={`/books/${id}`}
              className="bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-2.5 px-4 rounded-xl text-center text-sm border border-gray-200 hover:border-gray-300 transition-colors">
              Aperçu
            </Link>
            <Link href={`/books/${id}`}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-center text-sm shadow-sm shadow-indigo-200 hover:shadow-md transition-all">
              Acheter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Book;
