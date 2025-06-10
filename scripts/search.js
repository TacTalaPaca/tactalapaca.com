class GlobalSearch {
  constructor() {
    this.elements = {
      input: document.getElementById('globalSearch'),
      suggestions: document.getElementById('searchSuggestions'),
      results: document.getElementById('searchResults'),
    };
    this.searchIndex = [];
    if (this.elements.input) {
      this.buildSearchIndex();
      this.bindEvents();
    }
  }

  buildSearchIndex(retries = 0) {
    const navItems = document.querySelectorAll('.nav-item a');
    if (!navItems.length && retries < 20) return setTimeout(() => this.buildSearchIndex(retries + 1), 200);

    this.searchIndex = Array.from(navItems)
      .filter((item) => !['theme', 'language'].includes(item.id) && item.href && item.textContent?.trim() && !item.classList.contains('nav-pin-toggle-btn'))
      .map((item) => {
        const isSubpage = item.classList.contains('nav-submenu-page');
        const parent = isSubpage ? item.closest('.nav-item')?.querySelector('.nav-page')?.textContent?.trim().replace(/\s+/g, ' ').replace(/\*$/, '') : null;
        return {
          title: item.textContent
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/\*$/, '')
            .replace(/\s*\(open\)$/, ''),
          path: item.href,
          type: isSubpage ? 'subpage' : 'page',
          parent,
        };
      })
      .filter((item) => item.title && item.title !== '????????');
  }

  bindEvents() {
    this.elements.input.addEventListener('input', (e) => this.handleSearch(e.target.value.trim()));
    this.elements.input.addEventListener('focus', () => this.handleSearch(this.elements.input.value.trim()));
    document.addEventListener('click', (e) => !e.target.closest('.search-container') && this.hideAll());
    document.addEventListener('keydown', (e) => e.key === 'Escape' && (this.hideAll(), this.elements.input.blur()));
  }

  handleSearch(query) {
    !query ? this.hideAll() : query.length >= 2 ? this.showResults(query) : this.showSuggestions(query);
  }

  showSuggestions(query) {
    this.renderItems(this.searchIndex.filter((item) => item.title.toLowerCase().includes(query.toLowerCase())).slice(0, 5), query, 'suggestions');
  }

  showResults(query) {
    const queryLower = query.toLowerCase();
    this.renderItems(
      this.searchIndex
        .filter((item) => item.title.toLowerCase().includes(queryLower))
        .sort((a, b) => {
          const aExact = a.title.toLowerCase() === queryLower;
          const bExact = b.title.toLowerCase() === queryLower;
          return aExact !== bExact ? (aExact ? -1 : 1) : a.type !== b.type ? (a.type === 'page' ? -1 : 1) : 0;
        }),
      query,
      'results'
    );
  }

  renderItems(items, query, type) {
    this.elements[type].innerHTML = !items.length ? '<div class="search-no-results">No results found</div>' : items.map((item) => `<div class="search-item" onclick="location.href='${item.path}'"><div class="search-item-content"><div class="search-item-title">${this.highlightText(item.title, query)}</div></div><div class="search-item-path">${item.type}${item.parent ? ` > ${item.parent}` : ''}</div></div>`).join('');
    this.elements[type].classList.add('visible');
    this.elements[type === 'results' ? 'suggestions' : 'results'].classList.remove('visible');
  }

  highlightText(text, query) {
    return query ? text.replace(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<span class="search-highlight">$1</span>') : text;
  }

  hideAll() {
    this.elements.suggestions.classList.remove('visible');
    this.elements.results.classList.remove('visible');
  }
}

document.addEventListener('DOMContentLoaded', () => (window.globalSearch = new GlobalSearch()));
