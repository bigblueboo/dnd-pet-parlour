import React, { useState } from 'react';
import { getMonsterArtPath } from '../art';
import { SPECIES } from '../data';

type Props = {
  speciesId: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
};

export default function MonsterPortrait({
  speciesId,
  alt,
  className = '',
  imageClassName = '',
  fallbackClassName = '',
}: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const species = SPECIES[speciesId];

  return (
    <div
      className={`relative overflow-hidden rounded-[1.75rem] border border-stone-800 bg-[radial-gradient(circle_at_top,#292524_0%,#0c0a09_70%)] ${className}`}
    >
      {!imageFailed ? (
        <img
          src={getMonsterArtPath(speciesId)}
          alt={alt}
          className={`h-full w-full object-contain ${imageClassName}`}
          onError={() => setImageFailed(true)}
        />
      ) : null}
      {imageFailed ? (
        <div className={`flex h-full w-full items-center justify-center text-5xl ${fallbackClassName}`}>
          {species.image}
        </div>
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(12,10,9,0.04),rgba(12,10,9,0.42))]" />
    </div>
  );
}
