import type { CSSProperties } from 'react';
import { ActionIcon } from '@mantine/core';
import type { Card } from '../types';
import { displayUrl } from '../url';

interface PortalCardProps {
  card: Card;
  onEdit: () => void;
}

/** Stable hue per title so each card's badge keeps its color. */
function hueFor(text: string): number {
  let hash = 0;
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return Math.abs(hash) % 360;
}

export function PortalCard({ card, onEdit }: PortalCardProps) {
  return (
    <div className="card">
      <a className="card-link" href={card.url} target="_blank" rel="noopener noreferrer">
        <span className="card-badge" style={{ '--hue': hueFor(card.title) } as CSSProperties}>
          {card.title.charAt(0).toUpperCase()}
        </span>
        <span className="card-body">
          <span className="card-title">{card.title}</span>
          {card.description && <span className="card-description">{card.description}</span>}
          <span className="card-url">{displayUrl(card.url)}</span>
        </span>
      </a>
      <ActionIcon
        classNames={{ root: 'card-edit' }}
        aria-label={`Edit ${card.title}`}
        title="Edit"
        onClick={onEdit}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 20h4L18.5 9.5a2.83 2.83 0 0 0-4-4L4 16v4zM13.5 6.5l4 4"
          />
        </svg>
      </ActionIcon>
    </div>
  );
}
