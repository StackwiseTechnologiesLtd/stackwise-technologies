import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { listPaymentLinks } from "@/lib/db/payment-links";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatMoney } from "@/lib/currency";

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const links = await listPaymentLinks();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Payment links</h1>
          <p className="text-sm text-muted">Signed in as {session.email}</p>
        </div>
        <Link
          href="/admin/payment-links/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover"
        >
          New payment link
        </Link>
      </div>

      {links.length === 0 ? (
        <div className="rounded-xl border border-line bg-panel p-12 text-center">
          <p className="text-muted">No payment links yet.</p>
          <Link
            href="/admin/payment-links/new"
            className="mt-4 inline-block text-accent hover:underline"
          >
            Create your first link
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-panel text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr
                  key={link.id}
                  className="border-t border-line transition hover:bg-panel/50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/payment-links/${link.id}`}
                      className="font-mono text-accent hover:underline"
                    >
                      {link.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p>{link.customerName}</p>
                    <p className="text-xs text-muted">{link.customerEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>${link.amountUsd.toFixed(2)}</p>
                    <p className="text-xs text-muted">
                      {formatMoney(link.amountLocal, link.currency)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={link.status} />
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(link.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
