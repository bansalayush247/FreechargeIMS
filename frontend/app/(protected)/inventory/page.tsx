export default function InventoryPage() {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur-lg sm:p-8">
      <p className="text-sm uppercase tracking-[0.24em] text-orange-200/70">Protected route</p>
      <h1 className="mt-3 text-3xl font-semibold text-white">Inventory</h1>
      <p className="mt-2 max-w-2xl text-orange-50/80">
        Inventory totals and product detail cards will appear here once the API view is connected.
      </p>
    </section>
  );
}
