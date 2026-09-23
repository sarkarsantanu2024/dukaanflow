/**
 * Starter catalogues by shop type.
 *
 * Dictating two hundred items is an evening's work, and an owner facing a blank
 * list on day one very often simply stops. These are the things a shop of each
 * kind almost always carries, already named in all three languages with the
 * units Indian retail actually uses — so the owner ticks what they sell and is
 * left with only prices to check.
 *
 * PRICES ARE A STARTING POINT, NOT A PRICE.
 *
 * They used to be absent on the reasoning that a suggested price is a wrong
 * price. That was right about the risk and wrong about the alternative: what
 * "absent" actually meant was every item landing at a Re 1 placeholder, so an
 * owner who ticked sixty items faced sixty rows reading ₹1 and a banner telling
 * them customers could see none of it. Most of them stopped there. A number in
 * the right neighbourhood that the owner corrects beats a number that is
 * obviously wrong and has to be replaced from nothing sixty times.
 *
 * So the risk is handled where it belongs: an item added from this list is
 * still `priced: false` and still invisible to customers until somebody says
 * the number is right. Nothing here reaches a shopper unreviewed.
 *
 * These are typical Kolkata retail figures for the pack size given, and they
 * are stale the day they are written — pulses and vegetables move every month.
 * They exist to be corrected, not trusted.
 *
 * Units work the same way: these are the pack sizes a kirana actually sells in,
 * but every one of them is editable, because a shop that weighs rice by the
 * 5 kg bag should not have to fight a list that assumes 1 kg.
 *
 * This file is the cheapest thing in the product. It is static, it ships in the
 * bundle, it costs no database rows and no queries, and it does not grow with
 * the number of shops — so it is the right place to be generous. Only the items
 * an owner actually ticks ever become rows.
 *
 * NAMES ARE THE THING SOLD, NOT THE SHELF IT SITS ON. "Rice", "Atta", "Milk",
 * "Tea", "Detergent" were all in here once, and every one of them reads as a
 * heading rather than as something a customer can put in a basket: a shop page
 * offering "Rice" has told the shopper nothing, and the owner cannot price it,
 * because miniket and gobindobhog are not one price. So the generic entries are
 * gone or specific now — Whole Wheat Atta, Cow Milk, CTC Tea, Detergent Powder —
 * which is also how every quick-commerce app the same customer uses names them.
 * A new entry that could plausibly be a category heading is the wrong entry.
 *
 * Regional note: this leans Bengali/Eastern-Indian because that is where the
 * first shops are. Gobindobhog rice, panch phoron and jhinge belong on a
 * Kolkata kirana's list and would be noise in Gujarat. When the product moves,
 * the list should move with it rather than becoming a national average that
 * fits nowhere.
 */

import type { ShopType } from '@prisma/client';

export type StarterItem = {
  name: string;
  nameBn: string;
  nameHi: string;
  unit: string;
  /**
   * What this typically costs at the pack size above, in PAISE.
   *
   * Named in paise, like every other money value in the codebase, so nobody
   * ever wonders. It is a suggestion the owner confirms — see the note at the
   * top of this file — never a price a customer sees on its own.
   */
  pricePaise: number;
  category: string;
};

