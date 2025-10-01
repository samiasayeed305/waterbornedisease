// === SAFE INITIALIZATION ===
(function () {
    console.log('🚀 Page loading safely...');

    // Prevent rapid reloads
    const lastLoadTime = sessionStorage.getItem('lastPageLoad');
    const currentTime = Date.now();
    if (lastLoadTime && currentTime - parseInt(lastLoadTime) < 1000) {
        console.warn('🔄 Rapid reload detected');
        sessionStorage.clear();
    }
    sessionStorage.setItem('lastPageLoad', currentTime.toString());
})();

// Global state
let isDarkMode = false;
let currentLanguage = 'en';
let currentRole = '';

const translations = {
    en: {
        headerTitle: "SAMAJ HEALTH SURAKSHA",
        headerSubtitle: "Northeast India Health Initiative",
        title: "SAMAJ HEALTH SURAKSHA Monitoring System",
        subtitle: "Early Warning System for Water-Borne Diseases in Rural Northeast India",
        tagline: "Protecting Communities • Preventing Disease • Promoting Health",
        chooseRole: "Choose Your Role",
        roleDescription: "Select your role to access the appropriate dashboard and tools",
        asha: "ASHA Worker",
        volunteer: "Community Volunteer",
        admin: "Health Administrator",
        patient: "Patient",
        featuresTitle: "System Features",
        featuresDescription: "Comprehensive tools for community health monitoring and disease prevention",
        feature1_title: "Water Quality Monitoring",
        feature1_desc: "Real-time tracking and reporting of water source safety across communities",
        feature2_title: "Early Warning System",
        feature2_desc: "Automated alerts for disease outbreaks and contamination events",
        feature3_title: "Community Engagement",
        feature3_desc: "Tools for awareness campaigns and community feedback collection",
        feature4_title: "Data Analytics",
        feature4_desc: "Comprehensive health data analysis and trend identification",
        feature5_title: "Mobile Accessibility",
        feature5_desc: "Responsive design for access on any device, anywhere",
        feature6_title: "Multi-language Support",
        feature6_desc: "Available in local languages for better community reach",

        asha_desc: "Access health monitoring tools, community data, and coordinate with volunteers for disease prevention and health awareness.",
        asha_item1: "Health Data Management",
        asha_item2: "Community Coordination",
        asha_item3: "Emergency Response",
        asha_item4: "Training Resources",
        asha_button: "Login as ASHA Worker",

        volunteer_desc: "Report water sources, conduct awareness campaigns, collect community feedback, and communicate with ASHA workers.",
        volunteer_item1: "Water Source Reporting",
        volunteer_item2: "Awareness Campaigns",
        volunteer_item3: "Community Feedback",
        volunteer_item4: "Direct Communication",
        volunteer_button: "Login as Volunteer",

        admin_desc: "Monitor district-wide health data, manage resources, coordinate responses, and oversee system operations.",
        admin_item1: "District-wide Analytics",
        admin_item2: "Resource Management",
        admin_item3: "Policy Implementation",
        admin_item4: "System Administration",
        admin_button: "Login as Administrator",

        patient_desc: "Access your health records, report symptoms, view test results, and communicate with healthcare providers.",
        patient_item1: "Health Record Access",
        patient_item2: "Symptom Reporting",
        patient_item3: "Test Results",
        patient_item4: "Provider Communication",
        patient_button: "Login as Patient",

        login_title: "Login as {role}",
        user_id_label: "User ID / Email",
        user_id_placeholder: "Enter your user ID or email",
        password_label: "Password",
        password_placeholder: "Enter your password",
        remember_me: "Remember me",
        forgot_password: "Forgot password?",
        login_button: "Login to Dashboard",
        no_account: "Don't have an account? ",
        request_access: "Request Access",
        security_note: "For security, all access is managed by your district health administrator. Contact your supervisor for login credentials."
    },
    as: {
        headerTitle: "সমাজ স্বাস্থ্য সুৰক্ষা",
        headerSubtitle: "উত্তৰ-পূৰ্ব ভাৰত স্বাস্থ্য উদ্যোগ",
        title: "সমাজ স্বাস্থ্য সুৰক্ষা নিৰীক্ষণ ব্যৱস্থা",
        subtitle: "গ্ৰাম্য উত্তৰ-পূৰ্ব ভাৰতত পানীবাহিত ৰোগৰ বাবে আগতীয়া সতৰ্কবাণী ব্যৱস্থা",
        tagline: "সম্প্ৰদায় সুৰক্ষা • ৰোগ প্ৰতিৰোধ • স্বাস্থ্য প্ৰসাৰ",
        chooseRole: "আপোনাৰ ভূমিকা বাছনি কৰক",
        roleDescription: "উপযুক্ত ডেছবৰ্ড আৰু সঁজুলি ব্যৱহাৰ কৰিবলৈ আপোনাৰ ভূমিকা নিৰ্বাচন কৰক",
        asha: "আশা কৰ্মী",
        volunteer: "সম্প্ৰদায়িক স্বেচ্ছাসেৱক",
        admin: "স্বাস্থ্য প্ৰশাসক",
        patient: "ৰোগী",
        featuresTitle: "চিস্টেমৰ বৈশিষ্ট্যসমূহ",
        featuresDescription: "সামূহিক স্বাস্থ্য নিৰীক্ষণ আৰু ৰোগ প্ৰতিৰোধৰ বাবে ব্যাপক সঁজুলি",
        feature1_title: "পানীৰ গুণগত মান নিৰীক্ষণ",
        feature1_desc: "সমুদায়সমূহত পানীৰ উৎসৰ সুৰক্ষাৰ বাস্তৱ-সময়ত ট্ৰেকিং আৰু প্ৰতিবেদন",
        feature2_title: "আগতীয়া সতৰ্কবাণী ব্যৱস্থা",
        feature2_desc: "ৰোগৰ সংক্ৰমণ আৰু সংক্ৰমণৰ ঘটনাৰ বাবে স্বয়ংক্ৰিয় সতৰ্কবাণী",
        feature3_title: "সামূহিক অংশগ্ৰহণ",
        feature3_desc: "সজাগতা অভিযান আৰু সামূহিক মতামত সংগ্ৰহৰ বাবে সঁজুলি",
        feature4_title: "তথ্য বিশ্লেষণ",
        feature4_desc: "ব্যাপক স্বাস্থ্য তথ্য বিশ্লেষণ আৰু প্ৰভৱতা চিনাক্তকৰণ",
        feature5_title: "মোবাইলত উপলব্ধতা",
        feature5_desc: "যিকোনো ডিভাইচত, যিকোনো ঠাইতে ব্যৱহাৰৰ বাবে দায়বদ্ধ ডিজাইন",
        feature6_title: "বহুভাষিক সমৰ্থন",
        feature6_desc: "উন্নত সামূহিক প্ৰসাৰৰ বাবে স্থানীয় ভাষাত উপলব্ধ",

        asha_desc: "স্বাস্থ্য নিৰীক্ষণ সঁজুলি, সম্প্ৰদায়ৰ তথ্য ব্যৱহাৰ কৰক, আৰু ৰোগ প্ৰতিৰোধ আৰু স্বাস্থ্য সজাগতাৰ বাবে স্বেচ্ছাসেৱকৰ সৈতে সমন্বয় কৰক।",
        asha_item1: "স্বাস্থ্য তথ্য ব্যৱস্থাপনা",
        asha_item2: "সম্প্ৰদায় সমন্বয়",
        asha_item3: "জৰুৰীকালীন সঁহাৰি",
        asha_item4: "প্ৰশিক্ষণ সম্পদ",
        asha_button: "আশা কৰ্মী হিচাপে লগইন কৰক",

        volunteer_desc: "পানীৰ উৎসৰ প্ৰতিবেদন দিয়ক, সজাগতা অভিযান চলাওক, সম্প্ৰদায়ৰ মতামত সংগ্ৰহ কৰক, আৰু আশা কৰ্মীৰ সৈতে যোগাযোগ কৰক।",
        volunteer_item1: "পানীৰ উৎসৰ প্ৰতিবেদন",
        volunteer_item2: "সজাগতা অভিযান",
        volunteer_item3: "সম্প্ৰদায়ৰ মতামত",
        volunteer_item4: "পোনপটীয়া যোগাযোগ",
        volunteer_button: "স্বেচ্ছাসেৱক হিচাপে লগইন কৰক",

        admin_desc: "জিলাব্যাপী স্বাস্থ্য তথ্য নিৰীক্ষণ কৰক, সম্পদ ব্যৱস্থাপনা কৰক, সঁহাৰি সমন্বয় কৰক, আৰু চিস্টেমৰ কাৰ্য্যকলাপ নিৰীক্ষণ কৰক।",
        admin_item1: "জিলাব্যাপী বিশ্লেষণ",
        admin_item2: "সম্পদ ব্যৱস্থাপনা",
        admin_item3: "নীতি ৰূপায়ণ",
        admin_item4: "চিস্টেম প্ৰশাসন",
        admin_button: "প্ৰশাসক হিচাপে লগইন কৰক",

        patient_desc: "আপোনাৰ স্বাস্থ্য ৰেকৰ্ড চাওক, লক্ষণসমূহ জনাওক, পৰীক্ষাৰ ফলাফল চাওক, আৰু স্বাস্থ্যসেৱা প্ৰদানকাৰীৰ সৈতে যোগাযোগ কৰক।",
        patient_item1: "স্বাস্থ্য ৰেকৰ্ড ব্যৱহাৰ",
        patient_item2: "লক্ষণ জনোৱা",
        patient_item3: "পৰীক্ষাৰ ফলাফল",
        patient_item4: "প্ৰদানকাৰীৰ সৈতে যোগাযোগ",
        patient_button: "ৰোগী হিচাপে লগইন কৰক",

        login_title: "{role} হিচাপে লগইন কৰক",
        user_id_label: "ব্যৱহাৰকাৰী ID / ইমেইল",
        user_id_placeholder: "আপোনাৰ ব্যৱহাৰকাৰী ID বা ইমেইল সুমুৱাওক",
        password_label: "পাছৱৰ্ড",
        password_placeholder: "আপোনাৰ পাছৱৰ্ড সুমুৱাওক",
        remember_me: "মোক মনত ৰাখক",
        forgot_password: "পাছৱৰ্ড পাহৰিলে?",
        login_button: "ডেশ্ববৰ্ডত লগইন কৰক",
        no_account: "একাউণ্ট নাই? ",
        request_access: "প্ৰৱেশৰ বাবে অনুৰোধ কৰক",
        security_note: "সুৰক্ষাৰ বাবে, সকলো প্ৰৱেশ আপোনাৰ জিলাৰ স্বাস্থ্য প্ৰশাসকৰ দ্বাৰা পৰিচালিত হয়। লগইন কৰ্ডেনচিয়েলবোৰৰ বাবে আপোনাৰ উপৰিদৰ্শকৰ সৈতে যোগাযোগ কৰক।"
    },
    bn: {
        headerTitle: "সমাজ স্বাস্থ্য সুরক্ষা",
        headerSubtitle: "উত্তর-পূর্ব ভারত স্বাস্থ্য উদ্যোগ",
        title: "সমাজ স্বাস্থ্য সুরক্ষা পর্যবেক্ষণ সিস্টেম",
        subtitle: "গ্রামীণ উত্তর-পূর্ব ভারতে পানিবাহিত রোগের জন্য প্রাথমিক সতর্কতা সিস্টেম",
        tagline: "সম্প্রদায় সুরক্ষা • রোগ প্রতিরোধ • স্বাস্থ্য প্রচার",
        chooseRole: "আপনার ভূমিকা নির্বাচন করুন",
        roleDescription: "উপযুক্ত ড্যাশবোর্ড এবং সরঞ্জাম অ্যাক্সেস করতে আপনার ভূমিকা নির্বাচন করুন",
        asha: "আশা কর্মী",
        volunteer: "কমিউনিটি স্বেচ্ছাসেবক",
        admin: "স্বাস্থ্য প্রশাসক",
        patient: "রোগী",
        featuresTitle: "সিস্টেমের বৈশিষ্ট্য",
        featuresDescription: "সম্প্রদায়ের স্বাস্থ্য পর্যবেক্ষণ এবং রোগ প্রতিরোধের জন্য ব্যাপক সরঞ্জাম",
        feature1_title: "জলের গুণমান পর্যবেক্ষণ",
        feature1_desc: "সম্প্রদায় জুড়ে জলের উৎসের নিরাপত্তার রিয়েল-টাইম ট্র্যাকিং এবং রিপোর্টিং",
        feature2_title: "প্রাথমিক সতর্কতা সিস্টেম",
        feature2_desc: "রোগের প্রাদুর্ভাব এবং দূষণের ঘটনার জন্য স্বয়ংক্রিয় সতর্কতা",
        feature3_title: "সম্প্রদায়ের অংশগ্রহণ",
        feature3_desc: "সচেতনতা অভিযান এবং সম্প্রদায়ের প্রতিক্রিয়া সংগ্রহের জন্য সরঞ্জাম",
        feature4_title: "ডেটা অ্যানালিটিক্স",
        feature4_desc: "ব্যাপক স্বাস্থ্য তথ্য বিশ্লেষণ এবং প্রবণতা সনাক্তকরণ",
        feature5_title: "মোবাইল অ্যাক্সেসিবিলিটি",
        feature5_desc: "যেকোনো ডিভাইসে, যেকোনো জায়গায় অ্যাক্সেসের জন্য প্রতিক্রিয়াশীল ডিজাইন",
        feature6_title: "বহু-ভাষা সমর্থন",
        feature6_desc: "উন্নত সম্প্রদায়ের কাছে পৌঁছানোর জন্য স্থানীয় ভাষায় উপলব্ধ",

        asha_desc: "স্বাস্থ্য পর্যবেক্ষণের সরঞ্জাম, কমিউনিটি ডেটা অ্যাক্সেস করুন এবং রোগ প্রতিরোধ ও স্বাস্থ্য সচেতনতার জন্য স্বেচ্ছাসেবকদের সাথে সমন্বয় করুন।",
        asha_item1: "স্বাস্থ্য ডেটা ম্যানেজমেন্ট",
        asha_item2: "কমিউনিটি সমন্বয়",
        asha_item3: "জরুরী প্রতিক্রিয়া",
        asha_item4: "প্রশিক্ষণ সম্পদ",
        asha_button: "আশা কর্মী হিসাবে লগইন করুন",

        volunteer_desc: "জলের উৎস সম্পর্কে রিপোর্ট করুন, সচেতনতা অভিযান পরিচালনা করুন, সম্প্রদায়ের প্রতিক্রিয়া সংগ্রহ করুন এবং আশা কর্মীদের সাথে যোগাযোগ করুন।",
        volunteer_item1: "জলের উৎস রিপোর্টিং",
        volunteer_item2: "সচেতনতা অভিযান",
        volunteer_item3: "সম্প্রদায়ের প্রতিক্রিয়া",
        volunteer_item4: "সরাসরি যোগাযোগ",
        volunteer_button: "স্বেচ্ছাসেবক হিসাবে লগইন করুন",

        admin_desc: "জেলা-ব্যাপী স্বাস্থ্য ডেটা নিরীক্ষণ করুন, সম্পদ পরিচালনা করুন, প্রতিক্রিয়া সমন্বয় করুন এবং সিস্টেম অপারেশন তত্ত্বাবধান করুন।",
        admin_item1: "জেলা-ব্যাপী বিশ্লেষণ",
        admin_item2: "সম্পদ ব্যবস্থাপনা",
        admin_item3: "নীতি বাস্তবায়ন",
        admin_item4: "সিস্টেম প্রশাসন",
        admin_button: "প্রশাসক হিসাবে লগইন করুন",

        patient_desc: "আপনার স্বাস্থ্য রেকর্ড অ্যাক্সেস করুন, উপসর্গ রিপোর্ট করুন, পরীক্ষার ফলাফল দেখুন এবং স্বাস্থ্যসেবা প্রদানকারীদের সাথে যোগাযোগ করুন।",
        patient_item1: "স্বাস্থ্য রেকর্ড অ্যাক্সেস",
        patient_item2: "উপসর্গ রিপোর্টিং",
        patient_item3: "পরীক্ষার ফলাফল",
        patient_item4: "প্রদানকারী যোগাযোগ",
        patient_button: "রোগী হিসাবে লগইন করুন",

        login_title: "{role} হিসাবে লগইন করুন",
        user_id_label: "ব্যবহারকারী আইডি / ইমেল",
        user_id_placeholder: "আপনার ব্যবহারকারী আইডি বা ইমেল প্রবেশ করুন",
        password_label: "পাসওয়ার্ড",
        password_placeholder: "আপনার পাসওয়ার্ড প্রবেশ করুন",
        remember_me: "আমাকে মনে রাখুন",
        forgot_password: "পাসওয়ার্ড ভুলে গেছেন?",
        login_button: "ড্যাশবোর্ডে লগইন করুন",
        no_account: "অ্যাকাউন্ট নেই? ",
        request_access: "অ্যাক্সেসের জন্য অনুরোধ করুন",
        security_note: "সুরক্ষার জন্য, সমস্ত অ্যাক্সেস আপনার জেলার স্বাস্থ্য প্রশাসক দ্বারা পরিচালিত হয়। লগইন পরিচয়পত্রের জন্য আপনার সুপারভাইজারের সাথে যোগাযোগ করুন।"
    },
    hi: {
        headerTitle: "समाज स्वास्थ्य सुरक्षा",
        headerSubtitle: "उत्तर-पूर्व भारत स्वास्थ्य पहल",
        title: "समाज स्वास्थ्य सुरक्षा निगरानी प्रणाली",
        subtitle: "ग्रामीण उत्तर-पूर्व भारत में जल-जनित रोगों के लिए प्रारंभिक चेतावनी प्रणाली",
        tagline: "समुदाय सुरक्षा • रोग रोकथाम • स्वास्थ्य संवर्धन",
        chooseRole: "अपनी भूमिका चुनें",
        roleDescription: "उपयुक्त डैशबोर्ड और उपकरणों तक पहुंचने के लिए अपनी भूमिका का चयन करें",
        asha: "आशा कार्यकर्ता",
        volunteer: "सामुदायिक स्वयंसेवक",
        admin: "स्वास्थ्य प्रशासक",
        patient: "रोगी",
        featuresTitle: "सिस्टम की सुविधाएँ",
        featuresDescription: "सामुदायिक स्वास्थ्य निगरानी और रोग की रोकथाम के लिए व्यापक उपकरण",
        feature1_title: "जल गुणवत्ता की निगरानी",
        feature1_desc: "समुदायों में जल स्रोतों की सुरक्षा की रीयल-टाइम ट्रैकिंग और रिपोर्टिंग",
        feature2_title: "प्रारंभिक चेतावनी प्रणाली",
        feature2_desc: "बीमारी के प्रकोप और संदूषण की घटनाओं के लिए स्वचालित अलर्ट",
        feature3_title: "सामुदायिक भागीदारी",
        feature3_desc: "जागरूकता अभियानों और सामुदायिक प्रतिक्रिया संग्रह के लिए उपकरण",
        feature4_title: "डेटा एनालिटिक्स",
        feature4_desc: "व्यापक स्वास्थ्य डेटा विश्लेषण और प्रवृत्ति की पहचान",
        feature5_title: "मोबाइल एक्सेसिबिलिटी",
        feature5_desc: "किसी भी डिवाइस पर, कहीं भी एक्सेस के लिए रिस्पॉन्सिव डिज़ाइन",
        feature6_title: "बहु-भाषा समर्थन",
        feature6_desc: "बेहतर सामुदायिक पहुंच के लिए स्थानीय भाषाओं में उपलब्ध",

        asha_desc: "स्वास्थ्य निगरानी उपकरणों, सामुदायिक डेटा तक पहुँचें, और रोग की रोकथाम और स्वास्थ्य जागरूकता के लिए स्वयंसेवकों के साथ समन्वय करें।",
        asha_item1: "स्वास्थ्य डेटा प्रबंधन",
        asha_item2: "सामुदायिक समन्वय",
        asha_item3: "आपातकालीन प्रतिक्रिया",
        asha_item4: "प्रशिक्षण संसाधन",
        asha_button: "आशा कार्यकर्ता के रूप में लॉगिन करें",

        volunteer_desc: "जल स्रोतों की रिपोर्ट करें, जागरूकता अभियान चलाएं, सामुदायिक प्रतिक्रिया एकत्र करें, और आशा कार्यकर्ताओं के साथ संवाद करें।",
        volunteer_item1: "जल स्रोत रिपोर्टिंग",
        volunteer_item2: "जागरूकता अभियान",
        volunteer_item3: "सामुदायिक प्रतिक्रिया",
        volunteer_item4: "सीधा संचार",
        volunteer_button: "स्वयंसेवक के रूप में लॉगिन करें",

        admin_desc: "जिला-व्यापी स्वास्थ्य डेटा की निगरानी करें, संसाधनों का प्रबंधन करें, प्रतिक्रियाओं का समन्वय करें, और सिस्टम संचालन की देखरेख करें।",
        admin_item1: "जिला-व्यापी विश्लेषण",
        admin_item2: "संसाधन प्रबंधन",
        admin_item3: "नीति कार्यान्वयन",
        admin_item4: "सिस्टम प्रशासन",
        admin_button: "प्रशासक के रूप में लॉगिन करें",

        patient_desc: "अपने स्वास्थ्य रिकॉर्ड तक पहुँचें, लक्षणों की रिपोर्ट करें, परीक्षा परिणाम देखें, और स्वास्थ्य सेवा प्रदाताओं के साथ संवाद करें।",
        patient_item1: "स्वास्थ्य रिकॉर्ड एक्सेस",
        patient_item2: "लक्षण रिपोर्टिंग",
        patient_item3: "परीक्षा परिणाम",
        patient_item4: "प्रदाता संचार",
        patient_button: "रोगी के रूप में लॉगिन करें",

        login_title: "{role} के रूप में लॉगिन करें",
        user_id_label: "यूजर आईडी / ईमेल",
        user_id_placeholder: "अपना यूजर आईडी या ईमेल दर्ज करें",
        password_label: "पासवर्ड",
        password_placeholder: "अपना पासवर्ड दर्ज करें",
        remember_me: "मुझे याद रखें",
        forgot_password: "पासवर्ड भूल गए?",
        login_button: "डैशबोर्ड में लॉगिन करें",
        no_account: "खाता नहीं है? ",
        request_access: "एक्सेस के लिए अनुरोध करें",
        security_note: "सुरक्षा के लिए, सभी एक्सेस आपके जिला स्वास्थ्य प्रशासक द्वारा प्रबंधित किए जाते हैं। लॉगिन क्रेडेंशियल्स के लिए अपने पर्यवेक्षक से संपर्क करें।"
    }
};

