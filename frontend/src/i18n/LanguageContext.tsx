import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "en" | "ne";
const translations: Record<string, string> = {
  "Home": "गृहपृष्ठ", "Shop": "किनमेल", "Orders": "अर्डरहरू", "Help": "सहायता", "Favorites": "मनपर्ने",
  "Login": "लगइन", "Logout": "लगआउट", "Profile": "प्रोफाइल", "Search": "खोज्नुहोस्", "Search products": "सामान खोज्नुहोस्",
  "Find something in the store": "पसलमा सामान खोज्नुहोस्", "Shop products": "सामान किन्नुहोस्", "Help & feedback": "सहायता र सुझाव",
  "Popular": "लोकप्रिय", "Currently unavailable": "हाल उपलब्ध छैन", "Everyday grocery": "दैनिक किराना", "Few left": "थोरै बाँकी",
  "Available": "उपलब्ध", "Add to Cart": "कार्टमा थप्नुहोस्", "Added to cart": "कार्टमा थपियो", "Out of stock": "स्टक सकियो",
  "Your Cart": "तपाईंको कार्ट", "Your cart is empty": "तपाईंको कार्ट खाली छ", "Add products to start your order": "अर्डर सुरु गर्न सामान थप्नुहोस्",
  "Browse Products": "सामान हेर्नुहोस्", "Proceed to Checkout →": "भुक्तानीतर्फ जानुहोस् →", "Remove": "हटाउनुहोस्",
  "Subtotal": "जम्मा", "Delivery": "डेलिभरी", "Total": "कुल", "Free delivery on orders over NPR 500": "NPR ५०० भन्दा बढीको अर्डरमा निःशुल्क डेलिभरी",
  "Everyday groceries and household essentials for your home.": "तपाईंको घरका लागि दैनिक किराना र आवश्यक सामानहरू।",
  "Your neighbourhood kirana store": "तपाईंको छिमेकको किराना पसल", "Shop Now": "अहिले किन्नुहोस्", "Track Orders": "अर्डर हेर्नुहोस्",
  "From our shelves": "हाम्रा सामानहरू", "Browse the products available in our store.": "हाम्रो पसलमा उपलब्ध सामान हेर्नुहोस्।",
  "View all": "सबै हेर्नुहोस्", "No products available right now": "अहिले कुनै सामान उपलब्ध छैन", "Please check back soon.": "कृपया पछि फेरि हेर्नुहोस्।",
  "My Orders": "मेरा अर्डरहरू", "Track all your past and current orders": "पुराना र हालका सबै अर्डर हेर्नुहोस्", "No orders yet": "अहिलेसम्म अर्डर छैन",
  "Start Shopping": "किनमेल सुरु गर्नुहोस्", "Buy again": "फेरि किन्नुहोस्", "Reorder added to cart": "अर्डरका उपलब्ध सामान कार्टमा थपियो",
  "Some items were unavailable or had lower stock, so the available quantities were added.": "केही सामान उपलब्ध थिएनन् वा स्टक कम थियो, त्यसैले उपलब्ध परिमाण मात्र थपियो।",
  "Saved favorites": "मनपर्ने सामान", "No favorites saved yet.": "अहिलेसम्म मनपर्ने सामान छैन।", "Save items with the heart button while shopping.": "किनमेल गर्दा मुटु चिन्ह थिचेर सामान बचत गर्नुहोस्।",
  "Try these available alternatives": "यी उपलब्ध विकल्पहरू हेर्नुहोस्", "This item is unavailable right now. Here are similar products in stock.": "यो सामान अहिले उपलब्ध छैन। यहाँ स्टकमा भएका मिल्दोजुल्दो सामान छन्।",
  "Description": "विवरण", "Brand:": "ब्रान्ड:", "Qty:": "परिमाण:", "In stock": "स्टकमा छ", "Only": "केवल", "left": "बाँकी",
  "You get free delivery!": "तपाईंले निःशुल्क डेलिभरी पाउनुहुन्छ!", "Add": "थप", "more for free delivery": "थपेर निःशुल्क डेलिभरी पाउनुहोस्",
  "Checkout": "चेकआउट", "Delivery & notes": "डेलिभरी र नोट", "Your Details": "तपाईंको विवरण", "Full Name *": "पूरा नाम *", "Phone *": "फोन *",
  "How would you like to receive your order?": "तपाईं अर्डर कसरी लिन चाहनुहुन्छ?", "Pick up at store": "पसलबाट लिनुहोस्", "Delivery area": "डेलिभरी क्षेत्र", "Collect your order from our physical store at the selected time.": "छानिएको समयमा हाम्रो पसलबाट अर्डर लिनुहोस्।", "Date": "मिति", "Time slot": "समय", "Delivering to:": "डेलिभरी ठेगाना:",
  "Email (optional)": "इमेल (वैकल्पिक)", "Delivery Address *": "डेलिभरी ठेगाना *", "Landmark (optional)": "चिनारी (वैकल्पिक)", "Special note (optional)": "विशेष नोट (वैकल्पिक)",
  "Payment": "भुक्तानी", "Order Summary": "अर्डरको सारांश", "Place Order": "अर्डर गर्नुहोस्", "Placing order...": "अर्डर हुँदैछ...",
  "All Products": "सबै सामान", "Products": "सामान", "Featured Products": "विशेष सामान", "item": "सामान", "items": "सामानहरू", "found": "भेटियो",
  "Shop by category": "श्रेणीअनुसार हेर्नुहोस्", "Name A–Z": "नाम A–Z", "Name Z–A": "नाम Z–A", "Price Low–High": "कम मूल्य पहिले", "Price High–Low": "बढी मूल्य पहिले", "No products found.": "सामान भेटिएन।", "Sort products": "सामान क्रमबद्ध गर्नुहोस्",
  "Order Received": "अर्डर प्राप्त भयो", "Confirmed": "पुष्टि भयो", "Being Prepared": "तयार हुँदैछ", "Out for Delivery": "डेलिभरीमा छ", "Delivered": "डेलिभर भयो", "CANCELLED": "रद्द भयो",
  "PENDING": "पुष्टि हुन बाँकी", "CONFIRMED": "पुष्टि भयो", "PREPARING": "तयार हुँदैछ", "OUT FOR DELIVERY": "डेलिभरीमा छ", "DELIVERED": "डेलिभर भयो",
  "This order was cancelled.": "यो अर्डर रद्द गरिएको छ।", "Payment Required": "भुक्तानी आवश्यक छ", "Pending": "बाँकी", "Items": "सामानहरू", "Free": "निःशुल्क", "Paid": "भुक्तानी भयो", "Payment Pending": "भुक्तानी बाँकी",
  "Low stock": "स्टक कम छ", "available": "उपलब्ध",
  "Welcome Back": "फेरि स्वागत छ", "Login to track your orders": "अर्डर हेर्न लगइन गर्नुहोस्", "Email": "इमेल", "Password": "पासवर्ड", "Your password": "तपाईंको पासवर्ड",
  "Forgot your password?": "पासवर्ड बिर्सनुभयो?", "Logging in...": "लगइन हुँदैछ...", "No account yet?": "अझै खाता छैन?", "Sign up": "खाता खोल्नुहोस्", "Back to store": "पसलमा फर्कनुहोस्",
  "Create Account": "खाता खोल्नुहोस्", "Track your orders and save your details": "अर्डर हेर्नुहोस् र विवरण सुरक्षित गर्नुहोस्", "Password *": "पासवर्ड *", "Confirm Password *": "पासवर्ड फेरि लेख्नुहोस् *", "Confirm Password": "पासवर्ड पुष्टि गर्नुहोस्", "Already have an account?": "पहिले नै खाता छ?", "Creating account...": "खाता बनाउँदैछ...", "10-digit Nepal number starting with 97 or 98": "९७ वा ९८ बाट सुरु हुने १० अंकको नेपाली नम्बर", "At least 12 characters": "कम्तीमा १२ अक्षर", "Repeat password": "पासवर्ड फेरि लेख्नुहोस्", "Passwords do not match.": "पासवर्डहरू मेल खाएनन्।", "Password must be at least 12 characters.": "पासवर्ड कम्तीमा १२ अक्षरको हुनुपर्छ।", "Phone must start with 97 or 98 and be 10 digits.": "फोन नम्बर ९७ वा ९८ बाट सुरु हुने १० अंकको हुनुपर्छ।",
};

