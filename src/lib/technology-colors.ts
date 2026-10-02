// Logo colors; multicolor marks use one of their main colors.
export const technologyColors = {
  // https://astro.build/press/
  Astro: { background: '#F041FF' },
  // https://tailwindcss.com/brand
  'Tailwind CSS': { background: '#06B6D4' },
  // https://vercel.com/design/brands#next-js
  'Next.js': { background: '#000000' },
  // https://www.typescriptlang.org/branding/
  TypeScript: { background: '#3178C6' },
  // https://github.com/TanStack/query
  'React Query': { background: '#FF4154' },
  // https://github.com/fastify/graphics
  Fastify: { background: '#000000' },
  // https://connectrpc.com/ (dark blue in the two-tone mark)
  ConnectRPC: { background: '#161EDE' },
  // https://wiki.postgresql.org/wiki/Logo (three-color elephant)
  PostgreSQL: { background: '#336791' },
  // Monochrome OpenAI mark.
  'OpenAI API': { background: '#000000' },
  // https://vitest.dev/logo.svg
  Vitest: { background: '#22FF84' },
} as const;

export type Technology = keyof typeof technologyColors;
