import {businessMessages} from './i18n-business.js';
// System copy is translated here. Business names, product names and entered notes stay unchanged.
const coreMessages = [
 ['Overview','දළ විශ්ලේෂණය','கண்ணோட்டம்'],
 ['Products & stock','නිෂ්පාදන හා තොග','பொருட்கள் மற்றும் இருப்பு'],
 ['Orders','ඇණවුම්','ஆர்டர்கள்'],['Shops','වෙළඳසැල්','கடைகள்'],
 ['Collections','අයවිය යුතු මුදල්','வசூல்கள்'],['Stock history','තොග ඉතිහාසය','இருப்பு வரலாறு'],
 ['Reports','වාර්තා','அறிக்கைகள்'],['Settings','සැකසුම්','அமைப்புகள்'],
 ['New order','නව ඇණවුම','புதிய ஆர்டர்'],['Inventory management','තොග කළමනාකරණය','சரக்கு மேலாண்மை'],
 ['Factory workspace','කර්මාන්තශාලා වැඩ අවකාශය','தொழிற்சாலை பணியிடம்'],
 ['Workspace','වැඩ අවකාශය','பணியிடம்'],['Management','කළමනාකරණය','மேலாண்மை'],
 ['Main navigation','ප්‍රධාන මෙනුව','முதன்மை வழிசெலுத்தல்'],['Open navigation','මෙනුව විවෘත කරන්න','வழிசெலுத்தலைத் திறக்கவும்'],
 ['Menu','මෙනුව','பட்டியல்'],['Language','භාෂාව','மொழி'],['Administrator','පරිපාලක','நிர்வாகி'],
 ['Local workspace · This PC','දේශීය වැඩ අවකාශය · මෙම පරිගණකය','உள்ளூர் பணியிடம் · இந்தக் கணினி'],
 ['Saved on this computer','මෙම පරිගණකයේ සුරකින ලදී','இந்தக் கணினியில் சேமிக்கப்பட்டது'],
 ['Lock','අගුළු දමන්න','பூட்டு'],['Switch light or dark theme','ආලෝක හෝ අඳුරු තේමාව තෝරන්න','ஒளி அல்லது இருள் தோற்றத்தை மாற்றவும்'],
 ['Switch theme','තේමාව මාරු කරන්න','தோற்றத்தை மாற்றவும்'],
 ['A little clarity for your everyday business.','ඔබේ දෛනික ව්‍යාපාරයට පැහැදිලි දැක්මක්.','உங்கள் அன்றாட வணிகத்திற்குத் தெளிவான பார்வை.'],
 ['Total order value','මුළු ඇණවුම් වටිනාකම','மொத்த ஆர்டர் மதிப்பு'],['All active orders','සියලු සක්‍රිය ඇණවුම්','அனைத்து செயலில் உள்ள ஆர்டர்கள்'],
 ['Orders to fulfil','සම්පූර්ණ කළ යුතු ඇණවුම්','நிறைவேற்ற வேண்டிய ஆர்டர்கள்'],
 ['Ready for your next delivery','ඊළඟ බෙදාහැරීමට සූදානම්','அடுத்த விநியோகத்திற்குத் தயார்'],
 ['Available stock','පවතින තොග','கிடைக்கும் இருப்பு'],['units','ඒකක','அலகுகள்'],['units left','ඉතිරි ඒකක','மீதமுள்ள அலகுகள்'],
 ['Outstanding payments','අයවිය යුතු ගෙවීම්','நிலுவைத் தொகைகள்'],
 ['Sales activity','විකුණුම් ක්‍රියාකාරකම්','விற்பனைச் செயல்பாடு'],
 ['Order value over the last 7 days','පසුගිය දින 7 තුළ ඇණවුම් වටිනාකම','கடந்த 7 நாட்களின் ஆர்டர் மதிப்பு'],
 ['This week','මෙම සතිය','இந்த வாரம்'],['Stock needs attention','අවධානය අවශ්‍ය තොග','கவனிக்க வேண்டிய இருப்பு'],
 ['Keep your next orders moving','ඊළඟ ඇණවුම් සඳහා තොග සූදානම් කරගන්න','அடுத்த ஆர்டர்களுக்கான இருப்பைத் தயாராக வைத்திருங்கள்'],
 ['All products are above their minimum stock.','සියලු නිෂ්පාදන අවම තොග මට්ටමට ඉහළින් පවතී.','அனைத்துப் பொருட்களும் குறைந்தபட்ச இருப்பிற்கு மேல் உள்ளன.'],
 ['View inventory','තොග බලන්න','இருப்பைப் பார்க்கவும்'],['Recent orders','මෑත ඇණවුම්','சமீபத்திய ஆர்டர்கள்'],
 ['Your latest shop orders, at a glance','වෙළඳසැල්වල නවතම ඇණවුම් එක බැල්මකින්','சமீபத்திய கடை ஆர்டர்கள் ஒரே பார்வையில்'],
 ['View all orders','සියලු ඇණවුම් බලන්න','அனைத்து ஆர்டர்களையும் பார்க்கவும்'],
 ['Good records. A smoother working day.','නිවැරදි වාර්තා. පහසු වැඩ දිනයක්.','சரியான பதிவுகள். எளிதான வேலைநாள்.'],
 ['Stock updates automatically when you place an order.','ඇණවුමක් තැබූ විට තොග ස්වයංක්‍රීයව යාවත්කාලීන වේ.','ஆர்டர் இடும்போது இருப்பு தானாகப் புதுப்பிக்கப்படும்.'],
 ['Add stock','තොග එකතු කරන්න','இருப்பைச் சேர்க்கவும்'],
 ['Every product, every variant. Your stock in one place.','සියලු නිෂ්පාදන හා ප්‍රභේද. ඔබේ තොග එකම තැනක.','அனைத்துப் பொருட்களும் வகைகளும். உங்கள் இருப்பு ஒரே இடத்தில்.'],
 ['Manage orders from the first request to the final delivery.','ඉල්ලීමේ සිට බෙදාහැරීම දක්වා ඇණවුම් කළමනාකරණය කරන්න.','கோரிக்கை முதல் விநியோகம் வரை ஆர்டர்களை நிர்வகிக்கவும்.'],
 ['The shops you supply, all together.','ඔබ සැපයුම් කරන වෙළඳසැල් සියල්ල එකම තැනක.','நீங்கள் விநியோகிக்கும் கடைகள் அனைத்தும் ஒரே இடத்தில்.'],
 ['A clear view of what is still to collect.','තවමත් අයවිය යුතු මුදල් පිළිබඳ පැහැදිලි දැක්මක්.','இன்னும் வசூலிக்க வேண்டிய தொகைகளின் தெளிவான பார்வை.'],
 ['A record of every quantity added or taken out.','එකතු කළ හෝ ඉවත් කළ සෑම ප්‍රමාණයකම වාර්තාවක්.','சேர்க்கப்பட்ட அல்லது அகற்றப்பட்ட ஒவ்வொரு அளவின் பதிவும்.'],
 ['Add product','නිෂ්පාදනයක් එකතු කරන්න','பொருளைச் சேர்க்கவும்'],['Add a product','නිෂ්පාදනයක් එකතු කරන්න','பொருளைச் சேர்க்கவும்'],
 ['Add shop','වෙළඳසැලක් එකතු කරන්න','கடையைச் சேர்க்கவும்'],['Add a shop','වෙළඳසැලක් එකතු කරන්න','கடையைச் சேர்க்கவும்'],
 ['Search','සොයන්න','தேடவும்'],['Search shops…','වෙළඳසැල් සොයන්න…','கடைகளைத் தேடவும்…'],
 ['Search products, variants or codes…','නිෂ්පාදන, ප්‍රභේද හෝ කේත සොයන්න…','பொருட்கள், வகைகள் அல்லது குறியீடுகளைத் தேடவும்…'],
 ['Search records…','වාර්තා සොයන්න…','பதிவுகளைத் தேடவும்…'],['Search options…','විකල්ප සොයන්න…','விருப்பங்களைத் தேடவும்…'],
 ['No matching options','ගැළපෙන විකල්ප නැත','பொருந்தும் விருப்பங்கள் இல்லை'],['Select an option','විකල්පයක් තෝරන්න','ஒரு விருப்பத்தைத் தேர்ந்தெடுக்கவும்'],
 ['All categories','සියලු කාණ්ඩ','அனைத்து வகைகளும்'],['Export CSV','CSV ලෙස ලබාගන්න','CSV பதிவிறக்கம்'],
 ['Soap bars','සබන් කැට','சோப்புக் கட்டிகள்'],['Dishwashing','පිඟන් සේදුම්','பாத்திரம் கழுவும் பொருட்கள்'],
 ['Hand wash','අත් සේදුම්','கை கழுவும் திரவம்'],['Washing powder','රෙදි සෝදන කුඩු','சலவைத் தூள்'],['Fabric care','රෙදි සත්කාර','துணிப் பராமரிப்பு'],
 ['Order','ඇණවුම','ஆர்டர்'],['Shop','වෙළඳසැල','கடை'],['Date','දිනය','தேதி'],['Amount','මුදල','தொகை'],
 ['Payment','ගෙවීම','கட்டணம்'],['Status','තත්ත්වය','நிலை'],['View','බලන්න','பார்க்கவும்'],['Voided','අවලංගුයි','ரத்து செய்யப்பட்டது'],
 ['Paid','ගෙවා ඇත','செலுத்தப்பட்டது'],['Part paid','කොටසක් ගෙවා ඇත','பகுதி செலுத்தப்பட்டது'],['On credit','ණයට','கடனில்'],
 ['Placed','ඇණවුම් කර ඇත','ஆர்டர் இடப்பட்டது'],['Delivered','බෙදාහැර ඇත','விநியோகிக்கப்பட்டது'],['Cancelled','අවලංගු කර ඇත','ரத்து செய்யப்பட்டது'],
 ['No orders yet. Place your first shop order to see it here.','තවමත් ඇණවුම් නැත. පළමු වෙළඳසැල් ඇණවුම මෙහි පෙන්වනු ඇත.','இன்னும் ஆர்டர்கள் இல்லை. முதல் கடை ஆர்டரை இட்டதும் இங்கே காணலாம்.'],
 ['No records yet.','තවමත් වාර්තා නැත.','இன்னும் பதிவுகள் இல்லை.'],
 ['Product','නිෂ්පාදනය','பொருள்'],['Products','නිෂ්පාදන','பொருட்கள்'],['Code','කේතය','குறியீடு'],['Category','කාණ්ඩය','வகை'],
 ['Price','මිල','விலை'],['Available','පවතින ප්‍රමාණය','கிடைக்கும் அளவு'],['Stock status','තොග තත්ත්වය','இருப்பு நிலை'],
 ['Out of stock','තොග අවසන්','இருப்பு இல்லை'],['Low stock','අඩු තොග','குறைந்த இருப்பு'],['In stock','තොග පවතී','இருப்பில் உள்ளது'],
 ['Adjust','වෙනස් කරන්න','சரிசெய்யவும்'],['Edit','සංස්කරණය','திருத்தவும்'],
 ['No products match your search.','ඔබේ සෙවුමට ගැළපෙන නිෂ්පාදන නැත.','உங்கள் தேடலுக்குப் பொருந்தும் பொருட்கள் இல்லை.'],
 ['Area','ප්‍රදේශය','பகுதி'],['Phone','දුරකථනය','தொலைபேசி'],['Outstanding','අයවිය යුතු මුදල','நிலுவை'],
 ['Order date','ඇණවුම් දිනය','ஆர்டர் தேதி'],['Total','එකතුව','மொத்தம்'],['Received','ලැබුණු මුදල','பெறப்பட்டது'],
 ['To collect','අයකර ගත යුතු මුදල','வசூலிக்க வேண்டியது'],['Receive payment','ගෙවීමක් සටහන් කරන්න','கட்டணத்தைப் பதிவு செய்யவும்'],
 ['All caught up. There are no outstanding payments.','සියලු ගෙවීම් ලැබී ඇත. අයවිය යුතු මුදල් නැත.','அனைத்துக் கட்டணங்களும் பெறப்பட்டன. நிலுவைத் தொகைகள் இல்லை.'],
 ['Quantity','ප්‍රමාණය','அளவு'],['Reason','හේතුව','காரணம்'],
 ['Stock changes will appear here as you work.','ඔබ වැඩ කරන විට තොග වෙනස්කම් මෙහි පෙන්වනු ඇත.','நீங்கள் பணிபுரியும்போது இருப்பு மாற்றங்கள் இங்கே தோன்றும்.'],
 ['A clear picture of your business, from real records.','සැබෑ වාර්තා මත ඔබේ ව්‍යාපාරයේ පැහැදිලි තත්ත්වය.','உண்மைப் பதிவுகளிலிருந்து உங்கள் வணிகத்தின் தெளிவான நிலை.'],
 ['Export orders CSV','ඇණවුම් CSV ලෙස ලබාගන්න','ஆர்டர்களை CSV ஆகப் பதிவிறக்கவும்'],
 ['Sales & collections · All time','විකුණුම් හා අයකිරීම් · මුළු කාලය','விற்பனை மற்றும் வசூல் · முழுக் காலம்'],
 ['Order value','ඇණවුම් වටිනාකම','ஆர்டர் மதிப்பு'],['Payments received','ලැබුණු ගෙවීම්','பெறப்பட்ட கட்டணங்கள்'],
 ['Orders placed','තැබූ ඇණවුම්','இடப்பட்ட ஆர்டர்கள்'],['Stock by category','කාණ්ඩය අනුව තොග','வகை வாரியான இருப்பு'],
 ['Close','වසන්න','மூடவும்'],['Cancel','අත්හරින්න','கைவிடவும்'],['Save','සුරකින්න','சேமிக்கவும்'],['Saved successfully','සාර්ථකව සුරකින ලදී','வெற்றிகரமாகச் சேமிக்கப்பட்டது'],
 ['Adjust stock','තොග වෙනස් කරන්න','இருப்பைச் சரிசெய்யவும்'],
 ['Quantity change (+ add, − remove)','ප්‍රමාණ වෙනස (+ එකතු කිරීම, − ඉවත් කිරීම)','அளவு மாற்றம் (+ சேர்க்க, − அகற்ற)'],
 ['e.g. Production batch, damaged goods','උදා: නිෂ්පාදන කාණ්ඩයක්, හානි වූ භාණ්ඩ','எ.கா. உற்பத்தித் தொகுதி, சேதமடைந்த பொருட்கள்'],
 ['Use a negative number to remove stock. Every adjustment is recorded in stock history.','තොග ඉවත් කිරීමට ඍණ අගයක් යොදන්න. සෑම වෙනස්කමක්ම තොග ඉතිහාසයේ සටහන් වේ.','இருப்பை அகற்ற எதிர்மறை எண்ணைப் பயன்படுத்தவும். ஒவ்வொரு மாற்றமும் இருப்பு வரலாற்றில் பதிவாகும்.'],
 ['Add a shop first','පළමුව වෙළඳසැලක් එකතු කරන්න','முதலில் ஒரு கடையைச் சேர்க்கவும்'],['Add a product first','පළමුව නිෂ්පාදනයක් එකතු කරන්න','முதலில் ஒரு பொருளைச் சேர்க்கவும்'],
 ['Add another product','තවත් නිෂ්පාදනයක් එකතු කරන්න','மற்றொரு பொருளைச் சேர்க்கவும்'],
 ['Payment type','ගෙවීම් ක්‍රමය','கட்டண வகை'],['Fully paid','සම්පූර්ණයෙන් ගෙවා ඇත','முழுமையாகச் செலுத்தப்பட்டது'],
 ['Part payment','අර්ධ ගෙවීම','பகுதிக் கட்டணம்'],['Received now (LKR)','දැන් ලැබුණු මුදල (LKR)','இப்போது பெற்ற தொகை (LKR)'],
 ['Notes','සටහන්','குறிப்புகள்'],['Delivery instructions or order notes','බෙදාහැරීමේ උපදෙස් හෝ ඇණවුම් සටහන්','விநியோக வழிமுறைகள் அல்லது ஆர்டர் குறிப்புகள்'],
 ['Saving this order immediately deducts the listed quantities from stock.','මෙම ඇණවුම සුරැකූ විට සඳහන් ප්‍රමාණයන් වහාම තොගයෙන් අඩු වේ.','இந்த ஆர்டரைச் சேமித்ததும் பட்டியலிட்ட அளவுகள் இருப்பிலிருந்து உடனடியாகக் குறையும்.'],
 ['Remove product','නිෂ්පාදනය ඉවත් කරන්න','பொருளை அகற்றவும்'],['Amount received (LKR)','ලැබුණු මුදල (LKR)','பெற்ற தொகை (LKR)'],
 ['Order details','ඇණවුම් විස්තර','ஆர்டர் விவரங்கள்'],['Invoice','ඉන්වොයිසිය','விலைப்பட்டியல்'],['Qty','ප්‍රමාණය','அளவு'],['Unit price','ඒකක මිල','அலகு விலை'],
 ['Print / save PDF','මුද්‍රණය / PDF ලෙස සුරකින්න','அச்சிடு / PDF சேமி'],['Mark delivered','බෙදාහැරීම සටහන් කරන්න','விநியோகிக்கப்பட்டதாகக் குறிக்கவும்'],
 ['Cancel order','ඇණවුම අවලංගු කරන්න','ஆர்டரை ரத்து செய்யவும்'],
 ['Cancel this order and return its items to stock?','මෙම ඇණවුම අවලංගු කර භාණ්ඩ නැවත තොගයට එකතු කරන්නද?','இந்த ஆர்டரை ரத்து செய்து பொருட்களை மீண்டும் இருப்பில் சேர்க்கவா?'],
 ['Product name','නිෂ්පාදන නම','பொருளின் பெயர்'],['Variant','ප්‍රභේදය','வகை'],['Size','ඇසුරුම් ප්‍රමාණය','பொதி அளவு'],
 ['Price LKR','මිල LKR','விலை LKR'],['Stock','තොග','இருப்பு'],['Total LKR','එකතුව LKR','மொத்தம் LKR'],['Paid LKR','ගෙවූ මුදල LKR','செலுத்தியது LKR'],['Outstanding LKR','අයවිය යුතු මුදල LKR','நிலுவை LKR'],
 ['Unable to open your workspace','වැඩ අවකාශය විවෘත කළ නොහැක','பணியிடத்தைத் திறக்க முடியவில்லை'],['Try again','නැවත උත්සාහ කරන්න','மீண்டும் முயலவும்'],
 ['Your private workspace','ඔබේ පෞද්ගලික වැඩ අවකාශය','உங்கள் தனிப்பட்ட பணியிடம்'],['Made with care. Managed with clarity.','සැලකිල්ලෙන් නිපදවා, පැහැදිලිව කළමනාකරණය කරන්න.','அக்கறையுடன் தயாரித்து, தெளிவாக நிர்வகிக்கவும்.'],
 ['A clearer view.','වඩා පැහැදිලි දැක්මක්.','தெளிவான பார்வை.'],['A calmer','වඩා පහසු','அமைதியான'],['working day.','වැඩ දිනයක්.','வேலைநாள்.'],
 ['Your products, your shops, your next delivery.','ඔබේ නිෂ්පාදන, වෙළඳසැල් සහ ඊළඟ බෙදාහැරීම.','உங்கள் பொருட்கள், கடைகள் மற்றும் அடுத்த விநியோகம்.'],
 ['Everything in its place.','සියල්ල නිසි තැනක.','அனைத்தும் அதனதன் இடத்தில்.'],['Built for the business you care about.','ඔබ ආදරය කරන ව්‍යාපාරය වෙනුවෙන්.','நீங்கள் அக்கறை கொள்ளும் வணிகத்திற்காக.'],
 ['Everyday care','දෛනික සත්කාර','அன்றாடப் பராமரிப்பு'],['Homecare','ගෘහ සත්කාර','வீட்டுப் பராமரிப்பு'],['Fabric conditioner','රෙදි මෘදුකාරක','துணி மென்மையாக்கி'],['Soap bar','සබන් කැටය','சோப்புக் கட்டி'],
 ['Make it yours.','ඔබේ වැඩ අවකාශය සකසන්න.','உங்கள் பணியிடத்தை அமைக்கவும்.'],['Welcome back.','නැවත සාදරයෙන් පිළිගනිමු.','மீண்டும் வருக.'],
 ['Create your administrator PIN to protect this factory’s records.','කර්මාන්තශාලා වාර්තා ආරක්ෂා කිරීමට පරිපාලක PIN අංකයක් සාදන්න.','தொழிற்சாலைப் பதிவுகளைப் பாதுகாக்க நிர்வாகி PIN ஒன்றை உருவாக்கவும்.'],
 ['Enter your PIN to open the factory workspace.','වැඩ අවකාශය විවෘත කිරීමට ඔබේ PIN අංකය ඇතුළත් කරන්න.','பணியிடத்தைத் திறக்க உங்கள் PIN ஐ உள்ளிடவும்.'],
 ['Create a PIN','PIN අංකයක් සාදන්න','PIN உருவாக்கவும்'],['Workspace PIN','වැඩ අවකාශයේ PIN අංකය','பணியிட PIN'],['6 to 12 digits','ඉලක්කම් 6 සිට 12 දක්වා','6 முதல் 12 இலக்கங்கள்'],
 ['Confirm your PIN','PIN අංකය තහවුරු කරන්න','PIN ஐ உறுதிப்படுத்தவும்'],['Enter your PIN again','PIN අංකය නැවත ඇතුළත් කරන්න','PIN ஐ மீண்டும் உள்ளிடவும்'],
 ['Show PIN','PIN අංකය පෙන්වන්න','PIN ஐக் காட்டு'],['Create secure workspace','ආරක්ෂිත වැඩ අවකාශය සාදන්න','பாதுகாப்பான பணியிடத்தை உருவாக்கவும்'],['Open workspace','වැඩ අවකාශය විවෘත කරන්න','பணியிடத்தைத் திறக்கவும்'],
 ['Local to this computer · Works offline','මෙම පරිගණකයේ පමණි · අන්තර්ජාලය අවශ්‍ය නැත','இந்தக் கணினியில் மட்டும் · இணையமின்றி இயங்கும்'],
 ['Choose a PIN you can remember. There is no email reset for this offline workspace.','ඔබට මතක තබාගත හැකි PIN අංකයක් තෝරන්න. මෙම වැඩ අවකාශයේ ඊමේල් මගින් PIN නැවත සැකසිය නොහැක.','நினைவில் கொள்ளக்கூடிய PIN ஐத் தேர்ந்தெடுக்கவும். இந்தப் பணியிடத்தில் மின்னஞ்சல் மூலம் PIN மீட்டமைப்பு இல்லை.'],
 ['The workspace locks after 30 minutes of inactivity.','විනාඩි 30ක් භාවිත නොකළ විට වැඩ අවකාශය අගුළු වැටේ.','30 நிமிடங்கள் செயல்பாடின்றி இருந்தால் பணியிடம் பூட்டப்படும்.'],
 ['Factory management · Sri Lanka','කර්මාන්තශාලා කළමනාකරණය · ශ්‍රී ලංකාව','தொழிற்சாலை மேலாண்மை · இலங்கை'],
 ['Your PINs do not match.','PIN අංක දෙක නොගැළපේ.','உங்கள் PIN கள் பொருந்தவில்லை.'],
 ['A workspace that belongs to your business.','ඔබේ ව්‍යාපාරයට ගැළපෙන වැඩ අවකාශයක්.','உங்கள் வணிகத்திற்கான பணியிடம்.'],
 ['01 / IDENTITY','01 / ව්‍යාපාර අනන්‍යතාව','01 / அடையாளம்'],['02 / ACCESS','02 / පිවිසුම','02 / அணுகல்'],['03 / APPEARANCE','03 / පෙනුම','03 / தோற்றம்'],
 ['04 / YOUR RECORDS','04 / ඔබේ වාර්තා','04 / உங்கள் பதிவுகள்'],['05 / ACTIVITY','05 / ක්‍රියාකාරකම්','05 / செயல்பாடு'],['06 / LANGUAGE','06 / භාෂාව','06 / மொழி'],
 ['Add your factory address for invoices.','ඉන්වොයිසි සඳහා කර්මාන්තශාලා ලිපිනය එකතු කරන්න.','விலைப்பட்டியலுக்குத் தொழிற்சாலை முகவரியைச் சேர்க்கவும்.'],
 ['No contact number added.','දුරකථන අංකයක් එකතු කර නැත.','தொடர்பு எண் சேர்க்கப்படவில்லை.'],['Edit factory details','කර්මාන්තශාලා විස්තර වෙනස් කරන්න','தொழிற்சாலை விவரங்களைத் திருத்தவும்'],
 ['Your workspace PIN','ඔබේ වැඩ අවකාශයේ PIN අංකය','உங்கள் பணியிட PIN'],
 ['Change your administrator PIN. Changing it signs out previous sessions. This workspace locks after 30 minutes of inactivity.','පරිපාලක PIN අංකය වෙනස් කරන්න. එය වෙනස් කළ විට පෙර පිවිසුම් අවලංගු වේ. විනාඩි 30ක් භාවිත නොකළ විට වැඩ අවකාශය අගුළු වැටේ.','நிர்வாகி PIN ஐ மாற்றவும். மாற்றும்போது முந்தைய அமர்வுகள் வெளியேற்றப்படும். 30 நிமிடங்கள் செயல்பாடின்றி இருந்தால் பணியிடம் பூட்டப்படும்.'],
 ['Change PIN','PIN අංකය වෙනස් කරන්න','PIN ஐ மாற்றவும்'],['Lock workspace','වැඩ අවකාශය අගුළු දමන්න','பணியிடத்தைப் பூட்டவும்'],
 ['Find your working light','ඔබට ගැළපෙන තේමාව තෝරන්න','உங்களுக்கு ஏற்ற தோற்றத்தைத் தேர்ந்தெடுக்கவும்'],
 ['A bright paper workspace or a quieter charcoal finish. Your choice is remembered on this browser.','ආලෝක හෝ අඳුරු වැඩ අවකාශයක් තෝරන්න. ඔබේ තේරීම මෙම බ්‍රව්සරයේ මතක තබා ගනී.','ஒளி அல்லது இருள் பணியிடத்தைத் தேர்ந்தெடுக்கவும். உங்கள் தேர்வு இந்த உலாவியில் நினைவில் வைக்கப்படும்.'],
 ['Use light theme','ආලෝක තේමාව භාවිත කරන්න','ஒளித் தோற்றத்தைப் பயன்படுத்தவும்'],['Use dark theme','අඳුරු තේමාව භාවිත කරන්න','இருள் தோற்றத்தைப் பயன்படுத்தவும்'],
 ['Keep a safe copy','ආරක්ෂිත පිටපතක් තබාගන්න','பாதுகாப்பான நகலை வைத்திருங்கள்'],
 ['Download a complete SQLite backup, including product photographs and factory settings. Keep a copy on another drive.','නිෂ්පාදන ඡායාරූප හා සැකසුම් ඇතුළත් සම්පූර්ණ SQLite උපස්ථයක් ලබාගන්න. වෙනත් ධාවකයකද පිටපතක් තබන්න.','பொருள் புகைப்படங்கள் மற்றும் அமைப்புகள் அடங்கிய முழு SQLite காப்பை பதிவிறக்கவும். மற்றொரு இயக்ககத்திலும் நகலை வைத்திருங்கள்.'],
 ['Download database backup','දත්ත ගබඩාවේ උපස්ථය ලබාගන්න','தரவுத்தளக் காப்பைப் பதிவிறக்கவும்'],
 ['Daily local snapshots are made before the first stock or order change. Local copies should also be copied off this PC.','දවසේ පළමු තොග හෝ ඇණවුම් වෙනස්කමට පෙර උපස්ථයක් සෑදේ. මෙම පරිගණකයෙන් පිටතද පිටපත් තබාගන්න.','நாளின் முதல் இருப்பு அல்லது ஆர்டர் மாற்றத்திற்கு முன் காப்பு உருவாகும். இந்தக் கணினிக்கு வெளியிலும் நகல்களை வைத்திருங்கள்.'],
 ['A clear trail','පැහැදිලි ක්‍රියාකාරකම් වාර්තාවක්','தெளிவான செயல்பாட்டுப் பதிவு'],
 ['Review recent sign-ins and changes to factory settings, products, shops, stock, orders and collections.','මෑත පිවිසුම් සහ සැකසුම්, නිෂ්පාදන, වෙළඳසැල්, තොග, ඇණවුම් හා අයකිරීම්වල වෙනස්කම් බලන්න.','சமீபத்திய உள்நுழைவுகளையும் அமைப்புகள், பொருட்கள், கடைகள், இருப்பு, ஆர்டர்கள், வசூல்களின் மாற்றங்களையும் பார்க்கவும்.'],
 ['View recent activity','මෑත ක්‍රියාකාරකම් බලන්න','சமீபத்திய செயல்பாடுகளைப் பார்க்கவும்'],['Choose your language','ඔබේ භාෂාව තෝරන්න','உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்'],
 ['English, Sinhala and Tamil are available throughout the workspace. Product names and shop details stay as entered.','වැඩ අවකාශය පුරා ඉංග්‍රීසි, සිංහල හා දෙමළ භාවිත කළ හැක. නිෂ්පාදන නම් හා වෙළඳසැල් විස්තර ඇතුළත් කළ ආකාරයෙන්ම පවතී.','பணியிடம் முழுவதும் ஆங்கிலம், சிங்களம் மற்றும் தமிழ் கிடைக்கின்றன. பொருள் பெயர்களும் கடை விவரங்களும் உள்ளிடப்பட்டபடியே இருக்கும்.'],
 ['SQLite · Local database','SQLite · දේශීය දත්ත ගබඩාව','SQLite · உள்ளூர் தரவுத்தளம்'],
 ['Factory details','කර්මාන්තශාලා විස්තර','தொழிற்சாலை விவரங்கள்'],['Factory / company name','කර්මාන්තශාලාවේ / සමාගමේ නම','தொழிற்சாலை / நிறுவனப் பெயர்'],
 ['Address','ලිපිනය','முகவரி'],['Contact number','දුරකථන අංකය','தொடர்பு எண்'],
 ['Used on the login screen, workspace and printed invoices.','පිවිසුම් තිරයේ, වැඩ අවකාශයේ හා මුද්‍රිත ඉන්වොයිසිවල භාවිත වේ.','உள்நுழைவுத் திரை, பணியிடம் மற்றும் அச்சிடப்பட்ட விலைப்பட்டியல்களில் பயன்படுத்தப்படும்.'],
 ['Change workspace PIN','වැඩ අවකාශයේ PIN අංකය වෙනස් කරන්න','பணியிட PIN ஐ மாற்றவும்'],
 ['Current PIN','වත්මන් PIN අංකය','தற்போதைய PIN'],['New PIN','නව PIN අංකය','புதிய PIN'],['Confirm new PIN','නව PIN අංකය තහවුරු කරන්න','புதிய PIN ஐ உறுதிப்படுத்தவும்'],
 ['Use 6 to 12 digits. Keep your PIN somewhere safe; there is no email reset.','ඉලක්කම් 6 සිට 12 දක්වා භාවිත කරන්න. PIN අංකය ආරක්ෂිතව තබාගන්න; ඊමේල් මගින් නැවත සැකසිය නොහැක.','6 முதல் 12 இலக்கங்களைப் பயன்படுத்தவும். PIN ஐப் பாதுகாப்பாக வைத்திருங்கள்; மின்னஞ்சல் மீட்டமைப்பு இல்லை.'],
 ['Your new PINs do not match.','නව PIN අංක දෙක නොගැළපේ.','உங்கள் புதிய PIN கள் பொருந்தவில்லை.'],
 ['Recent workspace activity','වැඩ අවකාශයේ මෑත ක්‍රියාකාරකම්','சமீபத்திய பணியிடச் செயல்பாடு'],['Activity','ක්‍රියාකාරකම','செயல்பாடு'],
 ['Edit product','නිෂ්පාදනය සංස්කරණය කරන්න','பொருளைத் திருத்தவும்'],['Product photograph','නිෂ්පාදන ඡායාරූපය','பொருள் புகைப்படம்'],
 ['Choose photograph','ඡායාරූපයක් තෝරන්න','புகைப்படத்தைத் தேர்ந்தெடுக்கவும்'],['PNG, JPEG or WebP. Up to 4 MB.','PNG, JPEG හෝ WebP. උපරිම 4 MB.','PNG, JPEG அல்லது WebP. அதிகபட்சம் 4 MB.'],
 ['Remove photo','ඡායාරූපය ඉවත් කරන්න','புகைப்படத்தை அகற்றவும்'],['Fragrance / variant','සුවඳ / ප්‍රභේදය','மணம் / வகை'],['Pack size','ඇසුරුම් ප්‍රමාණය','பொதி அளவு'],
 ['Selling price (LKR)','විකුණුම් මිල (LKR)','விற்பனை விலை (LKR)'],['Low stock threshold','අවම තොග සීමාව','குறைந்த இருப்பு வரம்பு'],['Opening stock (units)','ආරම්භක තොග (ඒකක)','தொடக்க இருப்பு (அலகுகள்)'],
 ['Selected product photograph','තෝරාගත් නිෂ්පාදන ඡායාරූපය','தேர்ந்தெடுத்த பொருள் புகைப்படம்'],
 ['Choose a PNG, JPEG or WebP image under 4 MB.','4 MB ට අඩු PNG, JPEG හෝ WebP ඡායාරූපයක් තෝරන්න.','4 MB க்குக் குறைவான PNG, JPEG அல்லது WebP படத்தைத் தேர்ந்தெடுக்கவும்.'],
 ['Unable to read this image','මෙම ඡායාරූපය කියවිය නොහැක','இந்தப் படத்தைப் படிக்க முடியவில்லை'],
 ['Edit shop','වෙළඳසැල සංස්කරණය කරන්න','கடையைத் திருத்தவும்'],['Shop name','වෙළඳසැලේ නම','கடையின் பெயர்'],['Town / delivery area','නගරය / බෙදාහැරීම් ප්‍රදේශය','நகரம் / விநியோகப் பகுதி'],
 ['Opening stock','ආරම්භක තොග','தொடக்க இருப்பு'],
 ['Product saved','නිෂ්පාදනය සුරකින ලදී','பொருள் சேமிக்கப்பட்டது'],['Stock adjusted','තොග වෙනස් කරන ලදී','இருப்பு சரிசெய்யப்பட்டது'],['Shop saved','වෙළඳසැල සුරකින ලදී','கடை சேமிக்கப்பட்டது'],
 ['Order placed','ඇණවුම තබන ලදී','ஆர்டர் இடப்பட்டது'],['Payment received','ගෙවීම ලැබුණි','கட்டணம் பெறப்பட்டது'],['Order status changed','ඇණවුම් තත්ත්වය වෙනස් විය','ஆர்டர் நிலை மாற்றப்பட்டது'],['Workspace updated','වැඩ අවකාශය යාවත්කාලීන විය','பணியிடம் புதுப்பிக்கப்பட்டது'],
 ['Workspace PIN created','වැඩ අවකාශයේ PIN අංකය සෑදිණි','பணியிட PIN உருவாக்கப்பட்டது'],['Administrator signed in','පරිපාලක පිවිසුණි','நிர்வாகி உள்நுழைந்தார்'],
 ['Unsuccessful PIN attempt','අසාර්ථක PIN උත්සාහයක්','தோல்வியடைந்த PIN முயற்சி'],['Workspace PIN changed; previous sessions revoked','PIN අංකය වෙනස් විය; පෙර පිවිසුම් අවලංගු විය','PIN மாற்றப்பட்டது; முந்தைய அமர்வுகள் நீக்கப்பட்டன'],
 ['Factory details updated','කර්මාන්තශාලා විස්තර යාවත්කාලීන විය','தொழிற்சாலை விவரங்கள் புதுப்பிக்கப்பட்டன'],['Database backup downloaded','දත්ත ගබඩා උපස්ථය ලබාගන්නා ලදී','தரவுத்தளக் காப்பு பதிவிறக்கப்பட்டது'],
 ['Use a PIN with 6 to 12 digits.','ඉලක්කම් 6 සිට 12 දක්වා ඇති PIN අංකයක් භාවිත කරන්න.','6 முதல் 12 இலக்கங்கள் கொண்ட PIN ஐப் பயன்படுத்தவும்.'],
 ['Set up your workspace PIN first.','පළමුව වැඩ අවකාශයේ PIN අංකය සකසන්න.','முதலில் பணியிட PIN ஐ அமைக்கவும்.'],
 ['Too many attempts. Please wait 5 minutes before trying again.','උත්සාහ ගණන වැඩියි. නැවත උත්සාහ කිරීමට විනාඩි 5ක් රැඳී සිටින්න.','அதிக முயற்சிகள். மீண்டும் முயல 5 நிமிடங்கள் காத்திருக்கவும்.'],
 ['Incorrect PIN. Please try again.','PIN අංකය වැරදියි. නැවත උත්සාහ කරන්න.','தவறான PIN. மீண்டும் முயலவும்.'],
 ['A PIN is already configured.','PIN අංකයක් දැනටමත් සකසා ඇත.','PIN ஏற்கனவே அமைக்கப்பட்டுள்ளது.'],
 ['Please sign in to continue.','ඉදිරියට යාමට කරුණාකර පිවිසෙන්න.','தொடர உள்நுழையவும்.'],
 ['Enter a factory name (up to 100 characters)','කර්මාන්තශාලා නම ඇතුළත් කරන්න (අකුරු 100 දක්වා)','தொழிற்சாலைப் பெயரை உள்ளிடவும் (100 எழுத்துகள் வரை)'],
 ['Enter valid contact details','වලංගු සම්බන්ධතා විස්තර ඇතුළත් කරන්න','சரியான தொடர்பு விவரங்களை உள்ளிடவும்'],
 ['Select an image','ඡායාරූපයක් තෝරන්න','படத்தைத் தேர்ந்தெடுக்கவும்'],['Choose a PNG, JPEG or WebP image','PNG, JPEG හෝ WebP ඡායාරූපයක් තෝරන්න','PNG, JPEG அல்லது WebP படத்தைத் தேர்ந்தெடுக்கவும்'],
 ['Image must be under 4 MB','ඡායාරූපය 4 MB ට අඩු විය යුතුය','படம் 4 MB க்குக் குறைவாக இருக்க வேண்டும்'],['The image file format is invalid','ඡායාරූප ගොනු ආකෘතිය වලංගු නැත','படக் கோப்பு வடிவம் தவறானது'],
 ['Product name, variant and category are required','නිෂ්පාදන නම, ප්‍රභේදය හා කාණ්ඩය අවශ්‍යයි','பொருளின் பெயர், வகை மற்றும் பிரிவு தேவை'],
 ['Enter valid prices and whole stock quantities','වලංගු මිල හා පූර්ණ සංඛ්‍යා තොග ප්‍රමාණ ඇතුළත් කරන්න','சரியான விலைகளையும் முழு எண் இருப்பு அளவுகளையும் உள்ளிடவும்'],
 ['Upload a valid product image','වලංගු නිෂ්පාදන ඡායාරූපයක් එකතු කරන්න','சரியான பொருள் படத்தைப் பதிவேற்றவும்'],['Product not found','නිෂ්පාදනය හමු නොවීය','பொருள் கிடைக்கவில்லை'],
 ['Enter a valid quantity; stock cannot be negative','වලංගු ප්‍රමාණයක් ඇතුළත් කරන්න; තොග ඍණ විය නොහැක','சரியான அளவை உள்ளிடவும்; இருப்பு எதிர்மறையாக இருக்க முடியாது'],
 ['A reason is required','හේතුවක් අවශ්‍යයි','காரணம் தேவை'],['Shop name is required','වෙළඳසැලේ නම අවශ්‍යයි','கடையின் பெயர் தேவை'],['Shop not found','වෙළඳසැල හමු නොවීය','கடை கிடைக்கவில்லை'],
 ['Choose a shop','වෙළඳසැලක් තෝරන්න','கடையைத் தேர்ந்தெடுக்கவும்'],['Add at least one product','අවම වශයෙන් නිෂ්පාදනයක් එක් කරන්න','குறைந்தது ஒரு பொருளைச் சேர்க்கவும்'],
 ['Enter a valid quantity','වලංගු ප්‍රමාණයක් ඇතුළත් කරන්න','சரியான அளவை உள்ளிடவும்'],['Insufficient stock','ප්‍රමාණවත් තොග නැත','போதுமான இருப்பு இல்லை'],
 ['Payment must be between zero and the order total','ගෙවීම ශුන්‍යය හා ඇණවුම් එකතුව අතර විය යුතුය','கட்டணம் பூஜ்ஜியத்திற்கும் ஆர்டர் மொத்தத்திற்கும் இடையில் இருக்க வேண்டும்'],
 ['Order not available','ඇණවුම ලබාගත නොහැක','ஆர்டர் கிடைக்கவில்லை'],['Enter a payment within the outstanding balance','අයවිය යුතු ඉතිරි මුදලට නොවැඩි ගෙවීමක් ඇතුළත් කරන්න','நிலுவைத் தொகைக்குள் ஒரு கட்டணத்தை உள்ளிடவும்'],
 ['Only placed orders can be updated','තැබූ ඇණවුම් පමණක් යාවත්කාලීන කළ හැක','இடப்பட்ட ஆர்டர்களை மட்டுமே புதுப்பிக்க முடியும்'],['Invalid status','වලංගු නැති තත්ත්වයකි','தவறான நிலை'],
 ['Only unpaid orders can be cancelled. Resolve any collected payment first.','නොගෙවූ ඇණවුම් පමණක් අවලංගු කළ හැක. පළමුව ලැබුණු ගෙවීම් නිරවුල් කරන්න.','செலுத்தப்படாத ஆர்டர்களை மட்டுமே ரத்து செய்யலாம். முதலில் பெறப்பட்ட கட்டணங்களைத் தீர்க்கவும்.'],
 ['Delivered orders cannot be cancelled','බෙදාහැරූ ඇණවුම් අවලංගු කළ නොහැක','விநியோகிக்கப்பட்ட ஆர்டர்களை ரத்து செய்ய முடியாது'],
 ['Please fill in this field.','මෙම ක්ෂේත්‍රය පුරවන්න.','இந்தப் புலத்தை நிரப்பவும்.'],
 ['Please enter a valid value.','වලංගු අගයක් ඇතුළත් කරන්න.','சரியான மதிப்பை உள்ளிடவும்.'],
 ['Please enter a whole number.','පූර්ණ සංඛ්‍යාවක් ඇතුළත් කරන්න.','முழு எண்ணை உள்ளிடவும்.'],
 ['The value is outside the allowed range.','අගය අවසර දී ඇති පරාසයෙන් පිටතය.','மதிப்பு அனுமதிக்கப்பட்ட வரம்பிற்கு வெளியே உள்ளது.'],
 ['Unable to connect. Please check that the system is running.','සම්බන්ධ විය නොහැක. පද්ධතිය ක්‍රියාත්මකදැයි බලන්න.','இணைக்க முடியவில்லை. அமைப்பு இயங்குகிறதா எனச் சரிபார்க்கவும்.'],
 ['Request too large','ඉල්ලීම විශාල වැඩියි','கோரிக்கை மிகப் பெரியது'],['File or request is too large','ගොනුව හෝ ඉල්ලීම විශාල වැඩියි','கோப்பு அல்லது கோரிக்கை மிகப் பெரியது'],
 ['Image not found','ඡායාරූපය හමු නොවීය','படம் கிடைக்கவில்லை'],['Payment exceeds order total','ගෙවීම ඇණවුම් එකතුව ඉක්මවයි','கட்டணம் ஆர்டர் மொத்தத்தை மீறுகிறது'],
 ['Cannot pay a cancelled order','අවලංගු ඇණවුමකට ගෙවිය නොහැක','ரத்து செய்யப்பட்ட ஆர்டருக்கு கட்டணம் செலுத்த முடியாது'],
 ['Payment records cannot be removed','ගෙවීම් වාර්තා ඉවත් කළ නොහැක','கட்டணப் பதிவுகளை அகற்ற முடியாது'],
 ['Sign in','පිවිසෙන්න','உள்நுழையவும்'],['Set up workspace','වැඩ අවකාශය සකසන්න','பணியிடத்தை அமைக்கவும்'],
 ['Something went wrong. Please try again.','දෝෂයක් ඇති විය. කරුණාකර නැවත උත්සාහ කරන්න.','பிழை ஏற்பட்டது. மீண்டும் முயலவும்.'],
 ['Unknown shop','හඳුනා නොගත් වෙළඳසැල','அறியப்படாத கடை']
];