const GROCERY: StarterItem[] = [
  // Rice & Atta
  { name: 'Basmati Rice', nameBn: 'বাসমতি চাল', nameHi: 'बासमती चावल', unit: '1 kg', pricePaise: 13000, category: 'Rice & Atta' },
  { name: 'Gobindobhog Rice', nameBn: 'গোবিন্দভোগ চাল', nameHi: 'गोबिंदभोग चावल', unit: '1 kg', pricePaise: 11000, category: 'Rice & Atta' },
  { name: 'Whole Wheat Atta', nameBn: 'গমের আটা', nameHi: 'गेहूं का आटा', unit: '1 kg', pricePaise: 4500, category: 'Rice & Atta' },
  { name: 'Maida', nameBn: 'ময়দা', nameHi: 'मैदा', unit: '500 g', pricePaise: 2800, category: 'Rice & Atta' },
  { name: 'Suji', nameBn: 'সুজি', nameHi: 'सूजी', unit: '500 g', pricePaise: 3000, category: 'Rice & Atta' },
  { name: 'Besan', nameBn: 'বেসন', nameHi: 'बेसन', unit: '500 g', pricePaise: 6000, category: 'Rice & Atta' },
  { name: 'Rice Flour', nameBn: 'চালের গুঁড়ো', nameHi: 'चावल का आटा', unit: '500 g', pricePaise: 3000, category: 'Rice & Atta' },
  { name: 'Poha', nameBn: 'চিঁড়ে', nameHi: 'पोहा', unit: '500 g', pricePaise: 3000, category: 'Rice & Atta' },
  { name: 'Muri', nameBn: 'মুড়ি', nameHi: 'मुरमुरे', unit: '500 g', pricePaise: 3500, category: 'Rice & Atta' },
  { name: 'Sabudana', nameBn: 'সাবুদানা', nameHi: 'साबूदाना', unit: '250 g', pricePaise: 3000, category: 'Rice & Atta' },
  { name: 'Daliya', nameBn: 'ডালিয়া', nameHi: 'दलिया', unit: '500 g', pricePaise: 3500, category: 'Rice & Atta' },

  // Dal & Pulses
  { name: 'Masoor Dal', nameBn: 'মুসুর ডাল', nameHi: 'मसूर दाल', unit: '500 g', pricePaise: 5500, category: 'Dal & Pulses' },
  { name: 'Moong Dal', nameBn: 'মুগ ডাল', nameHi: 'मूंग दाल', unit: '500 g', pricePaise: 7000, category: 'Dal & Pulses' },
  { name: 'Chana Dal', nameBn: 'ছোলার ডাল', nameHi: 'चना दाल', unit: '500 g', pricePaise: 4500, category: 'Dal & Pulses' },
  { name: 'Toor Dal', nameBn: 'অড়হর ডাল', nameHi: 'तूर दाल', unit: '500 g', pricePaise: 8500, category: 'Dal & Pulses' },
  { name: 'Urad Dal', nameBn: 'বিউলির ডাল', nameHi: 'उड़द दाल', unit: '500 g', pricePaise: 7000, category: 'Dal & Pulses' },
  { name: 'Rajma', nameBn: 'রাজমা', nameHi: 'राजमा', unit: '500 g', pricePaise: 7000, category: 'Dal & Pulses' },
  { name: 'Kabuli Chana', nameBn: 'কাবুলি ছোলা', nameHi: 'काबुली चना', unit: '500 g', pricePaise: 6000, category: 'Dal & Pulses' },
  { name: 'Kala Chana', nameBn: 'কালো ছোলা', nameHi: 'काला चना', unit: '500 g', pricePaise: 4500, category: 'Dal & Pulses' },
  { name: 'Dry Green Peas', nameBn: 'শুকনো মটর', nameHi: 'सूखी मटर', unit: '500 g', pricePaise: 4000, category: 'Dal & Pulses' },
  // Staples, not Dal & Pulses. What a kirana sells as "soyabean" is the dried
  // nugget — soya badi — which is cooked as a vegetable or a curry and never as
  // a dal. Botanically it is a legume and that is how it got filed here; a
  // shopper looking under ডাল for it, or finding it there among the masoor and
  // the moong, is being told something untrue about how it is used.
  { name: 'Soyabean', nameBn: 'সয়াবিন', nameHi: 'सोयाबीन', unit: '200 g', pricePaise: 2500, category: 'Staples' },

  // Staples
  { name: 'Sugar', nameBn: 'চিনি', nameHi: 'चीनी', unit: '1 kg', pricePaise: 4800, category: 'Staples' },
  { name: 'Iodised Salt', nameBn: 'আয়োডিনযুক্ত নুন', nameHi: 'आयोडीन नमक', unit: '1 kg', pricePaise: 2500, category: 'Staples' },
  { name: 'Jaggery', nameBn: 'গুড়', nameHi: 'गुड़', unit: '500 g', pricePaise: 4500, category: 'Staples' },
  { name: 'Honey', nameBn: 'মধু', nameHi: 'शहद', unit: '250 g', pricePaise: 13000, category: 'Staples' },

  // Oil & Ghee
  { name: 'Mustard Oil', nameBn: 'সরিষার তেল', nameHi: 'सरसों का तेल', unit: '1 l', pricePaise: 16500, category: 'Oil & Ghee' },
  { name: 'Sunflower Oil', nameBn: 'সূর্যমুখী তেল', nameHi: 'सूरजमुखी तेल', unit: '1 l', pricePaise: 15000, category: 'Oil & Ghee' },
  { name: 'Soyabean Oil', nameBn: 'সয়াবিন তেল', nameHi: 'सोयाबीन तेल', unit: '1 l', pricePaise: 14000, category: 'Oil & Ghee' },
  { name: 'Rice Bran Oil', nameBn: 'রাইস ব্রান তেল', nameHi: 'राइस ब्रान तेल', unit: '1 l', pricePaise: 15500, category: 'Oil & Ghee' },
  { name: 'Coconut Oil', nameBn: 'নারকেল তেল', nameHi: 'नारियल तेल', unit: '200 ml', pricePaise: 9000, category: 'Oil & Ghee' },
  { name: 'Desi Ghee', nameBn: 'দেশি ঘি', nameHi: 'देसी घी', unit: '500 g', pricePaise: 32000, category: 'Oil & Ghee' },
  { name: 'Vanaspati', nameBn: 'ডালডা', nameHi: 'डालडा', unit: '500 g', pricePaise: 9000, category: 'Oil & Ghee' },

  // Spices
  { name: 'Turmeric', nameBn: 'হলুদ', nameHi: 'हल्दी', unit: '100 g', pricePaise: 3000, category: 'Spices' },
  { name: 'Chilli Powder', nameBn: 'লঙ্কা গুঁড়ো', nameHi: 'मिर्च पाउडर', unit: '100 g', pricePaise: 4000, category: 'Spices' },
  { name: 'Cumin', nameBn: 'জিরা', nameHi: 'जीरा', unit: '100 g', pricePaise: 4500, category: 'Spices' },
  { name: 'Coriander', nameBn: 'ধনে', nameHi: 'धनिया', unit: '100 g', pricePaise: 3000, category: 'Spices' },
  { name: 'Garam Masala', nameBn: 'গরম মশলা', nameHi: 'गरम मसाला', unit: '50 g', pricePaise: 4000, category: 'Spices' },
  { name: 'Mustard Seed', nameBn: 'সরিষা', nameHi: 'सरसों', unit: '100 g', pricePaise: 2500, category: 'Spices' },
  { name: 'Panch Phoron', nameBn: 'পাঁচফোড়ন', nameHi: 'पांच फोरन', unit: '100 g', pricePaise: 3000, category: 'Spices' },
  { name: 'Bay Leaf', nameBn: 'তেজপাতা', nameHi: 'तेज पत्ता', unit: '50 g', pricePaise: 2000, category: 'Spices' },
  { name: 'Cardamom', nameBn: 'এলাচ', nameHi: 'इलायची', unit: '50 g', pricePaise: 15000, category: 'Spices' },
  { name: 'Clove', nameBn: 'লবঙ্গ', nameHi: 'लौंग', unit: '50 g', pricePaise: 8000, category: 'Spices' },
  { name: 'Cinnamon', nameBn: 'দারচিনি', nameHi: 'दालचीनी', unit: '50 g', pricePaise: 4000, category: 'Spices' },
  { name: 'Black Pepper', nameBn: 'গোলমরিচ', nameHi: 'काली मिर्च', unit: '50 g', pricePaise: 6000, category: 'Spices' },
  { name: 'Fenugreek', nameBn: 'মেথি', nameHi: 'मेथी', unit: '100 g', pricePaise: 2500, category: 'Spices' },
  { name: 'Carom Seed', nameBn: 'জোয়ান', nameHi: 'अजवाइन', unit: '50 g', pricePaise: 2500, category: 'Spices' },
  { name: 'Asafoetida', nameBn: 'হিং', nameHi: 'हींग', unit: '25 g', pricePaise: 4000, category: 'Spices' },
  { name: 'Fennel', nameBn: 'মৌরি', nameHi: 'सौंफ', unit: '100 g', pricePaise: 3000, category: 'Spices' },
  { name: 'Dry Red Chilli', nameBn: 'শুকনো লঙ্কা', nameHi: 'सूखी लाल मिर्च', unit: '100 g', pricePaise: 4000, category: 'Spices' },

  // Vegetables
  { name: 'Potato', nameBn: 'আলু', nameHi: 'आलू', unit: '1 kg', pricePaise: 3000, category: 'Vegetables' },
  { name: 'Onion', nameBn: 'পেঁয়াজ', nameHi: 'प्याज', unit: '1 kg', pricePaise: 4000, category: 'Vegetables' },
  { name: 'Tomato', nameBn: 'টমেটো', nameHi: 'टमाटर', unit: '500 g', pricePaise: 2500, category: 'Vegetables' },
  { name: 'Garlic', nameBn: 'রসুন', nameHi: 'लहसुन', unit: '250 g', pricePaise: 4000, category: 'Vegetables' },
  { name: 'Ginger', nameBn: 'আদা', nameHi: 'अदरक', unit: '250 g', pricePaise: 3000, category: 'Vegetables' },
  { name: 'Green Chilli', nameBn: 'কাঁচা লঙ্কা', nameHi: 'हरी मिर्च', unit: '100 g', pricePaise: 1500, category: 'Vegetables' },
  { name: 'Brinjal', nameBn: 'বেগুন', nameHi: 'बैंगन', unit: '500 g', pricePaise: 2500, category: 'Vegetables' },
  { name: 'Cauliflower', nameBn: 'ফুলকপি', nameHi: 'फूलगोभी', unit: '1 pc', pricePaise: 3000, category: 'Vegetables' },
  { name: 'Cabbage', nameBn: 'বাঁধাকপি', nameHi: 'पत्तागोभी', unit: '1 pc', pricePaise: 2500, category: 'Vegetables' },
  { name: 'Pumpkin', nameBn: 'কুমড়ো', nameHi: 'कद्दू', unit: '500 g', pricePaise: 2000, category: 'Vegetables' },
  { name: 'Bottle Gourd', nameBn: 'লাউ', nameHi: 'लौकी', unit: '1 pc', pricePaise: 3000, category: 'Vegetables' },
  { name: 'Ridge Gourd', nameBn: 'ঝিঙে', nameHi: 'तोरई', unit: '500 g', pricePaise: 2500, category: 'Vegetables' },
  { name: 'Bitter Gourd', nameBn: 'করলা', nameHi: 'करेला', unit: '250 g', pricePaise: 2000, category: 'Vegetables' },
  { name: 'Lady Finger', nameBn: 'ঢেঁড়স', nameHi: 'भिंडी', unit: '500 g', pricePaise: 3000, category: 'Vegetables' },
  { name: 'Carrot', nameBn: 'গাজর', nameHi: 'गाजर', unit: '500 g', pricePaise: 2500, category: 'Vegetables' },
  { name: 'French Beans', nameBn: 'ফরাসি বিন', nameHi: 'फ्रेंच बीन्स', unit: '250 g', pricePaise: 2000, category: 'Vegetables' },
  { name: 'Capsicum', nameBn: 'ক্যাপসিকাম', nameHi: 'शिमला मिर्च', unit: '250 g', pricePaise: 2500, category: 'Vegetables' },
  { name: 'Cucumber', nameBn: 'শসা', nameHi: 'खीरा', unit: '500 g', pricePaise: 2000, category: 'Vegetables' },
  { name: 'Radish', nameBn: 'মুলো', nameHi: 'मूली', unit: '500 g', pricePaise: 1500, category: 'Vegetables' },
  { name: 'Spinach', nameBn: 'পালং শাক', nameHi: 'पालक', unit: '250 g', pricePaise: 1500, category: 'Vegetables' },
  { name: 'Coriander Leaves', nameBn: 'ধনেপাতা', nameHi: 'धनिया पत्ता', unit: '100 g', pricePaise: 1000, category: 'Vegetables' },
  { name: 'Drumstick', nameBn: 'সজনে ডাঁটা', nameHi: 'सहजन', unit: '250 g', pricePaise: 2500, category: 'Vegetables' },
  { name: 'Beetroot', nameBn: 'বিট', nameHi: 'चुकंदर', unit: '250 g', pricePaise: 1500, category: 'Vegetables' },
  { name: 'Green Peas', nameBn: 'মটরশুঁটি', nameHi: 'हरी मटर', unit: '250 g', pricePaise: 3000, category: 'Vegetables' },
  { name: 'Raw Papaya', nameBn: 'কাঁচা পেঁপে', nameHi: 'कच्चा पपीता', unit: '500 g', pricePaise: 2000, category: 'Vegetables' },

  // Fruits
  { name: 'Banana', nameBn: 'কলা', nameHi: 'केला', unit: '6 pc', pricePaise: 4000, category: 'Fruits' },
  { name: 'Apple', nameBn: 'আপেল', nameHi: 'सेब', unit: '500 g', pricePaise: 9000, category: 'Fruits' },
  { name: 'Orange', nameBn: 'কমলা', nameHi: 'संतरा', unit: '500 g', pricePaise: 5000, category: 'Fruits' },
  { name: 'Mango', nameBn: 'আম', nameHi: 'आम', unit: '1 kg', pricePaise: 10000, category: 'Fruits' },
  { name: 'Grapes', nameBn: 'আঙুর', nameHi: 'अंगूर', unit: '500 g', pricePaise: 6000, category: 'Fruits' },
  { name: 'Papaya', nameBn: 'পেঁপে', nameHi: 'पपीता', unit: '1 pc', pricePaise: 5000, category: 'Fruits' },
  { name: 'Guava', nameBn: 'পেয়ারা', nameHi: 'अमरूद', unit: '500 g', pricePaise: 4000, category: 'Fruits' },
  { name: 'Pomegranate', nameBn: 'বেদানা', nameHi: 'अनार', unit: '500 g', pricePaise: 11000, category: 'Fruits' },
  { name: 'Watermelon', nameBn: 'তরমুজ', nameHi: 'तरबूज', unit: '1 pc', pricePaise: 6000, category: 'Fruits' },
  { name: 'Lemon', nameBn: 'পাতিলেবু', nameHi: 'नींबू', unit: '4 pc', pricePaise: 2000, category: 'Fruits' },
  { name: 'Coconut', nameBn: 'নারকেল', nameHi: 'नारियल', unit: '1 pc', pricePaise: 4500, category: 'Fruits' },

  // Dairy
  { name: 'Cow Milk', nameBn: 'গরুর দুধ', nameHi: 'गाय का दूध', unit: '500 ml', pricePaise: 3000, category: 'Dairy' },
  { name: 'Curd', nameBn: 'দই', nameHi: 'दही', unit: '400 g', pricePaise: 4000, category: 'Dairy' },
  { name: 'Paneer', nameBn: 'পনির', nameHi: 'पनीर', unit: '200 g', pricePaise: 9000, category: 'Dairy' },
  { name: 'Table Butter', nameBn: 'টেবিল মাখন', nameHi: 'टेबल बटर', unit: '100 g', pricePaise: 6000, category: 'Dairy' },
  { name: 'Cheese Block', nameBn: 'চিজ ব্লক', nameHi: 'चीज़ ब्लॉक', unit: '200 g', pricePaise: 14500, category: 'Dairy' },
  { name: 'Poultry Egg', nameBn: 'পোলট্রি ডিম', nameHi: 'पोल्ट्री अंडा', unit: '6 pc', pricePaise: 4500, category: 'Dairy' },
  { name: 'Milk Powder', nameBn: 'গুঁড়ো দুধ', nameHi: 'मिल्क पाउडर', unit: '500 g', pricePaise: 29000, category: 'Dairy' },
  { name: 'Condensed Milk', nameBn: 'কনডেন্সড মিল্ক', nameHi: 'कंडेंस्ड मिल्क', unit: '400 g', pricePaise: 13000, category: 'Dairy' },

  // Tea & Coffee
  { name: 'CTC Tea', nameBn: 'সিটিসি চা', nameHi: 'सीटीसी चाय', unit: '250 g', pricePaise: 14000, category: 'Tea & Coffee' },
  { name: 'Green Tea', nameBn: 'গ্রিন টি', nameHi: 'ग्रीन टी', unit: '25 pc', pricePaise: 15000, category: 'Tea & Coffee' },
  { name: 'Malt Health Drink', nameBn: 'মল্ট হেলথ ড্রিংক', nameHi: 'माल्ट हेल्थ ड्रिंक', unit: '500 g', pricePaise: 27000, category: 'Tea & Coffee' },

  // Snacks
  { name: 'Glucose Biscuit', nameBn: 'গ্লুকোজ বিস্কুট', nameHi: 'ग्लूकोज़ बिस्कुट', unit: '1 packet', pricePaise: 2000, category: 'Snacks' },
  { name: 'White Bread', nameBn: 'সাদা পাউরুটি', nameHi: 'सफ़ेद ब्रेड', unit: '1 packet', pricePaise: 4500, category: 'Snacks' },
  { name: 'Namkeen', nameBn: 'নমকিন', nameHi: 'नमकीन', unit: '200 g', pricePaise: 5000, category: 'Snacks' },
  { name: 'Chanachur', nameBn: 'চানাচুর', nameHi: 'चनाचूर', unit: '200 g', pricePaise: 4500, category: 'Snacks' },
  { name: 'Potato Chips', nameBn: 'আলুর চিপস', nameHi: 'आलू चिप्स', unit: '1 packet', pricePaise: 2000, category: 'Snacks' },
  { name: 'Instant Noodles', nameBn: 'ইনস্ট্যান্ট নুডলস', nameHi: 'इंस्टेंट नूडल्स', unit: '1 packet', pricePaise: 1500, category: 'Snacks' },
  { name: 'Papad', nameBn: 'পাঁপড়', nameHi: 'पापड़', unit: '200 g', pricePaise: 6000, category: 'Snacks' },
  { name: 'Milk Chocolate', nameBn: 'মিল্ক চকোলেট', nameHi: 'मिल्क चॉकलेट', unit: '1 pc', pricePaise: 2000, category: 'Snacks' },
  { name: 'Rusk', nameBn: 'রাস্ক', nameHi: 'रस्क', unit: '200 g', pricePaise: 4500, category: 'Snacks' },

  // Dry Fruits
  { name: 'Almond', nameBn: 'কাঠবাদাম', nameHi: 'बादाम', unit: '100 g', pricePaise: 11000, category: 'Dry Fruits' },
  { name: 'Cashew', nameBn: 'কাজু', nameHi: 'काजू', unit: '100 g', pricePaise: 12000, category: 'Dry Fruits' },
  { name: 'Raisin', nameBn: 'কিশমিশ', nameHi: 'किशमिश', unit: '100 g', pricePaise: 5000, category: 'Dry Fruits' },
  { name: 'Walnut', nameBn: 'আখরোট', nameHi: 'अखरोट', unit: '100 g', pricePaise: 13000, category: 'Dry Fruits' },
  { name: 'Dates', nameBn: 'খেজুর', nameHi: 'खजूर', unit: '250 g', pricePaise: 9000, category: 'Dry Fruits' },

  // Household
  { name: 'Dishwash Bar', nameBn: 'বাসন মাজার সাবান', nameHi: 'बर्तन साबुन', unit: '1 pc', pricePaise: 2000, category: 'Household' },
  { name: 'Phenyl', nameBn: 'ফিনাইল', nameHi: 'फिनाइल', unit: '500 ml', pricePaise: 7000, category: 'Household' },
  { name: 'Toilet Cleaner', nameBn: 'টয়লেট ক্লিনার', nameHi: 'टॉयलेट क्लीनर', unit: '500 ml', pricePaise: 9500, category: 'Household' },
  { name: 'Broom', nameBn: 'ঝাঁটা', nameHi: 'झाड़ू', unit: '1 pc', pricePaise: 6000, category: 'Household' },
  { name: 'Agarbatti', nameBn: 'ধূপকাঠি', nameHi: 'अगरबत्ती', unit: '1 packet', pricePaise: 3000, category: 'Household' },
  { name: 'Candle', nameBn: 'মোমবাতি', nameHi: 'मोमबत्ती', unit: '1 pc', pricePaise: 2000, category: 'Household' },
  { name: 'Matchbox', nameBn: 'দেশলাই', nameHi: 'माचिस', unit: '1 pc', pricePaise: 200, category: 'Household' },
  { name: 'Garbage Bag', nameBn: 'আবর্জনার ব্যাগ', nameHi: 'कचरा बैग', unit: '1 packet', pricePaise: 6000, category: 'Household' },

  // Personal Care
  { name: 'Bath Soap', nameBn: 'স্নানের সাবান', nameHi: 'नहाने का साबुन', unit: '1 pc', pricePaise: 4000, category: 'Personal Care' },
  { name: 'Toothpaste', nameBn: 'টুথপেস্ট', nameHi: 'टूथपेस्ट', unit: '100 g', pricePaise: 6000, category: 'Personal Care' },
  { name: 'Toothbrush', nameBn: 'টুথব্রাশ', nameHi: 'टूथब्रश', unit: '1 pc', pricePaise: 3000, category: 'Personal Care' },
  { name: 'Hair Shampoo', nameBn: 'চুলের শ্যাম্পু', nameHi: 'हेयर शैम्पू', unit: '1 bottle', pricePaise: 9000, category: 'Personal Care' },
  { name: 'Hair Oil', nameBn: 'চুলের তেল', nameHi: 'बालों का तेल', unit: '200 ml', pricePaise: 11000, category: 'Personal Care' },
  { name: 'Face Cream', nameBn: 'ফেস ক্রিম', nameHi: 'फेस क्रीम', unit: '1 pc', pricePaise: 8000, category: 'Personal Care' },
  { name: 'Razor', nameBn: 'রেজার', nameHi: 'रेजर', unit: '1 pc', pricePaise: 3000, category: 'Personal Care' },
  { name: 'Sanitary Pad', nameBn: 'স্যানিটারি প্যাড', nameHi: 'सैनिटरी पैड', unit: '1 packet', pricePaise: 5000, category: 'Personal Care' },

  /* ----------------------------------------------------------------------
   * THE SECOND TRANCHE, taking this list to three hundred.
   *
   * A hundred and thirty was enough to prove the idea and not enough to be
   * the answer: an owner ticked what was there, still faced forty things to
   * dictate, and stopped. Three hundred is the size at which a West Bengal
   * kirana can tick its way to a working shop and type almost nothing.
   *
   * Chosen as what actually moves off a para shelf — the everyday and the
   * middling, not the long tail. Bengali kitchens are the bias throughout,
   * because that is where the shops are: posto, kasundi, mocha, thor, potol,
   * kul, mishti doi and gobindobhog belong on a Kolkata list and would be
   * noise in Gujarat.
   *
   * Four headings are new. Beverages, Baby Care, Puja Items and Stationery
   * are real aisles in a kirana and were landing under "Other", which is the
   * one heading that tells a customer nothing.
   *
   * THE PRICES ARE A STARTING POINT AND NOTHING MORE — see the note at the
   * top of this file. They are typical Kolkata retail for the pack size
   * given, they are stale the day they are written, and every one of them is
   * `priced: false` until the owner says the number is right.
   * -------------------------------------------------------------------- */
  { name: 'Miniket Rice', nameBn: 'মিনিকেট চাল', nameHi: 'मिनिकेट चावल', unit: '1 kg', pricePaise: 6000, category: 'Rice & Atta' },
  { name: 'Swarna Rice', nameBn: 'স্বর্ণ চাল', nameHi: 'स्वर्ण चावल', unit: '1 kg', pricePaise: 4200, category: 'Rice & Atta' },
  { name: 'Ratna Rice', nameBn: 'রত্না চাল', nameHi: 'रत्ना चावल', unit: '1 kg', pricePaise: 4500, category: 'Rice & Atta' },
  { name: 'Kaminibhog Rice', nameBn: 'কামিনীভোগ চাল', nameHi: 'कामिनीभोग चावल', unit: '1 kg', pricePaise: 8500, category: 'Rice & Atta' },
  { name: 'Sona Masoori Rice', nameBn: 'সোনা মসুরি চাল', nameHi: 'सोना मसूरी चावल', unit: '1 kg', pricePaise: 6500, category: 'Rice & Atta' },
  { name: 'Broken Rice', nameBn: 'খুদ', nameHi: 'खुद चावल', unit: '1 kg', pricePaise: 3200, category: 'Rice & Atta' },
  { name: 'Wheat', nameBn: 'গম', nameHi: 'गेहूं', unit: '1 kg', pricePaise: 3200, category: 'Rice & Atta' },
  { name: 'Semai', nameBn: 'সেমাই', nameHi: 'सेवई', unit: '200 g', pricePaise: 3000, category: 'Rice & Atta' },
  { name: 'Corn Flour', nameBn: 'কর্ন ফ্লাওয়ার', nameHi: 'कॉर्न फ्लोर', unit: '100 g', pricePaise: 2500, category: 'Rice & Atta' },
  { name: 'Oats', nameBn: 'ওটস', nameHi: 'ओट्स', unit: '500 g', pricePaise: 9000, category: 'Rice & Atta' },
  { name: 'Cornflakes', nameBn: 'কর্নফ্লেক্স', nameHi: 'कॉर्नफ्लेक्स', unit: '250 g', pricePaise: 9500, category: 'Rice & Atta' },
  { name: 'Red Poha', nameBn: 'লাল চিঁড়ে', nameHi: 'लाल पोहा', unit: '500 g', pricePaise: 4000, category: 'Rice & Atta' },
  { name: 'Matar Dal', nameBn: 'মটর ডাল', nameHi: 'मटर दाल', unit: '500 g', pricePaise: 3500, category: 'Dal & Pulses' },
  { name: 'Sabut Moong', nameBn: 'গোটা মুগ', nameHi: 'साबुत मूंग', unit: '500 g', pricePaise: 6500, category: 'Dal & Pulses' },
  { name: 'Sabut Masoor', nameBn: 'গোটা মুসুর', nameHi: 'साबुत मसूर', unit: '500 g', pricePaise: 5500, category: 'Dal & Pulses' },
  { name: 'Sabut Urad', nameBn: 'গোটা বিউলি', nameHi: 'साबुत उड़द', unit: '500 g', pricePaise: 7500, category: 'Dal & Pulses' },
  { name: 'Lobia', nameBn: 'বরবটি বীজ', nameHi: 'लोबिया', unit: '500 g', pricePaise: 6000, category: 'Dal & Pulses' },
  { name: 'White Peas', nameBn: 'সাদা মটর', nameHi: 'सफ़ेद मटर', unit: '500 g', pricePaise: 4000, category: 'Dal & Pulses' },
  { name: 'Soya Chunks', nameBn: 'সয়া বড়ি', nameHi: 'सोया बड़ी', unit: '200 g', pricePaise: 3000, category: 'Dal & Pulses' },
  { name: 'Moong Sprouts', nameBn: 'মুগ অঙ্কুর', nameHi: 'मूंग स्प्राउट्स', unit: '250 g', pricePaise: 4000, category: 'Dal & Pulses' },
  { name: 'Misri', nameBn: 'মিছরি', nameHi: 'मिश्री', unit: '250 g', pricePaise: 4000, category: 'Staples' },
  { name: 'Tamarind', nameBn: 'তেঁতুল', nameHi: 'इमली', unit: '250 g', pricePaise: 4500, category: 'Staples' },
  { name: 'Vinegar', nameBn: 'ভিনিগার', nameHi: 'सिरका', unit: '200 ml', pricePaise: 3000, category: 'Staples' },
  { name: 'Baking Soda', nameBn: 'খাবার সোডা', nameHi: 'खाने का सोडा', unit: '100 g', pricePaise: 2000, category: 'Staples' },
  { name: 'Baking Powder', nameBn: 'বেকিং পাউডার', nameHi: 'बेकिंग पाउडर', unit: '100 g', pricePaise: 3500, category: 'Staples' },
  { name: 'Yeast', nameBn: 'ইস্ট', nameHi: 'यीस्ट', unit: '50 g', pricePaise: 4000, category: 'Staples' },
  { name: 'Rock Salt', nameBn: 'সৈন্ধব লবণ', nameHi: 'सेंधा नमक', unit: '500 g', pricePaise: 3000, category: 'Staples' },
  { name: 'Custard Powder', nameBn: 'কাস্টার্ড পাউডার', nameHi: 'कस्टर्ड पाउडर', unit: '100 g', pricePaise: 4000, category: 'Staples' },
  { name: 'Til Oil', nameBn: 'তিল তেল', nameHi: 'तिल का तेल', unit: '500 ml', pricePaise: 18000, category: 'Oil & Ghee' },
  { name: 'Groundnut Oil', nameBn: 'চিনাবাদাম তেল', nameHi: 'मूंगफली का तेल', unit: '1 l', pricePaise: 21000, category: 'Oil & Ghee' },
  { name: 'Palm Oil', nameBn: 'পাম তেল', nameHi: 'पाम तेल', unit: '1 l', pricePaise: 12000, category: 'Oil & Ghee' },
  { name: 'Olive Oil', nameBn: 'অলিভ অয়েল', nameHi: 'जैतून का तेल', unit: '500 ml', pricePaise: 45000, category: 'Oil & Ghee' },
  { name: 'White Butter', nameBn: 'সাদা মাখন', nameHi: 'सफ़ेद मक्खन', unit: '200 g', pricePaise: 10000, category: 'Oil & Ghee' },
  { name: 'Posto', nameBn: 'পোস্ত', nameHi: 'खसखस', unit: '100 g', pricePaise: 15000, category: 'Spices' },
  { name: 'Kalonji', nameBn: 'কালোজিরে', nameHi: 'कलौंजी', unit: '100 g', pricePaise: 4000, category: 'Spices' },
  { name: 'Chat Masala', nameBn: 'চাট মশলা', nameHi: 'चाट मसाला', unit: '100 g', pricePaise: 4500, category: 'Spices' },
  { name: 'Kitchen King Masala', nameBn: 'কিচেন কিং মশলা', nameHi: 'किचन किंग मसाला', unit: '100 g', pricePaise: 8000, category: 'Spices' },
  { name: 'Meat Masala', nameBn: 'মাংসের মশলা', nameHi: 'मीट मसाला', unit: '100 g', pricePaise: 8500, category: 'Spices' },
  { name: 'Fish Masala', nameBn: 'মাছের মশলা', nameHi: 'मछली मसाला', unit: '100 g', pricePaise: 8000, category: 'Spices' },
  { name: 'Biryani Masala', nameBn: 'বিরিয়ানি মশলা', nameHi: 'बिरयानी मसाला', unit: '100 g', pricePaise: 9000, category: 'Spices' },
  { name: 'Tandoori Masala', nameBn: 'তন্দুরি মশলা', nameHi: 'तंदूरी मसाला', unit: '100 g', pricePaise: 8500, category: 'Spices' },
  { name: 'Amchur', nameBn: 'আমচুর', nameHi: 'अमचूर', unit: '100 g', pricePaise: 4500, category: 'Spices' },
  { name: 'Star Anise', nameBn: 'চক্র ফুল', nameHi: 'चक्र फूल', unit: '50 g', pricePaise: 9000, category: 'Spices' },
  { name: 'Nutmeg', nameBn: 'জায়ফল', nameHi: 'जायफल', unit: '50 g', pricePaise: 12000, category: 'Spices' },
  { name: 'Mace', nameBn: 'জয়িত্রী', nameHi: 'जावित्री', unit: '25 g', pricePaise: 15000, category: 'Spices' },
  { name: 'White Pepper', nameBn: 'সাদা গোলমরিচ', nameHi: 'सफ़ेद काली मिर्च', unit: '50 g', pricePaise: 14000, category: 'Spices' },
  { name: 'Ginger Garlic Paste', nameBn: 'আদা রসুন বাটা', nameHi: 'अदरक लहसुन पेस्ट', unit: '200 g', pricePaise: 6000, category: 'Spices' },
  { name: 'Mustard Paste', nameBn: 'সরষে বাটা', nameHi: 'सरसों पेस्ट', unit: '200 g', pricePaise: 5500, category: 'Spices' },
  { name: 'Kasundi', nameBn: 'কাসুন্দি', nameHi: 'कासुंदी', unit: '200 g', pricePaise: 6500, category: 'Spices' },
  { name: 'Sweet Potato', nameBn: 'রাঙা আলু', nameHi: 'शकरकंद', unit: '1 kg', pricePaise: 5000, category: 'Vegetables' },
  { name: 'Kochu', nameBn: 'কচু', nameHi: 'अरबी', unit: '500 g', pricePaise: 3000, category: 'Vegetables' },
  { name: 'Ol', nameBn: 'ওল', nameHi: 'सूरन', unit: '500 g', pricePaise: 3500, category: 'Vegetables' },
  { name: 'Potol', nameBn: 'পটল', nameHi: 'परवल', unit: '500 g', pricePaise: 3000, category: 'Vegetables' },
  { name: 'Chichinga', nameBn: 'চিচিঙ্গা', nameHi: 'चिचिंडा', unit: '500 g', pricePaise: 2500, category: 'Vegetables' },
  { name: 'Kundri', nameBn: 'কুঁদরি', nameHi: 'कुंदरू', unit: '250 g', pricePaise: 2000, category: 'Vegetables' },
  { name: 'Mocha', nameBn: 'মোচা', nameHi: 'केले का फूल', unit: '1 pc', pricePaise: 4000, category: 'Vegetables' },
  { name: 'Thor', nameBn: 'থোড়', nameHi: 'केले का तना', unit: '1 pc', pricePaise: 3000, category: 'Vegetables' },
  { name: 'Sheem', nameBn: 'শিম', nameHi: 'सेम', unit: '500 g', pricePaise: 3500, category: 'Vegetables' },
  { name: 'Cluster Beans', nameBn: 'ঝিঙা শিম', nameHi: 'ग्वार फली', unit: '250 g', pricePaise: 2500, category: 'Vegetables' },
  { name: 'Spring Onion', nameBn: 'পেঁয়াজ কলি', nameHi: 'हरा प्याज', unit: '250 g', pricePaise: 2000, category: 'Vegetables' },
  { name: 'Mint Leaves', nameBn: 'পুদিনা পাতা', nameHi: 'पुदीना', unit: '100 g', pricePaise: 1500, category: 'Vegetables' },
  { name: 'Curry Leaves', nameBn: 'কারিপাতা', nameHi: 'करी पत्ता', unit: '50 g', pricePaise: 1000, category: 'Vegetables' },
  { name: 'Methi Saag', nameBn: 'মেথি শাক', nameHi: 'मेथी साग', unit: '250 g', pricePaise: 2000, category: 'Vegetables' },
  { name: 'Lal Shak', nameBn: 'লাল শাক', nameHi: 'लाल साग', unit: '1 bunch', pricePaise: 1500, category: 'Vegetables' },
  { name: 'Pui Shak', nameBn: 'পুঁই শাক', nameHi: 'पोई साग', unit: '1 bunch', pricePaise: 1500, category: 'Vegetables' },
  { name: 'Mushroom', nameBn: 'মাশরুম', nameHi: 'मशरूम', unit: '200 g', pricePaise: 5000, category: 'Vegetables' },
  { name: 'Sweet Corn', nameBn: 'মিষ্টি ভুট্টা', nameHi: 'मीठा भुट्टा', unit: '1 pc', pricePaise: 2500, category: 'Vegetables' },
  { name: 'Pineapple', nameBn: 'আনারস', nameHi: 'अनानास', unit: '1 pc', pricePaise: 6000, category: 'Fruits' },
  { name: 'Litchi', nameBn: 'লিচু', nameHi: 'लीची', unit: '500 g', pricePaise: 9000, category: 'Fruits' },
  { name: 'Jackfruit', nameBn: 'কাঁঠাল', nameHi: 'कटहल', unit: '1 kg', pricePaise: 6000, category: 'Fruits' },
  { name: 'Custard Apple', nameBn: 'আতা', nameHi: 'सीताफल', unit: '500 g', pricePaise: 8000, category: 'Fruits' },
  { name: 'Sapota', nameBn: 'সবেদা', nameHi: 'चीकू', unit: '500 g', pricePaise: 5000, category: 'Fruits' },
  { name: 'Pear', nameBn: 'নাশপাতি', nameHi: 'नाशपाती', unit: '500 g', pricePaise: 9000, category: 'Fruits' },
  { name: 'Mosambi', nameBn: 'মোসাম্বি', nameHi: 'मौसमी', unit: '1 kg', pricePaise: 8000, category: 'Fruits' },
  { name: 'Jamun', nameBn: 'জাম', nameHi: 'जामुन', unit: '500 g', pricePaise: 8000, category: 'Fruits' },
  { name: 'Kul', nameBn: 'কুল', nameHi: 'बेर', unit: '500 g', pricePaise: 5000, category: 'Fruits' },
  { name: 'Musk Melon', nameBn: 'ফুটি', nameHi: 'खरबूजा', unit: '1 kg', pricePaise: 5000, category: 'Fruits' },
  { name: 'Mishti Doi', nameBn: 'মিষ্টি দই', nameHi: 'मीठा दही', unit: '200 g', pricePaise: 4000, category: 'Dairy' },
  { name: 'Buttermilk', nameBn: 'ঘোল', nameHi: 'छाछ', unit: '200 ml', pricePaise: 2000, category: 'Dairy' },
  { name: 'Lassi', nameBn: 'লস্যি', nameHi: 'लस्सी', unit: '200 ml', pricePaise: 2500, category: 'Dairy' },
  { name: 'Fresh Cream', nameBn: 'ফ্রেশ ক্রিম', nameHi: 'फ्रेश क्रीम', unit: '200 ml', pricePaise: 8000, category: 'Dairy' },
  { name: 'Khoya', nameBn: 'ক্ষীর', nameHi: 'खोया', unit: '250 g', pricePaise: 12000, category: 'Dairy' },
  { name: 'Flavoured Milk', nameBn: 'ফ্লেভারড দুধ', nameHi: 'फ्लेवर्ड दूध', unit: '200 ml', pricePaise: 3000, category: 'Dairy' },
  { name: 'Ice Cream', nameBn: 'আইসক্রিম', nameHi: 'आइसक्रीम', unit: '500 ml', pricePaise: 15000, category: 'Dairy' },
  { name: 'Tea Bags', nameBn: 'টি ব্যাগ', nameHi: 'टी बैग', unit: '25 pc', pricePaise: 9000, category: 'Tea & Coffee' },
  { name: 'Darjeeling Tea', nameBn: 'দার্জিলিং চা', nameHi: 'दार्जिलिंग चाय', unit: '250 g', pricePaise: 25000, category: 'Tea & Coffee' },
  { name: 'Assam Tea', nameBn: 'আসাম চা', nameHi: 'असम चाय', unit: '250 g', pricePaise: 14000, category: 'Tea & Coffee' },
  { name: 'Masala Tea', nameBn: 'মশলা চা', nameHi: 'मसाला चाय', unit: '250 g', pricePaise: 16000, category: 'Tea & Coffee' },
  { name: 'Instant Coffee', nameBn: 'ইনস্ট্যান্ট কফি', nameHi: 'इंस्टेंट कॉफ़ी', unit: '50 g', pricePaise: 18000, category: 'Tea & Coffee' },
  { name: 'Cola Soft Drink', nameBn: 'কোলা কোল্ড ড্রিংক', nameHi: 'कोला कोल्ड ड्रिंक', unit: '600 ml', pricePaise: 4000, category: 'Beverages' },
  { name: 'Fruit Juice', nameBn: 'ফলের রস', nameHi: 'फलों का रस', unit: '1 l', pricePaise: 11000, category: 'Beverages' },
  { name: 'Mineral Water', nameBn: 'মিনারেল ওয়াটার', nameHi: 'मिनरल वाटर', unit: '1 l', pricePaise: 2000, category: 'Beverages' },
  { name: 'Soda', nameBn: 'সোডা', nameHi: 'सोडा', unit: '750 ml', pricePaise: 2500, category: 'Beverages' },
  { name: 'Energy Drink', nameBn: 'এনার্জি ড্রিংক', nameHi: 'एनर्जी ड्रिंक', unit: '250 ml', pricePaise: 5000, category: 'Beverages' },
  { name: 'Glucose Powder', nameBn: 'গ্লুকোজ', nameHi: 'ग्लूकोज़', unit: '500 g', pricePaise: 10000, category: 'Beverages' },
  { name: 'Squash', nameBn: 'স্কোয়াশ', nameHi: 'स्क्वैश', unit: '750 ml', pricePaise: 15000, category: 'Beverages' },
  { name: 'Marie Biscuit', nameBn: 'মারি বিস্কুট', nameHi: 'मैरी बिस्कुट', unit: '250 g', pricePaise: 3500, category: 'Snacks' },
  { name: 'Cream Biscuit', nameBn: 'ক্রিম বিস্কুট', nameHi: 'क्रीम बिस्कुट', unit: '100 g', pricePaise: 2000, category: 'Snacks' },
  { name: 'Salt Biscuit', nameBn: 'নোনতা বিস্কুট', nameHi: 'नमकीन बिस्कुट', unit: '200 g', pricePaise: 3000, category: 'Snacks' },
  { name: 'Cake', nameBn: 'কেক', nameHi: 'केक', unit: '1 pc', pricePaise: 3000, category: 'Snacks' },
  { name: 'Nimki', nameBn: 'নিমকি', nameHi: 'निमकी', unit: '200 g', pricePaise: 4000, category: 'Snacks' },
  { name: 'Bhujia', nameBn: 'ভুজিয়া', nameHi: 'भुजिया', unit: '200 g', pricePaise: 5000, category: 'Snacks' },
  { name: 'Mixture', nameBn: 'মিক্সচার', nameHi: 'मिक्सचर', unit: '200 g', pricePaise: 4500, category: 'Snacks' },
  { name: 'Popcorn', nameBn: 'পপকর্ন', nameHi: 'पॉपकॉर्न', unit: '100 g', pricePaise: 3000, category: 'Snacks' },
  { name: 'Wafer', nameBn: 'ওয়েফার', nameHi: 'वेफर', unit: '75 g', pricePaise: 2000, category: 'Snacks' },
  { name: 'Candy', nameBn: 'ক্যান্ডি', nameHi: 'कैंडी', unit: '100 g', pricePaise: 2500, category: 'Snacks' },
  { name: 'Chewing Gum', nameBn: 'চুইংগাম', nameHi: 'च्युइंग गम', unit: '10 pc', pricePaise: 1000, category: 'Snacks' },
  { name: 'Mixed Fruit Jam', nameBn: 'মিক্সড ফ্রুট জ্যাম', nameHi: 'मिक्स फ्रूट जैम', unit: '200 g', pricePaise: 8000, category: 'Snacks' },
  { name: 'Mango Pickle', nameBn: 'আমের আচার', nameHi: 'आम का अचार', unit: '200 g', pricePaise: 6000, category: 'Snacks' },
  { name: 'Peanut', nameBn: 'চিনাবাদাম', nameHi: 'मूंगफली', unit: '250 g', pricePaise: 4000, category: 'Snacks' },
  { name: 'Roasted Chana', nameBn: 'ভাজা ছোলা', nameHi: 'भुना चना', unit: '250 g', pricePaise: 4000, category: 'Snacks' },
  { name: 'Pistachio', nameBn: 'পেস্তা', nameHi: 'पिस्ता', unit: '100 g', pricePaise: 12000, category: 'Dry Fruits' },
  { name: 'Anjeer', nameBn: 'আঞ্জির', nameHi: 'अंजीर', unit: '100 g', pricePaise: 11000, category: 'Dry Fruits' },
  { name: 'Apricot', nameBn: 'খুবানি', nameHi: 'खुबानी', unit: '100 g', pricePaise: 9000, category: 'Dry Fruits' },
  { name: 'Makhana', nameBn: 'মাখানা', nameHi: 'मखाना', unit: '100 g', pricePaise: 9000, category: 'Dry Fruits' },
  { name: 'Charmagaz', nameBn: 'চারমগজ', nameHi: 'चारमगज़', unit: '100 g', pricePaise: 8000, category: 'Dry Fruits' },
  { name: 'Dry Coconut', nameBn: 'শুকনো নারকেল', nameHi: 'सूखा नारियल', unit: '200 g', pricePaise: 6000, category: 'Dry Fruits' },
  { name: 'Detergent Powder', nameBn: 'ডিটারজেন্ট পাউডার', nameHi: 'डिटर्जेंट पाउडर', unit: '1 kg', pricePaise: 12000, category: 'Household' },
  { name: 'Liquid Detergent', nameBn: 'লিকুইড ডিটারজেন্ট', nameHi: 'लिक्विड डिटर्जेंट', unit: '500 ml', pricePaise: 12000, category: 'Household' },
  { name: 'Dishwash Liquid', nameBn: 'বাসন ধোয়ার লিকুইড', nameHi: 'बर्तन धोने का लिक्विड', unit: '500 ml', pricePaise: 11000, category: 'Household' },
  { name: 'Scrubber', nameBn: 'স্ক্রাবার', nameHi: 'स्क्रबर', unit: '1 pc', pricePaise: 2000, category: 'Household' },
  { name: 'Floor Cleaner', nameBn: 'মেঝে পরিষ্কারক', nameHi: 'फ़र्श क्लीनर', unit: '500 ml', pricePaise: 10000, category: 'Household' },
  { name: 'Naphthalene Balls', nameBn: 'ন্যাপথলিন', nameHi: 'नेफ़थलीन', unit: '100 g', pricePaise: 3000, category: 'Household' },
  { name: 'Mosquito Coil', nameBn: 'মশার কয়েল', nameHi: 'मच्छर कॉइल', unit: '10 pc', pricePaise: 4000, category: 'Household' },
  { name: 'Mosquito Repellent', nameBn: 'মশা তাড়ানোর লিকুইড', nameHi: 'मच्छर भगाने वाला', unit: '45 ml', pricePaise: 8000, category: 'Household' },
  { name: 'Room Freshener', nameBn: 'রুম ফ্রেশনার', nameHi: 'रूम फ्रेशनर', unit: '250 ml', pricePaise: 20000, category: 'Household' },
  { name: 'Aluminium Foil', nameBn: 'অ্যালুমিনিয়াম ফয়েল', nameHi: 'एल्युमिनियम फॉयल', unit: '1 pc', pricePaise: 8000, category: 'Household' },
  { name: 'Paper Napkin', nameBn: 'পেপার ন্যাপকিন', nameHi: 'पेपर नैपकिन', unit: '100 pc', pricePaise: 5000, category: 'Household' },
  { name: 'Toilet Paper', nameBn: 'টয়লেট পেপার', nameHi: 'टॉयलेट पेपर', unit: '1 pc', pricePaise: 4500, category: 'Household' },
  { name: 'Bleaching Powder', nameBn: 'ব্লিচিং পাউডার', nameHi: 'ब्लीचिंग पाउडर', unit: '500 g', pricePaise: 5000, category: 'Household' },
  { name: 'Neel', nameBn: 'নীল', nameHi: 'नील', unit: '1 pc', pricePaise: 1500, category: 'Household' },
  { name: 'Insect Killer', nameBn: 'পোকা মারার স্প্রে', nameHi: 'कीटनाशक स्प्रे', unit: '250 ml', pricePaise: 12000, category: 'Household' },
  { name: 'Antiseptic Liquid', nameBn: 'অ্যান্টিসেপটিক লিকুইড', nameHi: 'एंटीसेप्टिक लिक्विड', unit: '250 ml', pricePaise: 14000, category: 'Personal Care' },
  { name: 'Talcum Powder', nameBn: 'ট্যালকম পাউডার', nameHi: 'टैल्कम पाउडर', unit: '100 g', pricePaise: 6000, category: 'Personal Care' },
  { name: 'Hand Wash', nameBn: 'হ্যান্ড ওয়াশ', nameHi: 'हैंड वाश', unit: '200 ml', pricePaise: 7000, category: 'Personal Care' },
  { name: 'Sanitizer', nameBn: 'স্যানিটাইজার', nameHi: 'सैनिटाइज़र', unit: '100 ml', pricePaise: 5000, category: 'Personal Care' },
  { name: 'Comb', nameBn: 'চিরুনি', nameHi: 'कंघी', unit: '1 pc', pricePaise: 2000, category: 'Personal Care' },
  { name: 'Nail Cutter', nameBn: 'নেল কাটার', nameHi: 'नेल कटर', unit: '1 pc', pricePaise: 3000, category: 'Personal Care' },
  { name: 'Shaving Cream', nameBn: 'শেভিং ক্রিম', nameHi: 'शेविंग क्रीम', unit: '70 g', pricePaise: 6000, category: 'Personal Care' },
  { name: 'Hair Dye', nameBn: 'চুলের রং', nameHi: 'बालों का रंग', unit: '1 pc', pricePaise: 4000, category: 'Personal Care' },
  { name: 'Vaseline', nameBn: 'ভ্যাসলিন', nameHi: 'वैसलीन', unit: '100 ml', pricePaise: 9000, category: 'Personal Care' },
  { name: 'Lip Balm', nameBn: 'লিপ বাম', nameHi: 'लिप बाम', unit: '1 pc', pricePaise: 5000, category: 'Personal Care' },
  { name: 'Deodorant', nameBn: 'ডিওডোরেন্ট', nameHi: 'डियोडरेंट', unit: '150 ml', pricePaise: 20000, category: 'Personal Care' },
  { name: 'Conditioner', nameBn: 'কন্ডিশনার', nameHi: 'कंडीशनर', unit: '175 ml', pricePaise: 18000, category: 'Personal Care' },
  { name: 'Kajal', nameBn: 'কাজল', nameHi: 'काजल', unit: '1 pc', pricePaise: 15000, category: 'Personal Care' },
  { name: 'Bindi', nameBn: 'টিপ', nameHi: 'बिंदी', unit: '1 pc', pricePaise: 2000, category: 'Personal Care' },
  { name: 'Baby Soap', nameBn: 'বেবি সাবান', nameHi: 'बेबी साबुन', unit: '75 g', pricePaise: 8000, category: 'Baby Care' },
  { name: 'Baby Oil', nameBn: 'বেবি অয়েল', nameHi: 'बेबी ऑयल', unit: '100 ml', pricePaise: 11000, category: 'Baby Care' },
  { name: 'Baby Powder', nameBn: 'বেবি পাউডার', nameHi: 'बेबी पाउडर', unit: '100 g', pricePaise: 9000, category: 'Baby Care' },
  { name: 'Diaper', nameBn: 'ডায়াপার', nameHi: 'डायपर', unit: '10 pc', pricePaise: 25000, category: 'Baby Care' },
  { name: 'Baby Food', nameBn: 'বেবি ফুড', nameHi: 'बेबी फ़ूड', unit: '400 g', pricePaise: 35000, category: 'Baby Care' },
  { name: 'Baby Lotion', nameBn: 'বেবি লোশন', nameHi: 'बेबी लोशन', unit: '100 ml', pricePaise: 12000, category: 'Baby Care' },
  { name: 'Dhoop', nameBn: 'ধূপ', nameHi: 'धूप', unit: '1 pc', pricePaise: 3000, category: 'Puja Items' },
  { name: 'Camphor', nameBn: 'কর্পূর', nameHi: 'कपूर', unit: '50 g', pricePaise: 6000, category: 'Puja Items' },
  { name: 'Cotton Wick', nameBn: 'প্রদীপের সলতে', nameHi: 'रुई की बत्ती', unit: '1 pc', pricePaise: 1500, category: 'Puja Items' },
  { name: 'Earthen Diya', nameBn: 'মাটির প্রদীপ', nameHi: 'मिट्टी का दीया', unit: '10 pc', pricePaise: 3000, category: 'Puja Items' },
  { name: 'Sindoor', nameBn: 'সিঁদুর', nameHi: 'सिंदूर', unit: '1 pc', pricePaise: 3000, category: 'Puja Items' },
  { name: 'Ganga Jal', nameBn: 'গঙ্গাজল', nameHi: 'गंगाजल', unit: '250 ml', pricePaise: 3000, category: 'Puja Items' },
  { name: 'Puja Thread', nameBn: 'পৈতে', nameHi: 'जनेऊ', unit: '1 pc', pricePaise: 2000, category: 'Puja Items' },
  { name: 'Honey Comb Wax', nameBn: 'মোমবাতি সেট', nameHi: 'मोमबत्ती सेट', unit: '6 pc', pricePaise: 4000, category: 'Puja Items' },
  { name: 'Pen', nameBn: 'কলম', nameHi: 'पेन', unit: '1 pc', pricePaise: 1000, category: 'Stationery' },
  { name: 'Pencil', nameBn: 'পেন্সিল', nameHi: 'पेंसिल', unit: '1 pc', pricePaise: 500, category: 'Stationery' },
  { name: 'Notebook', nameBn: 'খাতা', nameHi: 'कॉपी', unit: '1 pc', pricePaise: 3000, category: 'Stationery' },
  { name: 'Eraser', nameBn: 'রবার', nameHi: 'रबर', unit: '1 pc', pricePaise: 500, category: 'Stationery' },
  { name: 'Sharpener', nameBn: 'শার্পনার', nameHi: 'शार्पनर', unit: '1 pc', pricePaise: 500, category: 'Stationery' },
  { name: 'Glue Stick', nameBn: 'আঠা', nameHi: 'गोंद', unit: '1 pc', pricePaise: 2500, category: 'Stationery' },
  { name: 'Cello Tape', nameBn: 'সেলো টেপ', nameHi: 'सेलो टेप', unit: '1 pc', pricePaise: 3000, category: 'Stationery' },
  { name: 'Envelope', nameBn: 'খাম', nameHi: 'लिफ़ाफ़ा', unit: '10 pc', pricePaise: 2000, category: 'Stationery' },
  { name: 'Sattu', nameBn: 'ছাতু', nameHi: 'सत्तू', unit: '500 g', pricePaise: 6000, category: 'Rice & Atta' },
  { name: 'Jhal Muri Masala', nameBn: 'ঝালমুড়ির মশলা', nameHi: 'झालमुड़ी मसाला', unit: '100 g', pricePaise: 3000, category: 'Spices' },

  /* ----------------------------------------------------------------------
   * THE THIRD TRANCHE, taking this list past five hundred.
   *
   * Three hundred covered the kitchen and stopped there. What an owner still
   * had to dictate was everything a kirana sells that is not an ingredient:
   * the ketchup and the pasta, the bulb and the battery, the bucket and the
   * mop, the diapers, the dog food, the mishti on the counter at Puja. A list
   * that is generous about dal and silent about detergent is not a list of
   * what the shop sells.
   *
   * Measured against what a quick-commerce app puts in front of the same
   * customer — Blinkit, Zepto, Instamart — because that is the shelf a
   * shopper's expectation is set by now, whether or not the kirana likes it.
   * Where they carry a thing no para shop stocks, it is left out; where they
   * carry a thing every para shop stocks and this list had forgotten, it is
   * here.
   *
   * Five headings are new. Packaged Food, Frozen Food, Sweets, Electricals
   * and Pet Care are real aisles and were landing under "Other" — each one
   * needs a matching entry in `CATEGORY_VOCAB` in `lib/speech.ts`, or the
   * customer's filter chip reads in English on a Bengali shop page.
   *
   * WHAT IS DELIBERATELY ABSENT: cigarettes, bidi, gutkha and pan masala.
   * Every kirana sells them and no Halkhata storefront will list them — an
   * online sale is a delivery to somebody whose age nobody checked, which is
   * a line this product does not need to be near. An owner who wants them can
   * still type them in; they will not be suggested.
   *
   * THE PRICES ARE A STARTING POINT AND NOTHING MORE — see the note at the
   * top of this file.
   * -------------------------------------------------------------------- */

  // Rice & Atta
  { name: 'Multigrain Atta', nameBn: 'মাল্টিগ্রেন আটা', nameHi: 'मल्टीग्रेन आटा', unit: '1 kg', pricePaise: 6500, category: 'Rice & Atta' },
  { name: 'Ragi Flour', nameBn: 'রাগি আটা', nameHi: 'रागी आटा', unit: '500 g', pricePaise: 4500, category: 'Rice & Atta' },
  { name: 'Bajra Flour', nameBn: 'বাজরার আটা', nameHi: 'बाजरे का आटा', unit: '500 g', pricePaise: 3500, category: 'Rice & Atta' },
  { name: 'Jowar Flour', nameBn: 'জোয়ারের আটা', nameHi: 'ज्वार का आटा', unit: '500 g', pricePaise: 3800, category: 'Rice & Atta' },
  { name: 'Makai Atta', nameBn: 'ভুট্টার আটা', nameHi: 'मक्के का आटा', unit: '500 g', pricePaise: 3500, category: 'Rice & Atta' },
  { name: 'Barley', nameBn: 'যব', nameHi: 'जौ', unit: '500 g', pricePaise: 4000, category: 'Rice & Atta' },
  { name: 'Brown Rice', nameBn: 'ব্রাউন রাইস', nameHi: 'ब्राउन चावल', unit: '1 kg', pricePaise: 9000, category: 'Rice & Atta' },
  { name: 'Idli Rice', nameBn: 'ইডলি চাল', nameHi: 'इडली चावल', unit: '1 kg', pricePaise: 6500, category: 'Rice & Atta' },
  { name: 'Kalijira Rice', nameBn: 'কালিজিরা চাল', nameHi: 'कालीजीरा चावल', unit: '1 kg', pricePaise: 14000, category: 'Rice & Atta' },
  { name: 'Banskathi Rice', nameBn: 'বাঁশকাঠি চাল', nameHi: 'बांसकाठी चावल', unit: '1 kg', pricePaise: 5500, category: 'Rice & Atta' },

  // Dal & Pulses
  { name: 'Chilka Moong Dal', nameBn: 'ছিলকা মুগ ডাল', nameHi: 'छिलका मूंग दाल', unit: '500 g', pricePaise: 6500, category: 'Dal & Pulses' },
  { name: 'Chitra Rajma', nameBn: 'চিত্রা রাজমা', nameHi: 'चित्रा राजमा', unit: '500 g', pricePaise: 8000, category: 'Dal & Pulses' },
  { name: 'Moth Bean', nameBn: 'মটকি ডাল', nameHi: 'मोठ', unit: '500 g', pricePaise: 6000, category: 'Dal & Pulses' },
  { name: 'Horse Gram', nameBn: 'কুলথি কলাই', nameHi: 'कुलथी', unit: '500 g', pricePaise: 5000, category: 'Dal & Pulses' },
  { name: 'Soya Granules', nameBn: 'সয়া দানা', nameHi: 'सोया ग्रेन्यूल्स', unit: '200 g', pricePaise: 3000, category: 'Dal & Pulses' },
  { name: 'Sprouts Mix', nameBn: 'অঙ্কুর মিক্স', nameHi: 'स्प्राउट्स मिक्स', unit: '250 g', pricePaise: 4500, category: 'Dal & Pulses' },

  // Staples
  { name: 'Brown Sugar', nameBn: 'ব্রাউন সুগার', nameHi: 'ब्राउन शुगर', unit: '500 g', pricePaise: 4000, category: 'Staples' },
  { name: 'Jaggery Powder', nameBn: 'গুড়ের গুঁড়ো', nameHi: 'गुड़ पाउडर', unit: '500 g', pricePaise: 6000, category: 'Staples' },
  { name: 'Nolen Gur', nameBn: 'নলেন গুড়', nameHi: 'नोलेन गुड़', unit: '500 g', pricePaise: 12000, category: 'Staples' },
  { name: 'Patali Gur', nameBn: 'পাটালি গুড়', nameHi: 'पाटाली गुड़', unit: '500 g', pricePaise: 10000, category: 'Staples' },
  { name: 'Black Salt', nameBn: 'বিট নুন', nameHi: 'काला नमक', unit: '100 g', pricePaise: 2000, category: 'Staples' },
  { name: 'Sugar Free Sweetener', nameBn: 'সুগার ফ্রি', nameHi: 'शुगर फ्री', unit: '100 pc', pricePaise: 15000, category: 'Staples' },
  { name: 'Food Colour', nameBn: 'খাবার রং', nameHi: 'खाने का रंग', unit: '25 g', pricePaise: 2000, category: 'Staples' },
  { name: 'Rose Water', nameBn: 'গোলাপ জল', nameHi: 'गुलाब जल', unit: '100 ml', pricePaise: 4000, category: 'Staples' },
  { name: 'Kewra Water', nameBn: 'কেওড়া জল', nameHi: 'केवड़ा जल', unit: '100 ml', pricePaise: 4500, category: 'Staples' },
  { name: 'Vanilla Essence', nameBn: 'ভ্যানিলা এসেন্স', nameHi: 'वनीला एसेंस', unit: '20 ml', pricePaise: 3000, category: 'Staples' },
  { name: 'Cocoa Powder', nameBn: 'কোকো পাউডার', nameHi: 'कोको पाउडर', unit: '100 g', pricePaise: 9000, category: 'Staples' },
  { name: 'Icing Sugar', nameBn: 'আইসিং সুগার', nameHi: 'आइसिंग शुगर', unit: '250 g', pricePaise: 5000, category: 'Staples' },

  // Oil & Ghee
  { name: 'Kachi Ghani Mustard Oil', nameBn: 'কাঁচি ঘানি সরিষার তেল', nameHi: 'कच्ची घानी सरसों तेल', unit: '1 l', pricePaise: 18000, category: 'Oil & Ghee' },
  { name: 'Refined Oil', nameBn: 'রিফাইন্ড তেল', nameHi: 'रिफाइंड तेल', unit: '1 l', pricePaise: 14000, category: 'Oil & Ghee' },
  { name: 'Cow Ghee', nameBn: 'গরুর ঘি', nameHi: 'गाय का घी', unit: '200 g', pricePaise: 16000, category: 'Oil & Ghee' },

  // Spices
  { name: 'Cumin Powder', nameBn: 'জিরে গুঁড়ো', nameHi: 'जीरा पाउडर', unit: '100 g', pricePaise: 5000, category: 'Spices' },
  { name: 'Coriander Powder', nameBn: 'ধনে গুঁড়ো', nameHi: 'धनिया पाउडर', unit: '100 g', pricePaise: 3500, category: 'Spices' },
  { name: 'Kashmiri Chilli Powder', nameBn: 'কাশ্মীরি লঙ্কা গুঁড়ো', nameHi: 'कश्मीरी मिर्च पाउडर', unit: '100 g', pricePaise: 6000, category: 'Spices' },
  { name: 'Turmeric Whole', nameBn: 'গোটা হলুদ', nameHi: 'साबुत हल्दी', unit: '100 g', pricePaise: 4000, category: 'Spices' },
  { name: 'Ginger Powder', nameBn: 'শুঁঠ', nameHi: 'सोंठ', unit: '100 g', pricePaise: 5000, category: 'Spices' },
  { name: 'Black Cardamom', nameBn: 'বড় এলাচ', nameHi: 'बड़ी इलायची', unit: '50 g', pricePaise: 9000, category: 'Spices' },
  { name: 'Saffron', nameBn: 'জাফরান', nameHi: 'केसर', unit: '1 g', pricePaise: 25000, category: 'Spices' },
  { name: 'Sesame Seed', nameBn: 'তিল', nameHi: 'तिल', unit: '100 g', pricePaise: 3000, category: 'Spices' },
  { name: 'Flax Seed', nameBn: 'তিসি', nameHi: 'अलसी', unit: '100 g', pricePaise: 3000, category: 'Spices' },
  { name: 'Radhuni', nameBn: 'রাঁধুনি', nameHi: 'राधुनी', unit: '50 g', pricePaise: 2500, category: 'Spices' },
  { name: 'Shahi Jeera', nameBn: 'শাহি জিরে', nameHi: 'शाही जीरा', unit: '50 g', pricePaise: 6000, category: 'Spices' },
  { name: 'Pav Bhaji Masala', nameBn: 'পাও ভাজি মশলা', nameHi: 'पाव भाजी मसाला', unit: '100 g', pricePaise: 7000, category: 'Spices' },
  { name: 'Chana Masala', nameBn: 'ছোলার মশলা', nameHi: 'छोले मसाला', unit: '100 g', pricePaise: 6000, category: 'Spices' },
  { name: 'Sambar Masala', nameBn: 'সাম্বার মশলা', nameHi: 'सांभर मसाला', unit: '100 g', pricePaise: 7000, category: 'Spices' },

  // Vegetables
  { name: 'Raw Banana', nameBn: 'কাঁচকলা', nameHi: 'कच्चा केला', unit: '4 pc', pricePaise: 3000, category: 'Vegetables' },
  { name: 'Broccoli', nameBn: 'ব্রকোলি', nameHi: 'ब्रोकली', unit: '250 g', pricePaise: 4000, category: 'Vegetables' },
  { name: 'Lettuce', nameBn: 'লেটুস', nameHi: 'लेट्यूस', unit: '1 pc', pricePaise: 4000, category: 'Vegetables' },
  { name: 'Baby Corn', nameBn: 'বেবি কর্ন', nameHi: 'बेबी कॉर्न', unit: '200 g', pricePaise: 4000, category: 'Vegetables' },
  { name: 'Note Shak', nameBn: 'নটে শাক', nameHi: 'चौलाई साग', unit: '1 bunch', pricePaise: 1500, category: 'Vegetables' },
  { name: 'Kolmi Shak', nameBn: 'কলমি শাক', nameHi: 'कलमी साग', unit: '1 bunch', pricePaise: 1500, category: 'Vegetables' },
  { name: 'Stem Amaranth', nameBn: 'ডাঁটা', nameHi: 'डंठल', unit: '250 g', pricePaise: 2000, category: 'Vegetables' },
  { name: 'Green Mango', nameBn: 'কাঁচা আম', nameHi: 'कच्चा आम', unit: '500 g', pricePaise: 4000, category: 'Vegetables' },
  { name: 'Shallot', nameBn: 'ছোট পেঁয়াজ', nameHi: 'छोटा प्याज', unit: '250 g', pricePaise: 4000, category: 'Vegetables' },
  { name: 'Chandramukhi Potato', nameBn: 'চন্দ্রমুখী আলু', nameHi: 'चंद्रमुखी आलू', unit: '1 kg', pricePaise: 3500, category: 'Vegetables' },
  { name: 'Jyoti Potato', nameBn: 'জ্যোতি আলু', nameHi: 'ज्योति आलू', unit: '1 kg', pricePaise: 2800, category: 'Vegetables' },
  { name: 'Amla', nameBn: 'আমলকি', nameHi: 'आंवला', unit: '250 g', pricePaise: 3000, category: 'Vegetables' },
  { name: 'Turnip', nameBn: 'শালগম', nameHi: 'शलजम', unit: '500 g', pricePaise: 2500, category: 'Vegetables' },
  { name: 'Knol Khol', nameBn: 'ওলকপি', nameHi: 'गांठ गोभी', unit: '500 g', pricePaise: 2500, category: 'Vegetables' },

  // Fruits
  { name: 'Pomelo', nameBn: 'বাতাবি লেবু', nameHi: 'चकोतरा', unit: '1 pc', pricePaise: 5000, category: 'Fruits' },
  { name: 'Star Fruit', nameBn: 'কামরাঙা', nameHi: 'कमरख', unit: '500 g', pricePaise: 4000, category: 'Fruits' },
  { name: 'Bel', nameBn: 'বেল', nameHi: 'बेल', unit: '1 pc', pricePaise: 4000, category: 'Fruits' },
  { name: 'Dragon Fruit', nameBn: 'ড্রাগন ফল', nameHi: 'ड्रैगन फ्रूट', unit: '1 pc', pricePaise: 8000, category: 'Fruits' },
  { name: 'Kiwi', nameBn: 'কিউই', nameHi: 'कीवी', unit: '3 pc', pricePaise: 9000, category: 'Fruits' },
  { name: 'Strawberry', nameBn: 'স্ট্রবেরি', nameHi: 'स्ट्रॉबेरी', unit: '200 g', pricePaise: 10000, category: 'Fruits' },
  { name: 'Green Apple', nameBn: 'সবুজ আপেল', nameHi: 'हरा सेब', unit: '500 g', pricePaise: 12000, category: 'Fruits' },
  { name: 'Black Grapes', nameBn: 'কালো আঙুর', nameHi: 'काले अंगूर', unit: '500 g', pricePaise: 7000, category: 'Fruits' },
  { name: 'Tender Coconut', nameBn: 'ডাব', nameHi: 'नारियल पानी', unit: '1 pc', pricePaise: 5000, category: 'Fruits' },
  { name: 'Peach', nameBn: 'পিচ ফল', nameHi: 'आड़ू', unit: '500 g', pricePaise: 12000, category: 'Fruits' },
  { name: 'Himsagar Mango', nameBn: 'হিমসাগর আম', nameHi: 'हिमसागर आम', unit: '1 kg', pricePaise: 12000, category: 'Fruits' },
  { name: 'Langra Mango', nameBn: 'ল্যাংড়া আম', nameHi: 'लंगड़ा आम', unit: '1 kg', pricePaise: 10000, category: 'Fruits' },

  // Dairy
  { name: 'Toned Milk', nameBn: 'টোনড দুধ', nameHi: 'टोंड दूध', unit: '1 l', pricePaise: 5600, category: 'Dairy' },
  { name: 'Full Cream Milk', nameBn: 'ফুল ক্রিম দুধ', nameHi: 'फुल क्रीम दूध', unit: '1 l', pricePaise: 6800, category: 'Dairy' },
  { name: 'Greek Yogurt', nameBn: 'গ্রিক দই', nameHi: 'ग्रीक योगर्ट', unit: '100 g', pricePaise: 4000, category: 'Dairy' },
  { name: 'Fruit Yoghurt', nameBn: 'ফ্রুট দই', nameHi: 'फ्रूट योगर्ट', unit: '100 g', pricePaise: 3000, category: 'Dairy' },
  { name: 'Cheese Slice', nameBn: 'চিজ স্লাইস', nameHi: 'चीज़ स्लाइस', unit: '200 g', pricePaise: 15000, category: 'Dairy' },
  { name: 'Cheese Spread', nameBn: 'চিজ স্প্রেড', nameHi: 'चीज़ स्प्रेड', unit: '180 g', pricePaise: 14000, category: 'Dairy' },
  { name: 'Tofu', nameBn: 'টোফু', nameHi: 'टोफू', unit: '200 g', pricePaise: 8000, category: 'Dairy' },
  { name: 'Chena', nameBn: 'ছানা', nameHi: 'छेना', unit: '250 g', pricePaise: 6000, category: 'Dairy' },
  { name: 'Country Egg', nameBn: 'দেশি ডিম', nameHi: 'देसी अंडा', unit: '6 pc', pricePaise: 7000, category: 'Dairy' },
  { name: 'Duck Egg', nameBn: 'হাঁসের ডিম', nameHi: 'बतख का अंडा', unit: '6 pc', pricePaise: 7000, category: 'Dairy' },

  // Tea & Coffee
  { name: 'Lemon Tea Premix', nameBn: 'লেবু চা প্রিমিক্স', nameHi: 'नींबू चाय प्रीमिक्स', unit: '200 g', pricePaise: 12000, category: 'Tea & Coffee' },
  { name: 'Tulsi Green Tea', nameBn: 'তুলসী গ্রিন টি', nameHi: 'तुलसी ग्रीन टी', unit: '25 pc', pricePaise: 18000, category: 'Tea & Coffee' },
  { name: 'Filter Coffee Powder', nameBn: 'ফিল্টার কফি পাউডার', nameHi: 'फिल्टर कॉफ़ी पाउडर', unit: '200 g', pricePaise: 14000, category: 'Tea & Coffee' },
  { name: 'Drinking Chocolate', nameBn: 'ড্রিংকিং চকোলেট', nameHi: 'ड्रिंकिंग चॉकलेट', unit: '200 g', pricePaise: 15000, category: 'Tea & Coffee' },
  { name: 'Iced Tea Mix', nameBn: 'আইসড টি মিক্স', nameHi: 'आइस्ड टी मिक्स', unit: '400 g', pricePaise: 18000, category: 'Tea & Coffee' },

  // Beverages
  { name: 'Water Jar', nameBn: 'জলের জার', nameHi: 'पानी का जार', unit: '20 l', pricePaise: 8000, category: 'Beverages' },
  { name: 'Packaged Coconut Water', nameBn: 'প্যাকেট ডাবের জল', nameHi: 'पैक्ड नारियल पानी', unit: '200 ml', pricePaise: 4000, category: 'Beverages' },
  { name: 'Rose Sharbat', nameBn: 'গোলাপ শরবত', nameHi: 'गुलाब शरबत', unit: '750 ml', pricePaise: 20000, category: 'Beverages' },
  { name: 'Mango Drink', nameBn: 'আমের পানীয়', nameHi: 'आम का ड्रिंक', unit: '600 ml', pricePaise: 4500, category: 'Beverages' },
  { name: 'ORS Drink', nameBn: 'ওআরএস পানীয়', nameHi: 'ओआरएस ड्रिंक', unit: '200 ml', pricePaise: 2500, category: 'Beverages' },

  // Snacks
  { name: 'Digestive Biscuit', nameBn: 'ডাইজেস্টিভ বিস্কুট', nameHi: 'डाइजेस्टिव बिस्कुट', unit: '250 g', pricePaise: 6000, category: 'Snacks' },
  { name: 'Cream Cracker', nameBn: 'ক্রিম ক্র্যাকার', nameHi: 'क्रीम क्रैकर', unit: '200 g', pricePaise: 4000, category: 'Snacks' },
  { name: 'Cookies', nameBn: 'কুকিজ', nameHi: 'कुकीज़', unit: '250 g', pricePaise: 12000, category: 'Snacks' },
  { name: 'Khari Biscuit', nameBn: 'খারি বিস্কুট', nameHi: 'खारी बिस्कुट', unit: '250 g', pricePaise: 8000, category: 'Snacks' },
  { name: 'Toast Biscuit', nameBn: 'টোস্ট বিস্কুট', nameHi: 'टोस्ट बिस्कुट', unit: '400 g', pricePaise: 7000, category: 'Snacks' },
  { name: 'Nankhatai', nameBn: 'নানখাতাই', nameHi: 'नानखताई', unit: '200 g', pricePaise: 5000, category: 'Snacks' },
  { name: 'Corn Puffs', nameBn: 'কর্ন পাফ', nameHi: 'कॉर्न पफ', unit: '100 g', pricePaise: 2000, category: 'Snacks' },
  { name: 'Bhel Mix', nameBn: 'ভেলপুরি মিক্স', nameHi: 'भेल मिक्स', unit: '200 g', pricePaise: 4000, category: 'Snacks' },
  { name: 'Sev', nameBn: 'সেভ', nameHi: 'सेव', unit: '200 g', pricePaise: 4500, category: 'Snacks' },
  { name: 'Energy Bar', nameBn: 'এনার্জি বার', nameHi: 'एनर्जी बार', unit: '1 pc', pricePaise: 4000, category: 'Snacks' },
  { name: 'Dark Chocolate', nameBn: 'ডার্ক চকোলেট', nameHi: 'डार्क चॉकलेट', unit: '100 g', pricePaise: 15000, category: 'Snacks' },
  { name: 'Lollipop', nameBn: 'ললিপপ', nameHi: 'लॉलीपॉप', unit: '1 pc', pricePaise: 500, category: 'Snacks' },
  { name: 'Brown Bread', nameBn: 'ব্রাউন ব্রেড', nameHi: 'ब्राउन ब्रेड', unit: '1 pc', pricePaise: 5500, category: 'Snacks' },
  { name: 'Pav', nameBn: 'পাভ', nameHi: 'पाव', unit: '6 pc', pricePaise: 3000, category: 'Snacks' },
  { name: 'Bun', nameBn: 'বান', nameHi: 'बन', unit: '1 pc', pricePaise: 1500, category: 'Snacks' },
  { name: 'Dry Cake', nameBn: 'ড্রাই কেক', nameHi: 'ड्राई केक', unit: '200 g', pricePaise: 5000, category: 'Snacks' },

  // Sweets — the counter jar and the Puja box. A kirana that sells nothing
  // else sweet still sells chikki and a tin of rosogolla.
  { name: 'Rasgulla', nameBn: 'রসগোল্লা', nameHi: 'रसगुल्ला', unit: '1 kg', pricePaise: 20000, category: 'Sweets' },
  { name: 'Gulab Jamun', nameBn: 'গোলাপ জাম', nameHi: 'गुलाब जामुन', unit: '1 kg', pricePaise: 22000, category: 'Sweets' },
  { name: 'Sandesh', nameBn: 'সন্দেশ', nameHi: 'संदेश', unit: '1 pc', pricePaise: 2000, category: 'Sweets' },
  { name: 'Laddu', nameBn: 'লাড্ডু', nameHi: 'लड्डू', unit: '1 pc', pricePaise: 2000, category: 'Sweets' },
  { name: 'Soan Papdi', nameBn: 'সোন পাপড়ি', nameHi: 'सोन पापड़ी', unit: '250 g', pricePaise: 6000, category: 'Sweets' },
  { name: 'Peanut Chikki', nameBn: 'চিনাবাদামের চিক্কি', nameHi: 'मूंगफली चिक्की', unit: '100 g', pricePaise: 3000, category: 'Sweets' },
  { name: 'Til Chikki', nameBn: 'তিলের চিক্কি', nameHi: 'तिल चिक्की', unit: '100 g', pricePaise: 3000, category: 'Sweets' },
  { name: 'Kaju Barfi', nameBn: 'কাজু বরফি', nameHi: 'काजू बर्फी', unit: '250 g', pricePaise: 25000, category: 'Sweets' },
  { name: 'Jalebi', nameBn: 'জিলিপি', nameHi: 'जलेबी', unit: '250 g', pricePaise: 6000, category: 'Sweets' },

  // Packaged Food — the aisle a kirana has had for twenty years and this
  // list had no heading for: the bottle, the packet and the tin.
  { name: 'Tomato Ketchup', nameBn: 'টমেটো কেচাপ', nameHi: 'टमाटो केचप', unit: '500 g', pricePaise: 11000, category: 'Packaged Food' },
  { name: 'Mayonnaise', nameBn: 'মেয়োনিজ', nameHi: 'मेयोनीज़', unit: '250 g', pricePaise: 9000, category: 'Packaged Food' },
  { name: 'Chilli Sauce', nameBn: 'চিলি সস', nameHi: 'चिली सॉस', unit: '200 g', pricePaise: 5000, category: 'Packaged Food' },
  { name: 'Soy Sauce', nameBn: 'সয়া সস', nameHi: 'सोया सॉस', unit: '200 ml', pricePaise: 5000, category: 'Packaged Food' },
  { name: 'Schezwan Chutney', nameBn: 'শেজোয়ান চাটনি', nameHi: 'शेज़वान चटनी', unit: '250 g', pricePaise: 9000, category: 'Packaged Food' },
  { name: 'Peanut Butter', nameBn: 'পিনাট বাটার', nameHi: 'पीनट बटर', unit: '340 g', pricePaise: 18000, category: 'Packaged Food' },
  { name: 'Chocolate Spread', nameBn: 'চকোলেট স্প্রেড', nameHi: 'चॉकलेट स्प्रेड', unit: '290 g', pricePaise: 22000, category: 'Packaged Food' },
  { name: 'Pasta', nameBn: 'পাস্তা', nameHi: 'पास्ता', unit: '500 g', pricePaise: 7000, category: 'Packaged Food' },
  { name: 'Macaroni', nameBn: 'ম্যাকারনি', nameHi: 'मैकरोनी', unit: '400 g', pricePaise: 5000, category: 'Packaged Food' },
  { name: 'Cup Noodles', nameBn: 'কাপ নুডলস', nameHi: 'कप नूडल्स', unit: '1 pc', pricePaise: 5000, category: 'Packaged Food' },
  { name: 'Hakka Noodles', nameBn: 'হাক্কা নুডলস', nameHi: 'हक्का नूडल्स', unit: '400 g', pricePaise: 6000, category: 'Packaged Food' },
  { name: 'Instant Soup', nameBn: 'ইনস্ট্যান্ট স্যুপ', nameHi: 'इंस्टेंट सूप', unit: '1 pc', pricePaise: 5000, category: 'Packaged Food' },
  { name: 'Idli Dosa Batter', nameBn: 'ইডলি দোসার ব্যাটার', nameHi: 'इडली डोसा बैटर', unit: '1 kg', pricePaise: 7000, category: 'Packaged Food' },
  { name: 'Gulab Jamun Mix', nameBn: 'গোলাপ জাম মিক্স', nameHi: 'गुलाब जामुन मिक्स', unit: '200 g', pricePaise: 6500, category: 'Packaged Food' },
  { name: 'Cake Mix', nameBn: 'কেক মিক্স', nameHi: 'केक मिक्स', unit: '250 g', pricePaise: 9000, category: 'Packaged Food' },
  { name: 'Instant Upma Mix', nameBn: 'ইনস্ট্যান্ট উপমা মিক্স', nameHi: 'इंस्टेंट उपमा मिक्स', unit: '200 g', pricePaise: 5000, category: 'Packaged Food' },
  { name: 'Ready Meal', nameBn: 'রেডি মিল', nameHi: 'रेडी मील', unit: '300 g', pricePaise: 12000, category: 'Packaged Food' },
  { name: 'Mango Chutney', nameBn: 'আমের চাটনি', nameHi: 'आम की चटनी', unit: '200 g', pricePaise: 5000, category: 'Packaged Food' },
  { name: 'Sweet Corn Tin', nameBn: 'সুইট কর্ন টিন', nameHi: 'स्वीट कॉर्न टिन', unit: '400 g', pricePaise: 8000, category: 'Packaged Food' },
  { name: 'Baked Beans', nameBn: 'বেকড বিনস', nameHi: 'बेक्ड बीन्स', unit: '415 g', pricePaise: 11000, category: 'Packaged Food' },
  { name: 'Pasta Sauce', nameBn: 'পাস্তা সস', nameHi: 'पास्ता सॉस', unit: '400 g', pricePaise: 14000, category: 'Packaged Food' },
  { name: 'Muesli', nameBn: 'মিউসলি', nameHi: 'म्यूसली', unit: '500 g', pricePaise: 22000, category: 'Packaged Food' },

  // Frozen Food — only for a shop with a freezer, which is why it is its own
  // heading rather than mixed into the packets a shelf can hold.
  { name: 'Frozen Peas', nameBn: 'ফ্রোজেন মটরশুঁটি', nameHi: 'फ्रोज़न मटर', unit: '500 g', pricePaise: 9000, category: 'Frozen Food' },
  { name: 'Frozen Paratha', nameBn: 'ফ্রোজেন পরোটা', nameHi: 'फ्रोज़न पराठा', unit: '5 pc', pricePaise: 9000, category: 'Frozen Food' },
  { name: 'French Fries', nameBn: 'ফ্রেঞ্চ ফ্রাই', nameHi: 'फ्रेंच फ्राइज़', unit: '400 g', pricePaise: 12000, category: 'Frozen Food' },
  { name: 'Veg Nuggets', nameBn: 'ভেজ নাগেটস', nameHi: 'वेज नगेट्स', unit: '300 g', pricePaise: 12000, category: 'Frozen Food' },
  { name: 'Chicken Nuggets', nameBn: 'চিকেন নাগেটস', nameHi: 'चिकन नगेट्स', unit: '300 g', pricePaise: 18000, category: 'Frozen Food' },
  { name: 'Frozen Momo', nameBn: 'ফ্রোজেন মোমো', nameHi: 'फ्रोज़न मोमो', unit: '10 pc', pricePaise: 13000, category: 'Frozen Food' },
  { name: 'Frozen Corn', nameBn: 'ফ্রোজেন ভুট্টা', nameHi: 'फ्रोज़न कॉर्न', unit: '500 g', pricePaise: 9000, category: 'Frozen Food' },
  { name: 'Fish Finger', nameBn: 'ফিশ ফিঙ্গার', nameHi: 'फिश फिंगर', unit: '300 g', pricePaise: 20000, category: 'Frozen Food' },

  // Dry Fruits
  { name: 'Sunflower Seed', nameBn: 'সূর্যমুখী বীজ', nameHi: 'सूरजमुखी बीज', unit: '100 g', pricePaise: 4000, category: 'Dry Fruits' },
  { name: 'Pumpkin Seed', nameBn: 'কুমড়োর বীজ', nameHi: 'कद्दू के बीज', unit: '100 g', pricePaise: 5000, category: 'Dry Fruits' },
  { name: 'Chia Seed', nameBn: 'চিয়া বীজ', nameHi: 'चिया बीज', unit: '100 g', pricePaise: 5000, category: 'Dry Fruits' },
  { name: 'Dry Dates', nameBn: 'কাবলি খেজুর', nameHi: 'छुहारा', unit: '250 g', pricePaise: 8000, category: 'Dry Fruits' },
  { name: 'Mixed Dry Fruits', nameBn: 'মিক্সড ড্রাই ফ্রুট', nameHi: 'मिक्स ड्राई फ्रूट', unit: '250 g', pricePaise: 25000, category: 'Dry Fruits' },

  // Household
  { name: 'Bucket', nameBn: 'বালতি', nameHi: 'बाल्टी', unit: '1 pc', pricePaise: 15000, category: 'Household' },
  { name: 'Mug', nameBn: 'মগ', nameHi: 'मग', unit: '1 pc', pricePaise: 4000, category: 'Household' },
  { name: 'Mop', nameBn: 'মপ', nameHi: 'मॉप', unit: '1 pc', pricePaise: 20000, category: 'Household' },
  { name: 'Floor Wiper', nameBn: 'মেঝের ওয়াইপার', nameHi: 'फ़र्श वाइपर', unit: '1 pc', pricePaise: 15000, category: 'Household' },
  { name: 'Toilet Brush', nameBn: 'টয়লেট ব্রাশ', nameHi: 'टॉयलेट ब्रश', unit: '1 pc', pricePaise: 9000, category: 'Household' },
  { name: 'Dustbin', nameBn: 'ডাস্টবিন', nameHi: 'डस्टबिन', unit: '1 pc', pricePaise: 20000, category: 'Household' },
  { name: 'Clothesline Rope', nameBn: 'কাপড়ের দড়ি', nameHi: 'कपड़े की रस्सी', unit: '1 pc', pricePaise: 6000, category: 'Household' },
  { name: 'Cloth Clip', nameBn: 'কাপড়ের ক্লিপ', nameHi: 'कपड़े की क्लिप', unit: '12 pc', pricePaise: 3000, category: 'Household' },
  { name: 'Steel Scrubber', nameBn: 'স্টিলের স্ক্রাবার', nameHi: 'स्टील स्क्रबर', unit: '1 pc', pricePaise: 1500, category: 'Household' },
  { name: 'Duster Cloth', nameBn: 'ঝাড়ন', nameHi: 'डस्टर कपड़ा', unit: '1 pc', pricePaise: 4000, category: 'Household' },
  { name: 'Sponge Wipe', nameBn: 'স্পঞ্জ', nameHi: 'स्पंज', unit: '1 pc', pricePaise: 3000, category: 'Household' },
  { name: 'Glass Cleaner', nameBn: 'কাচ পরিষ্কারক', nameHi: 'ग्लास क्लीनर', unit: '500 ml', pricePaise: 10000, category: 'Household' },
  { name: 'Washing Soda', nameBn: 'ওয়াশিং সোডা', nameHi: 'वाशिंग सोडा', unit: '500 g', pricePaise: 3000, category: 'Household' },
  { name: 'Detergent Bar', nameBn: 'কাপড় কাচার সাবান', nameHi: 'कपड़े धोने का साबुन', unit: '1 pc', pricePaise: 2000, category: 'Household' },
  { name: 'Fabric Conditioner', nameBn: 'ফ্যাব্রিক কন্ডিশনার', nameHi: 'फ़ैब्रिक कंडीशनर', unit: '400 ml', pricePaise: 12000, category: 'Household' },
  { name: 'Cling Film', nameBn: 'ক্লিং ফিল্ম', nameHi: 'क्लिंग फिल्म', unit: '1 pc', pricePaise: 7000, category: 'Household' },
  { name: 'Carry Bag', nameBn: 'ক্যারি ব্যাগ', nameHi: 'कैरी बैग', unit: '100 pc', pricePaise: 6000, category: 'Household' },
  { name: 'Paper Cup', nameBn: 'কাগজের কাপ', nameHi: 'पेपर कप', unit: '50 pc', pricePaise: 5000, category: 'Household' },
  { name: 'Paper Plate', nameBn: 'কাগজের প্লেট', nameHi: 'पेपर प्लेट', unit: '25 pc', pricePaise: 6000, category: 'Household' },
  { name: 'Disposable Spoon', nameBn: 'প্লাস্টিকের চামচ', nameHi: 'डिस्पोजेबल चम्मच', unit: '25 pc', pricePaise: 3000, category: 'Household' },
  { name: 'Lighter', nameBn: 'লাইটার', nameHi: 'लाइटर', unit: '1 pc', pricePaise: 2000, category: 'Household' },
  { name: 'Face Tissue', nameBn: 'টিস্যু পেপার', nameHi: 'टिशू पेपर', unit: '100 pc', pricePaise: 7000, category: 'Household' },
  { name: 'Shoe Polish', nameBn: 'জুতোর পালিশ', nameHi: 'जूता पॉलिश', unit: '40 g', pricePaise: 5000, category: 'Household' },

  // Electricals — the bulb and the battery, which every para shop sells and
  // nobody buys anywhere else at nine at night.
  { name: 'LED Bulb', nameBn: 'এলইডি বাল্ব', nameHi: 'एलईडी बल्ब', unit: '1 pc', pricePaise: 10000, category: 'Electricals' },
  { name: 'Tube Light', nameBn: 'টিউব লাইট', nameHi: 'ट्यूब लाइट', unit: '1 pc', pricePaise: 25000, category: 'Electricals' },
  { name: 'Torch', nameBn: 'টর্চ', nameHi: 'टॉर्च', unit: '1 pc', pricePaise: 15000, category: 'Electricals' },
  { name: 'Battery', nameBn: 'ব্যাটারি', nameHi: 'बैटरी', unit: '2 pc', pricePaise: 4000, category: 'Electricals' },
  { name: 'Extension Cord', nameBn: 'এক্সটেনশন কর্ড', nameHi: 'एक्सटेंशन कॉर्ड', unit: '1 pc', pricePaise: 25000, category: 'Electricals' },
  { name: 'Insulation Tape', nameBn: 'ইনসুলেশন টেপ', nameHi: 'इंसुलेशन टेप', unit: '1 pc', pricePaise: 2000, category: 'Electricals' },
  { name: 'Bulb Holder', nameBn: 'বাল্ব হোল্ডার', nameHi: 'बल्ब होल्डर', unit: '1 pc', pricePaise: 4000, category: 'Electricals' },
  { name: 'Electric Plug', nameBn: 'ইলেকট্রিক প্লাগ', nameHi: 'इलेक्ट्रिक प्लग', unit: '1 pc', pricePaise: 4000, category: 'Electricals' },

  // Personal Care
  { name: 'Face Wash', nameBn: 'ফেস ওয়াশ', nameHi: 'फेस वाश', unit: '100 g', pricePaise: 12000, category: 'Personal Care' },
  { name: 'Body Lotion', nameBn: 'বডি লোশন', nameHi: 'बॉडी लोशन', unit: '200 ml', pricePaise: 15000, category: 'Personal Care' },
  { name: 'Sunscreen', nameBn: 'সানস্ক্রিন', nameHi: 'सनस्क्रीन', unit: '50 g', pricePaise: 20000, category: 'Personal Care' },
  { name: 'Mehendi', nameBn: 'মেহেন্দি', nameHi: 'मेहंदी', unit: '100 g', pricePaise: 4000, category: 'Personal Care' },
  { name: 'Shaving Blade', nameBn: 'শেভিং ব্লেড', nameHi: 'शेविंग ब्लेड', unit: '5 pc', pricePaise: 3000, category: 'Personal Care' },
  { name: 'Perfume', nameBn: 'পারফিউম', nameHi: 'परफ्यूम', unit: '30 ml', pricePaise: 15000, category: 'Personal Care' },
  { name: 'Nail Polish', nameBn: 'নেলপলিশ', nameHi: 'नेल पॉलिश', unit: '1 pc', pricePaise: 5000, category: 'Personal Care' },
  { name: 'Hair Band', nameBn: 'হেয়ার ব্যান্ড', nameHi: 'हेयर बैंड', unit: '6 pc', pricePaise: 3000, category: 'Personal Care' },
  { name: 'Hair Clip', nameBn: 'চুলের ক্লিপ', nameHi: 'हेयर क्लिप', unit: '6 pc', pricePaise: 3000, category: 'Personal Care' },
  { name: 'Band Aid', nameBn: 'ব্যান্ড এইড', nameHi: 'बैंड एड', unit: '10 pc', pricePaise: 4000, category: 'Personal Care' },
  { name: 'Cotton Roll', nameBn: 'তুলো', nameHi: 'रुई', unit: '50 g', pricePaise: 4000, category: 'Personal Care' },
  { name: 'Pain Balm', nameBn: 'ব্যথার বাম', nameHi: 'दर्द बाम', unit: '10 ml', pricePaise: 5000, category: 'Personal Care' },
  { name: 'ORS Powder', nameBn: 'ওআরএস পাউডার', nameHi: 'ओआरएस पाउडर', unit: '21 g', pricePaise: 2500, category: 'Personal Care' },
  { name: 'Mouthwash', nameBn: 'মাউথওয়াশ', nameHi: 'माउथवाश', unit: '250 ml', pricePaise: 12000, category: 'Personal Care' },
  { name: 'Tongue Cleaner', nameBn: 'জিভ ছোলা', nameHi: 'जीभी', unit: '1 pc', pricePaise: 2000, category: 'Personal Care' },
  { name: 'Tooth Powder', nameBn: 'দাঁতের মাজন', nameHi: 'दंत मंजन', unit: '100 g', pricePaise: 4000, category: 'Personal Care' },
  { name: 'Shower Gel', nameBn: 'শাওয়ার জেল', nameHi: 'शावर जेल', unit: '250 ml', pricePaise: 18000, category: 'Personal Care' },
  { name: 'Wet Wipes', nameBn: 'ওয়েট ওয়াইপস', nameHi: 'वेट वाइप्स', unit: '30 pc', pricePaise: 6000, category: 'Personal Care' },

  // Baby Care
  { name: 'Baby Wipes', nameBn: 'বেবি ওয়াইপস', nameHi: 'बेबी वाइप्स', unit: '72 pc', pricePaise: 15000, category: 'Baby Care' },
  { name: 'Baby Shampoo', nameBn: 'বেবি শ্যাম্পু', nameHi: 'बेबी शैम्पू', unit: '100 ml', pricePaise: 13000, category: 'Baby Care' },
  { name: 'Feeding Bottle', nameBn: 'ফিডিং বোতল', nameHi: 'फीडिंग बोतल', unit: '1 pc', pricePaise: 25000, category: 'Baby Care' },
  { name: 'Baby Cream', nameBn: 'বেবি ক্রিম', nameHi: 'बेबी क्रीम', unit: '50 g', pricePaise: 10000, category: 'Baby Care' },
  { name: 'Baby Detergent', nameBn: 'বেবি ডিটারজেন্ট', nameHi: 'बेबी डिटर्जेंट', unit: '500 ml', pricePaise: 20000, category: 'Baby Care' },

  // Puja Items
  { name: 'Dhunuchi', nameBn: 'ধুনুচি', nameHi: 'धुनुची', unit: '1 pc', pricePaise: 5000, category: 'Puja Items' },
  { name: 'Alta', nameBn: 'আলতা', nameHi: 'आलता', unit: '1 pc', pricePaise: 1500, category: 'Puja Items' },
  { name: 'Chandan', nameBn: 'চন্দন', nameHi: 'चंदन', unit: '50 g', pricePaise: 5000, category: 'Puja Items' },
  { name: 'Havan Samagri', nameBn: 'হবন সামগ্রী', nameHi: 'हवन सामग्री', unit: '200 g', pricePaise: 6000, category: 'Puja Items' },
  { name: 'Roli', nameBn: 'রোলি', nameHi: 'रोली', unit: '50 g', pricePaise: 2000, category: 'Puja Items' },
  { name: 'Batasha', nameBn: 'বাতাসা', nameHi: 'बताशा', unit: '200 g', pricePaise: 3000, category: 'Puja Items' },

  // Stationery
  { name: 'Drawing Book', nameBn: 'আঁকার খাতা', nameHi: 'ड्राइंग बुक', unit: '1 pc', pricePaise: 4000, category: 'Stationery' },
  { name: 'Ruler', nameBn: 'স্কেল', nameHi: 'स्केल', unit: '1 pc', pricePaise: 1000, category: 'Stationery' },
  { name: 'Geometry Box', nameBn: 'জ্যামিতি বাক্স', nameHi: 'ज्यामिति बॉक्स', unit: '1 pc', pricePaise: 12000, category: 'Stationery' },
  { name: 'Crayons', nameBn: 'ক্রেয়ন', nameHi: 'क्रेयॉन', unit: '12 pc', pricePaise: 6000, category: 'Stationery' },
  { name: 'Sketch Pen', nameBn: 'স্কেচ পেন', nameHi: 'स्केच पेन', unit: '12 pc', pricePaise: 8000, category: 'Stationery' },
  { name: 'Marker', nameBn: 'মার্কার', nameHi: 'मार्कर', unit: '1 pc', pricePaise: 3000, category: 'Stationery' },
  { name: 'Stapler', nameBn: 'স্টেপলার', nameHi: 'स्टेपलर', unit: '1 pc', pricePaise: 8000, category: 'Stationery' },
  { name: 'Stapler Pin', nameBn: 'স্টেপলার পিন', nameHi: 'स्टेपलर पिन', unit: '1 pc', pricePaise: 2000, category: 'Stationery' },
  { name: 'Safety Pin', nameBn: 'সেফটি পিন', nameHi: 'सेफ्टी पिन', unit: '12 pc', pricePaise: 1000, category: 'Stationery' },
  { name: 'File Folder', nameBn: 'ফাইল ফোল্ডার', nameHi: 'फ़ाइल फ़ोल्डर', unit: '1 pc', pricePaise: 3000, category: 'Stationery' },
  { name: 'Chart Paper', nameBn: 'চার্ট পেপার', nameHi: 'चार्ट पेपर', unit: '1 pc', pricePaise: 1500, category: 'Stationery' },

  // Pet Care
  { name: 'Dog Food', nameBn: 'কুকুরের খাবার', nameHi: 'कुत्ते का खाना', unit: '1 kg', pricePaise: 30000, category: 'Pet Care' },
  { name: 'Cat Food', nameBn: 'বিড়ালের খাবার', nameHi: 'बिल्ली का खाना', unit: '1 kg', pricePaise: 35000, category: 'Pet Care' },
  { name: 'Dog Biscuit', nameBn: 'কুকুরের বিস্কুট', nameHi: 'कुत्ते का बिस्कुट', unit: '250 g', pricePaise: 12000, category: 'Pet Care' },
  { name: 'Bird Feed', nameBn: 'পাখির খাবার', nameHi: 'पक्षी का दाना', unit: '500 g', pricePaise: 8000, category: 'Pet Care' },
  { name: 'Fish Food', nameBn: 'মাছের খাবার', nameHi: 'मछली का खाना', unit: '100 g', pricePaise: 8000, category: 'Pet Care' },
];

