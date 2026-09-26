import { handle, body, required } from '@/lib/api';
import { updateDb, uid, logActivity } from '@/lib/db';

// Creates the signed-in company's profile, or updates it.
export const POST = handle(async (request) => {
  const b = await body(request);
  required(b, ['name', 'city', 'industry']);
  const fields = {
    name: b.name.trim(),
    city: b.city.trim(),
    industry: b.industry.trim(),
    size: b.size || '1–50',
    website: (b.website || '').trim(),
    about: (b.about || '').trim(),
    color: b.color || '#4F46E5',
    hr: {
      name: (b.hrName || '').trim() || 'Hiring Team',
      role: (b.hrRole || '').trim() || 'Talent Acquisition',
      email: (b.hrEmail || '').trim() || `careers@${(b.website || 'company.example').replace(/^https?:\/\//, '').split('/')[0]}`,
      slots: ['Mon 5:00 PM', 'Wed 11:00 AM', 'Fri 3:30 PM'],
    },
  };
  return updateDb((db) => {
    let company = db.companies.find((c) => c.id === db.activeCompanyId);
    if (company) {
      Object.assign(company, fields);
    } else {
      company = { id: uid('co'), ...fields, createdAt: new Date().toISOString() };
      db.companies.push(company);
      db.activeCompanyId = company.id;
      logActivity(db, `${company.name} joined ProofArena`, 'company');
    }
    return company;
  });
});
