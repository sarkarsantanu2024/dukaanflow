/**
 * Starter catalogues by shop type.
 *
 * Dictating two hundred items is an evening's work, and an owner facing a blank
 * list on day one very often simply stops. These are the things a shop of each
 * kind almost always carries, already named in all three languages with the
 * units Indian retail actually uses — so the owner ticks what they sell and is
 * left with only prices to fill in.
 *
 * Prices are deliberately absent. A suggested price is a wrong price, and a
 * shop that ships with wrong prices is worse than one that ships empty.
 */

import type { ShopType } from '@prisma/client';

export type StarterItem = {
  name: string;
  nameBn: string;
  nameHi: string;
  unit: string;
  category: string;
};

const GROCERY: StarterItem[] = [
  { name: 'Rice', nameBn: 'চাল', nameHi: 'चावल', unit: '1 kg', category: 'Staples' },
  { name: 'Basmati Rice', nameBn: 'বাসমতি চাল', nameHi: 'बासमती चावल', unit: '1 kg', category: 'Staples' },
  { name: 'Atta', nameBn: 'আটা', nameHi: 'आटा', unit: '1 kg', category: 'Staples' },
  { name: 'Maida', nameBn: 'ময়দা', nameHi: 'मैदा', unit: '500 g', category: 'Staples' },
  { name: 'Suji', nameBn: 'সুজি', nameHi: 'सूजी', unit: '500 g', category: 'Staples' },
  { name: 'Masoor Dal', nameBn: 'মুসুর ডাল', nameHi: 'मसूर दाल', unit: '500 g', category: 'Staples' },
  { name: 'Moong Dal', nameBn: 'মুগ ডাল', nameHi: 'मूंग दाल', unit: '500 g', category: 'Staples' },
  { name: 'Chana Dal', nameBn: 'ছোলার ডাল', nameHi: 'चना दाल', unit: '500 g', category: 'Staples' },
  { name: 'Sugar', nameBn: 'চিনি', nameHi: 'चीनी', unit: '1 kg', category: 'Staples' },
  { name: 'Salt', nameBn: 'নুন', nameHi: 'नमक', unit: '1 kg', category: 'Staples' },

  { name: 'Mustard Oil', nameBn: 'সরিষার তেল', nameHi: 'सरसों का तेल', unit: '1 l', category: 'Oil & Ghee' },
  { name: 'Sunflower Oil', nameBn: 'সূর্যমুখী তেল', nameHi: 'सूरजमुखी तेल', unit: '1 l', category: 'Oil & Ghee' },
  { name: 'Ghee', nameBn: 'ঘি', nameHi: 'घी', unit: '500 g', category: 'Oil & Ghee' },

  { name: 'Turmeric', nameBn: 'হলুদ', nameHi: 'हल्दी', unit: '100 g', category: 'Spices' },
  { name: 'Chilli Powder', nameBn: 'লঙ্কা গুঁড়ো', nameHi: 'मिर्च पाउडर', unit: '100 g', category: 'Spices' },
  { name: 'Cumin', nameBn: 'জিরা', nameHi: 'जीरा', unit: '100 g', category: 'Spices' },
  { name: 'Coriander', nameBn: 'ধনে', nameHi: 'धनिया', unit: '100 g', category: 'Spices' },
  { name: 'Garam Masala', nameBn: 'গরম মশলা', nameHi: 'गरम मसाला', unit: '50 g', category: 'Spices' },

  { name: 'Potato', nameBn: 'আলু', nameHi: 'आलू', unit: '1 kg', category: 'Vegetables' },
  { name: 'Onion', nameBn: 'পেঁয়াজ', nameHi: 'प्याज', unit: '1 kg', category: 'Vegetables' },
  { name: 'Tomato', nameBn: 'টমেটো', nameHi: 'टमाटर', unit: '500 g', category: 'Vegetables' },
  { name: 'Garlic', nameBn: 'রসুন', nameHi: 'लहसुन', unit: '250 g', category: 'Vegetables' },
  { name: 'Ginger', nameBn: 'আদা', nameHi: 'अदरक', unit: '250 g', category: 'Vegetables' },
  { name: 'Green Chilli', nameBn: 'কাঁচা লঙ্কা', nameHi: 'हरी मिर्च', unit: '100 g', category: 'Vegetables' },

  { name: 'Milk', nameBn: 'দুধ', nameHi: 'दूध', unit: '500 ml', category: 'Dairy' },
  { name: 'Curd', nameBn: 'দই', nameHi: 'दही', unit: '400 g', category: 'Dairy' },
  { name: 'Paneer', nameBn: 'পনির', nameHi: 'पनीर', unit: '200 g', category: 'Dairy' },
  { name: 'Egg', nameBn: 'ডিম', nameHi: 'अंडा', unit: '6 pc', category: 'Dairy' },

  { name: 'Tea', nameBn: 'চা', nameHi: 'चाय', unit: '250 g', category: 'Tea & Coffee' },
  { name: 'Biscuit Pack', nameBn: 'বিস্কুট প্যাকেট', nameHi: 'बिस्कुट पैकेट', unit: '', category: 'Snacks' },
  { name: 'Bread', nameBn: 'পাউরুটি', nameHi: 'ब्रेड', unit: '', category: 'Snacks' },
  { name: 'Soap', nameBn: 'সাবান', nameHi: 'साबुन', unit: '', category: 'Household' },
  { name: 'Detergent', nameBn: 'ডিটারজেন্ট', nameHi: 'डिटर्जेंट', unit: '1 kg', category: 'Household' },
];

