import { AppNav } from '@/components/AppNav';
/* Live platform data will be connected after super-admin RLS is enabled. */
const branches: {name:string;owner:string;sales:number;status:string}[] = [];

const plans: {name:string;price:string;seats:string}[] = [];

const activity: string[] = [];

const cashFlow = { endingCash: 0, netCash: 0, marginPercent: 0 };

export default function AdminPage() {
  return (
    <>
      <AppNav />
      <main className="min-h-screen bg-[#f6f2ea] p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-charcoal/60">Super Admin</p>
              <h1 className="text-3xl md:text-4xl">Tenant & Branch Control</h1>
            </div>
            <button className="rounded-full bg-gold px-5 py-3 font-semibold text-charcoal">+ Invite Admin</button>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {[
              ['Tenant Revenue', `Rp ${cashFlow.endingCash.toLocaleString('id-ID')}`],
              ['Net Cash', `Rp ${cashFlow.netCash.toLocaleString('id-ID')}`],
              ['Margin', `${cashFlow.marginPercent.toFixed(1)}%`],
              ['Branches', '3 aktif'],
            ].map(([label, value]) => (
              <div key={label} className="panel rounded-[22px] p-5">
                <p className="text-sm text-charcoal/60">{label}</p>
                <p className="mt-3 text-2xl font-semibold">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="panel rounded-[24px] p-5">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl">Cabang aktif</h2>
                <span className="rounded-full bg-charcoal/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-charcoal/60">Live</span>
              </div>

              <div className="space-y-3">
                {branches.map((branch) => (
                  <div key={branch.name} className="flex items-center justify-between rounded-2xl bg-[#f8f3ed] p-4">
                    <div>
                      <p className="font-semibold">{branch.name}</p>
                      <p className="text-sm text-charcoal/60">Owner: {branch.owner}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">Rp {branch.sales.toLocaleString('id-ID')}</p>
                      <span className={`text-xs ${branch.status === 'Watching' ? 'text-yellow-700' : 'text-green-700'}`}>
                        {branch.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel rounded-[24px] p-5">
              <h2 className="text-2xl">Subscription</h2>
              <div className="mt-5 space-y-3">
                {plans.map((plan) => (
                  <div key={plan.name} className="rounded-2xl border border-charcoal/10 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{plan.name}</p>
                      <span className="rounded-full bg-gold/10 px-2 py-1 text-xs text-charcoal">Popular</span>
                    </div>
                    <p className="mt-2 text-xl font-semibold">{plan.price}</p>
                    <p className="text-sm text-charcoal/60">{plan.seats}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="panel rounded-[24px] p-5">
            <h2 className="text-2xl">Aktivitas sistem</h2>
            <div className="mt-5 grid gap-3">
              {activity.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl bg-[#f8f3ed] p-3">
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-gold" />
                  <p className="text-sm text-charcoal/80">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