Object.assign(translations, {
  "Home": "घर", "Shop": "सामान", "Shop products": "सामान हेर्नुहोस्", "Orders": "अर्डर", "Help": "सहायता", "Help & feedback": "सहायता र सुझाव", "Login": "लगइन", "Search": "खोज्नुहोस्", "Search products": "सामान खोज्नुहोस्",
  "All Products": "सबै सामान", "Featured Products": "राम्रो सामान", "Shop by category": "सामानको प्रकार छान्नुहोस्", "item": "सामान", "items": "सामान", "found": "भेटियो", "Name A–Z": "नामअनुसार", "Name Z–A": "उल्टो नामअनुसार", "Price Low–High": "सस्तो पहिले", "Price High–Low": "महँगो पहिले", "Sort products": "सामान मिलाउनुहोस्", "No products found.": "सामान भेटिएन।", "Clear filters": "छनोट हटाउनुहोस्", "Loading products...": "सामान आउँदैछ...",
  "Your neighbourhood kirana store": "तपाईंको छिमेकको किराना पसल", "Everyday groceries and household essentials for your home.": "घरका लागि चाहिने दैनिक किराना सामान।", "From our shelves": "हाम्रो पसलका सामान", "Everyday groceries": "दैनिक किराना", "Browse the products available in our store.": "पसलमा भएका सामान हेर्नुहोस्।", "View all": "सबै हेर्नुहोस्", "No products available right now": "अहिले सामान उपलब्ध छैन", "Please check back soon.": "कृपया पछि फेरि हेर्नुहोस्।",
  "Bishnu & Dhungana Stores": "बिष्णु र ढुंगाना स्टोर्स", "Categories": "सामानका प्रकार", "Products": "सामान",
  "Grains & Rice": "अन्न र चामल", "Flour & Pulses": "पिठो र दाल", "Oil & Ghee": "तेल र घिउ", "Sugar & Salt": "चिनी र नुन", "Noodles": "चाउचाउ र खाजा", "Spices & Masala": "मसला", "Dairy": "दूध र दुग्धजन्य सामान", "Drinks": "पेय पदार्थ", "Rice": "चामल", "Chiura & Other Grains": "चिउरा र अन्य अन्न", "Flour & Semolina": "पिठो र सूजी", "Pulses & Beans": "दाल र गेडागुडी", "Cooking Oils": "खाने तेल", "Ghee": "घिउ", "Sugar": "चिनी", "Salt": "नुन", "Instant Noodles": "चाउचाउ", "Biscuits & Snacks": "बिस्कुट र खाजा", "Ground Spices": "पिसेको मसला", "Masala Blends": "मसला मिश्रण", "Milk": "दूध", "Curd & Paneer": "दही र पनीर", "Eggs": "अण्डा", "Tea & Coffee": "चिया र कफी", "Juice & Soft Drinks": "जुस र पेय पदार्थ",
  "Chamal, beaten rice, and other grains": "चामल, चिउरा र अन्य अन्न", "Maida, atta, dal, and lentils": "मैदा, आटा र दाल", "Cooking oils and clarified butter": "खाने तेल र घिउ", "Chini, salt, and sweeteners": "चिनी, नुन र गुलियो बनाउने सामान", "Instant noodles, biscuits, and savoury snacks": "चाउचाउ, बिस्कुट र खाजा", "Whole and ground spices, masala blends": "सग्लो र पिसेको मसला", "Milk, curd, paneer, and eggs": "दूध, दही, पनीर र अण्डा", "Tea, coffee, juices, and other beverages": "चिया, कफी, जुस र अन्य पेय पदार्थ", "Basmati, jeera masino, and everyday rice": "बासमती, जिरा मसिनो र दैनिक खाने चामल", "Beaten rice and traditional grains": "चिउरा र परम्परागत अन्न", "Atta, maida, and sooji": "आटा, मैदा र सूजी", "Lentils, beans, and chickpeas": "दाल, गेडागुडी र चना", "Everyday cooking oils": "दैनिक खाना पकाउने तेल", "Ghee for cooking and traditional meals": "खाना पकाउन र परिकारका लागि घिउ", "White and brown sugar": "सेतो र खैरो चिनी", "Iodised cooking salt": "आयोडिन भएको नुन", "Quick noodles and meal packs": "छिटो पक्ने चाउचाउ", "Biscuits, chips, and savoury snacks": "बिस्कुट, चिप्स र खाजा", "Powdered spices for home cooking": "घरमा खाना पकाउन पिसेको मसला", "Ready-to-use masala blends": "सिधै प्रयोग गर्न मिल्ने मसला", "Fresh, packaged, and everyday milk": "ताजा र प्याकेटको दूध", "Dahi, paneer, and fresh dairy foods": "दही, पनीर र ताजा दुग्धजन्य खानेकुरा", "Farm eggs and everyday essentials": "फार्मका अण्डा र दैनिक चाहिने सामान", "Tea and coffee for everyday cups": "दैनिक चिया र कफी", "Juices and soft drinks": "जुस र चिसो पेय पदार्थ",
  "Basmati Chamal": "बासमती चामल", "Chiura (Beaten Rice)": "चिउरा", "Kodo Ko Pitho": "कोदोको पिठो", "Maida (All-Purpose Flour)": "मैदा", "Musuro Dal (Red Lentil)": "मसुरो दाल", "Chana Dal (Split Chickpea)": "चना दाल", "Sunflower Cooking Oil": "सूर्यमुखी खाने तेल", "Mustard Oil (Tori Ko Tel)": "तोरीको तेल", "Pure Cow Ghee": "शुद्ध गाईको घिउ", "Chini (White Sugar)": "सेतो चिनी", "Nun (Iodised Salt)": "आयोडिन भएको नुन", "Wai Wai Noodles": "वाई वाई चाउचाउ", "Mayos Biscuit": "मेयोस बिस्कुट", "Kurkure Masala Munch": "कुर्कुरे मसला मुन्च", "Besar (Turmeric Powder)": "बेसारको धुलो", "Dhania Powder (Coriander)": "धनियाँको धुलो", "Fresh Cow Milk": "ताजा गाईको दूध", "Farm Eggs": "फार्मका अण्डा", "Ilam Black Tea": "इलामको कालो चिया", "Nescafe Classic Instant Coffee": "नेसक्याफे क्लासिक कफी", "Jeera Masino Rice": "जिरा मसिनो चामल", "Sona Mansuli Rice": "सोनामन्सुली चामल", "Basmati Rice (Premium)": "प्रिमियम बासमती चामल", "Sooji (Semolina)": "सूजी", "Aashirvaad Whole Wheat Atta": "आशीर्वाद गहुँको आटा", "Moong Dal": "मुङ दाल", "Black Gram (Kalo Dal)": "कालो दाल", "Kabuli Chana": "काबुली चना", "Fortune Mustard Oil": "फर्च्युन तोरीको तेल", "Soybean Cooking Oil": "भटमासको तेल", "Tata Iodised Salt": "टाटा आयोडिन नुन", "Brown Sugar (Sakhar)": "खैरो चिनी (सख्खर)", "Wai Wai Veg Noodles": "वाई वाई भेज चाउचाउ", "Current Masala Noodles": "करेन्ट मसला चाउचाउ", "Current Masala Curry Noodles": "करेन्ट करी चाउचाउ", "Rara Chicken Noodles": "रारा चिकेन चाउचाउ", "2PM Masala Noodles": "टुपिएम मसला चाउचाउ", "Britannia Marie Gold Biscuits": "ब्रिटानिया मेरी गोल्ड बिस्कुट", "Parle-G Glucose Biscuits": "पार्ले-जी बिस्कुट", "Lay’s Magic Masala Chips": "लेज म्याजिक मसला चिप्स", "Everest Turmeric Powder": "एभरेस्ट बेसारको धुलो", "Everest Cumin Powder": "एभरेस्ट जिराको धुलो", "Everest Red Chilli Powder": "एभरेस्ट खुर्सानीको धुलो", "Meat Masala": "मासुको मसला", "DDC Standard Milk": "डीडीसी दूध", "DDC Dahi (Curd)": "डीडीसी दही", "Paneer": "पनीर", "Tokla Tea": "टोकला चिया", "Dabur Real Mango Juice": "डाबर रियल आँपको जुस", "Nescafe Classic Coffee Jar": "नेसक्याफे क्लासिक कफी",
  "per": "प्रति", "Shop in this category": "यस प्रकारका सामान हेर्नुहोस्", "View": "हेर्नुहोस्", "Save": "सुरक्षित गर्नुहोस्", "from favorites": "मनपर्ने सूचीबाट", "to favorites": "मनपर्ने सूचीमा", "Remove from favorites": "मनपर्नेबाट हटाउनुहोस्", "Save to favorites": "मनपर्नेमा राख्नुहोस्", "kg": "केजी", "gram": "ग्राम", "litre": "लिटर", "ml": "एमएल", "packet": "प्याकेट", "box": "बट्टा", "piece": "वटा", "dozen": "दर्जन",
});