// === SAFE ICON CREATION ===
function createIconsSafely() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        try {
            lucide.createIcons();
        } catch (error) {
            console.warn('Error creating Lucide icons:', error);
            setTimeout(() => {
                try { lucide.createIcons(); }
                catch (retryError) { console.warn('Retry failed for Lucide icons:', retryError); }
            }, 1000);
        }
    } else {
        console.warn('Lucide not available, retrying...');
        setTimeout(createIconsSafely, 500);
    }
}

// === INITIALIZE APP ===
function initializeApp() {
    console.log('🚀 Initializing application...');
    createIconsSafely();
    setupEventListeners();
    loadTheme();
    loadLanguagePreference();
    console.log('✅ Application initialized successfully');
}

// === THEME TOGGLE ===
function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.documentElement.classList.toggle('dark', isDarkMode);

    const themeIcon = document.querySelector('#theme-toggle i');
    if (themeIcon) {
        themeIcon.setAttribute('data-lucide', isDarkMode ? 'moon' : 'sun');
        createIconsSafely();
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        isDarkMode = true;
        document.documentElement.classList.add('dark');
        const themeIcon = document.querySelector('#theme-toggle i');
        if (themeIcon) themeIcon.setAttribute('data-lucide', 'moon');
    }
}

// === LOGIN MODAL ===
function showLoginModal(role) {
    currentRole = role;
    const modal = document.getElementById('login-modal');
    const title = document.getElementById('modal-title');
    const content = document.getElementById('modal-content');
    if (!modal || !title || !content) return console.error('Modal not found');

    const t = translations[currentLanguage];
    const roleNames = { asha: t.asha, volunteer: t.volunteer, admin: t.admin, patient: t.patient };

    title.textContent = t.login_title.replace('{role}', roleNames[role]);

    content.innerHTML = `
        <form class="space-y-4" onsubmit="handleLogin(event)">
            <div>
                <label class="block mb-2">${t.user_id_label}</label>
                <input type="text" required placeholder="${t.user_id_placeholder}" class="w-full px-3 py-2 border rounded-lg">
            </div>
            <div>
                <label class="block mb-2">${t.password_label}</label>
                <input type="password" required placeholder="${t.password_placeholder}" class="w-full px-3 py-2 border rounded-lg">
            </div>
            <div class="flex items-center justify-between">
                <label class="flex items-center gap-2">
                    <input type="checkbox"><span class="text-sm">${t.remember_me}</span>
                </label>
                <button type="button" class="text-sm text-blue-600">${t.forgot_password}</button>
            </div>
            <button type="submit" class="w-full px-4 py-3 bg-blue-600 text-white rounded-lg">
                <i data-lucide="log-in" class="w-4 h-4 inline mr-2"></i>${t.login_button}
            </button>
            <div class="text-center mt-3">
                <span class="text-sm">${t.no_account}</span>
                <button type="button" onclick="showRegistrationInfo('${role}')" class="text-sm text-blue-600">${t.request_access}</button>
            </div>
        </form>
        <p class="text-xs mt-6 text-center">${t.security_note}</p>
    `;
    modal.classList.remove('hidden');
    createIconsSafely();
}

