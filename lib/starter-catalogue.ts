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
  { name: 'Soyabean', nameBn: 'সয়াবিন', nameHi: 'सोयाबीन', unit: '200 g', pricePaise: 2500, category: 'Dal & Pulses' },

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
