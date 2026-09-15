import React from 'react';
import {
  escapeHtml,
  sanitizeUrl,
  sanitizeColor,
  sanitizeCssValue,
  escapeJsonForHtml,
} from '../utils/sanitizer.js';

export {
  escapeHtml,
  sanitizeUrl,
  sanitizeColor,
  sanitizeCssValue,
  escapeJsonForHtml,
};

/**
 * Parses markdown bold (**text**) and italic (*text*) into React elements for live Canvas rendering
 */
export function renderFormattedText(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-inherit">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} className="italic text-inherit">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

/**
 * Converts text newlines and markdown bold/italic into safe HTML for email output
 */
export function formatTextContent(text) {
  if (!text) return '';
  let formatted = escapeHtml(text);
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  return formatted.replace(/\n/g, '<br/>');
}