const RESTAURANT: StarterItem[] = [
  // Chinese
  { name: 'Veg Chowmein', nameBn: 'ভেজ চাউমিন', nameHi: 'वेज चाउमिन', unit: '1 plate', pricePaise: 7000, category: 'Chinese' },
  { name: 'Egg Chowmein', nameBn: 'ডিম চাউমিন', nameHi: 'अंडा चाउमिन', unit: '1 plate', pricePaise: 9000, category: 'Chinese' },
  { name: 'Chicken Chowmein', nameBn: 'চিকেন চাউমিন', nameHi: 'चिकन चाउमिन', unit: '1 plate', pricePaise: 12000, category: 'Chinese' },
  { name: 'Veg Fried Rice', nameBn: 'ভেজ ফ্রায়েড রাইস', nameHi: 'वेज फ्राइड राइस', unit: '1 plate', pricePaise: 9000, category: 'Chinese' },
  { name: 'Egg Fried Rice', nameBn: 'ডিম ফ্রায়েড রাইস', nameHi: 'अंडा फ्राइड राइस', unit: '1 plate', pricePaise: 11000, category: 'Chinese' },
  { name: 'Chicken Fried Rice', nameBn: 'চিকেন ফ্রায়েড রাইস', nameHi: 'चिकन फ्राइड राइस', unit: '1 plate', pricePaise: 14000, category: 'Chinese' },
  { name: 'Chilli Chicken', nameBn: 'চিলি চিকেন', nameHi: 'चिली चिकन', unit: '1 plate', pricePaise: 16000, category: 'Chinese' },
  { name: 'Chilli Paneer', nameBn: 'চিলি পনির', nameHi: 'चिली पनीर', unit: '1 plate', pricePaise: 15000, category: 'Chinese' },
  { name: 'Veg Manchurian', nameBn: 'ভেজ মাঞ্চুরিয়ান', nameHi: 'वेज मंचूरियन', unit: '1 plate', pricePaise: 12000, category: 'Chinese' },
  { name: 'Chicken Lollipop', nameBn: 'চিকেন ললিপপ', nameHi: 'चिकन लॉलीपॉप', unit: '4 pc', pricePaise: 16000, category: 'Chinese' },

  // Momo
  { name: 'Veg Momo', nameBn: 'ভেজ মোমো', nameHi: 'वेज मोमो', unit: '8 pc', pricePaise: 7000, category: 'Momo' },
  { name: 'Chicken Momo', nameBn: 'চিকেন মোমো', nameHi: 'चिकन मोमो', unit: '8 pc', pricePaise: 10000, category: 'Momo' },
  { name: 'Paneer Momo', nameBn: 'পনির মোমো', nameHi: 'पनीर मोमो', unit: '8 pc', pricePaise: 9000, category: 'Momo' },
  { name: 'Fried Momo', nameBn: 'ফ্রায়েড মোমো', nameHi: 'फ्राइड मोमो', unit: '8 pc', pricePaise: 11000, category: 'Momo' },

  // Rolls
  { name: 'Egg Roll', nameBn: 'ডিম রোল', nameHi: 'अंडा रोल', unit: '', pricePaise: 4000, category: 'Rolls' },
  { name: 'Chicken Roll', nameBn: 'চিকেন রোল', nameHi: 'चिकन रोल', unit: '', pricePaise: 8000, category: 'Rolls' },
  { name: 'Egg Chicken Roll', nameBn: 'ডিম চিকেন রোল', nameHi: 'अंडा चिकन रोल', unit: '', pricePaise: 9000, category: 'Rolls' },
  { name: 'Paneer Roll', nameBn: 'পনির রোল', nameHi: 'पनीर रोल', unit: '', pricePaise: 8000, category: 'Rolls' },
  { name: 'Mutton Roll', nameBn: 'মাটন রোল', nameHi: 'मटन रोल', unit: '', pricePaise: 12000, category: 'Rolls' },
  { name: 'Veg Roll', nameBn: 'ভেজ রোল', nameHi: 'वेज रोल', unit: '', pricePaise: 4000, category: 'Rolls' },

  // Biryani
  { name: 'Chicken Biryani', nameBn: 'চিকেন বিরিয়ানি', nameHi: 'चिकन बिरयानी', unit: '1 plate', pricePaise: 16000, category: 'Biryani' },
  { name: 'Mutton Biryani', nameBn: 'মাটন বিরিয়ানি', nameHi: 'मटन बिरयानी', unit: '1 plate', pricePaise: 24000, category: 'Biryani' },
  { name: 'Egg Biryani', nameBn: 'ডিম বিরিয়ানি', nameHi: 'अंडा बिरयानी', unit: '1 plate', pricePaise: 10000, category: 'Biryani' },
  { name: 'Veg Biryani', nameBn: 'ভেজ বিরিয়ানি', nameHi: 'वेज बिरयानी', unit: '1 plate', pricePaise: 11000, category: 'Biryani' },

  // Non-veg
  { name: 'Fish Fry', nameBn: 'মাছ ভাজা', nameHi: 'फिश फ्राई', unit: '1 pc', pricePaise: 6000, category: 'Non-veg' },
  { name: 'Fish Curry', nameBn: 'মাছের ঝোল', nameHi: 'मछली करी', unit: '1 plate', pricePaise: 12000, category: 'Non-veg' },
  { name: 'Chicken Kosha', nameBn: 'চিকেন কষা', nameHi: 'चिकन कोशा', unit: '1 plate', pricePaise: 18000, category: 'Non-veg' },
  { name: 'Chicken Curry', nameBn: 'চিকেন কারি', nameHi: 'चिकन करी', unit: '1 plate', pricePaise: 15000, category: 'Non-veg' },
  { name: 'Mutton Curry', nameBn: 'মাটন কারি', nameHi: 'मटन करी', unit: '1 plate', pricePaise: 26000, category: 'Non-veg' },
  { name: 'Tandoori Chicken', nameBn: 'তন্দুরি চিকেন', nameHi: 'तंदूरी चिकन', unit: '1 pc', pricePaise: 16000, category: 'Non-veg' },
  { name: 'Chicken Tikka', nameBn: 'চিকেন টিক্কা', nameHi: 'चिकन टिक्का', unit: '1 plate', pricePaise: 18000, category: 'Non-veg' },
  { name: 'Egg Curry', nameBn: 'ডিমের ঝোল', nameHi: 'अंडा करी', unit: '1 plate', pricePaise: 7000, category: 'Non-veg' },

  // Meals
  { name: 'Roti', nameBn: 'রুটি', nameHi: 'रोटी', unit: '1 pc', pricePaise: 1000, category: 'Meals' },
  { name: 'Butter Naan', nameBn: 'বাটার নান', nameHi: 'बटर नान', unit: '1 pc', pricePaise: 3500, category: 'Meals' },
  { name: 'Paratha', nameBn: 'পরোটা', nameHi: 'पराठा', unit: '1 pc', pricePaise: 2000, category: 'Meals' },
  { name: 'Steamed Rice', nameBn: 'ভাত', nameHi: 'चावल', unit: '1 plate', pricePaise: 4500, category: 'Meals' },
  { name: 'Dal Fry', nameBn: 'ডাল ফ্রাই', nameHi: 'दाल फ्राई', unit: '1 bowl', pricePaise: 7000, category: 'Meals' },
  { name: 'Mixed Veg', nameBn: 'মিক্সড ভেজ', nameHi: 'मिक्स वेज', unit: '1 plate', pricePaise: 8500, category: 'Meals' },

  // Beverages
  { name: 'Cold Drink', nameBn: 'ঠান্ডা পানীয়', nameHi: 'कोल्ड ड्रिंक', unit: '250 ml', pricePaise: 2000, category: 'Beverages' },
  { name: 'Water Bottle', nameBn: 'জলের বোতল', nameHi: 'पानी की बोतल', unit: '1 l', pricePaise: 2000, category: 'Beverages' },
  { name: 'Lassi', nameBn: 'লস্যি', nameHi: 'लस्सी', unit: '1 glass', pricePaise: 3500, category: 'Beverages' },
  { name: 'Tea', nameBn: 'চা', nameHi: 'चाय', unit: '1 cup', pricePaise: 1000, category: 'Beverages' },

  // Sweets
  { name: 'Rasgulla', nameBn: 'রসগোল্লা', nameHi: 'रसगुल्ला', unit: '1 pc', pricePaise: 1500, category: 'Sweets' },
  { name: 'Gulab Jamun', nameBn: 'গোলাপ জাম', nameHi: 'गुलाब जामुन', unit: '1 pc', pricePaise: 1500, category: 'Sweets' },
  { name: 'Ice Cream', nameBn: 'আইসক্রিম', nameHi: 'आइसक्रीम', unit: '1 cup', pricePaise: 4000, category: 'Sweets' },
];

