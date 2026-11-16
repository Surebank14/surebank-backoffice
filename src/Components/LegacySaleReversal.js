import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { url } from '../redux/sagas/url';
export default function LegacySaleReversal({ accountNumber }) {
  const [sales, setSales] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [reason, setReason] = useState('');
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  useEffect(() => {
    if (selectedSale) dialogRef.current?.showModal();
    else if (dialogRef.current?.open) dialogRef.current.close();
  }, [selectedSale]);
  const close = () => {
    if (busy) return;
    setSelectedSale(null);
    setReason('');
    setError('');
    triggerRef.current?.focus();
  };
  const config = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } });
  const load = async () => {
    setError(''); setBusy(true);
    try { setSales((await axios.get(`${url}/api/sbaccount/legacy/${encodeURIComponent(accountNumber)}/sales`, config())).data); }
    catch (e) { setError(e.response?.data?.message || 'Could not load sales'); }
    finally { setBusy(false); }
  };
  const reverse = async (event) => {
    event.preventDefault();
    if (busy || !selectedSale || !reason.trim()) return;
    const sale = selectedSale;
    setBusy(true); setError('');
    try {
      await axios.post(`${url}/api/sbaccount/legacy/sales/${sale._id}/reverse`, { reason: reason.trim() }, config());
      window.location.reload();
    } catch (e) { setError(e.response?.data?.message || 'Reversal failed'); setBusy(false); }
  };
  return <div className="my-2 rounded border p-2 text-xs text-slate-900 bg-white">
    <button type="button" disabled={busy} onClick={load} className="rounded bg-orange-700 px-3 py-2 text-white">{busy ? 'Processing…' : 'Review / Reverse Legacy Sales'}</button>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {sales?.length === 0 && <p>No unreversed sales found.</p>}
    {sales?.map(sale => <div key={sale._id} className="mt-2 border-t pt-2">
      <p>{sale.narration} · ₦{Number(sale.amount).toLocaleString()} · {new Date(sale.createdAt).toLocaleString()}</p>
      <button type="button" disabled={busy} onClick={(event) => { triggerRef.current = event.currentTarget; setError(''); setReason(''); setSelectedSale(sale); }} className="text-red-700 underline">Reverse sale</button>
    </div>)}
    {createPortal(
      <dialog ref={dialogRef} aria-labelledby="legacy-reversal-title" onCancel={(event) => { event.preventDefault(); close(); }}
        className="w-full max-w-md rounded-2xl bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-black/60">
        <form onSubmit={reverse} className="p-5">
          <h2 id="legacy-reversal-title" className="text-lg font-bold">Reverse legacy sale</h2>
          <p className="mt-2 text-sm">{selectedSale?.narration} · ₦{Number(selectedSale?.amount || 0).toLocaleString()}</p>
          <p className="mt-2 text-sm text-slate-600">This restores the sale amount and reverses its profit. Any transferred excess will be recovered from Free To Withdraw.</p>
          <label className="mt-4 block text-sm font-semibold">Reason for reversal
            <textarea autoFocus required value={reason} onChange={(event) => setReason(event.target.value)} disabled={busy}
              placeholder="Explain why this sale is being reversed" rows={4}
              className="mt-2 w-full rounded-lg border border-slate-300 p-3 font-normal focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </label>
          {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={close} disabled={busy} className="rounded-lg border px-4 py-2 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={busy || !reason.trim()} className="rounded-lg bg-red-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{busy ? 'Reversing…' : 'Confirm reversal'}</button>
          </div>
        </form>
      </dialog>, document.body)}
  </div>;
}