export const messages=[...coreMessages,...businessMessages.filter(row=>!coreMessages.some(core=>core[0].toLowerCase()===row[0].toLowerCase()))];
const normalize=s=>String(s).replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
const lookup=new Map(messages.map(row=>[normalize(row[0]).toLowerCase(),row]));
export const localeFor=lang=>({en:'en-LK',si:'si-LK',ta:'ta-LK'}[lang]||'en-LK');
const months={si:['ජනවාරි','පෙබරවාරි','මාර්තු','අප්‍රේල්','මැයි','ජූනි','ජූලි','අගෝස්තු','සැප්තැම්බර්','ඔක්තෝබර්','නොවැම්බර්','දෙසැම්බර්'],ta:['ஜனவரி','பிப்ரவரி','மார்ச்','ஏப்ரல்','மே','ஜூன்','ஜூலை','ஆகஸ்ட்','செப்டம்பர்','அக்டோபர்','நவம்பர்','டிசம்பர்']};
const weekdays={si:['ඉරිදා','සඳුදා','අඟහරුවාදා','බදාදා','බ්‍රහස්පතින්දා','සිකුරාදා','සෙනසුරාදා'],ta:['ஞாயிறு','திங்கள்','செவ்வாய்','புதன்','வியாழன்','வெள்ளி','சனி']};
const shortWeekdays={si:['ඉරි','සඳු','අඟ','බදා','බ්‍රහ','සිකු','සෙන'],ta:['ஞாயி','திங்','செவ்','புத','வியா','வெள்','சனி']};
const dayNames=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
function dateParts(value){return Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Colombo',weekday:'long',day:'2-digit',month:'numeric',year:'numeric'}).formatToParts(new Date(value)).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]))}
export function formatDate(value,lang='en',full=false){
 if(lang==='en')return new Date(value).toLocaleDateString('en-GB',{timeZone:'Asia/Colombo',day:full?'numeric':'2-digit',month:full?'long':'short',year:'numeric',...(full?{weekday:'long'}:{})});
 const p=dateParts(value),month=months[lang]?.[Number(p.month)-1]||p.month,day=weekdays[lang]?.[dayNames.indexOf(p.weekday)]||p.weekday;
 return `${p.day} ${month} ${p.year}${full?' · '+day:''}`;
}
export function formatWeekday(value,lang='en'){if(lang==='en')return new Date(value).toLocaleDateString('en-GB',{timeZone:'Asia/Colombo',weekday:'short'});return shortWeekdays[lang]?.[dayNames.indexOf(dateParts(value).weekday)]||''}
export function translate(value,lang='en'){
 if(typeof value!=='string'||lang==='en')return value;
 const s=normalize(value),row=lookup.get(s.toLowerCase());if(row)return row[lang==='si'?1:2];
 const decorated=s.match(/^([＋+]\s*)?(.+?)(\s*[→])?$/);
 if(decorated&&(decorated[1]||decorated[3])){const base=lookup.get(decorated[2].toLowerCase());if(base)return (decorated[1]||'')+base[lang==='si'?1:2]+(decorated[3]||'')}
 const patterns=[
  [/^(\d+) product variants$/,n=>lang==='si'?`නිෂ්පාදන ප්‍රභේද ${n}`:`${n} பொருள் வகைகள்`],
  [/^(\d+) orders to collect$/,n=>lang==='si'?`අයකිරීමට ඇති ඇණවුම් ${n}`:`வசூலிக்க வேண்டிய ஆர்டர்கள் ${n}`],
  [/^(\d+) low$/,n=>lang==='si'?`අඩු තොග ${n}`:`${n} குறைந்த இருப்பு`],
  [/^(\d+) units$/,n=>lang==='si'?`ඒකක ${n}`:`${n} அலகுகள்`],
  [/^Invoice (LM-\d+)$/,n=>translate('Invoice',lang)+' '+n],
  [/^Order (LM-\d+)$/,n=>translate('Order',lang)+' '+n],
  [/^Cancelled (LM-\d+)$/,n=>translate('Cancelled',lang)+' '+n],
  [/^Return (LM-\d+)$/,n=>translate('Return credit',lang)+' '+n],
  [/^Correction (LM-\d+)$/,n=>translate('Order correction',lang)+' '+n],
  [/^CSV row has the wrong number of columns: (\d+)$/,n=>translate('CSV row has the wrong number of columns',lang)+': '+n],
  [/^(Missing value|Invalid number|Missing or invalid value): (\w+)$/,(prefix,key)=>translate(prefix,lang)+': '+translate(({sku:'Code',name:'Product name',variant:'Variant',size:'Size',category:'Category',price:'Price',stock:'Stock',minimum:'Low stock threshold',code:'Shop code',area:'Area',phone:'Phone',shop_code:'Shop code',reference:'Reference',amount:'Amount',date:'Date'})[key]||key,lang)],
  [/^Order (delivered|cancelled)$/,n=>translate(n==='delivered'?'Delivered':'Cancelled',lang)],
  [/^Total (LKR .+)$/,n=>translate('Total',lang)+' '+n],
  [/^Outstanding:$/,()=>translate('Outstanding',lang)+':'],
  [/^Product\s+photograph$/,()=>translate('Product photograph',lang)]
 ];
 for(const [pattern,format] of patterns){const match=s.match(pattern);if(match)return format(...match.slice(1))}
 return value;
}

export function localize(root,lang){
 if(!root)return;
 const doc=root.ownerDocument||root;
 const walker=doc.createTreeWalker(root,4);let node;
 while((node=walker.nextNode())){
  if(node.parentElement?.closest('[translate="no"],script,style,textarea'))continue;
  const original=node.nodeValue,translated=translate(original,lang);
  if(translated!==original)node.nodeValue=(original.match(/^\s*/)?.[0]||'')+translated+(original.match(/\s*$/)?.[0]||'');
 }
 for(const el of root.querySelectorAll('[placeholder],[aria-label],[title],img[alt]')){
  if(el.closest('[translate="no"]'))continue;
  for(const attribute of ['placeholder','aria-label','title','alt'])if(el.hasAttribute(attribute))el.setAttribute(attribute,translate(el.getAttribute(attribute),lang));
 }
}
