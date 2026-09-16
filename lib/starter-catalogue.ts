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
  { name: 'Rice', nameBn: 'চাল', nameHi: 'चावल', unit: '1 kg', pricePaise: 5500, category: 'Rice & Atta' },
  { name: 'Basmati Rice', nameBn: 'বাসমতি চাল', nameHi: 'बासमती चावल', unit: '1 kg', pricePaise: 13000, category: 'Rice & Atta' },
  { name: 'Gobindobhog Rice', nameBn: 'গোবিন্দভোগ চাল', nameHi: 'गोबिंदभोग चावल', unit: '1 kg', pricePaise: 11000, category: 'Rice & Atta' },
  { name: 'Atta', nameBn: 'আটা', nameHi: 'आटा', unit: '1 kg', pricePaise: 4500, category: 'Rice & Atta' },
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
  { name: 'Matar', nameBn: 'মটর', nameHi: 'मटर', unit: '500 g', pricePaise: 4000, category: 'Dal & Pulses' },
  // Staples, not Dal & Pulses. What a kirana sells as "soyabean" is the dried
  // nugget — soya badi — which is cooked as a vegetable or a curry and never as
  // a dal. Botanically it is a legume and that is how it got filed here; a
  // shopper looking under ডাল for it, or finding it there among the masoor and
  // the moong, is being told something untrue about how it is used.
  { name: 'Soyabean', nameBn: 'সয়াবিন', nameHi: 'सोयाबीन', unit: '200 g', pricePaise: 2500, category: 'Staples' },

  // Staples
  { name: 'Sugar', nameBn: 'চিনি', nameHi: 'चीनी', unit: '1 kg', pricePaise: 4800, category: 'Staples' },
  { name: 'Salt', nameBn: 'নুন', nameHi: 'नमक', unit: '1 kg', pricePaise: 2500, category: 'Staples' },
  { name: 'Jaggery', nameBn: 'গুড়', nameHi: 'गुड़', unit: '500 g', pricePaise: 4500, category: 'Staples' },
  { name: 'Honey', nameBn: 'মধু', nameHi: 'शहद', unit: '250 g', pricePaise: 13000, category: 'Staples' },

  // Oil & Ghee
  { name: 'Mustard Oil', nameBn: 'সরিষার তেল', nameHi: 'सरसों का तेल', unit: '1 l', pricePaise: 16500, category: 'Oil & Ghee' },
  { name: 'Sunflower Oil', nameBn: 'সূর্যমুখী তেল', nameHi: 'सूरजमुखी तेल', unit: '1 l', pricePaise: 15000, category: 'Oil & Ghee' },
  { name: 'Soyabean Oil', nameBn: 'সয়াবিন তেল', nameHi: 'सोयाबीन तेल', unit: '1 l', pricePaise: 14000, category: 'Oil & Ghee' },
  { name: 'Rice Bran Oil', nameBn: 'রাইস ব্রান তেল', nameHi: 'राइस ब्रान तेल', unit: '1 l', pricePaise: 15500, category: 'Oil & Ghee' },
  { name: 'Coconut Oil', nameBn: 'নারকেল তেল', nameHi: 'नारियल तेल', unit: '200 ml', pricePaise: 9000, category: 'Oil & Ghee' },
  { name: 'Ghee', nameBn: 'ঘি', nameHi: 'घी', unit: '500 g', pricePaise: 32000, category: 'Oil & Ghee' },
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
  { name: 'Beans', nameBn: 'বিনস', nameHi: 'बीन्स', unit: '250 g', pricePaise: 2000, category: 'Vegetables' },
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
  { name: 'Milk', nameBn: 'দুধ', nameHi: 'दूध', unit: '500 ml', pricePaise: 3000, category: 'Dairy' },
  { name: 'Curd', nameBn: 'দই', nameHi: 'दही', unit: '400 g', pricePaise: 4000, category: 'Dairy' },
  { name: 'Paneer', nameBn: 'পনির', nameHi: 'पनीर', unit: '200 g', pricePaise: 9000, category: 'Dairy' },
  { name: 'Butter', nameBn: 'মাখন', nameHi: 'मक्खन', unit: '100 g', pricePaise: 6000, category: 'Dairy' },
  { name: 'Cheese', nameBn: 'চিজ', nameHi: 'चीज़', unit: '200 g', pricePaise: 14500, category: 'Dairy' },
  { name: 'Egg', nameBn: 'ডিম', nameHi: 'अंडा', unit: '6 pc', pricePaise: 4500, category: 'Dairy' },
  { name: 'Milk Powder', nameBn: 'গুঁড়ো দুধ', nameHi: 'मिल्क पाउडर', unit: '500 g', pricePaise: 29000, category: 'Dairy' },
  { name: 'Condensed Milk', nameBn: 'কনডেন্সড মিল্ক', nameHi: 'कंडेंस्ड मिल्क', unit: '400 g', pricePaise: 13000, category: 'Dairy' },

  // Tea & Coffee
  { name: 'Tea', nameBn: 'চা', nameHi: 'चाय', unit: '250 g', pricePaise: 14000, category: 'Tea & Coffee' },
  { name: 'Green Tea', nameBn: 'গ্রিন টি', nameHi: 'ग्रीन टी', unit: '25 pc', pricePaise: 15000, category: 'Tea & Coffee' },
  { name: 'Coffee', nameBn: 'কফি', nameHi: 'कॉफ़ी', unit: '50 g', pricePaise: 16000, category: 'Tea & Coffee' },
  { name: 'Health Drink', nameBn: 'হেলথ ড্রিংক', nameHi: 'हेल्थ ड्रिंक', unit: '500 g', pricePaise: 27000, category: 'Tea & Coffee' },

  // Snacks
  { name: 'Biscuit Pack', nameBn: 'বিস্কুট প্যাকেট', nameHi: 'बिस्कुट पैकेट', unit: '', pricePaise: 2000, category: 'Snacks' },
  { name: 'Bread', nameBn: 'পাউরুটি', nameHi: 'ब्रेड', unit: '', pricePaise: 4500, category: 'Snacks' },
  { name: 'Namkeen', nameBn: 'নমকিন', nameHi: 'नमकीन', unit: '200 g', pricePaise: 5000, category: 'Snacks' },
  { name: 'Chanachur', nameBn: 'চানাচুর', nameHi: 'चनाचूर', unit: '200 g', pricePaise: 4500, category: 'Snacks' },
  { name: 'Chips', nameBn: 'চিপস', nameHi: 'चिप्स', unit: '', pricePaise: 2000, category: 'Snacks' },
  { name: 'Instant Noodles', nameBn: 'ইনস্ট্যান্ট নুডলস', nameHi: 'इंस्टेंट नूडल्स', unit: '', pricePaise: 1500, category: 'Snacks' },
  { name: 'Papad', nameBn: 'পাঁপড়', nameHi: 'पापड़', unit: '200 g', pricePaise: 6000, category: 'Snacks' },
  { name: 'Chocolate', nameBn: 'চকোলেট', nameHi: 'चॉकलेट', unit: '', pricePaise: 2000, category: 'Snacks' },
  { name: 'Rusk', nameBn: 'রাস্ক', nameHi: 'रस्क', unit: '200 g', pricePaise: 4500, category: 'Snacks' },
  { name: 'Sauce', nameBn: 'সস', nameHi: 'सॉस', unit: '200 g', pricePaise: 6000, category: 'Snacks' },

  // Dry Fruits
  { name: 'Almond', nameBn: 'কাঠবাদাম', nameHi: 'बादाम', unit: '100 g', pricePaise: 11000, category: 'Dry Fruits' },
  { name: 'Cashew', nameBn: 'কাজু', nameHi: 'काजू', unit: '100 g', pricePaise: 12000, category: 'Dry Fruits' },
  { name: 'Raisin', nameBn: 'কিশমিশ', nameHi: 'किशमिश', unit: '100 g', pricePaise: 5000, category: 'Dry Fruits' },
  { name: 'Walnut', nameBn: 'আখরোট', nameHi: 'अखरोट', unit: '100 g', pricePaise: 13000, category: 'Dry Fruits' },
  { name: 'Dates', nameBn: 'খেজুর', nameHi: 'खजूर', unit: '250 g', pricePaise: 9000, category: 'Dry Fruits' },

  // Household
  { name: 'Detergent', nameBn: 'ডিটারজেন্ট', nameHi: 'डिटर्जेंट', unit: '1 kg', pricePaise: 12000, category: 'Household' },
  { name: 'Dishwash Bar', nameBn: 'বাসন মাজার সাবান', nameHi: 'बर्तन साबुन', unit: '', pricePaise: 2000, category: 'Household' },
  { name: 'Phenyl', nameBn: 'ফিনাইল', nameHi: 'फिनाइल', unit: '500 ml', pricePaise: 7000, category: 'Household' },
  { name: 'Toilet Cleaner', nameBn: 'টয়লেট ক্লিনার', nameHi: 'टॉयलेट क्लीनर', unit: '500 ml', pricePaise: 9500, category: 'Household' },
  { name: 'Broom', nameBn: 'ঝাঁটা', nameHi: 'झाड़ू', unit: '1 pc', pricePaise: 6000, category: 'Household' },
  { name: 'Agarbatti', nameBn: 'ধূপকাঠি', nameHi: 'अगरबत्ती', unit: '', pricePaise: 3000, category: 'Household' },
  { name: 'Candle', nameBn: 'মোমবাতি', nameHi: 'मोमबत्ती', unit: '', pricePaise: 2000, category: 'Household' },
  { name: 'Matchbox', nameBn: 'দেশলাই', nameHi: 'माचिस', unit: '', pricePaise: 200, category: 'Household' },
  { name: 'Garbage Bag', nameBn: 'আবর্জনার ব্যাগ', nameHi: 'कचरा बैग', unit: '', pricePaise: 6000, category: 'Household' },

  // Personal Care
  { name: 'Bath Soap', nameBn: 'স্নানের সাবান', nameHi: 'नहाने का साबुन', unit: '', pricePaise: 4000, category: 'Personal Care' },
  { name: 'Toothpaste', nameBn: 'টুথপেস্ট', nameHi: 'टूथपेस्ट', unit: '100 g', pricePaise: 6000, category: 'Personal Care' },
  { name: 'Toothbrush', nameBn: 'টুথব্রাশ', nameHi: 'टूथब्रश', unit: '1 pc', pricePaise: 3000, category: 'Personal Care' },
  { name: 'Shampoo', nameBn: 'শ্যাম্পু', nameHi: 'शैम्पू', unit: '', pricePaise: 9000, category: 'Personal Care' },
  { name: 'Hair Oil', nameBn: 'চুলের তেল', nameHi: 'बालों का तेल', unit: '200 ml', pricePaise: 11000, category: 'Personal Care' },
  { name: 'Face Cream', nameBn: 'ফেস ক্রিম', nameHi: 'फेस क्रीम', unit: '', pricePaise: 8000, category: 'Personal Care' },
  { name: 'Razor', nameBn: 'রেজার', nameHi: 'रेजर', unit: '1 pc', pricePaise: 3000, category: 'Personal Care' },
  { name: 'Sanitary Pad', nameBn: 'স্যানিটারি প্যাড', nameHi: 'सैनिटरी पैड', unit: '', pricePaise: 5000, category: 'Personal Care' },

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
  { name: 'Soft Drink', nameBn: 'কোল্ড ড্রিংক', nameHi: 'कोल्ड ड्रिंक', unit: '600 ml', pricePaise: 4000, category: 'Beverages' },
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
  { name: 'Jam', nameBn: 'জ্যাম', nameHi: 'जैम', unit: '200 g', pricePaise: 8000, category: 'Snacks' },
  { name: 'Pickle', nameBn: 'আচার', nameHi: 'अचार', unit: '200 g', pricePaise: 6000, category: 'Snacks' },
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
    words: ['detergent', 'surf', 'phenyl', 'broom', 'jharu', 'matchbox', 'deshlai', 'candle', 'agarbatti', 'battery'],
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
