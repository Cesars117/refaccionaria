import { getDashboardStats, getInvoices } from "@/app/actions";
import { FinancePageClient } from "@/app/components/FinancePageClient";

export const dynamic = 'force-dynamic'

export default async function FinancePage() {
    const stats = await getDashboardStats();
    const invoices = await getInvoices();

    return (
        <FinancePageClient 
            stats={stats} 
            invoices={invoices}
        />
    );
}
