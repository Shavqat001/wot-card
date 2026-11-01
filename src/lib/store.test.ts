import { createRequire } from "node:module"
import { describe, expect, it } from "vitest"
import { buyGear, freshSave, setGear } from "./garage"
import { bootStore, currentDb, grantAlvares, loginAccount, logoutAccount, openMemory, putSave, registerAccount, saveFromDb, setWasmFile, writeSave } from "./store"
import { VEHICLES } from "./vehicles"

setWasmFile(createRequire(import.meta.url).resolve("sql.js/dist/sql-wasm.wasm"))

describe("sqlite", () => {
  it("держит серебро, боны, золото и свободный опыт", async () => {
    const db = await openMemory()
    const names = db.exec("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")[0].values.map((row) => row[0])
    expect(names).toEqual([
      "account", "depot_gear", "depot_shell", "equipment", "garage", "gear_slot",
      "player", "vehicle", "vehicle_shell",
    ])
    const tanks = db.exec("SELECT COUNT(*) FROM vehicle")[0].values[0][0]
    expect(tanks).toBe(VEHICLES.length)
    const hp = db.exec("SELECT hp FROM vehicle WHERE id = 't34'")[0].values[0][0]
    expect(hp).toBe(820)
    const shells = db.exec("SELECT COUNT(*) FROM vehicle_shell WHERE vehicle_id = 't34'")[0].values[0][0]
    expect(shells).toBe(3)
    let save = buyGear(freshSave(), "rammer")!
    save = setGear(save, "t34", 0, "rammer")
    save = { ...save, silver: 18000, gold: 250, bonds: 12, freeXp: 40 }
    writeSave(db, save)
    const back = saveFromDb(db)
    expect(back?.silver).toBe(18000)
    expect(back?.gold).toBe(250)
    expect(back?.bonds).toBe(12)
    expect(back?.freeXp).toBe(40)
    expect(back?.gear.t34[0]).toBe("rammer")
    expect(back?.depot.shells.ap).toBe(0)
    const purse = db.exec("SELECT silver, gold, bonds, free_xp FROM player WHERE id = 'local'")[0].values[0]
    expect(purse).toEqual([18000, 250, 12, 40])
    const kit = db.exec("SELECT COUNT(*) FROM equipment")[0].values[0][0]
    expect(kit).toBe(9)
  })
})

describe("alvares", () => {
  it("оставляет три танка и кладёт кошелёк", () => {
    const save = grantAlvares(freshSave(), "ALVARES")
    expect(save.owned).toEqual(["t34", "kv1", "sherman"])
    expect(save.silver).toBe(100000)
    expect(save.gold).toBe(100)
    expect(save.bonds).toBe(500)
    expect(grantAlvares(save, "ALVARES")).toBe(save)
    expect(grantAlvares(freshSave(), "Сталь").owned.length).toBeGreaterThan(3)
  })
})

describe("account", () => {
  it("пишет два ангара отдельно и не пускает чужой пароль", async () => {
    await bootStore()
    const first = await registerAccount("Сталь", "pass1", "pass1")
    expect(first.ok).toBe(true)
    if (!first.ok) return
    await putSave({ ...first.save, silver: 9100 })
    await logoutAccount()
    const taken = await registerAccount("сталь", "pass2", "pass2")
    expect(taken.ok).toBe(false)
    const second = await registerAccount("Тень", "pass2", "pass2")
    expect(second.ok).toBe(true)
    if (!second.ok) return
    expect(second.save.silver).toBe(24000)
    await logoutAccount()
    const bad = await loginAccount("Сталь", "pass2")
    expect(bad.ok).toBe(false)
    const back = await loginAccount("Сталь", "pass1")
    expect(back.ok).toBe(true)
    if (!back.ok) return
    expect(back.save.silver).toBe(9100)
    expect(back.nick).toBe("Сталь")
  })

  it("первый аккаунт забирает старый ангар", async () => {
    await bootStore()
    const db = currentDb()!
    writeSave(db, { ...freshSave(), silver: 333 }, "local")
    const host = await registerAccount("Хозяин", "abcd", "abcd")
    expect(host.ok).toBe(true)
    if (!host.ok) return
    expect(host.save.silver).toBe(333)
  })
})
