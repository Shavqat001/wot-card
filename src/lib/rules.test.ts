import { describe, expect, it } from "vitest"
import { chooseAi } from "./ai"
import { actionError, createBattle, resolveRound, step } from "./battle"
import { fit, gearHint, gearById } from "./gear"
import { buy, buyGear, buyGold, freshSave, goldToSilver, goldToXp, loadSave, scrapGear, setGear } from "./garage"
import { mulberry32 } from "./rng"
import {
  damageXp,
  fullRepair,
  levelMult,
  repairBill,
  rewardOf,
  shellPrice,
} from "./reward"
import { artId } from "./art"
import { effectiveArmor, gunWord, heSplash, leaveChance, retreatTo, salvoCount, splashFraction } from "./shot"
import { byId, VEHICLES } from "./vehicles"

describe("пробитие", () => {
  it("лоб в анфас и ромб считают ту же броню, что в примере", () => {
    const face = effectiveArmor(120, 8, "ap", 100)
    const diamond = effectiveArmor(120, 52, "ap", 100)
    expect(face.effective).toBe(120)
    expect(face.ricochet).toBe(false)
    expect(diamond.effective).toBe(176)
  })

  it("вилка ±25% и сравнение целых", () => {
    const low = Math.round(190 * 0.75)
    const high = Math.round(190 * 1.25)
    expect(low).toBe(143)
    expect(high).toBe(238)
    const thin = effectiveArmor(100, 8, "ap", 100).effective
    const thick = effectiveArmor(200, 8, "ap", 100).effective
    expect(low).toBeGreaterThanOrEqual(thin)
    expect(low).toBeLessThan(thick)
    expect(high).toBeGreaterThan(thick)
  })

  it("три калибра снимают рикошет и угол", () => {
    const ruled = effectiveArmor(30, 80, "ap", 100)
    const bounced = effectiveArmor(30, 80, "ap", 80)
    expect(ruled.threeCal).toBe(true)
    expect(ruled.ricochet).toBe(false)
    expect(ruled.effective).toBe(30)
    expect(ruled.angle).toBe(0)
    expect(bounced.ricochet).toBe(true)
  })

  it("фугас без пробития даёт осколки от 8% до 50%", () => {
    expect(splashFraction(1, 1000)).toBeGreaterThan(0.49)
    expect(splashFraction(9000, 100)).toBeCloseTo(0.08)
    expect(heSplash(1000, 1, 1000)).toBe(500)
    expect(heSplash(1000, 9000, 100)).toBe(80)
  })

  it("рикошет ББ с 70° после нормализации, ОФ не рикошетит", () => {
    expect(effectiveArmor(80, 75, "ap", 50).ricochet).toBe(true)
    expect(effectiveArmor(80, 74, "ap", 50).ricochet).toBe(false)
    expect(effectiveArmor(80, 80, "he", 50).ricochet).toBe(false)
  })
})

describe("попадание и уход", () => {
  const mid = {
    dispersion: 0.4,
    aim: 2.1,
    targetSpeed: 40,
    distanceGap: 0,
    targetCamo: 0.14,
    view: 340,
    targetDefend: false,
    targetRetreat: false,
    targetArmor: false,
    shooterArmor: false,
    targetCovered: false,
    shooterCovered: false,
    spotted: false,
    gunDamaged: false,
  }

  it("защита, отход и поломка орудия снижают шанс, прикрытие своего повышает", async () => {
    const { hitChance } = await import("./shot")
    const base = hitChance(mid)
    expect(base).toBeGreaterThan(0.45)
    expect(base).toBeLessThan(0.8)
    expect(hitChance({ ...mid, targetDefend: true })).toBeLessThan(base)
    expect(hitChance({ ...mid, targetRetreat: true })).toBeLessThan(base)
    expect(hitChance({ ...mid, gunDamaged: true })).toBeLessThan(base)
    expect(hitChance({ ...mid, shooterCovered: true })).toBeGreaterThan(base)
    expect(hitChance({ ...mid, dispersion: 3, aim: 9, targetSpeed: 80, distanceGap: 2, targetCamo: 0.9, gunDamaged: true })).toBe(0.08)
    expect(hitChance({ ...mid, dispersion: 0, aim: 1, targetSpeed: 0, targetCamo: 0, view: 500, shooterCovered: true, spotted: true })).toBe(0.93)
  })

  it("тяжёлый почти не уходит, лёгкий уходит чаще", () => {
    expect(leaveChance(34, "heavy")).toBeLessThan(0.08)
    expect(leaveChance(72, "light")).toBeGreaterThan(leaveChance(34, "heavy"))
  })
})

