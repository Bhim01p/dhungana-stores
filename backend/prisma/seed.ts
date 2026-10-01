/**
 * Prisma Seed — Bishnu and Dhungana Stores
 * 8 main categories, 17 subcategories, and 50 Nepali kirana products
 *
 * Run: npm run seed
 */

import 'dotenv/config';
import { PrismaClient, Unit } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─────────────────────────────────────────────
// Seed Data
// ─────────────────────────────────────────────

const categories: Array<{ name: string; description: string; parentName?: string }> = [
  { name: 'Grains & Rice',      description: 'Chamal, beaten rice, and other grains' },
  { name: 'Flour & Pulses',     description: 'Maida, atta, dal, and lentils' },
  { name: 'Oil & Ghee',         description: 'Cooking oils and clarified butter' },
  { name: 'Sugar & Salt',       description: 'Chini, salt, and sweeteners' },
  { name: 'Noodles',            description: 'Instant noodles, biscuits, and savoury snacks' },
  { name: 'Spices & Masala',    description: 'Whole and ground spices, masala blends' },
  { name: 'Dairy',              description: 'Milk, curd, paneer, and eggs' },
  { name: 'Drinks',             description: 'Tea, coffee, juices, and other beverages' },
  { name: 'Rice', parentName: 'Grains & Rice', description: 'Basmati, jeera masino, and everyday rice' },
  { name: 'Chiura & Other Grains', parentName: 'Grains & Rice', description: 'Beaten rice and traditional grains' },
  { name: 'Flour & Semolina', parentName: 'Flour & Pulses', description: 'Atta, maida, and sooji' },
  { name: 'Pulses & Beans', parentName: 'Flour & Pulses', description: 'Lentils, beans, and chickpeas' },
  { name: 'Cooking Oils', parentName: 'Oil & Ghee', description: 'Everyday cooking oils' },
  { name: 'Ghee', parentName: 'Oil & Ghee', description: 'Ghee for cooking and traditional meals' },
  { name: 'Sugar', parentName: 'Sugar & Salt', description: 'White and brown sugar' },
  { name: 'Salt', parentName: 'Sugar & Salt', description: 'Iodised cooking salt' },
  { name: 'Instant Noodles', parentName: 'Noodles', description: 'Quick noodles and meal packs' },
  { name: 'Biscuits & Snacks', parentName: 'Noodles', description: 'Biscuits, chips, and savoury snacks' },
  { name: 'Ground Spices', parentName: 'Spices & Masala', description: 'Powdered spices for home cooking' },
  { name: 'Masala Blends', parentName: 'Spices & Masala', description: 'Ready-to-use masala blends' },
  { name: 'Milk', parentName: 'Dairy', description: 'Fresh, packaged, and everyday milk' },
  { name: 'Curd & Paneer', parentName: 'Dairy', description: 'Dahi, paneer, and fresh dairy foods' },
  { name: 'Eggs', parentName: 'Dairy', description: 'Farm eggs and everyday essentials' },
  { name: 'Tea & Coffee', parentName: 'Drinks', description: 'Tea and coffee for everyday cups' },
  { name: 'Juice & Soft Drinks', parentName: 'Drinks', description: 'Juices and soft drinks' },
];

type ProductSeed = {
  name: string;
  description: string;
  categoryName: string;
  brand: string;
  sku: string;
  price: string;
  unit: Unit;
  stockQuantity: number;
  lowStockThreshold: number;
  featured: boolean;
  image?: string;
};

