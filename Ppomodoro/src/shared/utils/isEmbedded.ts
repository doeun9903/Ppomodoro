const isEmbedded = (() => {
  try { return window.self !== window.top; }
  catch { return true; }
})();

export default isEmbedded;
