export function cleanNick(raw: string): string {
  return raw.trim().replace(/\s+/g, " ")
}

export function nickKey(nick: string): string {
  return nick.toLocaleLowerCase("ru")
}

export function nickError(nick: string): string | null {
  if (nick.length < 2) return "короткий ник"
  if (nick.length > 16) return "длинный ник"
  if (!/^[\p{L}\p{N}_ -]+$/u.test(nick)) return "другие знаки"
  return null
}