const products: ProductSeed[] = [
  // Grains & Rice
  {
    name: 'Basmati Chamal',
    description: 'Premium long-grain basmati rice, aromatic and fluffy when cooked.',
    categoryName: 'Rice',
    brand: 'Shree Annapurna',
    sku: 'GR-001',
    price: '180.00',
    unit: Unit.kg,
    stockQuantity: 200,
    lowStockThreshold: 20,
    featured: true,
  },
  {
    name: 'Chiura (Beaten Rice)',
    description: 'Traditional Nepali beaten rice, ideal for snacks and quick meals.',
    categoryName: 'Chiura & Other Grains',
    brand: 'Himalayan Fields',
    sku: 'GR-002',
    image: 'https://nepalemarket.com/cdn/shop/products/setuchiura_1024x.jpg?v=1604247138',
    price: '90.00',
    unit: Unit.kg,
    stockQuantity: 150,
    lowStockThreshold: 15,
    featured: false,
  },
  {
    name: 'Kodo Ko Pitho',
    description: 'Millet flour, rich in fibre and a staple in hilly regions of Nepal.',
    categoryName: 'Flour & Semolina',
    brand: 'Pahadi Upahar',
    sku: 'GR-003',
    image: 'https://cdn2.blanxer.com/uploads/680b6d4f55cc9d321a0a6e14/product_image-kodoko-pitho-0753.webp',
    price: '120.00',
    unit: Unit.kg,
    stockQuantity: 80,
    lowStockThreshold: 10,
    featured: false,
  },

  // Flour & Pulses
  {
    name: 'Maida (All-Purpose Flour)',
    description: 'Fine white flour for roti, puri, and baking.',
    categoryName: 'Flour & Semolina',
    brand: 'Shree Annapurna',
    sku: 'FP-001',
    image: 'https://cdn0.woolworths.media/content/wowproductimages/large/155047.jpg',
    price: '75.00',
    unit: Unit.kg,
    stockQuantity: 300,
    lowStockThreshold: 30,
    featured: true,
  },
  {
    name: 'Musuro Dal (Red Lentil)',
    description: 'Split red lentils, cooks quickly and is a daily Nepali staple.',
    categoryName: 'Pulses & Beans',
    brand: 'Srijana',
    sku: 'FP-002',
    image: 'https://www.khadyanna.com/storage/products/2024/April/28/Mato_Langtang_Musuro_Dal_1714302428.webp',
    price: '145.00',
    unit: Unit.kg,
    stockQuantity: 180,
    lowStockThreshold: 20,
    featured: true,
  },
  {
    name: 'Chana Dal (Split Chickpea)',
    description: 'Yellow split chickpea dal, great for dal tarkari and snacks.',
    categoryName: 'Pulses & Beans',
    brand: 'Srijana',
    sku: 'FP-003',
    image: 'https://www.milanwholesale.com/storage/products/2024/December/30/9_20241228_180039_0008_1735551163.png',
    price: '130.00',
    unit: Unit.kg,
    stockQuantity: 120,
    lowStockThreshold: 15,
    featured: false,
  },

  // Oil & Ghee
  {
    name: 'Sunflower Cooking Oil',
    description: 'Light and healthy sunflower oil, suitable for all cooking methods.',
    categoryName: 'Cooking Oils',
    brand: 'Fortune',
    sku: 'OG-001',
    image: 'https://cdn.stopgrab.com/product/north-star/2023/oct/OugKFItsvSbahw0SCBne69gTYUbfYYmTZBwJ2xrT.png',
    price: '290.00',
    unit: Unit.litre,
    stockQuantity: 250,
    lowStockThreshold: 25,
    featured: true,
  },
  {
    name: 'Mustard Oil (Tori Ko Tel)',
    description: 'Traditional Nepali cold-pressed mustard oil with a pungent aroma.',
    categoryName: 'Cooking Oils',
    brand: 'Patanjali',
    sku: 'OG-002',
    image: 'https://static-01.daraz.com.np/p/91170dfe502561675f5b8c1658e29685.png',
    price: '320.00',
    unit: Unit.litre,
    stockQuantity: 180,
    lowStockThreshold: 20,
    featured: false,
  },
  {
    name: 'Pure Cow Ghee',
    description: 'Clarified butter made from pure cow milk. Rich flavour and aroma.',
    categoryName: 'Ghee',
    brand: 'Himalayan Dairy',
    sku: 'OG-003',
    image: 'https://static-01.daraz.com.np/p/1bc93a7af6255de6d7caff68609d0125.png',
    price: '950.00',
    unit: Unit.kg,
    stockQuantity: 60,
    lowStockThreshold: 10,
    featured: true,
  },

  // Sugar & Salt
  {
    name: 'Chini (White Sugar)',
    description: 'Refined white sugar for everyday use in tea, cooking, and baking.',
    categoryName: 'Sugar',
    brand: 'Himalayan Sugar',
    sku: 'SS-001',
    image: 'https://www.khadyanna.com/storage/products/2023/February/05/KHADYANNA_PRODUCT-3_1675599446.png',
    price: '85.00',
    unit: Unit.kg,
    stockQuantity: 400,
    lowStockThreshold: 40,
    featured: false,
  },
  {
    name: 'Nun (Iodised Salt)',
    description: 'Double-fortified iodised salt for healthy cooking.',
    categoryName: 'Salt',
    brand: 'Dharan Salt',
    sku: 'SS-002',
    image: 'https://netfornepal.com/122-thickbox_default/iodised-salt-1kg-salt1-salt1.jpg',
    price: '25.00',
    unit: Unit.kg,
    stockQuantity: 500,
    lowStockThreshold: 50,
    featured: false,
  },

  // Noodles & Snacks
  {
    name: 'Wai Wai Noodles',
    description: 'Nepal\'s most popular instant noodles. Ready to eat or cook.',
    categoryName: 'Instant Noodles',
    brand: 'CG Foods',
    sku: 'NS-001',
    price: '30.00',
    unit: Unit.packet,
    stockQuantity: 1000,
    lowStockThreshold: 100,
    featured: true,
    image: 'https://api.rasan.com.np/media/__sized__/uploads/products/7d171d88-b4ef-4dcf-9c2e-5e0f8f2aed0d_wai-wai-noodles-chicken-75gmctn-thumbnail-400x400-70.jpg',
  },
  {
    name: 'Mayos Biscuit',
    description: 'Classic cream biscuit, a favourite tea-time snack.',
    categoryName: 'Biscuits & Snacks',
    brand: 'Surya Nepal',
    sku: 'NS-002',
    price: '45.00',
    unit: Unit.packet,
    stockQuantity: 600,
    lowStockThreshold: 60,
    featured: false,
  },
  {
    name: 'Kurkure Masala Munch',
    description: 'Spicy and crunchy corn puffs, popular snack for all ages.',
    categoryName: 'Biscuits & Snacks',
    brand: 'PepsiCo',
    sku: 'NS-003',
    price: '25.00',
    unit: Unit.packet,
    stockQuantity: 800,
    lowStockThreshold: 80,
    featured: false,
    image: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy%2Cf_auto%2Cq_auto/NI_CATALOG/IMAGES/CIW/2026/2/10/7c533d41-2cdd-46f1-b1ad-8ab6031256d9_9159_1.png',
  },

  // Spices & Masala
  {
    name: 'Besar (Turmeric Powder)',
    description: 'Pure ground turmeric, an essential spice in every Nepali kitchen.',
    categoryName: 'Ground Spices',
    brand: 'Sochis',
    sku: 'SM-001',
    image: 'https://cdn.dmart.in/images/products/IPowderMasala100gEVRS3773XX301220_5_B.jpg',
    price: '55.00',
    unit: Unit.gram,
    stockQuantity: 300,
    lowStockThreshold: 30,
    featured: false,
  },
  {
    name: 'Dhania Powder (Coriander)',
    description: 'Freshly ground coriander powder for curries and gravies.',
    categoryName: 'Ground Spices',
    brand: 'Sochis',
    sku: 'SM-002',
    image: 'https://img.drz.lazcdn.com/static/np/p/d55fb74484c128260d5a87300521c255.jpg_720x720q80.jpg',
    price: '60.00',
    unit: Unit.gram,
    stockQuantity: 250,
    lowStockThreshold: 25,
    featured: false,
  },

  // Dairy & Eggs
  {
    name: 'Fresh Cow Milk',
    description: 'Pasteurised full-cream cow milk delivered fresh daily.',
    categoryName: 'Milk',
    brand: 'Dairy Development Corporation',
    sku: 'DE-001',
    price: '80.00',
    unit: Unit.litre,
    stockQuantity: 100,
    lowStockThreshold: 20,
    featured: true,
    image: 'https://cms.ddc.org.np/api/files/products/obxw79bkc7pi1b9/cow_milk_enhanced_8u85cgmlvn.png?thumb=256x256',
  },
  {
    name: 'Farm Eggs',
    description: 'Free-range farm eggs, rich in protein and nutrients.',
    categoryName: 'Eggs',
    brand: 'Kathmandu Farms',
    sku: 'DE-002',
    image: 'https://khetifood.com/image/cache/catalog/Egg3-500x500.jpg',
    price: '240.00',
    unit: Unit.dozen,
    stockQuantity: 150,
    lowStockThreshold: 20,
    featured: false,
  },

  // Beverages
  {
    name: 'Ilam Black Tea',
    description: 'Premium single-origin black tea from the Ilam hills of Nepal.',
    categoryName: 'Tea & Coffee',
    brand: 'Kanchanjangha Tea',
    sku: 'BV-001',
    price: '350.00',
    unit: Unit.gram,
    stockQuantity: 120,
    lowStockThreshold: 15,
    featured: true,
    image: 'https://www.baskotagroup.com/image/cache/catalog/packeted%20tea/106/Organic%20Black%20tea%20box-651x800.jpg',
  },
  {
    name: 'Nescafe Classic Instant Coffee',
    description: 'Rich and smooth instant coffee for a quick and easy brew.',
    categoryName: 'Tea & Coffee',
    brand: 'Nestle',
    sku: 'BV-002',
    price: '420.00',
    unit: Unit.gram,
    stockQuantity: 90,
    lowStockThreshold: 10,
    featured: false,
    image: 'https://esajee.com/public/uploads/media/7891000300503.png',
  },
  // More staples commonly found in Nepali neighborhood shops. Prices are
  // starter examples in NPR; confirm your own shelf prices before selling.
  { name: 'Jeera Masino Rice', description: 'Everyday aromatic jeera masino rice for dal-bhat and family meals.', categoryName: 'Rice', brand: 'Aashraya', sku: 'GR-004', price: '145.00', unit: Unit.kg, stockQuantity: 120, lowStockThreshold: 15, featured: true, image: 'https://www.milanwholesale.com/storage/products/2025/January/08/1_1736350343.jpg' },
  { name: 'Sona Mansuli Rice', description: 'Popular everyday rice variety for regular home cooking.', categoryName: 'Rice', brand: 'Local', sku: 'GR-005', price: '110.00', unit: Unit.kg, stockQuantity: 160, lowStockThreshold: 20, featured: false, image: 'https://nepalfoods.gov.np/p/6744691d63eac.png' },
  { name: 'Basmati Rice (Premium)', description: 'Long-grain aromatic rice for pulao, biryani, and special meals.', categoryName: 'Rice', brand: 'Local', sku: 'GR-006', price: '220.00', unit: Unit.kg, stockQuantity: 80, lowStockThreshold: 10, featured: false, image: 'https://api.rasan.com.np/media/__sized__/uploads/products/22441d9c-f6ed-4999-9557-9940966d817e_gyan-premium-basmati-rice-1kg25pktcrtn-thumbnail-400x400-70.jpg' },
  { name: 'Sooji (Semolina)', description: 'Coarse wheat semolina for halwa, upma, and snacks.', categoryName: 'Flour & Semolina', brand: 'Local', sku: 'GR-007', price: '100.00', unit: Unit.kg, stockQuantity: 60, lowStockThreshold: 10, featured: false, image: 'https://muncha.com/img/l90039.jpg' },
  { name: 'Aashirvaad Whole Wheat Atta', description: 'Whole wheat flour for roti and everyday home cooking.', categoryName: 'Flour & Semolina', brand: 'Aashirvaad', sku: 'FP-004', price: '110.00', unit: Unit.kg, stockQuantity: 100, lowStockThreshold: 15, featured: true, image: 'https://hiramart.net/cdn/shop/products/AashirvaadNepal5Kgok_1024x1024.jpg?v=1667207060' },
  { name: 'Moong Dal', description: 'Split mung beans for dal, khichdi, and soups.', categoryName: 'Pulses & Beans', brand: 'Local', sku: 'FP-005', price: '180.00', unit: Unit.kg, stockQuantity: 70, lowStockThreshold: 10, featured: false, image: 'https://www.khadyanna.com/storage/products/2023/March/03/KHADYANNA_PRODUCT-18_1677846547.png' },
  { name: 'Black Gram (Kalo Dal)', description: 'Whole black gram used in Nepali dal and traditional recipes.', categoryName: 'Pulses & Beans', brand: 'Local', sku: 'FP-006', price: '190.00', unit: Unit.kg, stockQuantity: 60, lowStockThreshold: 10, featured: false, image: 'https://organicventure.com.np/wp-content/uploads/2025/01/WhatsApp-Image-2025-01-17-at-14.16.24-2.jpeg' },
  { name: 'Kabuli Chana', description: 'Chickpeas for curry, chana chatpate, and snacks.', categoryName: 'Pulses & Beans', brand: 'Local', sku: 'FP-007', price: '190.00', unit: Unit.kg, stockQuantity: 60, lowStockThreshold: 10, featured: false, image: 'https://prithvienterprises.co.in/cdn/shop/files/full_screen_pro_527592jpgts1692432208_ab6959ec-9d23-4012-91f7-f66081a76bed.jpg?v=1745862851' },
  { name: 'Fortune Mustard Oil', description: 'Mustard oil for everyday cooking and pickles.', categoryName: 'Cooking Oils', brand: 'Fortune', sku: 'OG-004', price: '320.00', unit: Unit.litre, stockQuantity: 100, lowStockThreshold: 12, featured: true, image: 'https://static-01.daraz.com.np/p/8721e8fdd68e06d6db7c631d9a58e48d.jpg' },
  { name: 'Soybean Cooking Oil', description: 'Neutral cooking oil for frying and everyday meals.', categoryName: 'Cooking Oils', brand: 'Dhara', sku: 'OG-005', price: '280.00', unit: Unit.litre, stockQuantity: 100, lowStockThreshold: 12, featured: false, image: 'https://static-01.daraz.com.np/p/6aef1828ea81a137088fc32ae598540b.jpg' },
  { name: 'Tata Iodised Salt', description: 'Iodised table salt in a convenient household pack.', categoryName: 'Salt', brand: 'Tata', sku: 'SS-003', price: '35.00', unit: Unit.packet, stockQuantity: 200, lowStockThreshold: 25, featured: true, image: 'https://cdn.shopaccino.com/edible-smart/products/tata-salt-500946_l.jpg?v=704' },
  { name: 'Brown Sugar (Sakhar)', description: 'Unrefined brown sugar for tea, sweets, and cooking.', categoryName: 'Sugar', brand: 'Local', sku: 'SS-004', price: '130.00', unit: Unit.kg, stockQuantity: 40, lowStockThreshold: 8, featured: false, image: 'https://img.drz.lazcdn.com/static/np/p/5cc3f516a04b8ba37960796508ea654c.jpg_720x720q80.jpg' },
  { name: 'Wai Wai Veg Noodles', description: 'Vegetable-flavour instant noodles, a familiar Nepali snack and quick meal.', categoryName: 'Instant Noodles', brand: 'CG Foods', sku: 'NS-004', price: '25.00', unit: Unit.packet, stockQuantity: 500, lowStockThreshold: 50, featured: true, image: 'https://api.rasan.com.np/media/__sized__/uploads/products/7d171d88-b4ef-4dcf-9c2e-5e0f8f2aed0d_wai-wai-noodles-chicken-75gmctn-thumbnail-400x400-70.jpg' },
  { name: 'Current Masala Noodles', description: 'Spicy masala instant noodles made in Nepal.', categoryName: 'Instant Noodles', brand: 'Yashoda Foods', sku: 'NS-005', price: '25.00', unit: Unit.packet, stockQuantity: 400, lowStockThreshold: 50, featured: true, image: 'https://yashodafoods.com.np/wp-content/uploads/2024/03/current-masala-noodles.png' },
  { name: 'Current Masala Curry Noodles', description: 'Curry-style masala instant noodles from a Nepali brand.', categoryName: 'Instant Noodles', brand: 'Yashoda Foods', sku: 'NS-006', price: '25.00', unit: Unit.packet, stockQuantity: 300, lowStockThreshold: 40, featured: false, image: 'https://yashodafoods.com.np/wp-content/uploads/2025/12/Current-Masala-Curry-1024x627.png' },
  { name: 'Rara Chicken Noodles', description: 'Chicken-flavour instant noodles for a quick snack or meal.', categoryName: 'Instant Noodles', brand: 'Rara', sku: 'NS-007', price: '25.00', unit: Unit.packet, stockQuantity: 300, lowStockThreshold: 40, featured: false, image: 'https://mallko.store/cdn/shop/files/Rara_single_pack_grande.png?v=1783369247' },
  { name: '2PM Masala Noodles', description: 'Masala instant noodles from a popular Nepali snack brand.', categoryName: 'Instant Noodles', brand: '2PM', sku: 'NS-008', price: '25.00', unit: Unit.packet, stockQuantity: 300, lowStockThreshold: 40, featured: false, image: 'https://www.jiomart.com/images/product/original/494356046/2pm-premium-masala-noodle-60-g-product-images-o494356046-p609321015-0-202406111906.jpg?im=Resize%3D%281000%2C1000%29' },
  { name: 'Britannia Marie Gold Biscuits', description: 'Light tea-time Marie biscuits.', categoryName: 'Biscuits & Snacks', brand: 'Britannia', sku: 'NS-009', price: '50.00', unit: Unit.packet, stockQuantity: 100, lowStockThreshold: 15, featured: true, image: 'https://cdn.grofers.com/cdn-cgi/image/f%3Dauto%2Cfit%3Dscale-down%2Cq%3D70%2Cmetadata%3Dnone%2Cw%3D1080/da/cms-assets/cms/product/e607d740-dd7f-440b-a753-0ef134c35a8b.png' },
  { name: 'Parle-G Glucose Biscuits', description: 'Classic glucose biscuits for tea and snacks.', categoryName: 'Biscuits & Snacks', brand: 'Parle', sku: 'NS-010', price: '25.00', unit: Unit.packet, stockQuantity: 150, lowStockThreshold: 20, featured: true, image: 'https://services.kpnfarmfresh.com/media/v1/products/images/dc380bb5-142e-482e-a5a8-1e92ed1f2767/parleg-glucose-biscuits-super-save-pack.webp?c_type=C1' },
  { name: 'Lay’s Magic Masala Chips', description: 'Seasoned potato chips in a single-serve packet.', categoryName: 'Biscuits & Snacks', brand: 'Lay’s', sku: 'NS-011', price: '30.00', unit: Unit.packet, stockQuantity: 100, lowStockThreshold: 15, featured: false, image: 'https://www.milanwholesale.com/storage/products/2024/December/01/13_1733032143.jpg' },
  { name: 'Everest Turmeric Powder', description: 'Packaged turmeric powder for daily cooking.', categoryName: 'Ground Spices', brand: 'Everest', sku: 'SM-003', price: '65.00', unit: Unit.gram, stockQuantity: 100, lowStockThreshold: 12, featured: true, image: 'https://cdn.dmart.in/images/products/IPowderMasala100gEVRS3773XX301220_5_B.jpg' },
  { name: 'Everest Cumin Powder', description: 'Ground cumin for curries, achar, and spice mixes.', categoryName: 'Ground Spices', brand: 'Everest', sku: 'SM-004', price: '75.00', unit: Unit.gram, stockQuantity: 80, lowStockThreshold: 10, featured: false, image: 'https://cdn.grofers.com/da/cms-assets/cms/product/80036238-10f4-45be-9183-8bcf9ad66374.jpg' },
  { name: 'Everest Red Chilli Powder', description: 'Ground red chilli to add heat to everyday dishes.', categoryName: 'Ground Spices', brand: 'Everest', sku: 'SM-005', price: '70.00', unit: Unit.gram, stockQuantity: 80, lowStockThreshold: 10, featured: false, image: 'https://bazaar5.com/image/cache/catalog/pro/product/10005/everest-tikhalal-chilli-powder-100-g-product-images-o490000109-p490000109-0-202203151655-1000x1000.jpg' },
  { name: 'Meat Masala', description: 'Spice blend for Nepali-style meat curries.', categoryName: 'Masala Blends', brand: 'Everest', sku: 'SM-006', price: '80.00', unit: Unit.packet, stockQuantity: 70, lowStockThreshold: 10, featured: false, image: 'https://www.milanwholesale.com/storage/products/2026/January/13/everest-meat-masala-890637_l_1768291630.jpg' },
  { name: 'DDC Standard Milk', description: 'Pasteurised standard milk from Dairy Development Corporation.', categoryName: 'Milk', brand: 'DDC', sku: 'DE-003', price: '50.00', unit: Unit.packet, stockQuantity: 80, lowStockThreshold: 12, featured: true, image: 'https://sewapoint.com/kirana-images/68169c809c8644db-968c9fd4d6e8e6b8.png' },
  { name: 'DDC Dahi (Curd)', description: 'Fresh set curd for meals and snacks.', categoryName: 'Curd & Paneer', brand: 'DDC', sku: 'DE-004', price: '90.00', unit: Unit.piece, stockQuantity: 40, lowStockThreshold: 8, featured: false, image: 'https://muncha.com/img/l88914.jpg' },
  { name: 'Paneer', description: 'Fresh paneer for curry, snacks, and family meals.', categoryName: 'Curd & Paneer', brand: 'Local Dairy', sku: 'DE-005', price: '220.00', unit: Unit.piece, stockQuantity: 30, lowStockThreshold: 6, featured: false, image: 'https://pasal101.thulo.com.np/assets/tenant/uploads/media-uploader/pasal101/grid/grid-20240628012311_1317663947.jpg' },
  { name: 'Tokla Tea', description: 'Nepali tea for everyday milk tea and black tea.', categoryName: 'Tea & Coffee', brand: 'Tokla', sku: 'BV-003', price: '180.00', unit: Unit.gram, stockQuantity: 80, lowStockThreshold: 10, featured: true, image: 'https://api.rasan.com.np/media/__sized__/uploads/products/1d07194d-4a2d-4e28-b6dc-25252fbbe7df_tokla-tea-50gm10pcs1pkt-24pktcrtn-thumbnail-400x400-70.jpg' },
  { name: 'Dabur Real Mango Juice', description: 'Mango fruit drink for home and lunch boxes.', categoryName: 'Juice & Soft Drinks', brand: 'Dabur', sku: 'BV-004', price: '180.00', unit: Unit.litre, stockQuantity: 40, lowStockThreshold: 8, featured: false, image: 'https://spicedivine.com/cdn/shop/products/de_30_1078x1078.png?v=1674758121' },
  { name: 'Nescafe Classic Coffee Jar', description: 'Instant coffee in a resealable jar.', categoryName: 'Tea & Coffee', brand: 'Nestle', sku: 'BV-005', price: '550.00', unit: Unit.gram, stockQuantity: 40, lowStockThreshold: 6, featured: false, image: 'https://esajee.com/public/uploads/media/7891000300503.png' },
];

