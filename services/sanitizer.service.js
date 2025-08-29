
const sanitizeHtml = require('sanitize-html');

function tryCreateRegex(pattern, flags = 'u') {

  try {

    return new RegExp(pattern, flags);

  } catch (err) {

    console.error('Invalid regex:', pattern, 'Flags:', flags, err);

    return null;

  }

}

const sanitizeOptions = {
  allowedTags: [
    'b', 'i', 'em', 'strong', 'u', 'ul', 'ol', 'li',
    'p', 'br', 'span', 'blockquote', 'code', 'pre',
    'img', 'a', 'h1', 'h2', 'h3'
  ],
  allowedAttributes: {
    '*': ['style'],
    'a': ['href', 'name', 'target', 'rel'],
    'img': ['src', 'alt', 'width', 'height']
  },
  allowedSchemes: ['http', 'https', 'data'],
  allowedSchemesByTag: {
    img: ['http', 'https', 'data'],
    a: ['http', 'https', 'mailto']
  },
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', {
      rel: 'noopener noreferrer',
      target: '_blank'
    })
  }
};

function sanitizeBodyFull(body) {

  const cleaned = sanitizeHtml(body || '', sanitizeOptions);

  const plainText = cleaned.replace(/<[^>]*>/g, '');

  return cleaned;

}

function validateHashtags(tags) {

  if (
    !Array.isArray(tags.ThreadHashtags) ||
    tags.ThreadHashtags.length > 10 ||
    !tags.ThreadHashtags.every(tag =>
      typeof tag === 'string' &&
      tag.length <= 30 &&
      /^#[a-zA-Z0-9]{1,29}$/.test(tag)
    )
  ) {

    throw new Error('Each hashtag must start with # and contain only letters and numbers (max 30 chars total).');

  }

}

function validateCategory(category) {

  if (typeof category !== 'string' || category.length > 50 || !/^[a-zA-Z0-9_-]+$/.test(category)) {

    throw new Error('ThreadCategory must be a non-empty string under 50 chars using letters, numbers, _ or -.');

  }

}

function validateImageFilename(filename) {

  if (!filename) return;

  const isValid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg)$/i.test(filename);

  if (!isValid) {

    throw new Error('ThreadImage must be a UUID with .webp or .jpg extension.');

  }

}

function insertSpacesBetweenLowerUpper(text) {

  return text.replace(/([a-z])([A-Z])/g, '$1 $2');

}

// Export all functions
module.exports = {
  tryCreateRegex,
  sanitizeBodyFull,
  validateHashtags,
  validateCategory,
  validateImageFilename,
  insertSpacesBetweenLowerUpper
};