const RESTAURANT: StarterItem[] = [
  { name: 'Veg Chowmein', nameBn: 'ভেজ চাউমিন', nameHi: 'वेज चाउमिन', unit: '1 plate', category: 'Chinese' },
  { name: 'Chicken Chowmein', nameBn: 'চিকেন চাউমিন', nameHi: 'चिकन चाउमिन', unit: '1 plate', category: 'Chinese' },
  { name: 'Veg Fried Rice', nameBn: 'ভেজ ফ্রায়েড রাইস', nameHi: 'वेज फ्राइड राइस', unit: '1 plate', category: 'Chinese' },
  { name: 'Chilli Chicken', nameBn: 'চিলি চিকেন', nameHi: 'चिली चिकन', unit: '1 plate', category: 'Chinese' },
  { name: 'Veg Momo', nameBn: 'ভেজ মোমো', nameHi: 'वेज मोमो', unit: '8 pc', category: 'Momo' },
  { name: 'Chicken Momo', nameBn: 'চিকেন মোমো', nameHi: 'चिकन मोमो', unit: '8 pc', category: 'Momo' },
  { name: 'Egg Roll', nameBn: 'ডিম রোল', nameHi: 'अंडा रोल', unit: '', category: 'Rolls' },
  { name: 'Chicken Roll', nameBn: 'চিকেন রোল', nameHi: 'चिकन रोल', unit: '', category: 'Rolls' },
  { name: 'Paneer Roll', nameBn: 'পনির রোল', nameHi: 'पनीर रोल', unit: '', category: 'Rolls' },
  { name: 'Chicken Biryani', nameBn: 'চিকেন বিরিয়ানি', nameHi: 'चिकन बिरयानी', unit: '1 plate', category: 'Biryani' },
  { name: 'Mutton Biryani', nameBn: 'মাটন বিরিয়ানি', nameHi: 'मटन बिरयानी', unit: '1 plate', category: 'Biryani' },
  { name: 'Fish Fry', nameBn: 'মাছ ভাজা', nameHi: 'फिश फ्राई', unit: '1 pc', category: 'Non-veg' },
  { name: 'Cold Drink', nameBn: 'ঠান্ডা পানীয়', nameHi: 'कोल्ड ड्रिंक', unit: '250 ml', category: 'Beverages' },
  { name: 'Water Bottle', nameBn: 'জলের বোতল', nameHi: 'पानी की बोतल', unit: '1 l', category: 'Beverages' },
];

