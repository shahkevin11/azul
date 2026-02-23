// js/ui/ToastNotifications.js — Toast notifications

export class ToastNotifications {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      this.container.setAttribute('aria-live', 'polite');
      this.container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(this.container);
    }
  }

  show(message, type = 'info', duration = 2800) {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;

    this.container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, duration);
  }

  info(message) { this.show(message, 'info'); }
  error(message) { this.show(message, 'error'); }
  success(message) { this.show(message, 'success'); }
  turn(playerName) { this.show(`${playerName}'s turn`, 'info', 2000); }
}
