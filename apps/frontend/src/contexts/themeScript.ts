/**
 * Kept separate from ThemeContext (a client module) so the server root layout can
 * embed this script as a plain string.
 */
export const THEME_STORAGE_KEY = 'fg:theme';

/**
 * Runs in <head> before first paint. It applies the saved or system theme to <html>,
 * so dark-mode users never see a light flash and React hydrates against the
 * correct class. Failures (blocked storage) fall back to the system preference.
 */
export const themeInitScript = `(function(){try{var p=null;try{p=localStorage.getItem('${THEME_STORAGE_KEY}')}catch(e){}var d=p==='dark'||((p!=='light')&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})();`;