const TEA_STALL: StarterItem[] = [
  { name: 'Tea', nameBn: 'চা', nameHi: 'चाय', unit: '1 cup', category: 'Tea & Coffee' },
  { name: 'Lemon Tea', nameBn: 'লেবু চা', nameHi: 'नींबू चाय', unit: '1 cup', category: 'Tea & Coffee' },
  { name: 'Coffee', nameBn: 'কফি', nameHi: 'कॉफ़ी', unit: '1 cup', category: 'Tea & Coffee' },
  { name: 'Biscuit', nameBn: 'বিস্কুট', nameHi: 'बिस्कुट', unit: '', category: 'Snacks' },
  { name: 'Samosa', nameBn: 'সিঙাড়া', nameHi: 'समोसा', unit: '1 pc', category: 'Snacks' },
  { name: 'Toast', nameBn: 'টোস্ট', nameHi: 'टोस्ट', unit: '', category: 'Snacks' },
  { name: 'Omelette', nameBn: 'অমলেট', nameHi: 'ऑमलेट', unit: '', category: 'Snacks' },
  { name: 'Cold Drink', nameBn: 'ঠান্ডা পানীয়', nameHi: 'कोल्ड ड्रिंक', unit: '250 ml', category: 'Beverages' },
  { name: 'Water Bottle', nameBn: 'জলের বোতল', nameHi: 'पानी की बोतल', unit: '1 l', category: 'Beverages' },
];

const BAKERY: StarterItem[] = [
  { name: 'Bread', nameBn: 'পাউরুটি', nameHi: 'ब्रेड', unit: '', category: 'Bakery' },
  { name: 'Cake Slice', nameBn: 'কেকের টুকরো', nameHi: 'केक स्लाइस', unit: '1 pc', category: 'Bakery' },
  { name: 'Patties', nameBn: 'প্যাটিস', nameHi: 'पैटीज़', unit: '1 pc', category: 'Bakery' },
  { name: 'Cream Roll', nameBn: 'ক্রিম রোল', nameHi: 'क्रीम रोल', unit: '1 pc', category: 'Bakery' },
  { name: 'Cookies', nameBn: 'কুকিজ', nameHi: 'कुकीज़', unit: '250 g', category: 'Bakery' },
  { name: 'Rusk', nameBn: 'রাস্ক', nameHi: 'रस्क', unit: '200 g', category: 'Bakery' },
  { name: 'Birthday Cake', nameBn: 'জন্মদিনের কেক', nameHi: 'बर्थडे केक', unit: '500 g', category: 'Bakery' },
];

const HOME_KITCHEN: StarterItem[] = [
  { name: 'Rice & Dal', nameBn: 'ভাত ও ডাল', nameHi: 'चावल-दाल', unit: '1 plate', category: 'Meals' },
  { name: 'Veg Thali', nameBn: 'ভেজ থালি', nameHi: 'वेज थाली', unit: '1 plate', category: 'Meals' },
  { name: 'Chicken Thali', nameBn: 'চিকেন থালি', nameHi: 'चिकन थाली', unit: '1 plate', category: 'Meals' },
  { name: 'Fish Curry', nameBn: 'মাছের ঝোল', nameHi: 'मछली करी', unit: '1 plate', category: 'Meals' },
  { name: 'Roti', nameBn: 'রুটি', nameHi: 'रोटी', unit: '1 pc', category: 'Meals' },
  { name: 'Paratha', nameBn: 'পরোটা', nameHi: 'पराठा', unit: '1 pc', category: 'Meals' },
  { name: 'Pickle', nameBn: 'আচার', nameHi: 'अचार', unit: '200 g', category: 'Extras' },
  { name: 'Sweet', nameBn: 'মিষ্টি', nameHi: 'मिठाई', unit: '1 pc', category: 'Extras' },
];

/** Roll & momo counters share the restaurant list, trimmed to what they sell. */
const ROLL_MOMO: StarterItem[] = RESTAURANT.filter((item) =>
  ['Rolls', 'Momo', 'Chinese', 'Beverages'].includes(item.category),
);

const BY_TYPE: Record<ShopType, StarterItem[]> = {
  GROCERY: GROCERY,
  RESTAURANT: RESTAURANT,
  TEA_STALL: TEA_STALL,
  ROLL_MOMO: ROLL_MOMO,
  HOME_KITCHEN: HOME_KITCHEN,
  BAKERY: BAKERY,
  OTHER: GROCERY,
};

export function starterCatalogue(type: ShopType): StarterItem[] {
  return BY_TYPE[type] ?? GROCERY;
}

/** The name to show a starter item under, in the owner's language. */
export function starterName(item: StarterItem, locale: 'en' | 'bn' | 'hi'): string {
  if (locale === 'bn') return item.nameBn || item.name;
  if (locale === 'hi') return item.nameHi || item.name;
  return item.name;
}