describe("зарядка", () => {
  it("короткая пушка Panther даёт два выстрела, БЛ-10 молчит пока заряд мал", () => {
    expect(salvoCount(10, 4.6)).toBe(2)
    expect(salvoCount(18.5, 18.5)).toBe(1)
    expect(salvoCount(10, 18.5)).toBe(0)
    const panther = createBattle("panther", "duel", () => 0.4)
    const pi = panther.playerIndex
    panther.units[pi].action = "attack"
    panther.units[pi].target = panther.units.findIndex((u) => !u.player)
    panther.units[pi].shell = "ap"
    panther.units[pi].charge = 10
    const fired = resolveRound(panther, () => 0.01)
    expect(fired.beats.filter((b) => b.shooter === pi)).toHaveLength(2)

    const isu = createBattle("isu", "duel", () => 0.4)
    const ii = isu.playerIndex
    isu.units[ii].action = "attack"
    isu.units[ii].target = isu.units.findIndex((u) => !u.player)
    isu.units[ii].shell = "ap"
    isu.units[ii].charge = 10
    const quiet = resolveRound(isu, () => 0.2)
    expect(quiet.beats.filter((b) => b.shooter === ii)).toHaveLength(0)
    expect(quiet.units[ii].charge).toBe(20)
    expect(gunWord(10, 4.6)).toBe("два выстрела")
    expect(gunWord(10, 6.6)).toBe("готов")
    expect(gunWord(10, 18.5)).toBe("ещё удар")
  })

  it("быстрый с ближней сразу на дальнюю, медленный на шаг", () => {
    expect(retreatTo(0, 72)).toBe(2)
    expect(retreatTo(0, 34)).toBe(1)
    expect(retreatTo(1, 34)).toBe(2)
    const light = createBattle("bt7", "duel", () => 0.4)
    const li = light.playerIndex
    light.units[li].distance = 0
    light.units[li].action = "retreat"
    const far = resolveRound(light, () => 0)
    expect(far.units[li].distance).toBe(2)
    expect(far.units[li].present).toBe(true)
    const heavy = createBattle("kv1", "duel", () => 0.4)
    const hi = heavy.playerIndex
    heavy.units[hi].distance = 0
    heavy.units[hi].action = "retreat"
    expect(resolveRound(heavy, () => 0).units[hi].distance).toBe(1)
  })
})

