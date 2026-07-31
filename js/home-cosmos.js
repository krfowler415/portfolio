/**
 * =====================================================================
 * HOME COSMOS MODULE
 * Kevin Fowler Portfolio
 * =====================================================================
 *
 * Owns the dark/cosmos homepage behavior:
 * - intro UFO overlay
 * - starfield canvas
 * - terrain loading/parallax
 * - UFO scroll path
 *
 * This file is intentionally namespaced as window.KFCosmos so it can
 * load before main.js without creating duplicate global declarations.
 * =====================================================================
 */

window.KFCosmos = (() => {
  function init() {
    /*
     * Intentionally empty for now.
     * We will move the cosmos-specific functions here in the next step.
     */
  }

  function refresh() {
    /*
     * Future home for resize/orientation refresh behavior.
     */
  }

  return {
    init,
    refresh,
  };
})();
