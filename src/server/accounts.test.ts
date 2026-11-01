import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { bootAccounts, loginAccount, registerAccount, setAccountsFile } from "./accounts"

describe("ники", () => {
  it("на сервере один ник, без учёта регистра", async () => {
    setAccountsFile(join(mkdtempSync(join(tmpdir(), "angar-")), "host.sqlite"))
    await bootAccounts()
    const first = registerAccount("Alvares", "pass1", "pass1")
    expect(first.ok).toBe(true)
    const taken = registerAccount("ALVARES", "pass2", "pass2")
    expect(taken.ok).toBe(false)
    if (!taken.ok) expect(taken.error).toBe("ник занят")
    const bad = loginAccount("Alvares", "pass2")
    expect(bad.ok).toBe(false)
    const back = loginAccount("alvares", "pass1")
    expect(back.ok).toBe(true)
    if (first.ok && back.ok) expect(back.id).toBe(first.id)
  })
})