describe("раунд", () => {
  it("убитые в этом ходу ещё стреляют", () => {
    const b = createBattle("bt7", "duel", () => 0.3)
    b.units.forEach((u) => {
      u.vid = "bt7"
      u.hp = 1
      u.maxHp = 420
      u.charge = byId("bt7").reload
    })
    b.units[0].action = "attack"
    b.units[0].target = 1
    b.units[0].shell = "ap"
    b.units[1].action = "attack"
    b.units[1].target = 0
    b.units[1].shell = "ap"
    const n = resolveRound(b, () => 0.01)
    expect(n.units[0].alive).toBe(false)
    expect(n.units[1].alive).toBe(false)
    expect(n.outcome).toBe("draw")
    expect(n.beats).toHaveLength(2)
    expect(n.beats.every((beat) => beat.killed)).toBe(true)
    expect(n.stats.foes.length).toBeGreaterThan(0)
    expect(n.stats.foes.some((f) => f.killed)).toBe(true)
    expect(n.log.every((line) => !line.text.includes("мм"))).toBe(true)
  })

  it("дуэль закрывает помощь", () => {
    const b = createBattle("t34", "duel", mulberry32(1))
    expect(actionError(b, { kind: "help", target: 0, shell: null })).toBe("нельзя")
  })

  it("составы 1, 5 и 7", () => {
    expect(createBattle("t34", "duel", mulberry32(1)).units).toHaveLength(2)
    expect(createBattle("t34", "platoon", mulberry32(1)).units).toHaveLength(10)
    expect(createBattle("t34", "company", mulberry32(1)).units).toHaveLength(14)
    const odd = createBattle("su122", "platoon", mulberry32(2))
    const allies = odd.units.filter((u) => u.side === 0)
    const enemies = odd.units.filter((u) => u.side === 1)
    expect(allies.filter((u) => byId(u.vid).type === "spg")).toHaveLength(1)
    expect(enemies.filter((u) => byId(u.vid).type === "spg")).toHaveLength(0)
    const company = createBattle("t34", "company", mulberry32(1))
    const other = createBattle("t34", "company", mulberry32(2))
    expect(new Set(company.units.map((u) => u.vid)).size).toBe(company.units.length)
    const foe = (b: { units: { side: number; vid: string }[] }) =>
      b.units.filter((u) => u.side === 1).map((u) => u.vid).join()
    expect(foe(company)).not.toBe(foe(other))
  })

  it("дуэль доигрывается, журнал без миллиметров", () => {
    let b = createBattle("t34", "duel", mulberry32(7))
    const rng = mulberry32(99)
    let guard = 0
    while (!b.over && guard++ < 20) {
      const u = b.units[b.playerIndex]
      const enemy = b.units.findIndex((x) => x.side === 1 && x.alive && x.present)
      const ready = u.charge >= byId(u.vid).reload && enemy >= 0
      b = step(b, ready
        ? { kind: "attack", target: enemy, shell: "ap" }
        : { kind: "defend", target: null, shell: null }, rng)
    }
    expect(b.over).toBe(true)
    expect(b.outcome).not.toBeNull()
    expect(b.log.every((line) => !line.text.includes("мм"))).toBe(true)
  })
})

describe("ИИ", () => {
  it("раненый быстрый уходит, пустой тяжёлый ставит ромб, пустая ПТ защищается, САУ берёт фугас", () => {
    const light = createBattle("bt7", "duel", () => 0.5)
    const scout = light.units[light.playerIndex]
    scout.hp = 10
    expect(chooseAi(light, scout, () => 0.9).kind).toBe("retreat")

    const heavy = createBattle("kv1", "duel", () => 0.5)
    const ht = heavy.units[heavy.playerIndex]
    ht.charge = 0
    expect(chooseAi(heavy, ht, () => 0.9).kind).toBe("armor")

    const td = createBattle("stug", "duel", () => 0.5)
    const tank = td.units[td.playerIndex]
    tank.charge = 0
    expect(chooseAi(td, tank, () => 0.9).kind).toBe("defend")

    const arty = createBattle("su122", "duel", () => 0.5)
    const gun = arty.units[arty.playerIndex]
    gun.charge = 100
    expect(chooseAi(arty, gun, () => 0.9).shell).toBe("he")
  })
})

