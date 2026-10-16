import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma so createUser never touches the database.
const findUnique = vi.fn();
const create = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: (arg: unknown) => findUnique(arg),
      create: (arg: unknown) => create(arg),
    },
  },
}));

// Mock bcrypt to assert hashing happens with the expected rounds.
const hash = vi.fn<(pw: string, rounds: number) => Promise<string>>()
  .mockResolvedValue("hashed-pw");
vi.mock("bcryptjs", () => ({
  default: { hash: (pw: string, rounds: number) => hash(pw, rounds) },
}));

import { createUser } from "@/app/(auth)/register-core";

const validInput = {
  name: "Jane Doe",
  email: "jane@example.com",
  password: "longenoughpw",
};

beforeEach(() => {
  findUnique.mockReset();
  create.mockReset();
  hash.mockClear();
});

describe("createUser", () => {
  it("hashes the password and creates a MEMBER user", async () => {
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue({ id: "u1", email: validInput.email });

    const result = await createUser(validInput);

    expect(result.ok).toBe(true);
    // bcrypt.hash called with the plaintext and >= 10 rounds.
    expect(hash).toHaveBeenCalledWith(validInput.password, expect.any(Number));
    expect(hash.mock.calls[0][1]).toBeGreaterThanOrEqual(10);

    expect(create).toHaveBeenCalledTimes(1);
    const arg = create.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(arg.data.email).toBe(validInput.email);
    expect(arg.data.name).toBe(validInput.name);
    expect(arg.data.hashedPassword).toBe("hashed-pw");
    expect(arg.data.role).toBe("MEMBER");
  });

  it("returns a friendly error on a duplicate email", async () => {
    findUnique.mockResolvedValue({ id: "existing", email: validInput.email });

    const result = await createUser(validInput);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/already/i);
    }
    expect(create).not.toHaveBeenCalled();
  });

  it("returns a validation error on bad input", async () => {
    const result = await createUser({ name: "", email: "nope", password: "x" });
    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });
});
