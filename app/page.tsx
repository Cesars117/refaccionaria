import { getDashboardStats, seedInitialData, getItems } from "./actions";
import { SearchBar } from "./components/SearchBar";
import { DashboardContent } from "./components/DashboardContent";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic'

export default async function Home({ searchParams }: { searchParams: Promise<{ query?: string, view?: string }> }) {
  // Authentication disabled for now
  const session = null;


  // Auto-seed on first load solo si no es build time (simplification for this phase)
  if (process.env.NODE_ENV !== 'production') {
    await seedInitialData();
  }

  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.query || '';
  const view = resolvedSearchParams.view || '';
  
  const [{ itemCount, clientCount, projectCount, totalValue, revenue, costs, recentItems }, allItems] = await Promise.all([
    getDashboardStats(),
    query ? getItems(query) : Promise.resolve([])
  ]);

  // Determinar qué items mostrar basado en la vista y búsqueda
  let displayItems = recentItems || [];
  let sectionTitleKey = 'dashboard.recentInventory';
  
  if (query) {
    displayItems = allItems;
    sectionTitleKey = 'dashboard.searchResults';
  }

  return (
    <>
      <SearchBar />
      <DashboardContent
        itemCount={itemCount}
        clientCount={clientCount}
        projectCount={projectCount}
        totalValue={totalValue}
        revenue={revenue}
        costs={costs}
        displayItems={displayItems}
        sectionTitleKey={sectionTitleKey}
        query={query}
      />
    </>
  );

}