describe("опыт и кредиты", () => {
  it("множитель уровня зажат", () => {
    expect(levelMult(5, 5)).toBe(1)
    expect(levelMult(8, 1)).toBe(1.45)
    expect(levelMult(1, 8)).toBe(0.6)
  })

  it("учебный бой Т-34 даёт 833 опыта", () => {
    const t34 = byId("t34")
    const pz = byId("pz4")
    const stug = byId("stug")
    expect(t34.hp).toBe(820)
    expect(pz.hp).toBe(840)
    expect(stug.hp).toBe(760)
    expect(damageXp(520, pz.hp, pz.tier, t34.tier)).toBe(235)
    expect(damageXp(180, stug.hp, stug.tier, t34.tier)).toBe(90)
    const reward = rewardOf({
      shooterTier: t34.tier,
      ownHp: t34.hp,
      damage: [
        { name: pz.name, tier: pz.tier, hp: pz.hp, amount: 520 },
        { name: stug.name, tier: stug.tier, hp: stug.hp, amount: 180 },
      ],
      frags: [{ name: pz.name, tier: pz.tier }],
      blocked: 270,
      support: [{ allyTier: 5, targetTier: 5, targetHp: 1190, amount: 160 }],
      repairHp: 90,
      stayed: true,
      left: false,
      outcome: "win",
      shells: { ap: 10, apcr: 0, he: 0 },
      repairCost: repairBill(t34.tier, t34.hp / 2, t34.hp),
      hasSuccessor: true,
    })
    expect(reward.xp).toBe(833)
    expect(reward.onVehicle).toBe(791)
    expect(reward.freeXp).toBe(42)
    expect(reward.credits).toBe(8332 - 10 * 800 - 3500)
    expect(reward.xpLines.map((line) => line.value)).toEqual([235, 90, 84, 50, 28, 18, 50, 278])
    expect(reward.creditLines.map((line) => line.label)).toEqual([
      "начислено",
      "пополнение · ББ × 10",
      "ремонт",
    ])
  })

  it("БП вчетверо дороже ББ, ОФ вдвое", () => {
    expect(shellPrice("ap", 5)).toBe(800)
    expect(shellPrice("apcr", 5)).toBe(3200)
    expect(shellPrice("he", 5)).toBe(1600)
  })

  it("ремонт берёт долю потерянной прочности", () => {
    expect(fullRepair(10)).toBe(32000)
    expect(fullRepair(9)).toBe(22000)
    expect(fullRepair(8)).toBe(18000)
    expect(fullRepair(1)).toBe(400)
    expect(repairBill(10, 800, 1600)).toBe(16000)
    expect(repairBill(10, 0, 1600)).toBe(32000)
    expect(repairBill(5, 820, 820)).toBe(0)
    expect(repairBill(2, 0, 200)).toBe(800)
  })

  it("у дополнительных машин есть запасная картинка", () => {
    expect(artId("su18")).toBe("su122")
    expect(artId("kv1s")).toBe("kv1")
    expect(artId("t34")).toBe("t34")
  })
})

