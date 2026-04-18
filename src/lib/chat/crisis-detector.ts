export interface CrisisResource {
  name: string
  number: string
  description: string
  available: string
}

export interface CrisisResult {
  detected: boolean
  severity: 'low' | 'medium' | 'high' | null
  resources: CrisisResource[]
}

const RESOURCES: CrisisResource[] = [
  { name: 'iCall (TISS)', number: '9152987821', description: 'Free, confidential counselling in multiple languages', available: 'Mon–Sat 8am–10pm' },
  { name: 'Vandrevala Foundation', number: '1860-2662-345', description: '24/7 free mental health support', available: '24 hours, 7 days' },
  { name: 'NIMHANS', number: '080-46110007', description: 'National Institute of Mental Health helpline', available: '24/7' },
  { name: 'iCall WhatsApp', number: 'Available via website icallhelpline.org', description: 'Online chat support', available: 'Always' }
];

export function detectCrisis(message: string): CrisisResult {
  const lower = message.toLowerCase();

  const highPatterns = ["want to die", "kill myself", "end my life", "suicide", "suicidal", "no reason to live", "can't go on", "better off dead", "don't want to be here anymore"];
  const mediumPatterns = ["want to hurt myself", "self harm", "cutting myself", "hurting myself", "can't cope", "falling apart", "breaking down", "completely alone", "nobody cares", "hate myself"];
  const lowPatterns = ["feel hopeless", "no hope", "life is pointless", "what's the point", "don't care anymore"];

  if (highPatterns.some(p => lower.includes(p))) {
    return { detected: true, severity: 'high', resources: RESOURCES };
  }
  if (mediumPatterns.some(p => lower.includes(p))) {
    return { detected: true, severity: 'medium', resources: RESOURCES };
  }
  if (lowPatterns.some(p => lower.includes(p))) {
    return { detected: true, severity: 'low', resources: RESOURCES };
  }

  return { detected: false, severity: null, resources: [] };
}
