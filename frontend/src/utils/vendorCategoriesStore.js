// src/utils/vendorCategoriesStore.js

const DEFAULT_VENDOR_CATEGORIES = [
  {
    id: 'cat-raw-mat',
    name: 'Raw Materials',
    description: 'Food grains, pulses, spices, edible oils, and manufacturing ingredients',
    subCategories: ['Spices & Masala', 'Grains & Millets', 'Urad & Dal Flours', 'Edible Oils & Fats', 'Salt & Additives']
  },
  {
    id: 'cat-pkg-mat',
    name: 'Packaging Materials',
    description: 'Pouches, outer boxes, corrugated shippers, tapes, and moisture films',
    subCategories: ['Printed Foil Pouches', 'Corrugated Shipping Boxes', 'Sealing Tapes & Straps', 'Laminated Roll Films']
  },
  {
    id: 'cat-lbl-prn',
    name: 'Labeling & Printing',
    description: 'Nutritional labeling stickers, barcode prints, and custom branding materials',
    subCategories: ['Nutritional Label Stickers', 'Barcode & MRP Labels', 'Brand Inserts & Flyers']
  },
  {
    id: 'cat-eqp-mac',
    name: 'Equipment & Machinery',
    description: 'Grinding units, mixing bowls, pouch sealing machines, and lab equipment',
    subCategories: ['Grinding & Pulverizer Spares', 'Automatic Sealing Machines', 'Lab Testing Equipment']
  },
  {
    id: 'cat-log-trn',
    name: 'Logistics & Transportation',
    description: 'Freight carriers, local dispatch vans, and warehousing logistics',
    subCategories: ['Inter-State Freight', 'Local Dispatch Vehicles', 'Cold Storage Logistics']
  },
  {
    id: 'cat-srv-mnt',
    name: 'Services & Maintenance',
    description: 'FSSAI audit services, machine servicing, and pest control contracts',
    subCategories: ['Machinery AMC Services', 'Quality Lab Testing Services', 'FSSAI Licensing & Audits']
  }
];

const STORAGE_KEY = 'mansara_vendor_categories';

export function getStoredVendorCategories() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Failed to parse vendor categories from storage:', err);
  }
  return DEFAULT_VENDOR_CATEGORIES;
}

export function saveStoredVendorCategories(categories) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    window.dispatchEvent(new Event('vendor_categories_updated'));
  } catch (err) {
    console.error('Failed to save vendor categories:', err);
  }
}

export function getFlatCategoryOptions() {
  const categories = getStoredVendorCategories();
  const options = [];
  categories.forEach(cat => {
    options.push(cat.name);
    if (cat.subCategories && cat.subCategories.length > 0) {
      cat.subCategories.forEach(sub => {
        options.push(`${cat.name} > ${sub}`);
      });
    }
  });
  return options;
}