const TEA_STALL: StarterItem[] = [
  { name: 'Tea', nameBn: 'চা', nameHi: 'चाय', unit: '1 cup', pricePaise: 800, category: 'Tea & Coffee' },
  { name: 'Lemon Tea', nameBn: 'লেবু চা', nameHi: 'नींबू चाय', unit: '1 cup', pricePaise: 1200, category: 'Tea & Coffee' },
  { name: 'Special Tea', nameBn: 'স্পেশাল চা', nameHi: 'स्पेशल चाय', unit: '1 cup', pricePaise: 1500, category: 'Tea & Coffee' },
  { name: 'Coffee', nameBn: 'কফি', nameHi: 'कॉफ़ी', unit: '1 cup', pricePaise: 2000, category: 'Tea & Coffee' },
  { name: 'Biscuit', nameBn: 'বিস্কুট', nameHi: 'बिस्कुट', unit: '', pricePaise: 1000, category: 'Snacks' },
  { name: 'Samosa', nameBn: 'সিঙাড়া', nameHi: 'समोसा', unit: '1 pc', pricePaise: 1200, category: 'Snacks' },
  { name: 'Toast', nameBn: 'টোস্ট', nameHi: 'टोस्ट', unit: '', pricePaise: 1500, category: 'Snacks' },
  { name: 'Bread Butter', nameBn: 'পাউরুটি মাখন', nameHi: 'ब्रेड बटर', unit: '', pricePaise: 2500, category: 'Snacks' },
  { name: 'Omelette', nameBn: 'অমলেট', nameHi: 'ऑमलेट', unit: '', pricePaise: 3000, category: 'Snacks' },
  { name: 'Boiled Egg', nameBn: 'সেদ্ধ ডিম', nameHi: 'उबला अंडा', unit: '1 pc', pricePaise: 1500, category: 'Snacks' },
  { name: 'Ghugni', nameBn: 'ঘুগনি', nameHi: 'घुगनी', unit: '1 bowl', pricePaise: 2500, category: 'Snacks' },
  { name: 'Aloo Chop', nameBn: 'আলুর চপ', nameHi: 'आलू चॉप', unit: '1 pc', pricePaise: 1000, category: 'Snacks' },
  { name: 'Cutlet', nameBn: 'কাটলেট', nameHi: 'कटलेट', unit: '1 pc', pricePaise: 2500, category: 'Snacks' },
  { name: 'Muri', nameBn: 'মুড়ি', nameHi: 'मुरमुरे', unit: '1 bowl', pricePaise: 1500, category: 'Snacks' },
  { name: 'Cake', nameBn: 'কেক', nameHi: 'केक', unit: '1 pc', pricePaise: 1500, category: 'Bakery' },
  { name: 'Cold Drink', nameBn: 'ঠান্ডা পানীয়', nameHi: 'कोल्ड ड्रिंक', unit: '250 ml', pricePaise: 2000, category: 'Beverages' },
  { name: 'Water Bottle', nameBn: 'জলের বোতল', nameHi: 'पानी की बोतल', unit: '1 l', pricePaise: 2000, category: 'Beverages' },
  { name: 'Lassi', nameBn: 'লস্যি', nameHi: 'लस्सी', unit: '1 glass', pricePaise: 3500, category: 'Beverages' },
];

