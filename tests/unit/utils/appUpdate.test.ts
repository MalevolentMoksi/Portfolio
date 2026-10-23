import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

type AppUpdate = typeof import('@/utils/appUpdate');

// Fresh module per test: it keeps "update ready" and "watcher started" in module state.
let reload: ReturnType<typeof vi.fn<() => void>>;
const loadModule = async (): Promise<AppUpdate> => {
  vi.resetModules();
  const mod = await import('@/utils/appUpdate');
  vi.spyOn(mod.page, 'reload').mockImplementation(reload);
  return mod;
};

const mockDeployedBuild = (buildId: string) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ buildId }), { status: 200 })
  );

const clickLink = (href: string): MouseEvent => {
  const link = document.createElement('a');
  link.href = href;
  document.body.appendChild(link);
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
  link.dispatchEvent(event);
  link.remove();
  return event;
};

describe('appUpdate', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState(null, '', '/');
    reload = vi.fn<() => void>();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    delete document.documentElement.dataset.musicPlaying;
  });

  it('detects a newer deployed build', async () => {
    const mod = await loadModule();
    mockDeployedBuild(`${mod.BUILD_ID}-next`);
    await expect(mod.checkForUpdate()).resolves.toBe(true);
    expect(mod.isUpdateReady()).toBe(true);
  });

  it('reports no update when the deployed build is the running one', async () => {
    const mod = await loadModule();
    mockDeployedBuild(mod.BUILD_ID);
    await expect(mod.checkForUpdate()).resolves.toBe(false);
  });

  it('treats a failed check as "no update"', async () => {
    const mod = await loadModule();
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('offline'));
    await expect(mod.checkForUpdate()).resolves.toBe(false);
  });

  it('reloads at most once per build after a stale chunk', async () => {
    const mod = await loadModule();
    expect(mod.reloadForStaleBuild()).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
    // Same build after the reload: reloading again could only loop.
    expect(mod.reloadForStaleBuild()).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('allows a new reload once a different build is running', async () => {
    sessionStorage.setItem('chunk-reload-v1', 'some-older-build');
    const mod = await loadModule();
    expect(mod.reloadForStaleBuild()).toBe(true);
  });

  it('never reloads while offline', async () => {
    const mod = await loadModule();
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    expect(mod.reloadForStaleBuild()).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  describe('pending update', () => {
    const startWithUpdate = async (): Promise<AppUpdate> => {
      vi.stubEnv('DEV', false);
      const mod = await loadModule();
      mockDeployedBuild(`${mod.BUILD_ID}-next`);
      await mod.checkForUpdate();
      mod.startAppUpdateWatcher();
      return mod;
    };

    it('turns the next internal link click into a full load of the destination', async () => {
      await startWithUpdate();
      const event = clickLink('/projets');
      expect(event.defaultPrevented).toBe(true);
      expect(window.location.pathname).toBe('/projets');
      expect(reload).toHaveBeenCalledTimes(1);
    });

    it('leaves external links, same-page links and modified clicks alone', async () => {
      await startWithUpdate();
      expect(clickLink('https://example.com/elsewhere').defaultPrevented).toBe(false);
      expect(clickLink('/#contact').defaultPrevented).toBe(false);

      const link = document.createElement('a');
      link.href = '/projets';
      document.body.appendChild(link);
      const ctrlClick = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
      link.dispatchEvent(ctrlClick);
      link.remove();
      expect(ctrlClick.defaultPrevented).toBe(false);
      expect(reload).not.toHaveBeenCalled();
    });

    it('never interrupts the music', async () => {
      await startWithUpdate();
      document.documentElement.dataset.musicPlaying = 'true';
      expect(clickLink('/projets').defaultPrevented).toBe(false);
      expect(reload).not.toHaveBeenCalled();
    });
  });
});
