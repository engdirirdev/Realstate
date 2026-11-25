// ================================================================
// MODULE     : Global English -> Somali Real Estate Dictionary
// DESCRIPTION: Comprehensive platform-wide translation map and
//              smart pattern translator for Kiro-Maal Real Estate
// ================================================================

const RAW_EXACT_MAP: Record<string, string> = {
  // ─── Navbar & Global Navigation ───
  "Home": "Hoyga",
  "Properties": "Guryaha",
  "Services": "Adeegyada",
  "About": "Nagu Saabsan",
  "About Us": "Nagu Saabsan",
  "Contact": "Nala Soo Xiriir",
  "Contact Us": "Nala Soo Xiriir",
  "Login": "Gal",
  "Sign In": "Gal",
  "Sign Up": "Isdiiwaangeli",
  "Register": "Isdiiwaangeli",
  "Create Account": "Samee Akoon",
  "Sign Out": "Ka Bax",
  "Switch to Dashboard": "U Gudub Xarunta",
  "Public Site": "Bogga Guud",
  "Dashboard": "Xarunta Guud",
  "Profile": "Xogta Shaqsiga",
  "Profile Details": "Faahfaahinta Shaqsiga",
  "Settings": "Dejinta",
  "Account Settings": "Dejinta Akoonka",
  "Notifications": "Ogeysiisyada",
  "Alerts & Notifications": "Ogeysiisyada & Digniinaha",
  "Admin": "Maamule",
  "Super Admin": "Maamulka Sare",
  "Manager": "Maamule Guri",
  "Property Manager": "Maamulaha Guryaha",
  "Customer": "Macmiil",
  "User": "Isticmaale",
  "Skip to main content": "U bood nuxurka ugu muhiimsan",

  // ─── Homepage Hero & Stats ───
  "✦ Official Kiro-Maal Real Estate • Abudwak, Galmudug, Somalia":
    "✦ Kiro-Maal Real Estate Rasmiga ah • Caabudwaaq, Galmudug, Soomaaliya",
  "Smart Property Search": "Raadinta Guryaha Casriga ah",
  "Powered by AI": "Oo ku Shaqeeya AI",
  "Discover verified homes, modern apartments, and prime land plots across Abudwak, Galmudug, Somalia with precision AI valuations and trusted local agents.":
    "Ka hel guryo la hubiyay, dabaqyo casri ah, iyo dhulal qiimo leh oo ku yaalla Caabudwaaq, Galmudug, Soomaaliya iyadoo la adeegsanayo qiimeynta AI iyo wakiillo la aamini karo.",
  "Search Properties": "Raadi Guryo",
  "Verified Listings": "Guryo La Hubiyay",
  "6 Villages": "6 Xaafadood",
  "Full Abudwak Coverage": "Daboolida Caabudwaaq oo Dhan",
  "Verified Local Agents": "Wakiillo Deegaan oo La Hubiyay",
  "Abudwak Market Leader": "Hoggaamiyaha Suuqa Caabudwaaq",

  // ─── Homepage Featured Properties ───
  "✦ Handpicked Selection": "✦ Xulasho Gaar ah",
  "Featured Abudwak Properties": "Guryaha Ugu Fiican Caabudwaaq",
  "Explore verified, premium properties across Abudwak's villages curated for elegance, security, and growth.":
    "Sahami guryo la hubiyay oo tayo sare leh oo ku yaalla xaafadaha Caabudwaaq, looguna talagalay bilic, amni iyo maalgashi.",
  "View All Properties": "Eeg Dhammaan Guryaha",
  "New Abudwak Listings Coming Soon": "Guryo Cusub oo Caabudwaaq ah Way Soo Socdaan",
  "Verified homes, villas, and plots across Ubah, Horsed, October, 1da-Lulio, Ammano, and Waberi will appear here once published.":
    "Guryo la hubiyay, fillooyin, iyo dhulal ku yaalla Ubah, Horsed, October, 1da-Lulio, Ammano, iyo Waberi ayaa halkan ka muuqan doona marka la daabaco.",

  // ─── Homepage AI Strip & Testimonial ───
  "AI Smart Search": "Raadinta Caqliga AI",
  "Match properties in seconds": "Hel guryo kugu habboon ilbiriqsiyo gudahood",
  "Price Prediction": "Saadaasha Qiimaha",
  "ML future value forecasting": "Qiimeynta suuqa mustaqbalka ee AI",
  "Recommendations": "Talooyinka",
  "Tailored to your budget": "Loogu talagalay miisaaniyaddaada",
  "Virtual Tours": "Dalxiiska Muuqaalka",
  "Inspect before visiting": "Kormeer ka hor intaadan booqan",
  "24/7 AI Real Estate Assistant": "Kaaliyaha Guryaha AI 24/7",
  "Meet Kiro-Maal AI": "La Kulanka Kiro-Maal AI",
  "Ask anything about verified properties, villages in Abudwak, market prices, and investment opportunities in Galmudug.":
    "Weydii wax kasta oo ku saabsan guryaha la hubiyay, xaafadaha Caabudwaaq, qiimaha suuqa, iyo fursadaha maalgashiga Galmudug.",
  "Chat With Assistant": "La Sheekeyso Kaaliyaha",
  "“Kiro-Maal Real Estate made our home purchase in Abudwak completely seamless. The AI valuations gave us total clarity, and every village listing is verified and trustworthy.”":
    "“Kiro-Maal Real Estate waxay iibka gurigeenna ee Caabudwaaq ka dhigtay mid aad u fudud. Qiimeynta AI waxay na siisay kalsooni buuxda, xaafad kastana guryaha ku jira waa kuwo la hubiyay.”",
  "Verified Buyer • Horsed Village, Abudwak": "Iibsade La Hubiyay • Xaafadda Horsed, Caabudwaaq",

  // ─── Homepage Prime Villages ───
  "✦ Explore Abudwak, Galmudug": "✦ Sahami Caabudwaaq, Galmudug",
  "Prime Villages in Abudwak": "Xaafadaha Ugu Muhiimsan Caabudwaaq",
  "Browse verified properties across all 6 villages of Abudwak, Galmudug, Somalia.":
    "Ka baar guryo la hubiyay dhammaan 6-da xaafadood ee Caabudwaaq, Galmudug, Soomaaliya.",
  "Family villas, apartments & residential homes": "Fillooyin qoys, dabaqyo & guryo deegaan",
  "Modern villas, townhouses & rental homes": "Fillooyin casri ah, guryo dabaq & guryo kiro ah",
  "Central shops, offices & commercial properties": "Dukaamo bartamaha ah, xafiisyo & hanti ganacsi",
  "Spacious houses, land plots & new builds": "Guryo waawayn, dhulal bannaan & dhismayaal cusub",
  "Quiet family homes & prime residential plots": "Guryo qoys oo deggan & dhulal deegaan oo fiican",
  "Developing estates, land & commercial hubs": "Guryo koraya, dhulal & xarumo ganacsi",

  // ─── Footer ───
  "✦ VIP Real Estate Insights": "✦ Xogta Gaarka ah ee Suuqa Guryaha",
  "Stay Ahead of the Abudwak Property Market": "La Soco Xogta Suuqa Guryaha Caabudwaaq",
  "Subscribe to receive new verified listings, off-market opportunities, and AI market predictions.":
    "Isdiiwaangeli si aad u hesho guryaha cusub ee la hubiyay, fursadaha gaarka ah, iyo saadaasha qiimaha AI.",
  "Enter your email address": "Geli ciwaanka iimaylkaaga",
  "Subscribe": "Isdiiwaangeli",
  "Kiro-Maal Real Estate is Abudwak's premier luxury property platform. Discover verified properties, unlock AI-driven valuations, and find your dream home with unmatched trust and precision.":
    "Kiro-Maal Real Estate waa madasha ugu horreysa ee guryaha Caabudwaaq. Ka hel guryo la hubiyay, qiimeyn AI ah, iyo guriga riyadaada iyadoo la adeegsanayo kalsooni iyo daahfurnaan.",
  "Company": "Shirkadda",
  "Houses": "Guryo",
  "Apartments": "Dabaqyo",
  "Villas": "Fillooyin",
  "Commercial": "Ganacsi",
  "AI Features": "Astaamaha AI",
  "AI Recommendations": "Talooyinka AI",
  "AI Assistant": "Kaaliyaha AI",
  "Privacy Policy": "Siyaasadda Asturnaanta",
  "Terms of Service": "Shuruudaha Adeegga",
  "Cookie Policy": "Siyaasadda Kukiyada",

  // ─── About Us Page ───
  "Our Heritage & Vision": "Hiddaha & Aragtideenna",
  "Transforming Real Estate in Abudwak with": "Beddelidda Suuqa Guryaha Caabudwaaq iyadoo la Adeegsanayo",
  "We're on a mission to make property discovery smarter, fairer, and seamlessly accessible for every resident and diaspora investor in Abudwak, Galmudug, Somalia.":
    "Hadafkeennu waa in aan raadinta guryaha ka dhigno mid caqli badan, caddaalad ah, oo u fudud qof kasta oo deggan Caabudwaaq iyo qurbo-joogta maalgashanaysa Galmudug, Soomaaliya.",
  "Verified Local Listings": "Guryo Deegaan oo La Hubiyay",
  "Market Data Accuracy": "Saxnaanta Xogta Suuqa",
  "AI Concierge & Valuation": "Kaaliyaha AI & Qiimeynta",
  "✦ Our Mission": "✦ Hadafkeenna",
  "Why We Built Kiro-Maal": "Sababta aan u Dhisnay Kiro-Maal",
  "Finding trusted real estate in Abudwak has traditionally been difficult — a mix of word-of-mouth, unverified listings, and fragmented brokers. We established Kiro-Maal Real Estate to set the master standard for transparency, architecture, and technology across all 6 villages.":
    "Helitaanka guryo la aamini karo oo Caabudwaaq ku yaalla wuxuu ahaan jiray mid adag — isku darka hadal-hayn, guryo aan la hubin, iyo dallaallo kala daadsan. Waxaan aasaasnay Kiro-Maal Real Estate si aan u dejinno halbeegga daahfurnaanta iyo tiknoolajiyadda dhammaan 6-da xaafadood.",
  "By combining an exquisite digital experience with machine learning price intelligence and an interactive 24/7 AI concierge, we deliver the most prestigious property platform in Galmudug, Somalia.":
    "Iyadoo la isku darayo nidaam casri ah, qiimeynta AI, iyo kaaliye 24/7 shaqeeya, waxaan bixinaa madasha guryaha ugu tayada sarreysa Galmudug, Soomaaliya.",
  "✦ What We Stand For": "✦ Waxa aan u Taagannahay",
  "Our Core Values": "Qiyamkeenna Aasaasiga ah",
  "Innovation First": "Hal-abuurka Ugu Horreeya",
  "We leverage cutting-edge AI and ML to transform how clients find and value premium properties.":
    "Waxaan adeegsannaa tiknoolajiyadda casriga ah ee AI si aan u fududeyno raadinta iyo qiimeynta guryaha.",
  "Community Driven": "Bulshada Ku Saleysan",
  "Built by Somalis, for Somalis. We understand the Abudwak and Galmudug property market deeply.":
    "Waxaa dhisay Soomaali, looguna talagalay Soomaali. Waxaan si qoto dheer u fahamsannahay suuqa guryaha Caabudwaaq iyo Galmudug.",
  "Transparent Platform": "Madal Daahfuran",
  "No hidden fees, no fake listings. Every property is rigorously verified before listing.":
    "Ma jiraan khidmad qarsoon ama xayeysiis been abuur ah. Guri kasta si adag ayaa loo hubiyaa ka hor intaan la daabicin.",
  "Data Integrity": "Sugnaanta Xogta",
  "Our AI assistant speaks exclusively from real database listings — zero hallucinations.":
    "Kaaliyaheenna AI wuxuu kaliya ka hadlaa xogta dhabta ah ee keydka guryaha — wax been ah kuma jiraan.",
  "✦ The Leadership": "✦ Hoggaanka Shirkadda",
  "Meet Our Executive Team": "La Kulanka Kooxdeenna Hoggaanka",
  "Ready to Find Your Dream Property?": "Diyaar ma u Tahay in aad Hesho Guriga Riyadaada?",
  "Join discerning buyers, tenants, and investors who trust Kiro-Maal Real Estate for verified properties across Abudwak, Galmudug, Somalia.":
    "Ku biir iibsadayaasha, kireystayaasha, iyo maalgashadayaasha ku kalsoon Kiro-Maal Real Estate ee Caabudwaaq, Galmudug, Soomaaliya.",
  "Browse Properties": "Baar Guryaha",
  "Contact Advisory": "La Xiriir La-taliyaha",

  // ─── Services & Contact Pages ───
  "Our Services": "Adeegyadeenna",
  "Send Message": "Dir Farriin",
  "Send a Message": "Dir Farriin",
  "Full Name": "Magaca Oo Buuxa",
  "Email Address": "Ciwaanka Iimaylka",
  "Phone Number": "Lambarka Telefoonka",
  "Subject": "Mawduuca",
  "Message": "Farriinta",
  "Username": "Magaca Isticmaalaha",
  "Password": "Erayga Sirta ah",
  "Confirm Password": "Xaqiiji Erayga Sirta ah",

  // ─── Properties Listing & Filters ───
  "All Properties": "Dhammaan Guryaha",
  "Add Property": "Ku Dar Guri",
  "For Sale": "Iib",
  "For Rent": "Kiro",
  "FOR_SALE": "IIB",
  "FOR_RENT": "KIRO",
  "Buy Properties": "Iibso Guryo",
  "Rent Properties": "Kireyso Guryo",
  "Find Listings": "Raadi Guryo",
  "Search Term": "Erayga Raadinta",
  "Village (Abudwak)": "Xaafadda (Caabudwaaq)",
  "All Villages": "Dhammaan Xaafadaha",
  "City": "Magaalada",
  "City / Town": "Magaalada / Degmada",
  "Region / State": "Gobolka / Maamulka",
  "Country": "Dalka",
  "Category": "Qaybta",
  "All Categories": "Dhammaan Qaybaha",
  "All Types": "Dhammaan Noocyada",
  "Property Type": "Nooca Guriga",
  "House": "Guri",
  "Apartment": "Dabaq",
  "Villa": "Fillo",
  "Office": "Xafiis",
  "Land": "Dhul",
  "Land Plot": "Dhul Bannaan",
  "Townhouse": "Guri Dabaq ah",
  "Studio": "Istuudiyo",
  "Shop": "Dukaan",
  "Warehouse": "Bakhaar",
  "View Details": "Eeg Faahfaahinta",
  "Save": "Kaydi",
  "Share": "La Wadaag",
  "Cancel": "Jooji",
  "Edit": "Wax Ka Beddel",
  "Delete": "Tirtir",
  "Close": "Xir",
  "Refresh": "Cusboonaysii",
  "Submit": "Dir",
  "Confirm": "Xaqiiji",
  "Back": "Dib u Noqo",
  "Next": "Xiga",
  "Previous": "Hore",
  "Loading...": "Waa la soo rarayaa...",
  "Available": "Diyaar ah",
  "Sold": "La Iibiyay",
  "Rented": "La Kireeyay",
  "Pending": "Sugaya",
  "Approved": "La Ansixiyay",
  "Rejected": "La Diiday",
  "Active": "Shaqaynaya",
  "Disabled": "Damsan",
  "Completed": "Dhammaaday",
  "Paid": "La Bixiyay",
  "Unpaid": "Aan La Bixin",

  // ─── AI Assistant ───
  "Ask AI Assistant": "Weydii Kaaliyaha AI",
  "Kiro-Maal AI Assistant": "Kaaliyaha AI ee Kiro-Maal",
  "Admin Mode • Live Database": "Habka Maamulka • Xogta Tooska ah",
  "Manager Mode • Live Database": "Habka Maamulaha • Xogta Tooska ah",
  "Customer Mode • Live Database": "Habka Macmiilka • Xogta Tooska ah",
  "Public Mode • Live Database": "Habka Guud • Xogta Tooska ah",
  "Recent Conversations": "Sheekooyinkii Ugu Dambeeyay",
  "New Chat": "Sheeko Cusub",
  "Recently Asked": "Dhawaan La Weydiiyay",
  "Back to Chat": "Ku Noqo Sheekada",
  "No recent conversations yet": "Weli ma jiraan sheekooyin hore",
  "Ask AI about properties, prices...": "Weydii AI guryaha, qiimaha...",
  "Search what you asked before...": "Raadi wixii aad hore u weydiisay...",
  "AIDA is thinking...": "AI way ka fikiraysaa...",
  "How many pending properties need review?": "Immisa guri oo sugaya ayaa u baahan dib-u-eegis?",
  "Show platform revenue summary": "Muuji koobka dakhliga madasha",
  "How many registered users are active?": "Immisa isticmaale oo diiwaangashan ayaa shaqeynaya?",
  "How many properties do I have listed?": "Immisa guri ayaan soo geliyay?",
  "Show my pending or rejected listings": "Muuji guryahayga sugaya ama la diiday",
  "How can I improve my property descriptions?": "Sideen u wanaajin karaa sharraxaadda guryahayga?",
  "Recommend properties matching my budget": "Ii soo jeedi guryo ku habboon miisaaniyaddayda",
  "Show 3-bedroom houses in Abudwak": "Muuji guryaha 3-da qol leh ee Caabudwaaq",
  "Explain how ML price prediction works": "Sharax sida ay u shaqeyso saadaasha qiimaha AI",
  "Find apartments under $50,000 in Abudwak": "Hel dabaqyo ka yar $50,000 oo ku yaalla Caabudwaaq",
  "What real estate services do you provide?": "Waa maxay adeegyada guryaha ee aad bixisaan?",
  "Show me properties in Ubah or Horsed, Abudwak": "Ii muuji guryaha ku yaalla Ubah ama Horsed, Caabudwaaq",

  // ─── Admin & Manager Portals ───
  "Security & Compliance": "Amniga & U Hogaansanaanta",
  "System Audit & Event Logs": "Diiwaanka Amniga & Dhacdooyinka Nidaamka",
  "Immutable record of platform transactions, approvals, administrative actions, and security transitions.":
    "Diiwaan sugan oo ku saabsan heshiisyada, oggolaanshaha, hawlaha maamulka, iyo dhaqdhaqaaqa amniga nidaamka.",
  "Total Audit Records": "Wadarta Diiwaanka Amniga",
  "Verified ledger entries": "Diiwaan la xaqiijiyay",
  "Sales & Purchases": "Iibka & Codsiyada",
  "Approvals & settlements": "Oggolaanshaha & lacag-bixinta",
  "Rentals & Bookings": "Kirada & Ballamaha",
  "Lease & booking events": "Dhacdooyinka kirada iyo ballamaha",
  "Properties & System": "Guryaha & Nidaamka",
  "Listings & config audits": "Hubinta guryaha iyo dejinta",
  "All Events": "Dhammaan Dhacdooyinka",
  "System & Security": "Nidaamka & Amniga",
  "No matching audit events": "Ma jiraan dhacdooyin u dhigma",
  "Abudwak Village Registry": "Diiwaanka Xaafadaha Caabudwaaq",
  "Abudwak Villages & Locations": "Xaafadaha & Goobaha Caabudwaaq",
  "Register All 6 Villages": "Diiwaangeli Dhammaan 6-da Xaafadood",
  "Add Village": "Ku Dar Xaafad",
  "Register Abudwak Village": "Diiwaangeli Xaafad Caabudwaaq ah",
  "Edit Abudwak Village": "Wax Ka Beddel Xaafadda",
  "Village Name (Abudwak)": "Magaca Xaafadda (Caabudwaaq)",
  "Save Village": "Kaydi Xaafadda",
  "Save Changes": "Kaydi Isbeddellada",
  "No Villages Registered Yet": "Weli Xaafado Lama Diiwaangelin",
  "Shared Communications Hub": "Xarunta Isgaarsiinta Wadaagga ah",
  "Shared Conversations & Inquiries": "Sheekooyinka Wadaagga ah & Farriimaha",
  "Messages & Shared Conversations": "Farriimaha & Sheekooyinka Wadaagga ah",
  "Message Manager": "U Dir Maamulaha",
  "Message Admin": "U Dir Maamulka Sare",
  "All Shared Threads": "Dhammaan Sheekooyinka",
  "Admin ↔ Manager Chat": "Sheekada Maamulka ↔ Maamulaha",
  "Customer Inquiries": "Su'aalaha Macaamiisha",
  "Public Contact Form": "Foomka Xiriirka Guud",
  "Send Reply": "Dir Jawaabta",
  "Needs Reply": "U Baahan Jawaab",
  "Executive Team Management": "Maamulka Kooxda Hoggaanka",
  "Add Team Member": "Ku Dar Xubin",
  "Register Executive Member": "Diiwaangeli Xubin Hoggaan",
  "Edit Executive Member": "Wax Ka Beddel Xubinta",
  "Upload Photo": "Soo Geli Sawir",
  "Change Photo": "Beddel Sawirka",
  "Remove": "Ka Saar",
  "Platform Brand Name": "Magaca Shirkadda",
  "Concierge Email": "Iimaylka Adeegga",
  "Default Settlement Currency": "Lacagta Rasmiga ah",
  "Office Phone Number(s)": "Lambarrada Telefoonka Xafiiska",
  "Office Address (Footer)": "Ciwaanka Xafiiska",
  "Company Description (Footer)": "Sharraxaadda Shirkadda",
  "Auto-Publish Property Listings": "Daabacaadda Tooska ah ee Guryaha",
  "Enable Global Floating AI Concierge": "Daar Kaaliyaha AI ee Bogagga oo Dhan",
  "Save General Parameters": "Kaydi Dejinta Guud",
  "Centralized Payment Accounts": "Akoonnada Lacag-Bixinta",
  "Save Payment Accounts": "Kaydi Akoonnada",
  "Price Prediction Engine": "Matoorada Saadaasha Qiimaha",
  "AI Property Valuation Index": "Qiimeynta Guryaha ee AI",
  "Property Specifications": "Astaamaha Guriga",
  "Search properties, users, bookings...": "Raadi guryo, isticmaalayaal, ballamo...",
  "Search properties, customers...": "Raadi guryo, macaamiil...",
  "Search action, property, actor, ID...": "Raadi fal, guri, isticmaale, aqoonsi...",

  // ─── Additional Public, Auth & Portal Subtitles / Labels ───
  "Welcome Back": "Ku Soo Dhawoow Mar Kale",
  "Sign in to access your Kiro-Maal portal": "Gal si aad u furto xaruntaada Kiro-Maal",
  "Don't have an account?": "Ma lihid akoon?",
  "Already have an account?": "Hore ma u lahayd akoon?",
  "Remember me": "I xusuuso",
  "Forgot password?": "Ma ilowday erayga sirta ah?",
  "Personal Information": "Macluumaadka Shaqsiga",
  "Change Password": "Beddel Erayga Sirta ah",
  "Current Password": "Erayga Sirta ah ee Hadda",
  "New Password": "Erayga Sirta ah ee Cusub",
  "Save Profile": "Kaydi Xogta",
  "Update Password": "Cusboonaysii Erayga Sirta ah",
  "Portfolio Performance Analytics": "Falanqaynta Waxqabadka Guryaha",
  "Platform Analytics & Reports": "Falanqaynta & Warbixinta Madasha",
  "Total Portfolio Listings": "Wadarta Guryaha Diiwaangashan",
  "Active Published": "Kuwa Daabacan ee Shaqaynaya",
  "Under Review": "Dib-u-Eegis ku Jira",
  "Total Revenue Yield": "Wadarta Dakhliga",
  "Purchase Requests & Sales": "Codsiyada Iibka & Gadashada",
  "Bookings & Rents": "Ballamaha & Kirada",
  "Payments & Transactions": "Lacag-Bixinta & Xawaaladaha",
  "Customers": "Macaamiisha",
  "Managers": "Maamulayaasha",
  "Categories": "Qaybaha",
  "Locations": "Goobaha",
  "Audit Logs": "Diiwaanka Amniga",
  "My Requests": "Codsiyadayda",
  "My Rentals": "Kiradayda",
  "My Purchases": "Iibkayga",
  "My Payments": "Lacag-Bixintayda",
  "My Favorites": "Kuwa Aan Jeclahay",
  "Saved Searches": "Raadinta La Kaydiyay",
  "Messages": "Farriimaha",
  "My Reviews": "Faallooyinkayga",
  "Compare Properties": "Isbarbardhig Guryaha",
  "Clear": "Nadiifi",
  "Clear All": "Nadiifi Dhammaan",
  "Mark All Read": "U Calaamadee In La Akhriyay",
  "No notifications yet": "Weli ma jiraan ogeysiisyo",
  "No properties found": "Wax guri ah lama helin",
  "Reset Filters": "Dib u Deji Shaandhada",
  "Apply Filters": "Codso Shaandhada",
  "Min Price": "Qiimaha Ugu Yar",
  "Max Price": "Qiimaha Ugu Badan",
  "Bedrooms": "Qolalka Jiifka",
  "Bathrooms": "Musqulaha",
  "Area (m²)": "Bedka (m²)",
  "Furnished": "Qalabaysan",
  "Negotiable": "Laga Wada Hadli Karo",
  "Pay Now": "Bixi Hadda",
  "Confirm & Pay": "Xaqiiji & Bixi",
  "Official Sandbox Payment Gateway": "Nidaamka Lacag-Bixinta Rasmiga ah",
  "Total Amount Due": "Wadarta Lacagta La Rabo",
  "View Receipt": "Eeg Rasiidka",
  "Download Receipt": "Soo Degso Rasiidka",
  "Overview": "Guudmar",
  "Quick Actions": "Hawlaha Degdegga ah",
  "Recent Activity": "Dhaqdhaqaaqii Ugu Dambeeyay",
};

