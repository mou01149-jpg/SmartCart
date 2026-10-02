import { useState, useMemo } from 'react';
import ProductCard from './ProductCard.jsx';
import { products, CATEGORIES } from '../data/products.js';
import './ProductsSection.css';

export default function ProductsSection({ onAddToCart, wishlist, onToggleWishlist, onTryOn }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default');

  const filtered = useMemo(() => {
    let list = [...products];

    // Category filter
    if (activeCategory !== 'All') {
      list = list.filter(p => p.category === activeCategory);
    }

    // Search filter
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === 'price-asc')  list.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') list.sort((a, b) => b.price - a.price);
    if (sortBy === 'rating')     list.sort((a, b) => b.rating - a.rating);

    return list;
  }, [search, activeCategory, sortBy]);

  return (
    <section className="products-section section" id="products" aria-label="Products">
      <div className="container">
        {/* Section header */}
        <div className="products-header">
          <div>
            <h2 className="section-title">Our Products</h2>
            <p className="section-subtitle">
              {filtered.length} product{filtered.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {/* Sort */}
          <div className="sort-wrapper">
            <label htmlFor="sort-select" className="sort-label">Sort by:</label>
            <select
              id="sort-select"
              className="sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              aria-label="Sort products"
            >
              <option value="default">Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="search-filter-bar" role="search">
          {/* Search */}
          <div className="search-wrapper">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="search"
              id="product-search"
              className="search-input"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search products"
              aria-controls="products-grid"
            />
            {search && (
              <button
                className="search-clear"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* Category filters */}
          <div className="category-filters" role="group" aria-label="Filter by category">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`category-btn${activeCategory === cat ? ' active' : ''}`}
                onClick={() => setActiveCategory(cat)}
                aria-pressed={activeCategory === cat}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product grid */}
        {filtered.length > 0 ? (
          <div
            className="products-grid"
            id="products-grid"
            role="list"
            aria-label={`${filtered.length} products`}
            aria-live="polite"
          >
            {filtered.map(product => (
              <div key={product.id} role="listitem">
                <ProductCard
                  product={product}
                  onAddToCart={onAddToCart}
                  wishlist={wishlist}
                  onToggleWishlist={onToggleWishlist}
                  onTryOn={onTryOn}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="no-products" role="status" aria-live="polite">
            <div className="no-products-icon" aria-hidden="true">🔍</div>
            <h3>No products found</h3>
            <p>Try adjusting your search or filter criteria.</p>
            <button
              className="btn btn-outline"
              onClick={() => { setSearch(''); setActiveCategory('All'); }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
