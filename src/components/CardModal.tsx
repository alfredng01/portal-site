import { useEffect, useState, type FormEvent } from 'react';
import { Button, Modal, TextInput, Textarea, type TextInputProps } from '@mantine/core';
import type { Card, CardInput } from '../types';
import { normalizeUrl } from '../url';

interface CardModalProps {
  opened: boolean;
  /** When set, the modal edits this card; otherwise it creates a new one. */
  card?: Card;
  onClose: () => void;
  onSubmit: (input: CardInput) => Promise<void>;
  onDelete: () => Promise<void>;
}

type Errors = Partial<Record<'title' | 'url', string>>;

const MAX_TITLE = 100;
const MAX_DESCRIPTION = 300;

const modalClasses = {
  root: 'modal',
  overlay: 'modal-overlay',
  inner: 'modal-inner',
  content: 'modal-content',
  header: 'modal-header',
  title: 'modal-title',
  close: 'modal-close',
  body: 'modal-body',
};

const fieldProps: Pick<TextInputProps, 'inputWrapperOrder'> = {
  inputWrapperOrder: ['label', 'input', 'description', 'error'],
};

const fieldClasses = {
  root: 'field',
  label: 'field-label',
  required: 'field-required',
  input: 'field-input',
  error: 'field-error',
  description: 'field-hint',
};

export function CardModal({ opened, card, onClose, onSubmit, onDelete }: CardModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Reset the form each time the modal opens.
  useEffect(() => {
    if (!opened) return;
    setTitle(card?.title ?? '');
    setDescription(card?.description ?? '');
    setUrl(card?.url ?? '');
    setErrors({});
    setSubmitError(null);
    setBusy(false);
    setConfirmingDelete(false);
  }, [opened, card]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setSubmitError(null);
    try {
      await action();
    } catch (err) {
      setSubmitError((err as Error).message);
      setBusy(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Errors = {};
    const normalizedUrl = normalizeUrl(url);
    if (!title.trim()) nextErrors.title = 'Title is required';
    if (!url.trim()) nextErrors.url = 'URL is required';
    else if (!normalizedUrl) nextErrors.url = 'Enter a valid http(s) URL';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !normalizedUrl) return;

    void run(() =>
      onSubmit({ title: title.trim(), description: description.trim(), url: normalizedUrl }),
    );
  };

  const handleDelete = () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    void run(onDelete);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={card ? 'Edit card' : 'New card'}
      classNames={modalClasses}
      closeButtonProps={{ 'aria-label': 'Close' }}
    >
      <form onSubmit={handleSubmit} noValidate className="form">
        <TextInput
          classNames={fieldClasses}
          {...fieldProps}
          label="Title"
          placeholder="Plex"
          required
          data-autofocus
          maxLength={MAX_TITLE}
          value={title}
          error={errors.title}
          onChange={(e) => setTitle(e.currentTarget.value)}
        />
        <Textarea
          classNames={fieldClasses}
          {...fieldProps}
          label="Description"
          placeholder="Movies & TV (optional)"
          rows={2}
          maxLength={MAX_DESCRIPTION}
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
        />
        <TextInput
          classNames={fieldClasses}
          {...fieldProps}
          label="URL"
          placeholder="http://192.168.1.10:32400"
          description="http:// or https:// is added automatically if left out."
          required
          type="url"
          inputMode="url"
          autoComplete="off"
          value={url}
          error={errors.url}
          onChange={(e) => setUrl(e.currentTarget.value)}
        />

        {submitError && (
          <p className="form-error" role="alert">
            {submitError}
          </p>
        )}

        <div className="form-actions">
          {card && (
            <Button
              classNames={{ root: `btn btn-danger${confirmingDelete ? ' is-confirming' : ''}` }}
              onClick={handleDelete}
              disabled={busy}
            >
              {confirmingDelete ? 'Click again to delete' : 'Delete'}
            </Button>
          )}
          <span className="spacer" />
          <Button classNames={{ root: 'btn btn-ghost' }} onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button classNames={{ root: 'btn btn-primary' }} type="submit" disabled={busy}>
            {card ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
