export function sanitizeChatInput(input: string): string {
  let text = input.trim();
  if (text.length > 2000) {
    text = text.substring(0, 2000);
  }
  
  // Strip any HTML tags
  text = text.replace(/<[^>]*>?/gm, '');
  
  // Collapse multiple spaces into one
  text = text.replace(/\s+/g, ' ');
  
  return text.trim().length < 2 ? '' : text.trim();
}

export function stripPII(input: string): { cleaned: string; strippedFields: string[] } {
  let cleaned = input;
  if (cleaned.length > 2000) {
    cleaned = cleaned.substring(0, 2000);
  }

  const uniqueStripped = new Set<string>();

  // 1. Phone numbers
  const phoneRegex = /(?:\+?91[\-\s]?)?[789]\d{9}|\+?[\d\-\s]{10,}/g; 
  if (phoneRegex.test(cleaned)) {
    cleaned = cleaned.replace(phoneRegex, '[phone removed]');
    uniqueStripped.add('phone');
  }

  // 2. Email addresses
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  if (emailRegex.test(cleaned)) {
    cleaned = cleaned.replace(emailRegex, '[email removed]');
    uniqueStripped.add('email');
  }

  // 3. Full name patterns
  const nameRegex = /(i am|i'm|my name is|call me)\s+([A-Z][a-z]+(?:[ \-][A-Z][a-z]+)+)/ig;
  if(nameRegex.test(cleaned)) {
    cleaned = cleaned.replace(nameRegex, '$1 [name removed]');
    uniqueStripped.add('name');
  }

  // 4. Specific dates
  const dateRegex1 = /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?\b/ig;
  const dateRegex2 = /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\b/ig;
  const dateRegex3 = /\b\d{2}\/\d{2}\/\d{4}\b/g;
  const dateRegex4 = /\b\d{4}-\d{2}-\d{2}\b/g;
  const dateRegex5 = /\bon the \d{1,2}(?:st|nd|rd|th)?\b/ig;

  let strippedDate = false;
  if(dateRegex1.test(cleaned)) { cleaned = cleaned.replace(dateRegex1, 'recently'); strippedDate = true; }
  if(dateRegex2.test(cleaned)) { cleaned = cleaned.replace(dateRegex2, 'recently'); strippedDate = true; }
  if(dateRegex3.test(cleaned)) { cleaned = cleaned.replace(dateRegex3, 'recently'); strippedDate = true; }
  if(dateRegex4.test(cleaned)) { cleaned = cleaned.replace(dateRegex4, 'recently'); strippedDate = true; }
  if(dateRegex5.test(cleaned)) { cleaned = cleaned.replace(dateRegex5, 'on a recent date'); strippedDate = true; }
  
  if (strippedDate) uniqueStripped.add('date');

  // 5. City and location mentions
  const locationRegex = /\b(in|from|at|near)\s+([A-Z][a-zA-Z]+(?:[ \-][A-Z][a-zA-Z]+)*)\b/g;
  if (locationRegex.test(cleaned)) {
    cleaned = cleaned.replace(locationRegex, '$1 [location removed]');
    uniqueStripped.add('location');
  }

  // 6. Aadhaar-like numbers
  const aadhaarRegex = /\b\d{4}\s?\d{4}\s?\d{4}\b/g;
  if(aadhaarRegex.test(cleaned)) {
    cleaned = cleaned.replace(aadhaarRegex, '[ID removed]');
    uniqueStripped.add('id_number');
  }

  // 7. URLs
  const urlRegex = /https?:\/\/[^\s]+/g;
  if (urlRegex.test(cleaned)) {
    cleaned = cleaned.replace(urlRegex, '[link removed]');
    uniqueStripped.add('url');
  }

  return { cleaned, strippedFields: Array.from(uniqueStripped) };
}
