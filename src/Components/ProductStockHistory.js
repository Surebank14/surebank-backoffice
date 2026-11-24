import React, { useEffect, useState } from "react";
import axios from "axios";
import { url } from "../redux/sagas/url";

export default function ProductStockHistory({ product, branches, onClose }) {
  const [branchId, setBranchId] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setResult(null);
    setError("");
    axios.get(`${url}/api/products/${product._id}/stock-history`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      params: { page, branchId: branchId || undefined },
      signal: controller.signal,
    }).then(({ data }) => setResult(data)).catch((err) => {
      if (!controller.signal.aborted) {
        setError(err.response?.data?.message || "Could not load stock history.");
      }
    });
    return () => controller.abort();
  }, [product._id, branchId, page]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <section role="dialog" aria-modal="true" aria-label="Stock history" className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-lg bg-white p-4 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Stock History</h2>
            <p className="text-sm text-gray-600">{product.name}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded border px-3 py-1">Close</button>
        </div>

        {branches && (
          <label className="mb-4 block text-sm">
            Branch
            <select
              value={branchId}
              onChange={(event) => { setBranchId(event.target.value); setPage(1); }}
              className="ml-2 rounded border px-2 py-1"
            >
              <option value="">All branches</option>
              {branches.map((branch) => <option key={branch._id} value={branch._id}>{branch.name}</option>)}
            </select>
          </label>
        )}

        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {!result && !error && <p role="status" className="text-sm">Loading stock history…</p>}
        {result && result.entries.length === 0 && <p className="text-sm">No stock changes recorded.</p>}
        {result && result.entries.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Date", "Branch", "Variation", "Previous", "New", "Change", "Staff", "Reason"].map((label) =>
                    <th key={label} scope="col" className="px-3 py-2">{label}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {result.entries.map((entry) => {
                  const change = entry.quantity - entry.previousQuantity;
                  return (
                    <tr key={entry._id} className="border-b">
                      <td className="whitespace-nowrap px-3 py-2">{new Date(entry.createdAt).toLocaleString()}</td>
                      <td className="px-3 py-2">{entry.branchName}</td>
                      <td className="px-3 py-2">{entry.variationName || "Default"}</td>
                      <td className="px-3 py-2">{entry.previousQuantity}</td>
                      <td className="px-3 py-2">{entry.quantity}</td>
                      <td className="px-3 py-2">{change > 0 ? `+${change}` : change}</td>
                      <td className="px-3 py-2">{entry.staffName || "—"}</td>
                      <td className="px-3 py-2">{entry.reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {result?.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-end gap-3 text-sm">
            <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded border px-3 py-1 disabled:opacity-50">Previous</button>
            <span>Page {page} of {result.totalPages}</span>
            <button type="button" disabled={page >= result.totalPages} onClick={() => setPage(page + 1)} className="rounded border px-3 py-1 disabled:opacity-50">Next</button>
          </div>
        )}
      </section>
    </div>
  );
}
