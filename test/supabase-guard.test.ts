import { describe, it, expect } from "vitest";
import {
    sessionBlindDeadClient,
    guardDataAccess,
    SESSION_BLIND_MESSAGE,
} from "@/lib/supabase-guard";

describe("sessionBlindDeadClient (lib/supabase legacy export)", () => {
    it("throws the explanatory error on any string property access", () => {
        const dead = sessionBlindDeadClient<{ from: unknown; auth: unknown }>();
        expect(() => dead.from).toThrowError(SESSION_BLIND_MESSAGE);
        expect(() => dead.auth).toThrowError(/httpOnly/);
        expect(() => dead.auth).toThrowError(/requireUser/);
    });

    it("is safe to create, await, and log — only real use throws", () => {
        const dead = sessionBlindDeadClient<object>();
        expect(dead).toBeTruthy(); // creation alone must not throw
        const loose = dead as Record<PropertyKey, unknown>;
        expect(loose[Symbol.toPrimitive]).toBeUndefined(); // logging/inspection
        expect(loose["then"]).toBeUndefined(); // `await dead` must not throw
    });
});

describe("guardDataAccess (lib/supabase-browser wrapper)", () => {
    const fake = {
        from: () => "rows",
        rpc: () => "rpc",
        storage: {},
        channel: () => ({}),
        realtime: {},
        functions: {},
        auth: { signInWithOAuth: () => ({ error: null }) },
        misc: "passthrough",
    };

    it("throws on every data-access surface", () => {
        const guarded = guardDataAccess(fake);
        expect(() => guarded.from).toThrowError(SESSION_BLIND_MESSAGE);
        expect(() => guarded.rpc).toThrowError(SESSION_BLIND_MESSAGE);
        expect(() => guarded.storage).toThrowError(SESSION_BLIND_MESSAGE);
        expect(() => guarded.channel).toThrowError(SESSION_BLIND_MESSAGE);
        expect(() => guarded.realtime).toThrowError(SESSION_BLIND_MESSAGE);
        expect(() => guarded.functions).toThrowError(SESSION_BLIND_MESSAGE);
    });

    it("passes auth (the OAuth-initiation path) and unknown props through", () => {
        const guarded = guardDataAccess(fake);
        expect(guarded.auth.signInWithOAuth()).toEqual({ error: null });
        expect(guarded.auth).toBe(fake.auth);
        expect(guarded.misc).toBe("passthrough");
    });
});