const BAKERY: StarterItem[] = [
  { name: 'Bread', nameBn: 'পাউরুটি', nameHi: 'ब्रेड', unit: '', pricePaise: 4500, category: 'Bakery' },
  { name: 'Brown Bread', nameBn: 'ব্রাউন ব্রেড', nameHi: 'ब्राउन ब्रेड', unit: '', pricePaise: 5500, category: 'Bakery' },
  { name: 'Bun', nameBn: 'বান', nameHi: 'बन', unit: '1 pc', pricePaise: 1500, category: 'Bakery' },
  { name: 'Cake Slice', nameBn: 'কেকের টুকরো', nameHi: 'केक स्लाइस', unit: '1 pc', pricePaise: 4000, category: 'Bakery' },
  { name: 'Pastry', nameBn: 'পেস্ট্রি', nameHi: 'पेस्ट्री', unit: '1 pc', pricePaise: 5000, category: 'Bakery' },
  { name: 'Birthday Cake', nameBn: 'জন্মদিনের কেক', nameHi: 'बर्थडे केक', unit: '500 g', pricePaise: 40000, category: 'Bakery' },
  { name: 'Chocolate Cake', nameBn: 'চকোলেট কেক', nameHi: 'चॉकलेट केक', unit: '500 g', pricePaise: 45000, category: 'Bakery' },
  { name: 'Sponge Cake', nameBn: 'স্পঞ্জ কেক', nameHi: 'स्पंज केक', unit: '250 g', pricePaise: 18000, category: 'Bakery' },
  { name: 'Muffin', nameBn: 'মাফিন', nameHi: 'मफिन', unit: '1 pc', pricePaise: 4000, category: 'Bakery' },
  { name: 'Patties', nameBn: 'প্যাটিস', nameHi: 'पैटीज़', unit: '1 pc', pricePaise: 3000, category: 'Bakery' },
  { name: 'Veg Puff', nameBn: 'ভেজ পাফ', nameHi: 'वेज पफ', unit: '1 pc', pricePaise: 2500, category: 'Bakery' },
  { name: 'Cream Roll', nameBn: 'ক্রিম রোল', nameHi: 'क्रीम रोल', unit: '1 pc', pricePaise: 2500, category: 'Bakery' },
  { name: 'Cookies', nameBn: 'কুকিজ', nameHi: 'कुकीज़', unit: '250 g', pricePaise: 12000, category: 'Bakery' },
  { name: 'Khari Biscuit', nameBn: 'খারি বিস্কুট', nameHi: 'खारी बिस्कुट', unit: '250 g', pricePaise: 8000, category: 'Bakery' },
  { name: 'Rusk', nameBn: 'রাস্ক', nameHi: 'रस्क', unit: '200 g', pricePaise: 4500, category: 'Bakery' },
  { name: 'Doughnut', nameBn: 'ডোনাট', nameHi: 'डोनट', unit: '1 pc', pricePaise: 5000, category: 'Bakery' },
  { name: 'Cold Drink', nameBn: 'ঠান্ডা পানীয়', nameHi: 'कोल्ड ड्रिंक', unit: '250 ml', pricePaise: 2000, category: 'Beverages' },
];

