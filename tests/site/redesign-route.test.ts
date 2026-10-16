// @vitest-environment node
import {beforeEach, describe, expect, it, vi} from "vitest";
import routes from "../../redesign/routes.json";
import {canReviewRedesign} from "@/lib/redesign-access";

const mocks = vi.hoisted(() => ({auth: vi.fn(), readFile: vi.fn()}));
vi.mock("@/lib/auth", () => ({auth: mocks.auth}));
vi.mock("node:fs/promises", () => ({readFile: mocks.readFile}));
import {GET} from "@/app/redesign-content/[page]/route";

beforeEach(() => {
  vi.resetAllMocks();
  vi.unstubAllEnvs();
  mocks.auth.mockResolvedValue(null);
  mocks.readFile.mockResolvedValue("<!doctype html><h1>Covenant Embassy</h1>");
});

describe("private redesign delivery", () => {
  it("denies anonymous and ordinary member accounts by default", () => {
    expect(canReviewRedesign(null, undefined)).toBe(false);
    expect(canReviewRedesign({id: "member", role: "MEMBER"}, undefined)).toBe(false);
    expect(canReviewRedesign({role: "ADMIN"}, undefined)).toBe(false);
    expect(canReviewRedesign({id: "admin", role: "ADMIN"}, undefined)).toBe(true);
    expect(canReviewRedesign({id: "reader", role: "MEMBER"}, "other, reader ")).toBe(true);
    expect(canReviewRedesign({id: "reader-prefix", role: "MEMBER"}, "reader")).toBe(false);
  });
  it("redirects anonymous requests to sign-in using a same-origin canonical callback", async () => {
    const response = await GET(new Request("https://preview.example/redesign-content/watch?service=ZLl7B5PcLmA"), {params: Promise.resolve({page: "watch"})});
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.origin).toBe("https://preview.example");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("callbackUrl")).toBe("/watch?service=ZLl7B5PcLmA");
    expect(mocks.readFile).not.toHaveBeenCalled();
  });
  it("rejects authenticated users without review permission and never reads the page", async () => {
    mocks.auth.mockResolvedValue({user: {id: "member", role: "MEMBER"}});
    const response = await GET(new Request("https://preview.example/about?public=true"), {params: Promise.resolve({page: "about"})});
    expect(response.status).toBe(403);
    expect(mocks.readFile).not.toHaveBeenCalled();
  });
  it.each(Object.keys(routes))("serves allowlisted page %s to an administrator without shared caching", async page => {
    mocks.auth.mockResolvedValue({user: {id: "admin", role: "ADMIN"}});
    const response = await GET(new Request("https://preview.example/redesign-content/" + page), {params: Promise.resolve({page})});
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("Covenant Embassy");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("vary")).toBe("Cookie");
    expect(response.headers.get("x-robots-tag")).toContain("noindex");
    expect(mocks.readFile.mock.calls[0][0]).toMatch(/redesign[/\\]dist[/\\].*index\.html$/);
  });
  it("permits a server-allowlisted existing reviewer without granting admin rights", async () => {
    vi.stubEnv("REDESIGN_REVIEWER_USER_IDS", "reviewer-id");
    mocks.auth.mockResolvedValue({user: {id: "reviewer-id", role: "MEMBER"}});
    expect((await GET(new Request("https://preview.example/"), {params: Promise.resolve({page: "home"})})).status).toBe(200);
  });
  it.each(["../.env", "__proto__", "constructor", "not-a-page"])("rejects unknown/traversal key %s before reading content", async page => {
    const response = await GET(new Request("https://preview.example/"), {params: Promise.resolve({page})});
    expect(response.status).toBe(404);
    expect(mocks.auth).not.toHaveBeenCalled();
    expect(mocks.readFile).not.toHaveBeenCalled();
  });
  it("returns an uncached unavailable state without filesystem details", async () => {
    mocks.auth.mockResolvedValue({user: {id: "admin", role: "ADMIN"}});
    mocks.readFile.mockRejectedValue(new Error("ENOENT /private/path"));
    const response = await GET(new Request("https://preview.example/"), {params: Promise.resolve({page: "home"})});
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("/private/path");
  });
});