describe("ангар", () => {
  it("битое сохранение собирает ангар заново", () => {
    expect(loadSave(null).rebuilt).toBe(false)
    expect(loadSave(null).save.silver).toBe(24000)
    expect(loadSave(null).save.gold).toBe(0)
    expect(loadSave(null).save.bonds).toBe(0)
    expect(loadSave("{").rebuilt).toBe(true)
    expect(loadSave("{").save.owned).toEqual(freshSave().owned)
    expect(freshSave().owned.length).toBeGreaterThan(40)
    expect(freshSave().owned.every((id) => ["ussr", "germany", "usa"].includes(byId(id).country))).toBe(true)
    expect(freshSave().owned).not.toContain("is3")
    const kept = loadSave(JSON.stringify({ v: 1, credits: 10, freeXp: 0, owned: ["t34"], xp: {}, selected: "t34" }))
    expect(kept.rebuilt).toBe(false)
    expect(kept.save.silver).toBe(10)
    expect(kept.save.gold).toBe(0)
    expect(kept.save.bonds).toBe(0)
    expect(kept.save.owned).toContain("tiger")
  })

  it("опыт Т-34 открывает Т-34-85 вместе с кредитами", () => {
    const save = freshSave()
    save.owned = save.owned.filter((id) => id !== "t3485")
    save.xp.t34 = 2400
    save.silver = 50000
    const next = buy(save, "t3485")
    expect(next?.owned).toContain("t3485")
    expect(next?.xp.t34).toBe(0)
    expect(next?.silver).toBe(32000)
    const poor = freshSave()
    poor.owned = ["t34"]
    poor.silver = 0
    expect(buy(poor, "t3485")).toBeNull()
  })

  it("ветки целые, стартовые три", () => {
    const ids = new Set(VEHICLES.map((v) => v.id))
    expect(ids.size).toBe(VEHICLES.length)
    for (const v of VEHICLES) {
      if (v.pred) expect(ids.has(v.pred)).toBe(true)
      expect(v.shells).toHaveLength(3)
      expect(v.tier).toBeGreaterThanOrEqual(1)
      expect(v.tier).toBeLessThanOrEqual(10)
      const seen = new Set<string>()
      let cur = v.pred
      let guard = 0
      while (cur) {
        expect(seen.has(cur)).toBe(false)
        seen.add(cur)
        cur = byId(cur).pred
        expect(++guard).toBeLessThan(12)
      }
    }
    expect(VEHICLES.filter((v) => v.pred === null && v.xp === 0).map((v) => v.id).sort()).toEqual(["bt7", "stug", "t34"])
  })

  it("оборудование меняет машину и не встаёт дважды", () => {
    const base = byId("t34")
    expect(fit(base, ["rammer"]).reload).toBeLessThan(base.reload)
    expect(fit(base, ["harden"]).hp).toBe(Math.round(base.hp * 1.08))
    const battle = createBattle("t34", "duel", () => 0.4, ["harden"])
    expect(battle.units[battle.playerIndex].maxHp).toBe(Math.round(base.hp * 1.08))
    const bought = buyGear(freshSave(), "rammer")!
    expect(bought.silver).toBe(freshSave().silver - gearById("rammer")!.cost)
    expect(bought.depot.gear.rammer).toBe(1)
    let save = setGear(bought, "t34", 0, "rammer")
    expect(save.gear.t34[0]).toBe("rammer")
    expect(save.depot.gear.rammer ?? 0).toBe(0)
    save = setGear(save, "t34", 1, "rammer")
    expect(save.gear.t34.filter((id) => id === "rammer")).toHaveLength(1)
    expect(save.gear.t34[1]).toBe("rammer")
    expect(save.silver).toBe(bought.silver)
    save = setGear(save, "t34", 1, null)
    expect(save.depot.gear.rammer).toBe(1)
    expect(save.silver).toBe(bought.silver)
    save = setGear(save, "t34", 0, "rammer")
    save = scrapGear(save, "t34", 0)
    expect(save.gear.t34[0]).toBe("")
    expect(save.depot.gear.rammer ?? 0).toBe(0)
    expect(setGear(freshSave(), "t34", 0, "rammer").gear.t34).toBeUndefined()
    expect(buyGear({ ...freshSave(), silver: 0 }, "rammer")).toBeNull()
    expect(gearHint(gearById("vent")!)).toEqual(["перезарядка", "сведение", "обзор", "в минуту"])
    expect(gearHint(gearById("liner")!)).toEqual(["фугас"])
  })

  it("магазин продаёт золото и меняет его на серебро и опыт", () => {
    const rich = { ...freshSave(), silver: 50000 }
    const g = buyGold(rich, 0)!
    expect(g.gold).toBe(100)
    expect(g.silver).toBe(5000)
    const s = goldToSilver(g, 10)!
    expect(s.gold).toBe(90)
    expect(s.silver).toBe(9000)
    const x = goldToXp(g, 10)!
    expect(x.freeXp).toBe(250)
    expect(buyGold({ ...freshSave(), silver: 0 }, 0)).toBeNull()
  })

  it("досылатель добавляет выстрел, подбой режет фугас", () => {
    const shots = (gear: string[]) => {
      const battle = createBattle("t34", "duel", () => 0.4, gear)
      const me = battle.playerIndex
      const foe = battle.units.findIndex((_, i) => i !== me)
      battle.units[me].charge = 12
      battle.units[me].action = "attack"
      battle.units[me].target = foe
      battle.units[me].shell = "ap"
      battle.units[foe].action = "defend"
      return resolveRound(battle, () => 0).beats.filter((beat) => beat.shooter === me).length
    }
    expect(shots(["rammer"])).toBeGreaterThan(shots([]))

    const left = (gear: string[]) => {
      const battle = createBattle("t34", "duel", () => 0.4, gear)
      const me = battle.playerIndex
      const foe = battle.units.findIndex((_, i) => i !== me)
      battle.units[foe].charge = 40
      battle.units[foe].action = "attack"
      battle.units[foe].target = me
      battle.units[foe].shell = "he"
      battle.units[me].action = "defend"
      return resolveRound(battle, () => 0).units[me].hp
    }
    expect(left(["liner"])).toBeGreaterThan(left([]))
  })
})
