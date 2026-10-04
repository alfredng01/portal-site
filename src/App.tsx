import { useEffect, useState } from 'react';
import { Button } from '@mantine/core';
import { api } from './api';
import { CardModal } from './components/CardModal';
import { PortalCard } from './components/PortalCard';
import type { Card, CardInput } from './types';

const buttonClasses = { root: 'btn btn-primary' };

export function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  // Kept after closing so the modal's contents don't change mid close-animation.
  const [editingCard, setEditingCard] = useState<Card | undefined>();

  useEffect(() => {
    api
      .listCards()
      .then(setCards)
      .catch((err: Error) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const openModal = (card?: Card) => {
    setEditingCard(card);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const handleSubmit = async (input: CardInput) => {
    if (editingCard) {
      const updated = await api.updateCard(editingCard.id, input);
      setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } else {
      const created = await api.createCard(input);
      setCards((prev) => [...prev, created]);
    }
    closeModal();
  };

  const handleDelete = async () => {
    if (!editingCard) return;
    const { id } = editingCard;
    await api.deleteCard(id);
    setCards((prev) => prev.filter((c) => c.id !== id));
    closeModal();
  };

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <img src="/favicon.svg" alt="" className="brand-logo" />
          <h1>Home Portal</h1>
        </div>
        <Button classNames={buttonClasses} onClick={() => openModal()}>
          + New card
        </Button>
      </header>

      <main>
        {loading ? (
          <p className="status">Loading…</p>
        ) : loadError ? (
          <p className="status status-error">Couldn't load cards: {loadError}</p>
        ) : cards.length === 0 ? (
          <div className="empty">
            <h2>No cards yet</h2>
            <p>Add your first link to get started.</p>
            <Button classNames={buttonClasses} onClick={() => openModal()}>
              Create a card
            </Button>
          </div>
        ) : (
          <ul className="grid">
            {cards.map((card) => (
              <li key={card.id}>
                <PortalCard card={card} onEdit={() => openModal(card)} />
              </li>
            ))}
          </ul>
        )}
      </main>

      <CardModal
        opened={modalOpen}
        card={editingCard}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}
