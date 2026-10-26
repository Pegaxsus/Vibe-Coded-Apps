(() => {
  'use strict';
  const messages = {
    es: { toolTitle: 'Metadata Cleaner', languageGroup: 'Idioma', themeGroup: 'Tema', lightTheme: 'Tema claro', darkTheme: 'Tema oscuro', eyebrow: 'BASE REUTILIZABLE', moduleTitle: 'Tu próxima herramienta empieza aquí.', moduleDescription: 'Un espacio preparado para añadir tus controles, contenido y resultados.' },
    en: { toolTitle: 'Metadata Cleaner', languageGroup: 'Language', themeGroup: 'Theme', lightTheme: 'Light theme', darkTheme: 'Dark theme', eyebrow: 'REUSABLE TEMPLATE', moduleTitle: 'Your next tool starts here.', moduleDescription: 'A space ready for your controls, content and results.' }
  };
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const save = (key, value) => { try { localStorage.setItem(key, value); } catch { /* Storage is optional when embedded. */ } };
  let language = 'es';
  function setLanguage(value) {
    language = value === 'en' ? 'en' : 'es';
    document.documentElement.lang = language;
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const text = messages[language][element.dataset.i18n];
      if (text !== undefined) element.textContent = text;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(element => {
      const text = messages[language][element.dataset.i18nAria];
      if (text !== undefined) { element.setAttribute('aria-label', text); if (element.tagName === 'BUTTON') element.title = text; }
    });
    document.querySelectorAll('[data-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
    document.title = messages[language].toolTitle;
    save('tools-template-language', language);
    document.dispatchEvent(new CustomEvent('tool:languagechange', { detail: { language } }));
  }
  function setTheme(value) {
    const theme = value === 'dark' ? 'dark' : 'light';
    document.body.dataset.theme = theme;
    document.querySelectorAll('[data-theme-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme)));
    save('tools-template-theme', theme);
    document.dispatchEvent(new CustomEvent('tool:themechange', { detail: { theme } }));
  }
  document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.language)));
  document.querySelectorAll('[data-theme-choice]').forEach(button => button.addEventListener('click', () => setTheme(button.dataset.themeChoice)));
  window.ToolShell = { messages, setLanguage, setTheme, get language() { return language; }, get theme() { return document.body.dataset.theme; } };
  setTheme(read('tools-template-theme'));
  setLanguage(read('tools-template-language'));
})();
