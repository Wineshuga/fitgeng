import { Link } from 'react-router';
import { brand } from '@/config/brand';
import { buttonClasses } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/Icon';

const sports = ['Lawn tennis', 'Football', 'Basketball', 'Table tennis', 'Padel', 'Swimming', 'Badminton'];

const audiences: { title: string; body: string; icon: IconName }[] = [
  {
    title: 'For players',
    body: 'Find groups near you, join sessions, track your schedule and payments, all in one place.',
    icon: 'compass',
  },
  {
    title: 'For coaches',
    body: 'Run your academy: rosters, recurring schedules, attendance and membership fees without the spreadsheets.',
    icon: 'calendar',
  },
  {
    title: 'For organisers',
    body: 'Build teams, publish events, manage registrations and keep your community in the loop.',
    icon: 'trophy',
  },
];

export function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 right-[-10rem] size-[32rem] rounded-full bg-brand-500/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 left-[-10rem] size-[28rem] rounded-full bg-accent-500/15 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-20 sm:pt-24">
          <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 dark:bg-brand-950 dark:text-brand-300 dark:ring-brand-800">
            Now live in Lagos
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-balance sm:text-6xl">
            {brand.tagline}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            {brand.name} connects players, coaches and organisers. Discover sports communities, join training groups
            and manage everything from schedules to membership fees.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/register" className={buttonClasses('primary', 'lg')}>
              Join {brand.name}
            </Link>
            <Link to="/discover" className={buttonClasses('secondary', 'lg')}>
              Explore groups
            </Link>
          </div>
          <ul className="mt-12 flex flex-wrap gap-2" aria-label="Supported sports">
            {sports.map((s) => (
              <li
                key={s}
                className="rounded-full bg-white px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
              >
                {s}
              </li>
            ))}
            <li className="rounded-full px-4 py-2 text-sm text-slate-500">and more</li>
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="grid gap-4 md:grid-cols-3">
          {audiences.map((a) => (
            <article
              key={a.title}
              className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
            >
              <span className="grid size-11 place-items-center rounded-2xl bg-brand-600 text-white">
                <Icon name={a.icon} />
              </span>
              <h2 className="mt-4 text-lg font-bold">{a.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{a.body}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
