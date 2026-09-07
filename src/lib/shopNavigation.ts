const LANDING_HOSTS = new Set(["peza.africa", "www.peza.africa"]);
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

export function getShopDestination(currentUrl = typeof window !== "undefined" ? window.location.href : "https://shop.peza.africa/", targetPath = "/shop") {
    const current = new URL(currentUrl);
    const isLandingHost = LANDING_HOSTS.has(current.hostname);
    const isLocalHost = LOCAL_HOSTS.has(current.hostname) || current.hostname.endsWith(".local");
    const isShopHost = current.hostname === "shop.peza.africa" || current.hostname.endsWith(".shop.peza.africa");

    if (isLandingHost) {
        const shopUrl = new URL("https://shop.peza.africa/");
        if (current.search) shopUrl.search = current.search;
        if (current.hash) shopUrl.hash = current.hash;
        return shopUrl.toString();
    }

    if (isShopHost || isLocalHost) {
        return targetPath;
    }

    return targetPath;
}
