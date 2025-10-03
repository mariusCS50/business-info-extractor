export async function getEmails(page) {
  // TODO: extract emails from page (regex + mailto:)
  return [];
}

export async function getPhones(page) {
  // TODO: extract phone numbers (+40, 07, 03 patterns)
  return [];
}

export async function getCompanyName(page) {
  // TODO: detect SRL, SC patterns, maybe from title or footer
  return [];
}

export async function getCUI(page) {
  // TODO: detect RO + 6-10 digits
  return [];
}