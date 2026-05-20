/**
 * UI Helper Functions for Scrum Poker
 */

const UI = (() => {
  // --- Screen Management ---
  function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) {
      screen.classList.add('active');
      // Re-trigger animation
      screen.style.animation = 'none';
      screen.offsetHeight; // force reflow
      screen.style.animation = '';
    }
  }

  // --- Toast Notifications ---
  let toastTimeout = null;
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    // Clear any existing toast
    if (toastTimeout) clearTimeout(toastTimeout);
    container.innerHTML = '';
    
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    toastTimeout = setTimeout(() => {
      toast.classList.add('toast--exit');
      setTimeout(() => {
        if (container.contains(toast)) {
          container.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  // --- Player Chip Rendering ---
  function renderPlayerChip(player, hostId) {
    const isHost = player.id === hostId;
    const classes = ['player-chip'];
    if (player.hasVoted) classes.push('player-chip--voted');
    if (isHost) classes.push('player-chip--host');

    const initials = player.name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return `
      <div class="${classes.join(' ')}">
        <div class="player-avatar">${initials}</div>
        <span class="player-name">${escapeHtml(player.name)}</span>
        ${isHost ? '<span class="player-host-badge">Host</span>' : ''}
        <div class="player-vote-indicator"></div>
      </div>
    `;
  }

  // --- Card Rendering ---
  function renderCard(value, isSelected) {
    return `
      <div class="card ${isSelected ? 'selected' : ''}" data-value="${escapeHtml(value)}">
        <div class="card__inner">
          <div class="card__face card__face--front">
            <span class="card__value">${escapeHtml(value)}</span>
          </div>
        </div>
      </div>
    `;
  }

  // --- Scale Selector Rendering ---
  function renderScaleOption(key, scale, isSelected) {
    return `
      <div class="scale-option ${isSelected ? 'selected' : ''}" data-scale="${key}">
        <div class="scale-option__radio"></div>
        <div class="scale-option__info">
          <div class="scale-option__name">${escapeHtml(scale.name)}</div>
          <div class="scale-option__values">${escapeHtml(scale.description)}</div>
        </div>
      </div>
    `;
  }

  // --- Vote Result Row ---
  function renderVoteResultRow(player, index) {
    const initials = player.name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const voteDisplay = player.vote !== null && player.vote !== undefined
      ? `<span class="vote-result-row__vote">${escapeHtml(String(player.vote))}</span>`
      : `<span class="vote-result-row__no-vote">No vote</span>`;

    return `
      <div class="vote-result-row" style="animation-delay: ${index * 0.08}s">
        <div class="vote-result-row__player">
          <div class="player-avatar">${initials}</div>
          <span class="vote-result-row__name">${escapeHtml(player.name)}</span>
        </div>
        ${voteDisplay}
      </div>
    `;
  }

  // --- Stats Rendering ---
  function renderStats(stats) {
    if (!stats) return '';
    
    if (stats.type === 'numeric') {
      return `
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-card__value">${stats.average}</div>
            <div class="stat-card__label">Average</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__value">${stats.min}</div>
            <div class="stat-card__label">Low</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__value">${stats.max}</div>
            <div class="stat-card__label">High</div>
          </div>
        </div>
        <div class="agreement-bar">
          <div class="agreement-bar__label">
            <span class="agreement-bar__text">Agreement</span>
            <span class="agreement-bar__value">${stats.agreement}%</span>
          </div>
          <div class="agreement-bar__track">
            <div class="agreement-bar__fill" style="width: ${stats.agreement}%"></div>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="stats-grid" style="grid-template-columns: 1fr 1fr;">
          <div class="stat-card">
            <div class="stat-card__value">${escapeHtml(stats.mostCommon)}</div>
            <div class="stat-card__label">Most Common</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__value">${stats.agreement}%</div>
            <div class="stat-card__label">Agreement</div>
          </div>
        </div>
      `;
    }
  }

  // --- Waiting Indicator ---
  function renderWaitingIndicator(text) {
    return `
      <div class="waiting-indicator">
        <span>${escapeHtml(text)}</span>
        <div class="waiting-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
  }

  // --- Utility: HTML escape ---
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // --- Utility: Copy to clipboard ---
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard!', 'success');
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('Copied to clipboard!', 'success');
    }
  }

  return {
    showScreen,
    showToast,
    renderPlayerChip,
    renderCard,
    renderScaleOption,
    renderVoteResultRow,
    renderStats,
    renderWaitingIndicator,
    escapeHtml,
    copyToClipboard
  };
})();
