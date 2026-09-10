import { describe, expect, it } from "vitest";
import { getShopDestination } from "./shopNavigation";

describe("shop navigation", () => {
    it("redirects landing-host traffic to the marketplace subdomain", () => {
        expect(getShopDestination("https://www.peza.africa/?utm_source=landing")).toBe("https://shop.peza.africa/?utm_source=landing");
        expect(getShopDestination("https://peza.africa/")).toBe("https://shop.peza.africa/");
    });

    it("keeps local and marketplace-host navigation internal", () => {
        expect(getShopDestination("http://localhost:3000/")).toBe("/shop");
        expect(getShopDestination("https://shop.peza.africa/products/123")).toBe("/shop");
    });
});
