// Global audio singleton — only one preview plays at a time across the whole app
export const audioPreview = {
  _audio: null as HTMLAudioElement | null,

  play(url: string): void {
    this.stop();
    if (!url) return;
    this._audio = new Audio(url);
    this._audio.volume = 0.5;
    this._audio.play().catch(() => {});
  },

  stop(): void {
    if (this._audio) {
      this._audio.pause();
      this._audio = null;
    }
  },
};
