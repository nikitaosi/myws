// Deterministic, code-native artwork. No external image service or user data.
import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
import {profile} from '../src/lib/profile.ts';

const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#212737"/>
  <rect x="0" y="0" width="14" height="630" fill="#ff6b01"/>
  <circle cx="1100" cy="50" r="230" fill="#293348"/>
  <circle cx="1100" cy="50" r="160" fill="none" stroke="#40506a" stroke-width="2"/>
  <g font-family="Arial, sans-serif">
    <text x="88" y="138" font-size="30" fill="#ff9a54">${escape(profile.jobTitle)}</text>
    <text x="82" y="252" font-size="82" font-weight="700" fill="#eaedf3">${escape(profile.name)}</text>
    <text x="88" y="330" font-size="34" fill="#ccd4e1">React · TypeScript · Next.js</text>
    <path d="M88 404H1112" stroke="#40506a" stroke-width="2"/>
    <text x="88" y="476" font-size="28" fill="#ccd4e1">Experience, projects and source code</text>
    <text x="88" y="552" font-size="30" font-weight="700" fill="#eaedf3">nikitaosi.dev</text>
  </g>
</svg>`;

const directory = new URL('../public/images/', import.meta.url);
await mkdir(directory, {recursive: true});
await sharp(Buffer.from(svg)).png().toFile(new URL('social-card.png', directory).pathname);
console.log('Generated public/images/social-card.png (1200 × 630)');
