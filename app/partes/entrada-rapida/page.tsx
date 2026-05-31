import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canManageInventory, normalizeRole } from '@/lib/rbac';
import { getParts, getCategories, getLocations } from '@/app/actions';
import { redirect } from 'next/navigation';
import EntradaRapidaClient from './EntradaRapidaClient';

export const dynamic = 'force-dynamic';

export default async function EntradaRapidaPage() {
  const session = await getServerSession(authOptions);
  const role = normalizeRole(session?.user?.role);

  if (!canManageInventory(role)) {
    redirect('/');
  }

  // Cargar refacciones existentes, categorías y ubicaciones en paralelo
  const [parts, categories, locations] = await Promise.all([
    getParts().catch(() => []),
    getCategories().catch(() => []),
    getLocations().catch(() => []),
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <EntradaRapidaClient
        initialParts={JSON.parse(JSON.stringify(parts))}
        categories={JSON.parse(JSON.stringify(categories))}
        locations={JSON.parse(JSON.stringify(locations))}
      />
    </div>
  );
}
