export function Header({ title }: { title: string }) {
  return (
    <header className="header">
      <div className="header__brand">ELFBAR WIEN</div>
      <h1 className="header__title">{title}</h1>
    </header>
  );
}
