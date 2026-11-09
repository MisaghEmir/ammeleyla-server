
export function normalizeIranPhone(phone: string): string | null {
  let value = phone.replace(/[\s()-]/g, "");

  if (value.startsWith("+98")) {
    value = "0" + value.slice(3);
  } else if (value.startsWith("0098")) {
    value = "0" + value.slice(4);
  } else if (value.startsWith("98")) {
    value = "0" + value.slice(2);
  }

  if (!/^09\d{9}$/.test(value)) {
    return null;
  }

  return value;
}