Object.assign(translations, {
  // Profile page
  "My Profile": "मेरो प्रोफाइल", "Loading profile...": "प्रोफाइल खुल्दैछ...", "Name cannot be empty.": "नाम खाली राख्न मिल्दैन।",
  "Name updated successfully!": "नाम परिवर्तन भयो।", "Profile photo updated.": "प्रोफाइल फोटो परिवर्तन भयो।", "Could not update your profile photo.": "प्रोफाइल फोटो परिवर्तन गर्न सकिएन।",
  "Logout": "लगआउट", "Member since": "सदस्य भएको मिति", "Uploading…": "अपलोड हुँदैछ…", "Change photo": "फोटो बदल्नुहोस्", "Upload profile photo": "प्रोफाइल फोटो राख्नुहोस्",
  "Full Name": "पूरा नाम", "Save": "सेभ गर्नुहोस्", "Cancel": "रद्द गर्नुहोस्", "Edit": "बदल्नुहोस्", "Email": "इमेल", "Phone Number": "फोन नम्बर", "Profile photo for": "प्रोफाइल फोटो",
  "Password": "पासवर्ड", "Keep your account secure": "आफ्नो खाता सुरक्षित राख्नुहोस्", "Change Password": "पासवर्ड बदल्नुहोस्", "Current Password": "अहिलेको पासवर्ड",
  "Enter your current password": "अहिलेको पासवर्ड लेख्नुहोस्", "New Password": "नयाँ पासवर्ड", "Confirm New Password": "नयाँ पासवर्ड फेरि लेख्नुहोस्", "Repeat new password": "नयाँ पासवर्ड फेरि लेख्नुहोस्",
  "Please enter your current password.": "अहिलेको पासवर्ड लेख्नुहोस्।", "Please enter a new password.": "नयाँ पासवर्ड लेख्नुहोस्।",
  "New password must be different from current password.": "नयाँ पासवर्ड अहिलेकोभन्दा फरक हुनुपर्छ।", "New passwords do not match.": "दुवै नयाँ पासवर्ड मिलेनन्।",
  "Update Password": "पासवर्ड सेभ गर्नुहोस्", "Updating...": "परिवर्तन हुँदैछ...", "My Orders": "मेरा अर्डर", "View and track all your orders →": "आफ्ना अर्डर हेर्नुहोस् →",
  "New password must be at least 12 characters.": "नयाँ पासवर्ड कम्तीमा १२ अक्षरको हुनुपर्छ।", "Failed to update profile.": "प्रोफाइल परिवर्तन गर्न सकिएन।",
  "Failed to change password.": "पासवर्ड परिवर्तन गर्न सकिएन।", "Password updated. Sign in again with your new password.": "पासवर्ड परिवर्तन भयो। नयाँ पासवर्डले फेरि लगइन गर्नुहोस्।",
  "Saving...": "सेभ हुँदैछ...", "Could not load your profile.": "प्रोफाइल खुल्न सकेन।",

  // Help and feedback page
  "We’re here to help": "हामी सहयोगका लागि यहाँ छौँ", "Ask a question, share a complaint, or leave a store review. Your message goes directly to our store team.": "सोध्न, गुनासो गर्न वा पसलबारे सुझाव दिनुहोस्। तपाईंको सन्देश पसलको टोलीकहाँ पुग्छ।",
  "Talk to the store team": "पसलको टोलीसँग कुरा गर्नुहोस्", "We’ll review your message in our admin desk.": "हामी तपाईंको सन्देश हेरेर जवाफ दिनेछौँ।",
  "Your details stay private": "तपाईंको विवरण सुरक्षित रहन्छ", "We only use your contact details to follow up.": "तपाईंको सम्पर्क विवरण जवाफ दिन मात्र प्रयोग हुन्छ।",
  "Send us a message": "हामीलाई सन्देश पठाउनुहोस्", "Fields marked * are required.": "* भएका ठाउँ भर्नुहोस्।", "What do you need? *": "के सहयोग चाहिन्छ? *",
  "Help / question": "सहयोग / प्रश्न", "Complaint": "गुनासो", "Store review": "पसलको समीक्षा", "Something else": "अरू कुरा", "Your rating *": "तपाईंको मूल्याङ्कन *",
  "Your name *": "तपाईंको नाम *", "Email (account email)": "इमेल (खाताको इमेल)", "Email (optional)": "इमेल (वैकल्पिक)", "Phone (optional)": "फोन (वैकल्पिक)",
  "Please provide at least one contact method so we can respond.": "जवाफ दिन सकियोस् भनेर इमेल वा फोन नम्बर दिनुहोस्।", "For a reply": "जवाफ पाउन", "Subject *": "विषय *",
  "What is this about?": "के विषयमा हो?", "Message *": "सन्देश *", "Tell us a little more (at least 10 characters)": "अलि खुलाएर लेख्नुहोस् (कम्तीमा १० अक्षर)",
  "Send to the store team": "पसलमा पठाउनुहोस्", "Sending…": "पठाउँदैछ…", "Could not send your message.": "सन्देश पठाउन सकिएन।", "Thanks for reaching out. Your message has been sent to the store team.": "सम्पर्क गर्नुभएकोमा धन्यवाद। तपाईंको सन्देश पसलमा पठाइयो।",
  "Add an email or phone number so the store team can reply.": "पसलले जवाफ दिन इमेल वा फोन नम्बर दिनुहोस्।", "Your messages": "तपाईंका सन्देश", "View your questions and the store team’s replies here.": "तपाईंका प्रश्न र पसलका जवाफ यहाँ हेर्नुहोस्।",
  "Refresh": "फेरि हेर्नुहोस्", "Could not load your messages.": "तपाईंका सन्देश खुल्न सकेनन्।", "Loading your messages…": "तपाईंका सन्देश खुल्दैछन्…",
  "You haven’t sent a help request or complaint yet.": "तपाईंले अहिलेसम्म सहयोग माग्नुभएको वा गुनासो पठाउनुभएको छैन।", "Reply from the store": "पसलको जवाफ",
  "Reply copy sent": "जवाफको प्रति तपाईंको इमेलमा पठाइयो।", "Reply saved; email pending": "जवाफ यहाँ सुरक्षित छ; इमेल पठाउन बाँकी छ।", "Store rating": "पसलको मूल्याङ्कन", "star": "तारा", "stars": "तारा",
  "NEW": "नयाँ", "IN PROGRESS": "काम हुँदैछ", "RESOLVED": "समाधान भयो", "HELP": "सहयोग", "COMPLAINT": "गुनासो", "REVIEW": "समीक्षा", "OTHER": "अन्य",
});

interface LanguageContextValue { language: Language; setLanguage: (language: Language) => void; t: (english: string) => string; }
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => localStorage.getItem("bd_language") === "ne" ? "ne" : "en");
  useEffect(() => { document.documentElement.lang = language === "ne" ? "ne" : "en"; }, [language]);
  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage: (next) => { localStorage.setItem("bd_language", next); setLanguageState(next); },
    t: (english) => language === "ne" ? (translations[english] ?? english) : english,
  }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
