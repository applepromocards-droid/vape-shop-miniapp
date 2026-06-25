import type { Category } from "../types";

export function CategoryCard({ category, onClick }: { category: Category; onClick: () => void }) {
  return (
    <button className="cat-card" onClick={onClick}>
      {category.image && (
        <img src={category.image} alt="" className="cat-card__img" />
      )}
      <div className="cat-card__gradient" />
      <div className="cat-card__body">
        <span className="cat-card__emoji">{category.emoji}</span>
        <div className="cat-card__title">{category.title}</div>
        {category.subtitle && <div className="cat-card__sub">{category.subtitle}</div>}
      </div>
    </button>
  );
}
