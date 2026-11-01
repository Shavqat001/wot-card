import { mkdir, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const outDir = join(root, "public", "tanks")
const CDN = "https://na-wotp.wgcdn.co/dcont/tankopedia_images"

/** Наши id → тег танкопедии. Чего нет в API — пропускаем. */
const TAGS = {
  t54lt: "R109_T54S",
  t100lt: "R132_VNII_100LT",
  t62a: "R87_T62A",
  obj140: "R97_Object_140",
  t10: "R81_IS8",
  is7: "R45_IS-7",
  obj704: "R53_Object_704",
  obj268: "R88_Object268",
  sti: "R63_ST_I",
  is4: "R90_IS_4M",
  obj263: "R93_Object263",
  obj2684: "R149_Object_268_4",
  obj212: "R51_Object_212",
  obj261: "R52_Object_261",
  hwk12: "G126_HWK_12",
  rhmwpz: "G125_Spz_57_Rh",
  e50: "G54_E-50",
  e50m: "G73_E50_Ausf_M",
  e75: "G55_E-75",
  e100: "G56_E-100",
  jagdtiger: "G44_JagdTiger",
  jgpze100: "G72_JagdPz_E100",
  gwtigerp: "G94_GW_Tiger_P",
  gwe100: "G61_G_E",
  vk4502b: "G58_VK4502P",
  maus: "G42_Maus",
  t49: "A100_T49",
  sheridan: "A116_XM551",
  m46: "A63_M46_Patton",
  m48: "A120_M48A5",
  m103: "A66_M103",
  t110e5: "A69_T110E5",
  t95: "A40_T95",
  t110e3: "A85_T110E3",
  t92a: "A38_T92",
  t92: "A38_T92",
  lynx: "F114_Lynx_6x6",
  ebr105: "F108_Panhard_EBR_105",
  bc25tap: "F75_Char_de_25t",
  amx30b: "F72_AMX_30",
  amx50120: "F09_AMX_50_120",
  amx50b: "F10_AMX_50B",
  foch: "F37_AMX50_Foch",
  foch155: "F36_AMX_50Fosh_155",
  bat15555: "F67_Bat_Chatillon155_55",
  bat15558: "F38_Bat_Chatillon155_58",
  gsor: "GB103_GSOR3301_AVR_FS",
  manticore: "GB100_Manticore",
  cent71: "GB24_Centurion_Mk3",
  fv4202: "GB86_Centurion_Action_X",
  conqueror: "GB12_Conqueror",
  fv215b: "GB13_FV215b",
  tortoise: "GB32_Tortoise",
  fv215b183: "GB48_FV215b_183",
  fv3805: "GB30_FV3805",
  conqgc: "GB31_Conqueror_Gun",
  skodat50: "Cz04_T50",
  tvp51: "Cz04_T50_51",
  tnh10551: "Cz11_TNH_105_51",
  vz55: "Cz17_Vz_55",
  wz132a: "Ch28_WZ_132A",
  wz1321: "Ch29_Type_62C_prot",
  wz120: "Ch18_WZ-120",
  n121: "Ch19_121",
  wz11114: "Ch12_111_1_2_3",
  n113: "Ch22_113",
  wz111gft9: "Ch37_WZ111G_FT",
  wz113gft: "Ch38_WZ113G_FT",
  type61: "J15_STA_1",
  stb1: "J16_ST_B1",
  type5h: "J20_Type_2605",
  hori3: "J27_O_I_120",
  cs59: "Pl18_CS_59",
  cs63: "Pl21_CS_63",
  tp50p: "Pl13_50TP_Tyszkiewicza",
  tp60: "Pl15_60TP_Lewandowskiego",
  udes16: "S27_UDES_16",
  udes1516: "S28_UDES_15_16",
  emil2: "S17_EMIL_1952_E2",
  kranvagn: "S16_Kranvagn",
  strv1030: "S10_Strv_103_0_Series",
  strv103b: "S11_Strv_103B",
  bkan1: "S09_Bkan_1",
  progetto65: "It08_Progetto_M40_mod_65",
  rinoceronte: "It15_Rinoceronte",
  minotauro: "It23_CC_3",
  standardb: "It19_Progetto_C50_mod_66",
}

function urlOf(tag) {
  const key = tag.toLowerCase()
  return `${CDN}/${key}/${key}_image.png`
}

async function grab(id, tag) {
  const res = await fetch(urlOf(tag))
  if (!res.ok) return { id, tag, ok: false, status: res.status }
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < 2000) return { id, tag, ok: false, status: "tiny" }
  await writeFile(join(outDir, `${id}.png`), buf)
  return { id, tag, ok: true, bytes: buf.length }
}

await mkdir(outDir, { recursive: true })
const entries = Object.entries(TAGS)
const ok = []
const miss = []
for (let i = 0; i < entries.length; i += 6) {
  const chunk = entries.slice(i, i + 6)
  const got = await Promise.all(chunk.map(([id, tag]) => grab(id, tag)))
  for (const row of got) {
    if (row.ok) ok.push(row.id)
    else miss.push(`${row.id} (${row.tag} ${row.status})`)
    console.log(row.ok ? `ok ${row.id}` : `нет ${row.id} ${row.tag} ${row.status}`)
  }
}
console.log(`готово ${ok.length}, нет ${miss.length}`)
if (miss.length) console.log(miss.join("\n"))
