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
    <div className="group bg-white rounded-2xl overflow-hidden border border-[#E0D4EE] hover:border-[#9B7CC8] transition-all duration-300 hover:shadow-xl hover:shadow-[#7C5CAA]/10 flex flex-col justify-between h-full max-w-sm">
      {/* Couverture — cliquable vers la page d'achat */}
      <Link href={`/books/${id}`} className="relative bg-gradient-to-b from-[#FAF7F5] to-[#F5EEFF] flex items-center justify-center p-6 h-72 overflow-hidden border-b border-[#E0D4EE] cursor-pointer">
        <div className="relative transition-transform duration-500 group-hover:scale-105 group-hover:rotate-1">
          <img
            className="w-40 h-56 object-cover rounded-md shadow-[8px_12px_24px_rgba(45,36,68,0.18),_1px_2px_4px_rgba(45,36,68,0.1)] border border-[#E0D4EE]"
            src={imageUrl}
            alt={title}
          />
          {/* Tranche brillance 3D */}
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-r from-white/30 to-transparent pointer-events-none rounded-l-md" />

          {/* Tome + âge discrets */}
          {(series?.volume || ageGroup) && (
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 py-1 bg-[#2D2444]/60 backdrop-blur-sm rounded-b-md">
              {series?.volume ? (
                <span className="text-[10px] font-semibold text-white/90 tracking-wide">Tome {series.volume}</span>
              ) : <span />}
              {ageGroup && (
                <span className="text-[10px] font-semibold text-purple-200/90">{ageGroup} ans</span>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* Infos */}
      <div className="p-5 flex flex-col flex-grow justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#8B7EA0] mb-1">
            <span className="font-bold text-[#7C5CAA]">{author || 'Théo Arven'}</span>
            {pageCount > 0 && <><span>·</span><span>{pageCount} pages</span></>}
          </div>
          <h3 className="font-extrabold text-lg text-[#2D2444] group-hover:text-[#7C5CAA] transition-colors line-clamp-1 mb-2">
            {title}
          </h3>
          <p className="text-[#6B5E80] text-sm line-clamp-2 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xl font-black text-[#2D2444]">{eur(price)}</span>
              <span className="text-xs text-[#8B7EA0] ml-1.5 font-medium">/ tome</span>
            </div>
            <span className="text-[10px] font-bold text-[#388860] bg-[#E8F8F0] border border-[#C0E8D0] px-2 py-1 rounded-full">
              Disponible
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Link href={`/books/${id}`}
              className="bg-[#F8F5FA] hover:bg-[#F0EBF5] text-[#5A4878] font-bold py-2.5 px-4 rounded-xl text-center text-sm border border-[#E0D4EE] transition-colors">
              Aperçu
            </Link>
            <Link href={`/books/${id}`}
              className="bg-gradient-to-r from-[#7C5CAA] to-[#9B7CC8] hover:from-[#6D4E9B] hover:to-[#8C6DBA] text-white font-bold py-2.5 px-4 rounded-xl text-center text-sm shadow-md shadow-[#7C5CAA]/25 hover:shadow-lg transition-all">
              Acheter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Book;
