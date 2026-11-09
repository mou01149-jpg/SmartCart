import { useState, useMemo } from 'react';
import ProductCard from './ProductCard.jsx';
import { CATEGORIES } from '../data/products.js';
import './ProductsSection.css';

export default function ProductsSection({
  products: dynamicProducts = [],
  onAddToCart,
  wishlist,
  onToggleWishlist,
  onTryOn,
  onBargain,
  isLoading = false,
  error = '',
  onRefresh,
}) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default');

  const catalog = dynamicProducts;
  const categories = useMemo(() => [
    ...new Set([
      ...CATEGORIES,
      ...catalog.map(product => product.category).filter(Boolean),
    ]),
  ], [catalog]);

  const filtered = useMemo(() => {
    let list = [...catalog];

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
  }, [search, activeCategory, sortBy, catalog]);

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

          <div className="sort-wrapper">
            {onRefresh && (
              <button
                className="btn btn-outline btn-sm"
                onClick={onRefresh}
                disabled={isLoading}
              >
                {isLoading ? 'Refreshing...' : 'Refresh products'}
              </button>
            )}
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
            {categories.map(cat => (
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

        {error && catalog.length > 0 && (
          <div className="products-error" role="alert">
            <p>{error} Showing the original SmartCart catalog for now.</p>
            {onRefresh && (
              <button className="btn btn-outline btn-sm" onClick={onRefresh}>
                Retry
              </button>
            )}
          </div>
        )}

        {/* Product grid */}
        {isLoading ? (
          <div className="no-products" role="status" aria-live="polite">
            <span className="products-spinner" aria-hidden="true" />
            <p>Loading products...</p>
          </div>
        ) : error && catalog.length === 0 ? (
          <div className="no-products" role="alert">
            <h3>Products could not be loaded</h3>
            <p>{error}</p>
            {onRefresh && (
              <button className="btn btn-outline" onClick={onRefresh}>
                Try again
              </button>
            )}
          </div>
        ) : catalog.length === 0 ? (
          <div className="no-products" role="status">
            <h3>No products available</h3>
            <p>The product catalog is currently empty.</p>
          </div>
        ) : filtered.length > 0 ? (
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
                  onBargain={onBargain}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="no-products" role="status" aria-live="polite">
            <div className="no-products-icon" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
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