const HOME_KITCHEN: StarterItem[] = [
  { name: 'Rice & Dal', nameBn: 'ভাত ও ডাল', nameHi: 'चावल-दाल', unit: '1 plate', pricePaise: 6000, category: 'Meals' },
  { name: 'Veg Thali', nameBn: 'ভেজ থালি', nameHi: 'वेज थाली', unit: '1 plate', pricePaise: 9000, category: 'Meals' },
  { name: 'Egg Thali', nameBn: 'ডিম থালি', nameHi: 'अंडा थाली', unit: '1 plate', pricePaise: 11000, category: 'Meals' },
  { name: 'Chicken Thali', nameBn: 'চিকেন থালি', nameHi: 'चिकन थाली', unit: '1 plate', pricePaise: 15000, category: 'Meals' },
  { name: 'Fish Thali', nameBn: 'মাছের থালি', nameHi: 'मछली थाली', unit: '1 plate', pricePaise: 15000, category: 'Meals' },
  { name: 'Mutton Thali', nameBn: 'মাটন থালি', nameHi: 'मटन थाली', unit: '1 plate', pricePaise: 22000, category: 'Meals' },
  { name: 'Fish Curry', nameBn: 'মাছের ঝোল', nameHi: 'मछली करी', unit: '1 plate', pricePaise: 11000, category: 'Meals' },
  { name: 'Chicken Curry', nameBn: 'চিকেন কারি', nameHi: 'चिकन करी', unit: '1 plate', pricePaise: 14000, category: 'Meals' },
  { name: 'Egg Curry', nameBn: 'ডিমের ঝোল', nameHi: 'अंडा करी', unit: '1 plate', pricePaise: 7000, category: 'Meals' },
  { name: 'Mixed Veg', nameBn: 'মিক্সড ভেজ', nameHi: 'मिक्स वेज', unit: '1 plate', pricePaise: 8500, category: 'Meals' },
  { name: 'Aloo Posto', nameBn: 'আলু পোস্ত', nameHi: 'आलू पोस्ता', unit: '1 bowl', pricePaise: 7000, category: 'Meals' },
  { name: 'Dal', nameBn: 'ডাল', nameHi: 'दाल', unit: '1 bowl', pricePaise: 4000, category: 'Meals' },
  { name: 'Steamed Rice', nameBn: 'ভাত', nameHi: 'चावल', unit: '1 plate', pricePaise: 4500, category: 'Meals' },
  { name: 'Roti', nameBn: 'রুটি', nameHi: 'रोटी', unit: '1 pc', pricePaise: 1000, category: 'Meals' },
  { name: 'Paratha', nameBn: 'পরোটা', nameHi: 'पराठा', unit: '1 pc', pricePaise: 2000, category: 'Meals' },
  { name: 'Salad', nameBn: 'স্যালাড', nameHi: 'सलाद', unit: '1 plate', pricePaise: 3000, category: 'Extras' },
  { name: 'Papad', nameBn: 'পাঁপড়', nameHi: 'पापड़', unit: '1 pc', pricePaise: 1000, category: 'Extras' },
  { name: 'Pickle', nameBn: 'আচার', nameHi: 'अचार', unit: '200 g', pricePaise: 6000, category: 'Extras' },
  { name: 'Sweet', nameBn: 'মিষ্টি', nameHi: 'मिठाई', unit: '1 pc', pricePaise: 2000, category: 'Extras' },
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

/**
 * The item's other names, for the line under the heading.
 *
 * Both languages are shown because the operator picking items and the
 * shopkeeper they are picking for do not read the same one — a list that says
 * only "Rice" cannot be checked by the person who calls it চাল. Deduplicated,
 * so a name spelled identically in two languages is not repeated.
 */
export function starterOtherNames(item: StarterItem, locale: 'en' | 'bn' | 'hi'): string[] {
  const shown = starterName(item, locale);
  return [...new Set([item.name, item.nameBn, item.nameHi])].filter(
    (name) => name && name !== shown,
  );
}

/* ------------------------------------------------------------------------- *
 * What the shop already has, so it is never offered again.
 *
 * The suggestion lists used to match on `name + unit` in English only, and both
 * halves of that were wrong. Matching on the unit meant a shop already selling
 * "Rice — 5 kg" was cheerfully offered "Rice — 1 kg" as something it was
 * missing, and one tap later the shop had two rice rows and a customer had two
 * things to choose between that are the same thing. Matching in English only
 * meant a shop that had typed "মুড়ি" by hand was offered "Muri", because
 * nothing ever compared the two.
 *
 * So a shop owns a NAME, in any of its languages, whatever size it sells it in
 * — and an owner's own hand-typed rows count exactly as much as ones that came
 * from this catalogue, because to the owner staring at a duplicate there is no
 * difference between them.
 * ------------------------------------------------------------------------- */

/** One shop item, as little of it as this needs to know. */
export type OwnedName = { name: string; nameBn: string; nameHi: string };

/** Every spelling this shop already uses, loosened for comparison. */
export function ownedNames(items: OwnedName[]): Set<string> {
  const owned = new Set<string>();
  for (const item of items) {
    for (const form of [item.name, item.nameBn, item.nameHi]) {
      const key = loosenWord(form ?? '');
      if (key) owned.add(key);
    }
  }
  return owned;
}

/**
 * Is this catalogue entry already on the shop's list, under any of its names?
 *
 * Any one of the three matching is enough. A shop holding "Puffed rice" has
 * "মুড়ি", and offering it the catalogue's Muri would hand it the same sack
 * twice under two names.
 */
/**
 * Items on the shop's own list that name the same thing as another item on it.
 *
 * KEEPING SUGGESTIONS CLEAN DOES NOT CLEAN UP THE LIST. `alreadyOwned` stops a
 * duplicate being offered from here on, and does nothing about the two "মটর
 * ডাল" rows already sitting in a shop — one at ₹100 and one at ₹50, because
 * they were typed on different days under English names that do not match
 * ("Matar Dal", "Motor dal") while their Bengali names are identical.
 *
 * A customer meeting both has to guess which is real, and the shop has two
 * prices for one sack. So they are FLAGGED, not merged: the two prices are each
 * deliberate, only the owner knows which one stands, and silently keeping one
 * would throw away a number somebody typed on purpose. One tap on the bin
 * settles it.
 *
 * Matched on any of the three names, loosened — which is what catches a pair
 * whose English spellings differ and whose Bengali is the same word.
 */
export function duplicateNameIds<T extends OwnedName & { id: string }>(items: T[]): Set<string> {
  /** loosened name → the ids that use it */
  const byName = new Map<string, string[]>();

  for (const item of items) {
    // Deduplicated per item: a row whose English and Bengali loosen to the
    // same string must not be reported as a duplicate of itself.
    const keys = new Set(
      [item.name, item.nameBn, item.nameHi].map((form) => loosenWord(form ?? '')).filter(Boolean),
    );
    for (const key of keys) {
      const bucket = byName.get(key);
      if (bucket) bucket.push(item.id);
      else byName.set(key, [item.id]);
    }
  }

  const flagged = new Set<string>();
  for (const ids of byName.values()) {
    if (ids.length > 1) for (const id of ids) flagged.add(id);
  }
  return flagged;
}

export function alreadyOwned(entry: StarterItem, owned: Set<string>): boolean {
  return [entry.name, entry.nameBn, entry.nameHi].some((form) => {
    const key = loosenWord(form ?? '');
    return key !== '' && owned.has(key);
  });
}

/* ------------------------------------------------------------------------- *
 * Working out which category an item belongs in.
 *
 * A shopkeeper knows they sell rice. Whether it files under "Rice & Atta" or
 * "Staples" is a taxonomy question they never asked to be given, so the app
 * answers it from the catalogue instead — and for a long time it answered it
 * badly, because the only test was whether the typed English name was character
 * for character one of the catalogue's English names.
 *
 * Everything real fell through that. "Matar Dal" is not "Matar". "Minicate
 * rice" is not "Rice". An item named "Flour" with মুড়ি-style Bengali filled in
 * was never even compared against its own Bengali name, because only the
 * primary name was passed in. All of them landed with a blank category and
 * piled up under "Other", which is the one heading that tells a customer
 * nothing — and a category filter where half the shop is "Other" is worse than
 * no filter at all.
 *
 * So: all three names are tried, spelling is loosened the way voice matching
 * already loosens it, a catalogue name that is contained in what was typed
 * counts as a match, and the LONGEST such match wins — "Soyabean Oil" must
 * resolve to Oil & Ghee and never to Soyabean. Only then, for a word no
 * catalogue entry knows, does a short table of head-words answer.
 * ------------------------------------------------------------------------- */

/**
 * Spelling, with everything that varies between two romanisations removed.
 *
 * The same idea as `loosen` in `lib/speech.ts` and for the same reason: roman
 * Bengali and Hindi have no correct spelling, so "Basmoti", "basmati" and
 * "Basmathi" are one word typed by three people. Punctuation goes, case goes,
 * and a doubled letter collapses.
 */
function loosenWord(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, '')
    .replace(/(.)\1+/gu, '$1');
}

