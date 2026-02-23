// js/variants/VariantRegistry.js — Register/load game variant modules

const variants = new Map();

export function registerVariant(config) {
  variants.set(config.id, config);
}

export function getVariant(id) {
  return variants.get(id);
}

export function listVariants() {
  return Array.from(variants.values()).map(v => ({
    id: v.id,
    name: v.name,
    description: v.description,
    playerRange: v.playerRange,
  }));
}