// === HANDLE LOGIN ===
async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const inputs = form.querySelectorAll('input');
    const loginData = { username: inputs[0].value, password: inputs[1].value, role: currentRole };

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Signing in...';

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData),
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`Login failed: ${response.status}`);
        const result = await response.json();
        if (result.success) {
            localStorage.setItem('currentUser', JSON.stringify(result.user));
            document.getElementById('login-modal').classList.add('hidden');
            document.getElementById('success-modal').classList.remove('hidden');
            setTimeout(() => {
                document.getElementById('success-modal').classList.add('hidden');
                redirectToDashboard();
            }, 2000);
        } else throw new Error(result.error || 'Login failed');
    } catch (err) {
        alert(err.message);
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

function redirectToDashboard() {
    const redirectMap = { patient: 'pd.html', asha: 'ashaworker.html', volunteer: 'cd.html', admin: 'had.html' };
    window.location.href = redirectMap[currentRole] || 'dashboard.html';
}

function showRegistrationInfo(role) {
    closeModal();
    const registrationPages = { volunteer: 'cv.html', admin: 'uy1ha.html', asha: 'uy.html', hospital: 'hospital-registration.html' };
    const page = registrationPages[role];
    if (page) window.location.href = page;
    else alert(`Contact your health administrator for ${role} access.`);
}

function closeModal() {
    const modal = document.getElementById('login-modal');
    if (modal) modal.classList.add('hidden');
}

// === LANGUAGE HANDLING ===
function toggleLanguageDropdown() {
    const dropdown = document.getElementById('language-dropdown');
    if (dropdown) dropdown.classList.toggle('show');
}

function changeLanguage(lang) {
    currentLanguage = lang;
    const langNames = { en: 'English', as: 'অসমীয়া', bn: 'বাংলা', hi: 'हिंदी' };
    const currentLangElement = document.getElementById('current-language');
    if (currentLangElement) currentLangElement.textContent = langNames[lang];
    const dropdown = document.getElementById('language-dropdown');
    if (dropdown) dropdown.classList.remove('show');
    updatePageContent();
    localStorage.setItem('language', lang);
}

function loadLanguagePreference() {
    const savedLang = localStorage.getItem('language') || 'en';
    changeLanguage(savedLang);
}

function updatePageContent() {
    const t = translations[currentLanguage];
    if (!t) return console.error(`No translations for ${currentLanguage}`);

    const setText = (selector, text) => { const el = document.querySelector(selector); if (el) el.textContent = text; };

    setText('#header-title', t.headerTitle);
    setText('#header-subtitle', t.headerSubtitle);
    setText('#sub-heading', t.subtitle);
    setText('#tagline', t.tagline);
    setText('#choose-role-heading', t.chooseRole);
    setText('#role-description', t.roleDescription);

    // Main heading styled split
    const mainHeading = document.getElementById('main-heading');
    if (mainHeading) {
        const parts = t.title.split(' ');
        const lastWord = parts.pop();
        mainHeading.innerHTML = `${parts.join(' ')} <span class="bg-gradient-to-r from-yellow-300 to-pink-300 text-transparent bg-clip-text">${lastWord}</span>`;
    }
}

// === EVENT LISTENERS ===
function setupEventListeners() {
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#language-selector')) {
            document.getElementById('language-dropdown')?.classList.remove('show');
        }
    });
}

// === START APP ===
document.addEventListener('DOMContentLoaded', initializeApp);
