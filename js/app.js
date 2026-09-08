(function () {
  'use strict';

  const STORAGE_KEYS = {
    THEME: 'meme_theme',
    FAVORITES: 'meme_favorites'
  };

  const state = {
    allMemes: [],
    filteredMemes: [],
    collections: [],
    categories: [],
    currentCategory: 'all',
    currentSort: 'newest',
    searchQuery: '',
    activeTag: null,
    activeCollection: null,
    favorites: new Set(),
    dataLoaded: false
  };

  const debounce = (fn, delay = 300) => {
    let timer = null;
    return function (...args) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  };

  function resolveDataPath() {
    const baseHref = document.querySelector('base')?.href || '';
    const loc = window.location;
    const pathName = loc.pathname.substring(0, loc.pathname.lastIndexOf('/') + 1);
    const protocol = loc.protocol;

    if (protocol === 'file:') {
      return 'data/data.json';
    }

    const viteDev = typeof __vite_plugin_react_preamble_installed__ !== 'undefined'
      || (loc.port && parseInt(loc.port) >= 5173 && parseInt(loc.port) <= 5180);
    if (viteDev) {
      return baseHref + 'data/data.json';
    }

    if (baseHref) {
      return baseHref.replace(/\/$/, '') + '/data/data.json';
    }

    if (pathName.includes('/dist/')) {
      return pathName.replace(/\/dist\/.*$/, '/dist/data/data.json');
    }

    if (pathName === '/' || pathName === '') {
      return 'data/data.json';
    }

    const parts = pathName.split('/').filter(Boolean);
    if (parts.length >= 2 && parts[parts.length - 1] !== 'data') {
      return parts.join('/') + '/data/data.json';
    }

    return 'data/data.json';
  }

  function initTheme() {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    let theme;
    if (saved === 'light' || saved === 'dark') {
      theme = saved;
    } else {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    applyTheme(theme);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(STORAGE_KEYS.THEME)) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.setAttribute('aria-label', theme === 'dark' ? '切换为亮色主题' : '切换为暗色主题');
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEYS.THEME, next);
    applyTheme(next);
    showToast(next === 'dark' ? '🌙 已切换暗色主题' : '☀️ 已切换亮色主题', 'info');
  }

  function loadFavorites() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (saved) {
        const arr = JSON.parse(saved);
        state.favorites = new Set(Array.isArray(arr) ? arr : []);
      }
    } catch (e) {
      state.favorites = new Set();
    }
    updateFavBadges();
  }

  function saveFavorites() {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(Array.from(state.favorites)));
    updateFavBadges();
  }

  function updateFavBadges() {
    const count = state.favorites.size;
    const navCount = document.getElementById('favNavCount');
    const tabBadge = document.getElementById('favTabBadge');
    if (navCount) navCount.textContent = count;
    if (tabBadge) tabBadge.textContent = count;
  }

  function toggleFavorite(memeId, event) {
    if (event) {
      event.stopPropagation();
    }
    const id = Number(memeId);
    if (state.favorites.has(id)) {
      state.favorites.delete(id);
      showToast('💔 已取消收藏', 'info');
    } else {
      state.favorites.add(id);
      showToast('❤️ 收藏成功！', 'success');
    }
    saveFavorites();
    renderMemes();
    if (state.currentCategory === 'favorites') {
      applyFilters();
    }
  }

  async function loadData() {
    showState('loading');
    try {
      const path = resolveDataPath();
      const res = await fetch(path, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      state.allMemes = data.memes || [];
      state.collections = data.collections || [];
      state.categories = data.categories || [];
      state.dataLoaded = true;
      renderCollections();
      renderTagCloud();
      applyFilters();
    } catch (err) {
      console.error('Failed to load data:', err);
      showState('error', err.message);
    }
  }

  function showState(type, msg) {
    const loading = document.getElementById('loadingState');
    const empty = document.getElementById('emptyState');
    const error = document.getElementById('errorState');
    const grid = document.getElementById('memeGrid');
    if (!loading) return;

    loading.style.display = 'none';
    empty.style.display = 'none';
    error.style.display = 'none';
    grid.style.display = 'grid';

    if (type === 'loading') {
      loading.style.display = 'flex';
      grid.style.display = 'none';
    } else if (type === 'empty') {
      empty.style.display = 'flex';
      grid.style.display = 'none';
    } else if (type === 'error') {
      error.style.display = 'flex';
      if (msg) document.getElementById('errorMsg').textContent = msg;
      grid.style.display = 'none';
    }
  }

  function applyFilters() {
    let result = [...state.allMemes];

    if (state.currentCategory === 'favorites') {
      result = result.filter(m => state.favorites.has(m.id));
    } else if (state.currentCategory !== 'all') {
      result = result.filter(m => m.category === state.currentCategory);
    }

    if (state.activeCollection) {
      const col = state.collections.find(c => c.name === state.activeCollection);
      if (col && col.memeIds) {
        result = result.filter(m => col.memeIds.includes(m.id));
      }
    }

    if (state.activeTag) {
      const tag = state.activeTag.toLowerCase();
      result = result.filter(m => m.tags && m.tags.some(t => t.toLowerCase().includes(tag)));
    }

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase().trim();
      result = result.filter(m => {
        const name = (m.name || '').toLowerCase();
        const author = (m.author || '').toLowerCase();
        const tags = (m.tags || []).join(' ').toLowerCase();
        return name.includes(q) || author.includes(q) || tags.includes(q);
      });
    }

    result = sortMemes(result, state.currentSort);
    state.filteredMemes = result;
    renderMemes();
    document.getElementById('resultCount').textContent = result.length;
  }

  function sortMemes(memes, sort) {
    const copy = [...memes];
    switch (sort) {
      case 'hottest':
        return copy.sort((a, b) => (b.likes + b.views * 0.1) - (a.likes + a.views * 0.1));
      case 'downloads':
        return copy.sort((a, b) => b.downloads - a.downloads);
      case 'newest':
      default:
        return copy.sort((a, b) => {
          const da = new Date(a.uploadTime || 0).getTime();
          const db = new Date(b.uploadTime || 0).getTime();
          if (db !== da) return db - da;
          return b.id - a.id;
        });
    }
  }

  function formatNumber(n) {
    if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  }

  function formatSizeKB(kb) {
    if (kb >= 1024) return (kb / 1024).toFixed(2) + ' MB';
    return kb + ' KB';
  }

  function renderMemes() {
    const grid = document.getElementById('memeGrid');
    if (!grid) return;

    const list = state.filteredMemes;
    if (!state.dataLoaded) return;

    if (list.length === 0) {
      showState('empty');
      grid.innerHTML = '';
      return;
    }

    showState(null);
    grid.innerHTML = list.map(m => renderMemeCard(m)).join('');

    grid.querySelectorAll('[data-action="favorite"]').forEach(btn => {
      btn.addEventListener('click', e => toggleFavorite(btn.dataset.id, e));
    });
    grid.querySelectorAll('[data-action="copy"]').forEach(btn => {
      btn.addEventListener('click', e => copyImageUrl(btn.dataset.id, e));
    });
    grid.querySelectorAll('[data-action="download"]').forEach(btn => {
      btn.addEventListener('click', e => downloadMeme(btn.dataset.id, e));
    });
    grid.querySelectorAll('.meme-card').forEach(card => {
      card.addEventListener('click', () => openDetailModal(Number(card.dataset.id)));
    });
    grid.querySelectorAll('.tag-chip').forEach(chip => {
      chip.addEventListener('click', e => {
        e.stopPropagation();
        setActiveTag(chip.dataset.tag);
      });
    });
  }

  function renderMemeCard(m) {
    const isFav = state.favorites.has(m.id);
    const badges = [];
    if (m.isHot) badges.push('<span class="meme-badge badge-hot">🔥 热门</span>');
    if (m.isNew) badges.push('<span class="meme-badge badge-new">✨ 最新</span>');
    badges.push(`<span class="meme-badge badge-format" style="right:10px;left:auto;">${m.format}</span>`);

    const tagsHtml = (m.tags || []).slice(0, 3).map(t =>
      `<span class="tag-chip" data-tag="${escapeHtml(t)}">#${escapeHtml(t)}</span>`
    ).join('');

    return `
      <article class="meme-card" data-id="${m.id}">
        <div class="meme-badges">${badges.join('')}</div>
        <div class="meme-image-wrap">
          <img src="${m.thumbnailUrl}" alt="${escapeHtml(m.name)}" loading="lazy"
               onerror="this.src='https://picsum.photos/seed/meme-fallback-${m.id}/400/400'">
          <div class="meme-overlay">
            <button class="overlay-btn ${isFav ? 'liked' : ''}"
                    data-action="favorite" data-id="${m.id}"
                    title="${isFav ? '取消收藏' : '收藏'}">
              ${isFav ? '❤️' : '🤍'}
            </button>
            <button class="overlay-btn" data-action="copy" data-id="${m.id}" title="复制图片链接">
              💬
            </button>
            <button class="overlay-btn" data-action="download" data-id="${m.id}" title="下载">
              ⬇️
            </button>
          </div>
        </div>
        <div class="meme-info">
          <h3 class="meme-name">${escapeHtml(m.name)}</h3>
          <div class="meme-meta">
            <span class="meme-size">📐 ${m.width}×${m.height}</span>
            <span class="meme-size">💾 ${formatSizeKB(m.sizeKB)}</span>
          </div>
          <div class="meme-stats">
            <span class="stat-item likes">❤️ ${formatNumber(m.likes)}</span>
            <span class="stat-item downloads">⬇️ ${formatNumber(m.downloads)}</span>
          </div>
          ${tagsHtml ? `<div class="meme-tags">${tagsHtml}</div>` : ''}
        </div>
      </article>
    `;
  }

  function renderCollections() {
    const wrap = document.getElementById('collectionsScroll');
    if (!wrap) return;

    wrap.innerHTML = state.collections.map(col => {
      const ids = col.memeIds || [];
      const previewIds = ids.slice(0, 4);
      const previews = previewIds.map(id => {
        const m = state.allMemes.find(x => x.id === id);
        const url = m ? m.thumbnailUrl : `https://picsum.photos/seed/col-${col.name}-${id}/200/200`;
        return `<img src="${url}" alt="${escapeHtml(col.name)}" loading="lazy"
                 onerror="this.src='https://picsum.photos/seed/col-fallback-${id}/200/200'">`;
      }).join('');

      return `
        <div class="collection-card" data-collection="${escapeHtml(col.name)}">
          <div class="collection-preview">${previews}</div>
          <div class="collection-info">
            <div class="collection-name">📚 ${escapeHtml(col.name)}</div>
            <div class="collection-count">共 <span>${ids.length}</span> 个表情包</div>
          </div>
        </div>
      `;
    }).join('');

    wrap.querySelectorAll('.collection-card').forEach(card => {
      card.addEventListener('click', () => {
        const name = card.dataset.collection;
        setActiveCollection(name);
      });
    });
  }

  function renderTagCloud() {
    const wrap = document.getElementById('tagCloud');
    if (!wrap) return;

    const tagCount = new Map();
    state.allMemes.forEach(m => {
      (m.tags || []).forEach(t => {
        tagCount.set(t, (tagCount.get(t) || 0) + 1);
      });
    });

    const tags = Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);

    if (tags.length === 0) return;

    const maxCount = tags[0][1];
    const minCount = tags[tags.length - 1][1];

    const getSize = (count) => {
      const ratio = maxCount === minCount ? 0.5 : (count - minCount) / (maxCount - minCount);
      if (ratio < 0.2) return 1;
      if (ratio < 0.4) return 2;
      if (ratio < 0.6) return 3;
      if (ratio < 0.8) return 4;
      return 5;
    };

    wrap.innerHTML = tags.map(([tag, count], i) => {
      const size = getSize(count);
      const color = (i % 10) + 1;
      const active = state.activeTag === tag ? 'active' : '';
      return `
        <span class="tag-item tag-size-${size} color-${color} ${active}"
              data-tag="${escapeHtml(tag)}" title="共 ${count} 个表情">
          #${escapeHtml(tag)}
        </span>
      `;
    }).join('');

    wrap.querySelectorAll('.tag-item').forEach(item => {
      item.addEventListener('click', () => setActiveTag(item.dataset.tag));
    });
  }

  function setActiveCategory(cat) {
    state.currentCategory = cat;
    state.activeCollection = null;
    document.querySelectorAll('#categoryTabs .tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === cat);
    });
    if (cat !== 'all') {
      state.activeTag = null;
      renderTagCloud();
    }
    applyFilters();
  }

  function setActiveSort(sort) {
    state.currentSort = sort;
    document.querySelectorAll('.sort-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.sort === sort);
    });
    applyFilters();
  }

  function setActiveTag(tag) {
    if (state.activeTag === tag) {
      state.activeTag = null;
    } else {
      state.activeTag = tag;
    }
    renderTagCloud();
    applyFilters();
    if (state.activeTag) {
      showToast(`🏷️ 已筛选标签：${tag}`, 'info');
    }
  }

  function setActiveCollection(name) {
    state.activeCollection = state.activeCollection === name ? null : name;
    if (state.activeCollection) {
      document.querySelectorAll('#categoryTabs .tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === 'all');
      });
      state.currentCategory = 'all';
      state.activeTag = null;
      renderTagCloud();
      showToast(`📚 已进入合集：${name}`, 'info');
    }
    applyFilters();
    document.getElementById('home').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function copyImageUrl(memeId, event) {
    if (event) event.stopPropagation();
    const m = state.allMemes.find(x => x.id === Number(memeId));
    if (!m) return;
    const url = m.imageUrl;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      showToast('✅ 图片链接已复制！', 'success');
    } catch (e) {
      showToast('❌ 复制失败，请手动复制：' + url, 'error');
    }
  }

  function downloadMeme(memeId, event) {
    if (event) event.stopPropagation();
    const m = state.allMemes.find(x => x.id === Number(memeId));
    if (!m) return;
    showToast(`⬇️ 准备下载：${m.name} (模拟)`, 'info');
    const a = document.createElement('a');
    a.href = m.imageUrl;
    a.download = `meme-${m.id}.${m.format.toLowerCase()}`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function openDetailModal(memeId) {
    const m = state.allMemes.find(x => x.id === memeId);
    if (!m) return;
    const modal = document.getElementById('detailModal');
    const body = document.getElementById('modalBody');
    const isFav = state.favorites.has(m.id);

    const authorInitial = (m.author || 'U').charAt(0).toUpperCase();
    const colHtml = (m.collections && m.collections.length > 0) ? m.collections.map(c =>
      `<span class="collection-chip" data-col="${escapeHtml(c)}">📚 ${escapeHtml(c)}</span>`
    ).join('') : '<span style="color:var(--color-text-muted);font-size:13px;">暂无所属合集</span>';

    const tagsHtml = (m.tags || []).map(t =>
      `<span class="tag-chip" data-tag="${escapeHtml(t)}" style="font-size:12px;padding:5px 12px;">#${escapeHtml(t)}</span>`
    ).join('') || '<span style="color:var(--color-text-muted);font-size:13px;">暂无标签</span>';

    body.innerHTML = `
      <div class="modal-image-section">
        <img src="${m.imageUrl}" alt="${escapeHtml(m.name)}"
             onerror="this.src='https://picsum.photos/seed/meme-detail-${m.id}/800/800'">
      </div>
      <div class="modal-detail-section">
        <h2 class="detail-title">${escapeHtml(m.name)}</h2>
        <div class="detail-author-row">
          <div class="detail-author">
            <div class="detail-avatar">${authorInitial}</div>
            <div>
              <div style="font-weight:700;">${escapeHtml(m.author)}</div>
              <div style="font-size:11px;color:var(--color-text-muted);">上传于 ${m.uploadTime}</div>
            </div>
          </div>
          <span class="format-badge">${m.format}</span>
        </div>

        <div class="detail-info-grid">
          <div class="info-item">
            <span class="info-label">图片尺寸</span>
            <span class="info-value">📐 ${m.width} × ${m.height} px</span>
          </div>
          <div class="info-item">
            <span class="info-label">文件大小</span>
            <span class="info-value">💾 ${formatSizeKB(m.sizeKB)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">图片格式</span>
            <span class="info-value">🖼️ ${m.format}</span>
          </div>
          <div class="info-item">
            <span class="info-label">来源</span>
            <span class="info-value">🌐 picsum.photos</span>
          </div>
        </div>

        <div class="detail-stats">
          <div class="detail-stat">
            <div class="detail-stat-num likes">${formatNumber(m.likes)}</div>
            <div class="detail-stat-label">❤️ 收藏数</div>
          </div>
          <div class="detail-stat">
            <div class="detail-stat-num downloads">${formatNumber(m.downloads)}</div>
            <div class="detail-stat-label">⬇️ 下载数</div>
          </div>
          <div class="detail-stat">
            <div class="detail-stat-num views">${formatNumber(m.views)}</div>
            <div class="detail-stat-label">👀 浏览量</div>
          </div>
        </div>

        <div>
          <div class="detail-tag-title">🏷️ 标签</div>
          <div class="detail-tags" style="margin-top:8px;">${tagsHtml}</div>
        </div>

        <div>
          <div class="detail-tag-title">📚 所属合集</div>
          <div class="detail-collections" style="margin-top:8px;">${colHtml}</div>
        </div>

        <div class="detail-actions">
          <button class="action-btn primary" id="modalDownload">
            ⬇️ <span>下载</span>
          </button>
          <button class="action-btn secondary" id="modalCopy">
            💬 <span>复制链接</span>
          </button>
          <button class="action-btn secondary ${isFav ? 'liked' : ''}" id="modalFav">
            ${isFav ? '❤️' : '🤍'} <span>${isFav ? '已收藏' : '收藏'}</span>
          </button>
        </div>
      </div>
    `;

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    document.getElementById('modalDownload').addEventListener('click', () => downloadMeme(m.id));
    document.getElementById('modalCopy').addEventListener('click', () => copyImageUrl(m.id));
    document.getElementById('modalFav').addEventListener('click', () => {
      toggleFavorite(m.id);
      openDetailModal(m.id);
    });

    body.querySelectorAll('.tag-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        closeModal();
        setActiveTag(chip.dataset.tag);
      });
    });
    body.querySelectorAll('.collection-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        closeModal();
        setActiveCollection(chip.dataset.col);
      });
    });
  }

  function closeModal() {
    const modal = document.getElementById('detailModal');
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  let toastTimer = null;
  function showToast(msg, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  function initScrollEffects() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    const onScroll = () => {
      if (window.scrollY > 400) btn.classList.add('visible');
      else btn.classList.remove('visible');
    };
    window.addEventListener('scroll', debounce(onScroll, 100), { passive: true });
    onScroll();

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function initEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    if (searchInput) {
      const debouncedSearch = debounce((e) => {
        state.searchQuery = e.target.value;
        searchClear.style.display = e.target.value ? 'flex' : 'none';
        applyFilters();
      }, 300);
      searchInput.addEventListener('input', debouncedSearch);
    }
    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        state.searchQuery = '';
        searchClear.style.display = 'none';
        applyFilters();
        searchInput.focus();
      });
    }

    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    document.querySelectorAll('#categoryTabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => setActiveCategory(btn.dataset.category));
    });

    document.querySelectorAll('.sort-btn').forEach(btn => {
      btn.addEventListener('click', () => setActiveSort(btn.dataset.sort));
    });

    document.getElementById('btnRetry').addEventListener('click', loadData);

    document.querySelectorAll('[data-close]').forEach(el => {
      el.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadFavorites();
    initEventListeners();
    initScrollEffects();
    loadData();
  });

  window.MemeApp = {
    toggleFavorite,
    copyImageUrl,
    downloadMeme,
    state
  };
})();
