import type {APIRoute} from 'astro';
import {profile} from '../lib/profile';

export const prerender = true;

export const GET: APIRoute = ({site}) => {
  const url = (path: string) => new URL(path, site).href;
  const text = `# ${profile.name}

> ${profile.description}

Location: ${profile.location}
Work format: ${profile.workFormat}
Availability: ${profile.availability}
Skills: ${profile.skills.join(', ')}.

## Portfolio and CV

- [Profile](${url('/')}): Professional summary, skills, availability and contact links.
- [Work experience](${url('/experience/')}): Roles, dates and project contributions. Use this page for detailed employment history.
- [Projects](${url('/projects/')}): Project descriptions, technology stacks and public source repositories.
- [CV (PDF)](${url('/CV_Nikita_Osipov.pdf')}): Downloadable resume. The live profile page contains current availability and location, which may be newer than the PDF.

## Professional profiles

- [GitHub](${profile.sameAs[0]}): Public source code.
- [LinkedIn](${profile.sameAs[1]}): Professional profile.
`;
  return new Response(text, {headers: {'Content-Type': 'text/plain; charset=utf-8'}});
};
