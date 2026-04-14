export default function DashboardHeader({title}) {
  return (
    <header className="mb-6 animate-fade-in-up">
      <h1 className="font-display text-4xl font-bold text-slate-900 sm:text-[2.5rem]">
          {title}
      </h1>
    </header>
  );
}
