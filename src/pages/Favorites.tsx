export function Favorites() {
  return (
    <div>
      <div className="cart-page__title">Избранное</div>
      <div className="empty">
        <span className="empty__icon">♡</span>
        <div className="empty__title">Ничего не сохранено</div>
        <p>Нажмите ♡ на товаре, чтобы добавить в избранное</p>
      </div>
    </div>
  );
}