/** A name as a list of loosened words, blanks dropped. */
function wordsOf(value: string): string[] {
  return value
    .trim()
    .toLowerCase()
    .split(/[\s,./\\()-]+/)
    .map(loosenWord)
    .filter(Boolean);
}

/**
 * Head-words that decide a category on their own, for names no catalogue entry
 * covers.
 *
 * DELIBERATELY SHORT, and every entry is a word that names the kind of thing
 * rather than the thing: "dal" is a category in the way "masoor" is not. That
 * is the whole test for adding one. A generous list would start guessing —
 * putting "Lux" in Personal Care because somebody wrote "soap" in a brand name
 * — and a wrong category is worse than a blank one, because the blank one is
 * visibly unfinished and the wrong one is not.
 *
 * Checked only after the catalogue itself has failed, and only ever used when
 * the shop's own catalogue actually has that category — a roll counter must
 * never acquire a "Dal & Pulses" heading because somebody listed a side of dal.
 */
const HEAD_WORDS: { category: string; words: string[] }[] = [
  {
    category: 'Dal & Pulses',
    words: ['dal', 'daal', 'dail', 'ডাল', 'दाल', 'lentil', 'lentils', 'pulse', 'pulses'],
  },
  {
    category: 'Rice & Atta',
    words: [
      'rice', 'chal', 'chaal', 'chawal', 'chaval', 'চাল', 'चावल',
      'atta', 'ata', 'flour', 'আটা', 'आटा', 'maida', 'ময়দা', 'मैदा',
      'suji', 'sooji', 'rava', 'muri', 'মুড়ি', 'poha', 'chire', 'চিঁড়ে',
    ],
  },
  {
    category: 'Oil & Ghee',
    words: ['oil', 'tel', 'তেল', 'तेल', 'ghee', 'ঘি', 'घी', 'dalda', 'vanaspati'],
  },
  {
    category: 'Spices',
    words: ['masala', 'মশলা', 'मसाला', 'spice', 'powder', 'guro', 'গুঁড়ো', 'mirch', 'lanka'],
  },
  {
    category: 'Dairy',
    words: ['milk', 'dudh', 'doodh', 'দুধ', 'दूध', 'curd', 'dahi', 'doi', 'দই', 'paneer', 'পনির', 'butter', 'cheese'],
  },
  {
    category: 'Tea & Coffee',
    words: ['tea', 'cha', 'chai', 'চা', 'चाय', 'coffee', 'কফি', 'कॉफ़ी'],
  },
  {
    category: 'Snacks',
    words: ['biscuit', 'biscuits', 'বিস্কুট', 'बिस्कुट', 'chips', 'namkeen', 'chanachur', 'চানাচুর', 'noodles', 'cake'],
  },
  {
    category: 'Personal Care',
    words: ['soap', 'sabun', 'saban', 'সাবান', 'साबुन', 'shampoo', 'শ্যাম্পু', 'paste', 'toothpaste', 'brush', 'oil-hair'],
  },
  {
    category: 'Household',
    words: ['detergent', 'surf', 'phenyl', 'broom', 'jharu', 'matchbox', 'deshlai', 'candle', 'agarbatti'],
  },
  // 'battery' used to sit in Household, from before there was anywhere better
  // for it. A torch cell is not a cleaning product, and the shop that sells it
  // keeps it with the bulbs.
  {
    category: 'Electricals',
    words: ['bulb', 'battery', 'cell', 'tubelight', 'torch', 'wire', 'plug', 'switch', 'বাল্ব', 'बल्ब'],
  },
  { category: 'Baby Care', words: ['baby', 'bebi', 'বেবি', 'बेबी', 'diaper', 'ডায়াপার', 'डायपर'] },
  {
    category: 'Packaged Food',
    words: ['sauce', 'sos', 'সস', 'सॉस', 'ketchup', 'chutney', 'চাটনি', 'चटनी', 'pasta', 'spread'],
  },
  { category: 'Vegetables', words: ['sabji', 'sabzi', 'সবজি', 'सब्ज़ी', 'veg', 'vegetable'] },
  { category: 'Fruits', words: ['fruit', 'ful', 'ফল', 'फल'] },
];

