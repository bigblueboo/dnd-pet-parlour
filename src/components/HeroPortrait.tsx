import React, { useState } from 'react';
import { getHeroArtPath } from '../art';
import { HEROES } from '../data';

type Props = {
  heroId: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
};

export default function HeroPortrait({
  heroId,
  alt,
  className = '',
  imageClassName = '',
  fallbackClassName = '',
}: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const hero = HEROES.find((candidate) => candidate.id === heroId);

  return (
    <div
      className={`relative overflow-hidden rounded-[1.75rem] border border-stone-800 bg-[radial-gradient(circle_at_top,#1f2937_0%,#0c0a09_75%)] ${className}`}
    >
      {!imageFailed ? (
        <img
          src={getHeroArtPath(heroId)}
          alt={alt}
          className={`h-full w-full object-contain ${imageClassName}`}
          onError={() => setImageFailed(true)}
        />
      ) : null}
      {imageFailed ? (
        <div className={`flex h-full w-full items-center justify-center text-5xl ${fallbackClassName}`}>
          {hero?.icon ?? '🛡️'}
        </div>
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(12,10,9,0.04),rgba(12,10,9,0.42))]" />
    </div>
  );
}
