/**
 * Maps category slugs (and partial name matches) to emoji icons.
 * Falls back to a generic basket emoji if no match is found.
 */
const ICON_MAP: Record<string, string> = {
  // by slug
  'grains-rice':    '🌾',
  'flour-pulses':   '🫘',
  'oil-ghee':       '🫙',
  'sugar-salt':     '🧂',
  'noodles-snacks': '🍜',
  'spices-masala':  '🌶️',
  'dairy-eggs':     '🥛',
  'beverages':      '☕',
  // keyword fallbacks
  grain:    '🌾',
  rice:     '🌾',
  flour:    '🫘',
  pulse:    '🫘',
  dal:      '🫘',
  lentil:   '🫘',
  oil:      '🫙',
  ghee:     '🫙',
  sugar:    '🍬',
  salt:     '🧂',
  noodle:   '🍜',
  snack:    '🍿',
  biscuit:  '🍪',
  spice:    '🌶️',
  masala:   '🌶️',
  dairy:    '🥛',
  milk:     '🥛',
  egg:      '🥚',
  beverage: '☕',
  tea:      '🍵',
  coffee:   '☕',
  drink:    '🥤',
};

export function getCategoryIcon(slug: string, name?: string): string {
  // exact slug match first
  if (ICON_MAP[slug]) return ICON_MAP[slug];

  // keyword scan on slug
  for (const [key, icon] of Object.entries(ICON_MAP)) {
    if (slug.includes(key)) return icon;
  }

  // keyword scan on name if provided
  if (name) {
    const lower = name.toLowerCase();
    for (const [key, icon] of Object.entries(ICON_MAP)) {
      if (lower.includes(key)) return icon;
    }
  }

  return '🧺';
}
