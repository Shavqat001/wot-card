import { describe, expect, it } from "vitest"
import { Hub } from "./rooms"

describe("комната", () => {
  it("двое стреляют каждый своей машиной", () => {
    const hub = new Hub()
    const host = hub.create("duel", "t34", ["harden"])
    expect("code" in host).toBe(true)
    if (!("code" in host)) return
    const guest = hub.join(host.code, "pz4", ["rammer"])
    expect("you" in guest).toBe(true)
    if (!("you" in guest)) return
    const started = hub.start(host.code, host.you)
    expect(started.kind).toBe("battle")
    if (started.kind !== "battle") return
    const mine = started.views.find((view) => view.you === host.you)?.battle
    const theirs = started.views.find((view) => view.you === guest.you)?.battle
    expect(mine?.units[mine.playerIndex].maxHp).toBe(886)
    expect(mine?.units[mine.playerIndex].vid).toBe("t34")
    expect(theirs?.units[theirs.playerIndex].vid).toBe("pz4")
    expect(theirs?.units[theirs.playerIndex].side).toBe(0)
    expect(theirs?.units[theirs.playerIndex].kit).toContain("rammer")
    const foe = mine ? mine.units.findIndex((unit) => !unit.player) : -1
    const back = theirs ? theirs.units.findIndex((unit) => !unit.player) : -1
    expect(hub.order(host.code, host.you, { kind: "attack", target: foe, shell: "ap" }).kind).toBe("wait")
    const done = hub.order(host.code, guest.you, { kind: "attack", target: back, shell: "ap" })
    expect(done.kind).toBe("battle")
    if (done.kind !== "battle") return
    const after = done.views.find((view) => view.you === host.you)?.battle
    expect(after?.played).toBe(1)
    expect(after?.beats.length).toBeGreaterThan(0)
  })

  it("пустую дуэль не начать", () => {
    const hub = new Hub()
    const host = hub.create("duel", "t34", [])
    if (!("code" in host)) return
    expect(hub.start(host.code, host.you)).toEqual({ kind: "error", text: "жди второго" })
  })

  it("в стычке гости свои, противник боты", () => {
    const hub = new Hub()
    const host = hub.create("platoon", "t34", [])
    expect("code" in host).toBe(true)
    if (!("code" in host)) return
    const guest = hub.join(host.code, "pz4", [])
    expect("you" in guest).toBe(true)
    if (!("you" in guest)) return
    const lobby = hub.lobby(host.code, host.you)
    expect(lobby?.seats.every((s) => s.side === 0)).toBe(true)
    const started = hub.start(host.code, host.you)
    expect(started.kind).toBe("battle")
    if (started.kind !== "battle") return
    const mine = started.views.find((view) => view.you === host.you)?.battle
    const theirs = started.views.find((view) => view.you === guest.you)?.battle
    expect(mine?.units.filter((u) => u.human).every((u) => u.side === 0)).toBe(true)
    expect(theirs?.units[theirs.playerIndex].side).toBe(0)
    expect(theirs?.units[theirs.playerIndex].vid).toBe("pz4")
    expect(mine?.units.filter((u) => u.side === 1).every((u) => !u.human)).toBe(true)
  })
})