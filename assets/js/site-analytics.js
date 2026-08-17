(function (window, document) {
  "use strict";

  const GTM_ID = "GTM-5MMRV373";
  const OWNER_KEY = "sh_owner";
  const OWNER_PARAM = "sh_owner";

  /*
   * Register / unregister this browser as the site owner.
   *
   * ?sh_owner=1  → exclude this browser from analytics
   * ?sh_owner=0  → restore analytics for this browser
   */
  try {
    const url = new URL(window.location.href);
    const ownerMode = url.searchParams.get(OWNER_PARAM);

    if (ownerMode === "1") {
      localStorage.setItem(OWNER_KEY, "1");
    }

    if (ownerMode === "0") {
      localStorage.removeItem(OWNER_KEY);
    }

    /*
     * Remove the owner parameter immediately so it does not
     * remain in the address bar or get copied accidentally.
     */
    if (ownerMode === "1" || ownerMode === "0") {
      url.searchParams.delete(OWNER_PARAM);

      history.replaceState(
        null,
        "",
        url.pathname +
          (url.searchParams.toString()
            ? "?" + url.searchParams.toString()
            : "") +
          url.hash
      );
    }

    /*
     * Owner browser:
     * stop here before Google Tag Manager is loaded.
     */
    if (localStorage.getItem(OWNER_KEY) === "1") {
      return;
    }
  } catch (error) {
    /*
     * If storage or URL APIs fail for any reason,
     * analytics loads normally.
     */
  }

  /*
   * Avoid accidentally loading GTM twice.
   */
  if (
    document.querySelector(
      'script[src*="googletagmanager.com/gtm.js?id=' + GTM_ID + '"]'
    )
  ) {
    return;
  }

  /*
   * Google Tag Manager
   */
  window.dataLayer = window.dataLayer || [];

  window.dataLayer.push({
    "gtm.start": new Date().getTime(),
    event: "gtm.js"
  });

  const firstScript =
    document.getElementsByTagName("script")[0];

  const gtmScript =
    document.createElement("script");

  gtmScript.async = true;

  gtmScript.src =
    "https://www.googletagmanager.com/gtm.js?id=" +
    encodeURIComponent(GTM_ID);

  firstScript.parentNode.insertBefore(
    gtmScript,
    firstScript
  );
})(window, document);