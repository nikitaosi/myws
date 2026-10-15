import {profile} from './profile';

export type PageType = 'WebPage' | 'ProfilePage' | 'AboutPage' | 'CollectionPage' | 'ContactPage';

export const socialImage = {
  path: '/images/social-card.png',
  width: 1200,
  height: 630,
  alt: 'Nikita Osipov — Frontend Engineer. React, TypeScript and Next.js. nikitaosi.dev.',
};

export function canonicalUrl(pathname: string, site: URL) {
  return new URL(pathname.replace(/\/+$/, '') + '/', site).href;
}

export function pageSchema({site, canonical, title, description, pageType, photo, mainEntity}: {
  site: URL;
  canonical: string;
  title: string;
  description: string;
  pageType: PageType;
  photo: string;
  mainEntity?: Record<string, unknown>;
}) {
  const personId = new URL('/#person', site).href;
  const websiteId = new URL('/#website', site).href;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': personId,
        name: profile.name,
        jobTitle: profile.jobTitle,
        description: profile.description,
        url: site.href,
        image: photo,
        knowsAbout: profile.skills,
        sameAs: profile.sameAs,
        mainEntityOfPage: {'@id': new URL('/#webpage', site).href},
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: site.href,
        name: `${profile.name} — ${profile.jobTitle}`,
        inLanguage: 'en',
        publisher: {'@id': personId},
      },
      {
        '@type': pageType,
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: title,
        description,
        inLanguage: 'en',
        isPartOf: {'@id': websiteId},
        about: {'@id': personId},
        author: {'@id': personId},
        ...(mainEntity ? {mainEntity} : pageType === 'ProfilePage' ? {mainEntity: {'@id': personId}} : {}),
      },
    ],
  };
}