// ─────────────────────────────────────────────
// Main seed function
// ─────────────────────────────────────────────

async function main() {
  console.log('\n🌱  Starting seed for Bishnu and Dhungana Stores...\n');

  // 1. Upsert categories
  const categoryMap = new Map<string, string>(); // name → id

  for (const cat of categories) {
    const slug = slugify(cat.name);
    const parentId = cat.parentName ? categoryMap.get(cat.parentName) : null;
    if (cat.parentName && !parentId) {
      console.error(`  ✘ Parent category not found for: ${cat.name}`);
      continue;
    }
    const record = await prisma.category.upsert({
      where: { slug },
      update: { name: cat.name, description: cat.description, active: true, parentId },
      create: {
        name: cat.name,
        slug,
        description: cat.description,
        active: true,
        parentId,
      },
    });
    categoryMap.set(cat.name, record.id);
    console.log(`  ✔ Category: ${cat.name}`);
  }

  // 2. Upsert products
  console.log('');
  for (const prod of products) {
    const categoryId = categoryMap.get(prod.categoryName);
    if (!categoryId) {
      console.error(`  ✘ Category not found for product: ${prod.name}`);
      continue;
    }

    const slug = slugify(prod.name);
    const existing = await prisma.product.findUnique({ where: { slug }, select: { id: true, image: true } });
    if (existing) {
      // Keep store-managed values (price, stock, active status, description); only
      // fill an empty photo when a sourced product photo is available.
      if (!existing.image && prod.image) {
        await prisma.product.update({ where: { id: existing.id }, data: { image: prod.image } });
      }
      console.log(`  ↷ Existing product kept: ${prod.name}`);
      continue;
    }
    await prisma.product.create({
      data: {
        name: prod.name,
        slug,
        description: prod.description,
        categoryId,
        brand: prod.brand,
        sku: prod.sku,
        price: new Decimal(prod.price),
        unit: prod.unit,
        stockQuantity: prod.stockQuantity,
        lowStockThreshold: prod.lowStockThreshold,
        featured: prod.featured,
        active: true,
        image: prod.image,
      },
    });
    console.log(`  ✔ Product : ${prod.name} (${prod.brand}) — NPR ${prod.price}/${prod.unit}`);
  }

  console.log('\n✅  Seed complete!');
  console.log(`    Categories : ${categories.length}`);
  console.log(`    Products   : ${products.length}\n`);
}

main()
  .catch((e) => {
    console.error('❌  Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
