import { describe, expect, it } from "vitest";
import { buildInfobipReply, parseCategorySelection } from "./paymentWebhook.js";

describe("Infobip storefront trigger logic", () => {
    const categories = [
        { id: 1, slug: "groceries", name: "Groceries" },
        { id: 2, slug: "electronics", name: "Electronics" },
    ];

    const products = [
        { id: 10, name: "Rice 10kg", price: "95.00", categorySlug: "groceries" },
        { id: 11, name: "Bluetooth Speaker", price: "420.00", categorySlug: "electronics" },
    ];

    it("returns the catalog menu for a shop trigger", () => {
        const reply = buildInfobipReply("menu", categories, products);
        expect(reply).toContain("PEZA Store");
        expect(reply).toContain("Groceries");
        expect(reply).toContain("Electronics");
    });

    it("maps a numeric category selection to a category result", () => {
        expect(parseCategorySelection("1", categories)).toEqual("groceries");
        expect(parseCategorySelection("2", categories)).toEqual("electronics");
    });

    it("returns matching product info when the customer asks to buy a product", () => {
        const reply = buildInfobipReply("buy rice", categories, products);
        expect(reply).toContain("Rice 10kg");
        expect(reply).toContain("K95");
    });
});