/**
 * The category an item belongs in, or `''` when nothing is confident enough.
 *
 * Every name the owner gave is tried — English, Bengali and Hindi — because a
 * shop that types "Puffed rice" and "মুড়ি" on the same row has named a
 * catalogue item twice and only one of the two spellings needs to land.
 *
 * `''` is a real answer and stays one. An item whose category nobody can work
 * out belongs under the shop's "Other" heading, which is honest; inventing a
 * category to avoid the blank puts the item somewhere a customer will not look.
 */
export function categoryForNames(names: string[], catalogue: StarterItem[]): string {
  const candidates = names.map((name) => name?.trim() ?? '').filter(Boolean);
  if (candidates.length === 0 || catalogue.length === 0) return '';

  const looseCandidates = candidates.map(loosenWord);
  const wordSets = candidates.map((name) => new Set(wordsOf(name)));

  /** Every written form of a catalogue entry, as typed and as loosened words. */
  const formsOf = (item: StarterItem) =>
    [item.name, item.nameBn, item.nameHi].filter(Boolean);

  // 1. The whole name is a catalogue name, give or take spelling. The strongest
  //    signal there is, so it is tried across every entry before anything else.
  for (const item of catalogue) {
    for (const form of formsOf(item)) {
      if (looseCandidates.includes(loosenWord(form))) return item.category;
    }
  }

  /**
   * 2. A catalogue name sits INSIDE what was typed — "Matar" within "Matar
   *    Dal", "Rice" within "Minicate rice".
   *
   *    THE LONGEST MATCH WINS, and that is not a refinement, it is the whole
   *    correctness of this step: "Soyabean Oil" contains both "Soyabean" and
   *    "Soyabean Oil", and taking the first match found would file cooking oil
   *    under whatever Soyabean happens to be. The same lesson the voice matcher
   *    learned when "Chandramukhi aloo" resolved to plain "Potato" — score
   *    precision, never coverage alone.
   */
  let best = '';
  let bestWords = 0;

  for (const item of catalogue) {
    for (const form of formsOf(item)) {
      const formWords = wordsOf(form);
      if (formWords.length === 0 || formWords.length <= bestWords) continue;

      const contained = wordSets.some((set) => formWords.every((word) => set.has(word)));
      if (contained) {
        best = item.category;
        bestWords = formWords.length;
      }
    }
  }
  if (best) return best;

  // 3. A head-word, for a thing this catalogue has never heard of. Only ever
  //    into a category the shop's own list actually uses.
  const available = new Set(catalogue.map((item) => item.category));
  for (const { category, words } of HEAD_WORDS) {
    if (!available.has(category)) continue;
    const loose = words.map(loosenWord);
    if (wordSets.some((set) => [...set].some((word) => loose.includes(word)))) {
      return category;
    }
  }

  return '';
}
