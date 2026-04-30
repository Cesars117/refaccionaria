export const dynamic = 'force-dynamic';
import { getCategories, getLocations } from '@/app/actions';

import NuevaParteForm from './NuevaParteForm';

export default async function NuevaPartePage() {
  const [categories, locations] = await Promise.all([getCategories(), getLocations()]);
  return (
    <NuevaParteForm 
      categories={JSON.parse(JSON.stringify(categories))} 
      locations={JSON.parse(JSON.stringify(locations))} 
    />
  );
}
