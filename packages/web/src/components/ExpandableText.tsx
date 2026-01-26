import { useState } from 'react';
import { Modal } from './Modal';

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  title?: string;
  className?: string;
}

/**
 * Text that truncates and can be expanded in a modal.
 */
export function ExpandableText({
  text,
  maxLength = 100,
  title = 'Details',
  className = '',
}: ExpandableTextProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!text) return <span className="text-gray-400">—</span>;

  const needsTruncation = text.length > maxLength;
  const displayText = needsTruncation ? text.slice(0, maxLength) + '...' : text;

  return (
    <>
      <span className={className}>
        {displayText}
        {needsTruncation && (
          <button
            onClick={() => setIsOpen(true)}
            className="ml-1 text-mc-primary-600 hover:text-mc-primary-800 text-xs"
          >
            [more]
          </button>
        )}
      </span>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={title}>
        <p className="whitespace-pre-wrap text-gray-700">{text}</p>
      </Modal>
    </>
  );
}