// Build case-normalized lookup map for fast matching
const NORMALIZED_MAP = new Map<string, string>();
for (const [en, so] of Object.entries(RAW_EXACT_MAP)) {
  NORMALIZED_MAP.set(en.trim(), so);
  NORMALIZED_MAP.set(en.trim().toLowerCase(), so);
}

// Dynamic template rules (regex -> Somali)
const PATTERN_RULES: { regex: RegExp; replace: (...args: string[]) => string }[] = [
  {
    regex: /^(\d+)\s+Properties$/i,
    replace: (_, n) => `${n} Guryo`,
  },
  {
    regex: /^1\s+Property$/i,
    replace: () => `1 Guri`,
  },
  {
    regex: /^(\d+)\s+Beds?$/i,
    replace: (_, n) => `${n} Qolal`,
  },
  {
    regex: /^(\d+)\s+Baths?$/i,
    replace: (_, n) => `${n} Musqulo`,
  },
  {
    regex: /^(\d+)\s+events in last 24h$/i,
    replace: (_, n) => `${n} dhacdo 24-kii saac ee u dambeeyay`,
  },
  {
    regex: /^View all \((\d+)\)\s*→$/i,
    replace: (_, n) => `Eeg dhammaan (${n}) →`,
  },
  {
    regex: /^(\d+)\s+msgs$/i,
    replace: (_, n) => `${n} farriimo`,
  },
  {
    regex: /^©\s*(\d{4})\s+(.+?)\.\s*All rights reserved\.$/i,
    replace: (_, year, brand) => `© ${year} ${brand}. Xuquuqda oo dhan way xafidan tahay.`,
  },
  {
    regex: /^Hello Admin (.+?)! I can help you monitor pending approvals, platform stats, and revenue\.$/i,
    replace: (_, name) =>
      `Soo dhawoow Maamule ${name}! Waxaan kaa caawin karaa la socodka oggolaanshaha sugaya, tirakoobka madasha, iyo dakhliga.`,
  },
  {
    regex: /^Hello Agent (.+?)! Ask me about your property listings, approval statuses, or inquiries\.$/i,
    replace: (_, name) =>
      `Soo dhawoow Wakiil ${name}! I weydii guryahaaga, xaaladda oggolaanshaha, ama farriimaha macaamiisha.`,
  },
  {
    regex: /^Welcome (.+?)! I can recommend properties based on your preferences or answer housing questions\.$/i,
    replace: (_, name) =>
      `Soo dhawoow ${name}! Waxaan kuu soo jeedin karaa guryo ku habboon dookhaaga ama ka jawaabi karaa su'aalaha guryaha.`,
  },
  {
    regex: /^Welcome to Kiro-Maal Real Estate! Ask me anything about properties, locations, or price predictions in Somalia\.$/i,
    replace: () =>
      `Ku soo dhawoow Kiro-Maal Real Estate! I weydii wax kasta oo ku saabsan guryaha, xaafadaha Caabudwaaq, ama saadaasha qiimaha.`,
  },
  {
    regex: /^Reply in shared thread with (.+?)\.\.\.$/i,
    replace: (_, name) => `Ku qor jawaabta sheekada wadaagga ah ee ${name}...`,
  },
  {
    regex: /^Reply to (.+?)\.\.\.$/i,
    replace: (_, name) => `U jawaab ${name}...`,
  },
  {
    regex: /^Go to Portal \((.+?)\)$/i,
    replace: (_, role) => `U Gudub Xarunta (${translateToSomali(role)})`,
  },
];

export function translateToSomali(rawText: string): string {
  if (!rawText) return rawText;
  const trimmed = rawText.trim();
  if (!trimmed || trimmed.length < 2) return rawText;

  // Preserve pure numbers, currency, emails, URLs, or uppercase codes
  if (
    /^[\d\s$,.%+\-/:()#]+$/.test(trimmed) ||
    /^https?:\/\//i.test(trimmed) ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
  ) {
    return rawText;
  }

  const leading = rawText.slice(0, rawText.indexOf(trimmed));
  const trailing = rawText.slice(rawText.indexOf(trimmed) + trimmed.length);

  // 1. Exact match (case-sensitive, then case-insensitive)
  const exact = NORMALIZED_MAP.get(trimmed) || NORMALIZED_MAP.get(trimmed.toLowerCase());
  if (exact) {
    return `${leading}${exact}${trailing}`;
  }

  // 2. Dynamic regex pattern rules
  for (const rule of PATTERN_RULES) {
    if (rule.regex.test(trimmed)) {
      const replaced = trimmed.replace(rule.regex, rule.replace as any);
      return `${leading}${replaced}${trailing}`;
    }
  }

  return rawText;
}
