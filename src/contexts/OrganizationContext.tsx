import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from '@/api/client';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  primaryColor: string | null;
}

interface OrgContextType {
  organization: Organization | null;
  slug: string;
  setSlug: (slug: string) => void;
  loading: boolean;
}

const OrganizationContext = createContext<OrgContextType | null>(null);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [slug, setSlugState] = useState(() => localStorage.getItem('org_slug') ?? '');
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('org_slug'));

  const setSlug = useCallback((newSlug: string) => {
    setSlugState(newSlug);
    if (newSlug) {
      localStorage.setItem('org_slug', newSlug);
    } else {
      localStorage.removeItem('org_slug');
    }
  }, []);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setOrganization(null);
      return;
    }
    setLoading(true);
    api
      .get<Organization>(`/organizations/public/${slug}`)
      .then((res) => setOrganization(res.data))
      .catch(() => {
        setOrganization(null);
        localStorage.removeItem('org_slug');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <OrganizationContext.Provider value={{ organization, slug, setSlug, loading }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization(): OrgContextType {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error('useOrganization must be used within OrganizationProvider');
  return ctx;
}
