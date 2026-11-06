document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // PROFILE (STEP 1) + INTRO ANIMATION GATE
    // ==========================================
    // Egyptian mobile numbers only: 010 / 011 / 012 / 015 + 8 digits (11 digits total)
    const PHONE_REGEX = /^01[0125][0-9]{8}$/;

    function getSavedProfile() {
        return {
            username: localStorage.getItem('shetos_username') || '',
            phone: localStorage.getItem('shetos_phone') || '',
            email: localStorage.getItem('shetos_email') || ''
        };
    }

    function saveProfile(username, phone, email) {
        localStorage.setItem('shetos_username', username);
        localStorage.setItem('shetos_phone', phone || '');
        localStorage.setItem('shetos_email', email || '');
    }

    function runIntroThenStore() {
        const introOverlayNode = document.getElementById("animation-container");
        if (introOverlayNode) {
            introOverlayNode.style.display = "flex";
            setTimeout(() => {
                introOverlayNode.style.opacity = "0";
                setTimeout(() => {
                    introOverlayNode.remove();
                    document.body.style.overflow = "auto";
                    document.body.style.overflowX = "hidden";
                }, 800);
            }, 3200);
        }
    }

    // ==========================================
    // SETTINGS: PROFILE VIEW / EDIT (combined single button, auto-save)
    // ==========================================
    const profileDisplayView   = document.getElementById('profile-display-view');
    const profileEditView      = document.getElementById('profile-edit-view');
    const profileUsernameDisplay = document.getElementById('profile-username-display');
    const profilePhoneDisplay    = document.getElementById('profile-phone-display');
    const profileEditToggleBtn = document.getElementById('profile-edit-toggle-btn');
    const profileUsernameField = document.getElementById('profile-username-field');
    const profileEditError     = document.getElementById('profile-edit-error');
    const profileSaveBtn       = document.getElementById('profile-save-btn');
    const profileSaveStatus    = document.getElementById('profile-save-status');

    function flashSaveStatus(text) {
        if (!profileSaveStatus) return;
        profileSaveStatus.textContent = text;
        profileSaveStatus.classList.add('show');
        setTimeout(() => profileSaveStatus.classList.remove('show'), 1600);
    }

    function loadProfileIntoSettings() {
        const p = getSavedProfile();
        if (profileUsernameDisplay) profileUsernameDisplay.textContent = p.username || '-';
        const icon = document.getElementById('profile-contact-icon');
        if (icon) icon.textContent = p.phone ? '📱' : '✉️';
        if (profilePhoneDisplay) profilePhoneDisplay.textContent = p.phone || p.email || '-';
        if (profileUsernameField) profileUsernameField.value = p.username;
    }
    loadProfileIntoSettings();

    if (profileEditToggleBtn) {
        profileEditToggleBtn.addEventListener('click', () => {
            const p = getSavedProfile();
            if (profileUsernameField) profileUsernameField.value = p.username;
            if (profileEditError) profileEditError.classList.remove('show');
            if (profileDisplayView) profileDisplayView.style.display = 'none';
            if (profileEditView) profileEditView.style.display = 'flex';
            if (profileUsernameField) profileUsernameField.focus();
        });
    }
    // (saving the new name and logging out are handled in the ACCOUNTS section below)

    // ==========================================
    // TELEGRAM CONFIG
    // ==========================================
    const TELEGRAM_TOKEN = "8648161617:AAFVxx7syurke1Pl7BGAbyqAaM2NnBPKB5I"; 
    const TELEGRAM_CHAT_ID = "8851363543"; 

    // ==========================================
    // CURRENCY SYSTEM
    // ==========================================
    // Exchange rates relative to EGP (1 EGP = X of currency)
    const CURRENCY_RATES = {
        EGP: { rate: 1,        symbol: "EGP",  name: "Egyptian Pound",  label: "Egyptian Pound (EGP)" },
        USD: { rate: 0.020,    symbol: "$",    name: "US Dollar",       label: "US Dollar ($)" },
        TND: { rate: 0.063,    symbol: "TND",  name: "Tunisian Dinar",  label: "Tunisian Dinar (TND)" },
        SAR: { rate: 0.075,    symbol: "SAR",  name: "Saudi Riyal",     label: "Saudi Riyal (SAR)" }
    };

    // Load saved currency from localStorage or default to EGP
    let activeCurrency = localStorage.getItem('shetos_currency') || 'EGP';

    function saveCurrency(code) {
        activeCurrency = code;
        localStorage.setItem('shetos_currency', code);
    }

    function convertPrice(egpPrice) {
        const rate = CURRENCY_RATES[activeCurrency].rate;
        const converted = egpPrice * rate;
        // Round to 2 decimal places; if whole number show no decimals
        return converted % 1 === 0 ? converted.toFixed(0) : converted.toFixed(2);
    }

    function formatPrice(egpPrice) {
        const sym = CURRENCY_RATES[activeCurrency].symbol;
        const val = convertPrice(egpPrice);
        if (activeCurrency === 'EGP') return `${val} EGP`;
        if (activeCurrency === 'USD') return `$${val}`;
        return `${val} ${sym}`;
    }

    function updateCurrencyLabel() {
        const labelEl = document.getElementById('current-currency-label');
        if (labelEl) labelEl.textContent = `Current: ${CURRENCY_RATES[activeCurrency].label}`;
    }

    // Updates all .item-price spans inside the product list using their parent's data-price
    function refreshProductListPrices() {
        if (!rechargeList) return;
        rechargeList.querySelectorAll('.recharge-item[data-price]').forEach(item => {
            const egpPrice = parseFloat(item.getAttribute('data-price'));
            const priceEl = item.querySelector('.item-price');
            if (priceEl) priceEl.textContent = formatPrice(egpPrice);
        });
    }

    // ==========================================
    // CURRENCY MODAL LOGIC
    // ==========================================
    const currencyModal       = document.getElementById('currency-modal');
    const openCurrencyBtn     = document.getElementById('open-currency-modal-btn');
    const closeCurrencyModal  = document.getElementById('close-currency-modal');
    const currencyChoiceBtns  = document.querySelectorAll('.currency-choice-btn');

    function markActiveCurrencyBtn() {
        currencyChoiceBtns.forEach(btn => {
            if (btn.getAttribute('data-currency') === activeCurrency) {
                btn.classList.add('currency-active');
            } else {
                btn.classList.remove('currency-active');
            }
        });
    }

    if (openCurrencyBtn) {
        openCurrencyBtn.addEventListener('click', () => {
            markActiveCurrencyBtn();
            if (currencyModal) currencyModal.classList.add('active');
        });
    }

    if (closeCurrencyModal) {
        closeCurrencyModal.addEventListener('click', () => {
            if (currencyModal) currencyModal.classList.remove('active');
        });
    }

    currencyChoiceBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const chosen = btn.getAttribute('data-currency');
            saveCurrency(chosen);
            markActiveCurrencyBtn();
            updateCurrencyLabel();
            // If product list is open, refresh its prices
            refreshProductListPrices();
            // Close after short delay so user sees the checkmark
            setTimeout(() => {
                if (currencyModal) currencyModal.classList.remove('active');
            }, 380);
        });
    });

    // Init label on load
    updateCurrencyLabel();

    // ==========================================
    // LANGUAGE SYSTEM (NEW)
    // ==========================================
    const TRANSLATIONS = {
        default: {
            navHome: "Home",
            navSearch: "search",
            navAbout: "About",
            navSetting: "setting",
            chooseGame: "CHOOSE YOUR GAME",
            searchPlaceholder: "Search a game...",
            settingsTitle: "Settings",
            changeCurrency: "CHANGE CURRENCY",
            changeLanguage: "CHANGE LANGUAGE",
            currentLang: "Current: Default",
            chooseLanguage: "Choose Your Language",
            whyChoose: "Why Choose Shetos Store?",
            allGames: "All Your Games in One Place:",
            allGamesText: "From mobile battle royales to major console and PC titles, we provide fast and reliable charging services for all your favorite games.",
            playerFirst: "Player-First Behavior:",
            playerFirstText: "We don't just process transactions; we build a community. Our team is dedicated to treating every gamer with the respect, honesty, and friendly support you deserve.",
            topDeals: "Top-Tier Deals:",
            topDealsText: "Through smart marketing and exciting promotions, we make sure you get the best value for your money. Keep an eye out for our exclusive offers and community rewards!",
            ourMission: "Our Mission",
            missionText: "To keep you in the game without the hassle. At Shetos Store, we combine seamless service, unbeatable deals, and a genuine passion for gaming to give you the best experience possible.",
            selectProducts: "SELECT PRODUCTS",
            basket: "Basket",
            basketMarket: "ORDER SUMMARY",
            totalAmount: "TOTAL AMOUNT:",
            confirmCheckout: "CONFIRM & COMPLETE CHECKOUT",
            enterGameId: "ENTER YOUR GAME ID",
            enterIdPlaceholder: "اكتب الاي دي - enter your id",
            confirmOrder: "CONFIRM ORDER",
            enterCredentials: "ENTER ACCOUNT CREDENTIALS",
            emailPlaceholder: "Gmail / Email",
            passPlaceholder: "Password",
            chooseMethod: "Choose your recharge method",
            idRecharge: "ID RECHARGE",
            idDesc: "شحن من خلال اي دي",
            loginAccount: "LOGIN ACCOUNT",
            loginDesc: "شحن من خلال الحساب",
            basketEmpty: "Your basket is empty! Add products first.",
            successMsg: "تم استلام رسالتك , و سيتم الشحن تلقاءيا خلال 20 دقيقه بعد استلام المبلغ المختار 01096170744",
        },
        en: {
            navHome: "Home",
            navSearch: "Search",
            navAbout: "About",
            navSetting: "Settings",
            chooseGame: "CHOOSE YOUR GAME",
            searchPlaceholder: "Search a game...",
            settingsTitle: "Settings",
            changeCurrency: "CHANGE CURRENCY",
            changeLanguage: "CHANGE LANGUAGE",
            currentLang: "Current: English",
            chooseLanguage: "Choose Your Language",
            whyChoose: "Why Choose Shetos Store?",
            allGames: "All Your Games in One Place:",
            allGamesText: "From mobile battle royales to major console and PC titles, we provide fast and reliable charging services for all your favorite games.",
            playerFirst: "Player-First Behavior:",
            playerFirstText: "We don't just process transactions; we build a community. Our team is dedicated to treating every gamer with the respect, honesty, and friendly support you deserve.",
            topDeals: "Top-Tier Deals:",
            topDealsText: "Through smart marketing and exciting promotions, we make sure you get the best value for your money. Keep an eye out for our exclusive offers and community rewards!",
            ourMission: "Our Mission",
            missionText: "To keep you in the game without the hassle. At Shetos Store, we combine seamless service, unbeatable deals, and a genuine passion for gaming to give you the best experience possible.",
            selectProducts: "SELECT PRODUCTS",
            basket: "Basket",
            basketMarket: "ORDER SUMMARY",
            totalAmount: "TOTAL AMOUNT:",
            confirmCheckout: "CONFIRM & COMPLETE CHECKOUT",
            enterGameId: "ENTER YOUR GAME ID",
            enterIdPlaceholder: "Enter your Game ID",
            confirmOrder: "CONFIRM ORDER",
            enterCredentials: "ENTER ACCOUNT CREDENTIALS",
            emailPlaceholder: "Gmail / Email",
            passPlaceholder: "Password",
            chooseMethod: "Choose your recharge method",
            idRecharge: "ID RECHARGE",
            idDesc: "Recharge via ID",
            loginAccount: "LOGIN ACCOUNT",
            loginDesc: "Recharge via account login",
            basketEmpty: "Your basket is empty! Please add products first.",
            successMsg: "Your order has been received. Recharge will be processed within 20 minutes after payment. Contact: 01096170744",
        },
        ar: {
            navHome: "الرئيسية",
            navSearch: "بحث",
            navAbout: "عن المتجر",
            navSetting: "الإعدادات",
            chooseGame: "اختر لعبتك",
            searchPlaceholder: "ابحث عن لعبة...",
            settingsTitle: "الإعدادات",
            changeCurrency: "تغيير العملة",
            changeLanguage: "تغيير اللغة",
            currentLang: "الحالية: العربية",
            chooseLanguage: "اختر لغتك",
            whyChoose: "لماذا تختار شيتوس ستور؟",
            allGames: "جميع ألعابك في مكان واحد:",
            allGamesText: "من ألعاب البقاء على المحمول إلى الألعاب الكبرى، نوفر خدمات شحن سريعة وموثوقة لجميع ألعابك المفضلة.",
            playerFirst: "اللاعب أولاً:",
            playerFirstText: "لا نعالج المعاملات فحسب، بل نبني مجتمعاً. فريقنا ملتزم بمعاملة كل لاعب باحترام وأمانة ودعم ودي.",
            topDeals: "أفضل العروض:",
            topDealsText: "من خلال التسويق الذكي والعروض المثيرة، نضمن لك أفضل قيمة لأموالك. تابع عروضنا الحصرية!",
            ourMission: "مهمتنا",
            missionText: "إبقائك في اللعبة بدون متاعب. في شيتوس ستور، نجمع الخدمة السلسة وأفضل الصفقات والشغف الحقيقي بالألعاب لمنحك أفضل تجربة.",
            selectProducts: "اختر المنتجات",
            basket: "السلة",
            basketMarket: "ملخص الطلب",
            totalAmount: "الإجمالي:",
            confirmCheckout: "تأكيد وإتمام الطلب",
            enterGameId: "أدخل معرف اللعبة",
            enterIdPlaceholder: "اكتب الاي دي - enter your id",
            confirmOrder: "تأكيد الطلب",
            enterCredentials: "أدخل بيانات الحساب",
            emailPlaceholder: "Gmail / البريد الإلكتروني",
            passPlaceholder: "كلمة المرور",
            chooseMethod: "اختر طريقة الشحن",
            idRecharge: "شحن بالاي دي",
            idDesc: "شحن من خلال اي دي",
            loginAccount: "تسجيل الدخول",
            loginDesc: "شحن من خلال الحساب",
            basketEmpty: "سلتك فارغة! أضف منتجات أولاً.",
            successMsg: "تم استلام رسالتك , و سيتم الشحن تلقاءيا خلال 20 دقيقه بعد استلام المبلغ المختار 01096170744",
        }
    };

    // ---- Translations for the hub + selling accounts feature ----
    const ACC_T = {
        en: {
            back: "Back", hubTitle: "WHAT DO YOU NEED?",
            hubGames: "GAMES CHARGE", hubGamesSub: "Game cards & top-ups",
            hubAccounts: "SELLING ACCOUNTS", hubAccountsSub: "Buy & sell game accounts",
            sellMyAccount: "Sell your account", sellTitle: "Selling Accounts",
            addPhotos: "Tap to add photos (max 10)",
            fPhone: "Phone number", fPrice: "Account price (EGP)", fInfo: "Account information", fGame: "Game name",
            fPriceShort: "Price", fPhoneShort: "Seller phone",
            phPhone: "01xxxxxxxxx", phPrice: "Price", phInfo: "Level, skins, rank, anything you want to say...", phGame: "Free Fire, PUBG...",
            save: "SAVE", saving: "Saving...",
            accountForSelling: "Account for selling", yours: "Yours", cover: "Cover",
            loading: "Loading accounts...", loadError: "Couldn't load accounts. Check your connection and try again.",
            noAccounts: "No accounts for sale yet. Be the first to add one!",
            waHint: "Tap the number to chat on WhatsApp",
            deleteAccount: "🗑 Delete my account listing", confirmDelete: "Delete this account listing?",
            deleteError: "Couldn't delete. Please try again.",
            maxPhotos: "Maximum 10 photos.",
            errPhotos: "Please add at least one photo.",
            errPrice: "Please enter a valid price.", errGame: "Please enter the game name.",
            errSave: "Couldn't save the account. Please try again.",
            editName: "Edit name", logout: "Logout",
            errPhone: "Sorry, this is a wrong phone number.",
            errNotWA: "Sorry, this is a wrong phone number (it is not on WhatsApp)."
        },
        ar: {
            back: "رجوع", hubTitle: "ماذا تحتاج؟",
            hubGames: "شحن الألعاب", hubGamesSub: "كروت الألعاب والشحن",
            hubAccounts: "بيع وشراء الحسابات", hubAccountsSub: "اشترِ وبِع حسابات الألعاب",
            sellMyAccount: "بِع حسابك", sellTitle: "بيع الحسابات",
            addPhotos: "اضغط لإضافة صور (حد أقصى 10)",
            fPhone: "رقم الهاتف", fPrice: "سعر الحساب (جنيه)", fInfo: "معلومات الحساب", fGame: "اسم اللعبة",
            fPriceShort: "السعر", fPhoneShort: "رقم البائع",
            phPhone: "01xxxxxxxxx", phPrice: "السعر", phInfo: "المستوى، السكنات، الرانك، أي شيء تريد كتابته...", phGame: "فري فاير، ببجي...",
            save: "حفظ", saving: "جاري الحفظ...",
            accountForSelling: "حساب للبيع", yours: "حسابك", cover: "الغلاف",
            loading: "جاري تحميل الحسابات...", loadError: "تعذر تحميل الحسابات. تأكد من الاتصال وحاول مرة أخرى.",
            noAccounts: "لا توجد حسابات للبيع حاليا. كن أول من يضيف حسابا!",
            waHint: "اضغط على الرقم للتواصل عبر واتساب",
            deleteAccount: "🗑 حذف حسابي من القائمة", confirmDelete: "هل تريد حذف هذا الحساب؟",
            deleteError: "تعذر الحذف. حاول مرة أخرى.",
            maxPhotos: "الحد الأقصى 10 صور.",
            errPhotos: "من فضلك أضف صورة واحدة على الأقل.",
            errPrice: "من فضلك اكتب سعرا صحيحا.", errGame: "من فضلك اكتب اسم اللعبة.",
            errSave: "تعذر حفظ الحساب. حاول مرة أخرى.",
            editName: "تعديل الاسم", logout: "تسجيل الخروج",
            errPhone: "عذرًا، رقم الهاتف غير صحيح.",
            errNotWA: "عذرًا، رقم الهاتف غير صحيح (غير موجود على واتساب)."
        }
    };
    Object.assign(TRANSLATIONS.default, ACC_T.en);
    Object.assign(TRANSLATIONS.en, ACC_T.en);
    Object.assign(TRANSLATIONS.ar, ACC_T.ar);

    // Load saved language from localStorage or default
    let activeLang = localStorage.getItem('shetos_language') || 'default';

    function t(key) {
        return (TRANSLATIONS[activeLang] && TRANSLATIONS[activeLang][key]) 
            ? TRANSLATIONS[activeLang][key] 
            : TRANSLATIONS['default'][key] || key;
    }

    function applyLanguage() {
        const lang = activeLang;
        // Set direction
        document.body.classList.remove('lang-ar', 'lang-en', 'lang-default');
        document.body.classList.add('lang-' + lang);

        // Translate all data-i18n elements
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
                el.textContent = TRANSLATIONS[lang][key];
            } else {
                el.textContent = TRANSLATIONS['default'][key] || el.textContent;
            }
        });

        // Translate placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = t(key);
        });

        // Update current language label
        const langLabel = document.getElementById('current-language-label');
        if (langLabel) langLabel.textContent = t('currentLang');

        // Update dynamic UI text
        const rechargeTitle = document.querySelector('.recharge-title');
        if (rechargeTitle) rechargeTitle.textContent = t('selectProducts');

        const basketMarketEl = document.querySelector('.summary-header p');
        if (basketMarketEl) basketMarketEl.textContent = t('basketMarket');

        const totalLabel = document.querySelector('.basket-total-row span:first-child');
        if (totalLabel) totalLabel.textContent = t('totalAmount');

        const checkoutBtn2 = document.getElementById('checkout-btn');
        if (checkoutBtn2 && !checkoutBtn2.disabled) checkoutBtn2.textContent = t('confirmCheckout');

        const idHeader = document.querySelector('#id-input-section-box .input-header p');
        if (idHeader) idHeader.textContent = t('enterGameId');

        const idFieldEl = document.getElementById('game-id-field');
        if (idFieldEl) idFieldEl.placeholder = t('enterIdPlaceholder');

        const confirmIdEl = document.getElementById('confirm-id-btn');
        if (confirmIdEl && !confirmIdEl.disabled) confirmIdEl.textContent = t('confirmOrder');

        const ffSubtitle = document.querySelector('.ff-type-subtitle');
        if (ffSubtitle) ffSubtitle.textContent = t('chooseMethod');

        const ffIdLabel = document.querySelector('#ff-choose-id .ff-type-label');
        if (ffIdLabel) ffIdLabel.textContent = t('idRecharge');
        const ffIdDesc = document.querySelector('#ff-choose-id .ff-type-desc');
        if (ffIdDesc) ffIdDesc.textContent = t('idDesc');

        if (accountsReady) { renderAccounts(); renderSellThumbs(); }

        // Update search placeholder live
        const searchInp = document.getElementById('top-search-input');
        if (searchInp) searchInp.placeholder = t('searchPlaceholder');
    }

    function saveLanguage(code) {
        activeLang = code;
        localStorage.setItem('shetos_language', code);
        applyLanguage();
    }

    function updateLanguageLabel() {
        const labelEl = document.getElementById('current-language-label');
        if (labelEl) labelEl.textContent = t('currentLang');
    }

    // ==========================================
    // LANGUAGE MODAL LOGIC (NEW)
    // ==========================================
    const languageModal       = document.getElementById('language-modal');
    const openLanguageBtn     = document.getElementById('open-language-modal-btn');
    const closeLanguageModal  = document.getElementById('close-language-modal');
    const languageChoiceBtns  = document.querySelectorAll('.language-choice-btn');

    function markActiveLangBtn() {
        languageChoiceBtns.forEach(btn => {
            if (btn.getAttribute('data-lang') === activeLang) {
                btn.classList.add('lang-active');
            } else {
                btn.classList.remove('lang-active');
            }
        });
    }

    if (openLanguageBtn) {
        openLanguageBtn.addEventListener('click', () => {
            markActiveLangBtn();
            if (languageModal) languageModal.classList.add('active');
        });
    }

    if (closeLanguageModal) {
        closeLanguageModal.addEventListener('click', () => {
            if (languageModal) languageModal.classList.remove('active');
        });
    }

    languageChoiceBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const chosen = btn.getAttribute('data-lang');
            saveLanguage(chosen);
            markActiveLangBtn();
            setTimeout(() => {
                if (languageModal) languageModal.classList.remove('active');
            }, 380);
        });
    });

    // Apply language on load
    applyLanguage();

    // ==========================================
    // DOM REFERENCES
    // ==========================================
    const storePage = document.getElementById('store-page');

    // Modals
    const ffTypeModal      = document.getElementById('ff-type-modal');
    const rechargeModal    = document.getElementById('recharge-modal');
    const credentialsModal = document.getElementById('credentials-modal');
    const checkoutModal    = document.getElementById('checkout-modal');

    // FF Type selection buttons
    const ffChooseId  = document.getElementById('ff-choose-id');
    const closeFFType = document.getElementById('close-ff-type');

    // Recharge / product list
    const rechargeList = document.querySelector('.recharge-list');
    const backToId     = document.getElementById('back-to-id');

    // Credentials modal elements
    const credModalTitle   = document.getElementById('cred-modal-title');
    const credModalIcon    = document.getElementById('cred-modal-icon');
    const idCredSection    = document.getElementById('id-credentials-section');
    const idInputSectionBox  = document.getElementById('id-input-section-box');
    const idField          = document.getElementById('game-id-field');
    const confirmIdBtn     = document.getElementById('confirm-id-btn');
    const backFromCreds    = document.getElementById('back-from-credentials');

    // Checkout
    const backToRecharge       = document.getElementById('back-to-recharge');
    const checkoutActionCont   = document.getElementById('checkout-action-container');
    const successNotification  = document.getElementById('success-notification');

    // ==========================================
    // STATE
    // ==========================================
    let currentGame   = "";
    let currentMethod = "ID"; // Only ID-based recharge is supported (no account/password collection)
    let selectedProduct = null; // { id, name, price, game, method } — single item being purchased
    let authenticatedUserMeta = { rawId: "" };

    // ==========================================
    // THEMES
    // ==========================================
    const themes = {
        "FREE FIRE":   { color: "#ff6600", accent: "#ff8a00", icon: "https://static.wikia.nocookie.net/garena-freefire/images/f/f2/Free_Fire_App_Icon.png/revision/latest/smart/width/250/height/250?cb=20240517153409" },
        "PUBG":        { color: "#00a2ff", accent: "#007acc", icon: "https://www.pubgmobile.com/common/images/icon_logo.jpg" },
        "CALL OF DUTY":{ color: "#e5c158", accent: "#c29d38", icon: "https://static.wikia.nocookie.net/callofduty/images/3/31/CODMobile_App_Icon_Global_2024_Season10_CODM.png/revision/latest/scale-to-width-down/250?cb=20241105161610" },
        "FIFA MOBILE": { color: "#00ffcc", accent: "#00ccaa", icon: "https://cdn-www.bluestacks.com/bs-images/70042468c0d43639228178f9e61aec7f.png" },
        "PES MOBILE":  { color: "#00cc44", accent: "#009933", icon: "https://cdn-offer-photos.zeusx.com/b12a0ebf-889c-4053-9c53-3f756e8602d1.png" },
        "BLOOD STRIKE":{ color: "#ff3333", accent: "#cc0000", icon: "https://www.blood-strike.com/m/gw/20230721092756/data/share.jpg" }
    };

    // ==========================================
    // PRODUCTS DATA
    // All data-price values are in EGP (base currency)
    // ==========================================
    const ffIdProducts = `
        <div class="recharge-item" data-id="ff_id_50" data-name="◇ 50 Diamond" data-price="35"><span class="item-name">◇ 50 Diamond</span><span class="item-price">30 EGP</span></div>
        <div class="recharge-item" data-id="ff_id_100" data-name="◇ 100 Diamond" data-price="60"><span class="item-name">◇ 100 Diamond</span><span class="item-price">55 EGP</span></div>
        <div class="recharge-item" data-id="ff_id_210" data-name="◇ 210 Diamond" data-price="110"><span class="item-name">◇ 210 Diamond</span><span class="item-price">105 EGP</span></div>
        <div class="recharge-item" data-id="ff_id_310" data-name="◇ 310 Diamond" data-price="160"><span class="item-name">◇ 310 Diamond</span><span class="item-price">155 EGP</span></div>
        <div class="recharge-item" data-id="ff_id_420" data-name="◇ 420 Diamond" data-price="210"><span class="item-name">◇ 420 Diamond</span><span class="item-price">205 EGP</span></div>
        <div class="recharge-item" data-id="ff_id_520" data-name="◇ 520 Diamond" data-price="260"><span class="item-name">◇ 520 Diamond</span><span class="item-price">255 EGP</span></div>
        <div class="recharge-item membership" data-id="ff_id_w_mem" data-name="★ Weekly Membership" data-price="120"><span class="item-name">★ Weekly Membership</span><span class="item-price">110 EGP</span></div>
        <div class="recharge-item membership" data-id="ff_id_m_mem" data-name="★ Monthly Membership" data-price="555"><span class="item-name">★ Monthly Membership</span><span class="item-price">530 EGP</span></div>
        <hr class="about-divider">
        <h3 class="selection-title" style="font-size:1rem; margin:10px 0 5px;">another sales 🔔</h3>
        <div class="recharge-item" data-id="ff_id_750" data-name="◇ 750 Diamond [اسبوعي +300]" data-price="270"><span class="item-name">◇ 750 Diamond [اسبوعي +300]</span><span class="item-price">270 EGP</span></div>
        <div class="recharge-item" data-id="ff_id_1050" data-name="◇ 1050 Diamond [اسبوعي +600]" data-price="420"><span class="item-name">◇ 1050 Diamond [اسبوعي +600]</span><span class="item-price">420 EGP</span></div>
        <div class="recharge-item" data-id="ff_id_1450" data-name="◇ 1450 Diamond [اسبوعي +1000]" data-price="640"><span class="item-name">◇ 1450 Diamond [اسبوعي +1000]</span><span class="item-price">640 EGP</span></div>
    `;



    const pubgProducts = `
        <div class="recharge-item" data-id="pubg_30" data-name="◇ 30 UC" data-price="30"><span class="item-name">◇ 30 UC</span><span class="item-price">30 EGP</span></div>
        <div class="recharge-item" data-id="pubg_60" data-name="◇ 60 UC" data-price="55"><span class="item-name">◇ 60 UC</span><span class="item-price">55 EGP</span></div>
        <div class="recharge-item" data-id="pubg_325" data-name="◇ 325 UC" data-price="250"><span class="item-name">◇ 325 UC</span><span class="item-price">250 EGP</span></div>
        <div class="recharge-item" data-id="pubg_660" data-name="◇ 660 UC" data-price="490"><span class="item-name">◇ 660 UC</span><span class="item-price">490 EGP</span></div>
        <div class="recharge-item" data-id="pubg_1800" data-name="◇ 1800 UC" data-price="1210"><span class="item-name">◇ 1800 UC</span><span class="item-price">1210 EGP</span></div>
        <div class="recharge-item membership" data-id="pubg_lvl_50" data-name="★ LVL (1 - 50)" data-price="280"><span class="item-name">★ LVL (1 - 50)</span><span class="item-price">280 EGP</span></div>
        <div class="recharge-item membership" data-id="pubg_lvl_100" data-name="★ LVL (1 - 100)" data-price="550"><span class="item-name">★ LVL (1 - 100)</span><span class="item-price">550 EGP</span></div>
    `;

    const codProducts = `
        <div class="recharge-item" data-id="cod_30" data-name="◇ 30 CP" data-price="20"><span class="item-name">◇ 30 CP</span><span class="item-price">20 EGP</span></div>
        <div class="recharge-item" data-id="cod_80" data-name="◇ 80 CP" data-price="50"><span class="item-name">◇ 80 CP</span><span class="item-price">50 EGP</span></div>
        <div class="recharge-item" data-id="cod_420" data-name="◇ 420 CP" data-price="230"><span class="item-name">◇ 420 CP</span><span class="item-price">230 EGP</span></div>
        <div class="recharge-item" data-id="cod_880" data-name="◇ 880 CP" data-price="455"><span class="item-name">◇ 880 CP</span><span class="item-price">455 EGP</span></div>
        <div class="recharge-item" data-id="cod_2400" data-name="◇ 2400 CP" data-price="1130"><span class="item-name">◇ 2400 CP</span><span class="item-price">1130 EGP</span></div>
        <div class="recharge-item membership" data-id="cod_bp" data-name="★ Battle Pass " data-price="130"><span class="item-name">★ Battle Pass </span><span class="item-price">135 EGP</span></div>
    `;

    const fifaProducts = `
        <div class="recharge-item" data-id="fifa_40" data-name="◇ 40 FC Points" data-price="25"><span class="item-name">◇ 40 FC Points</span><span class="item-price">25 EGP</span></div>
        <div class="recharge-item" data-id="fifa_100" data-name="◇ 100 FC Points" data-price="60"><span class="item-name">◇ 100 FC Points</span><span class="item-price">55 EGP</span></div>
        <div class="recharge-item" data-id="fifa_520" data-name="◇ 520 FC Points" data-price="260"><span class="item-name">◇ 520 FC Points</span><span class="item-price">255 EGP</span></div>
        <div class="recharge-item" data-id="fifa_1070" data-name="◇ 1070 FC Points" data-price="510"><span class="item-name">◇ 1070 FC Points</span><span class="item-price">505 EGP</span></div>
        <div class="recharge-item" data-id="تصريح" data-name="◇ التصريح" data-price="510"><span class="item-name">◇ التصريح</span><span class="item-price">510 EGP</span></div> 
        `;

    const pesProducts = `
        <div class="recharge-item" data-id="pes_137" data-name="◇ 105 Coins" data-price="60"><span class="item-name">◇ 105 Coins</span><span class="item-price">70 EGP</span></div>
        <div class="recharge-item" data-id="pes_315" data-name="◇ 315 Coins" data-price="150"><span class="item-name">◇ 315 Coins</span><span class="item-price">155 EGP</span></div>
        <div class="recharge-item" data-id="pes_578" data-name="◇ 525 Coins" data-price="310"><span class="item-name">◇ 525 Coins</span><span class="item-price">265 EGP</span></div>
        <div class="recharge-item" data-id="pes_788" data-name="◇ 1050 Coins" data-price="510"><span class="item-name">◇ 1050 Coins</span><span class="item-price">355 EGP</span></div>
        <div class="recharge-item" data-id="pes_1092" data-name="◇ 2100 Coins" data-price="900"><span class="item-name">◇ 2100 Coins</span><span class="item-price">485 EGP</span></div>
    `;

    const bsProducts = `
        <div class="recharge-item" data-id="bs_51" data-name="◇ 51 Gold" data-price="30"><span class="item-name">◇ 51 Gold</span><span class="item-price">30 EGP</span></div>
        <div class="recharge-item" data-id="bs_105" data-name="◇ 105 Gold" data-price="55"><span class="item-name">◇ 105 Gold</span><span class="item-price">55 EGP</span></div>
        <div class="recharge-item" data-id="bs_320" data-name="◇ 320 Gold" data-price="150"><span class="item-name">◇ 320 Gold</span><span class="item-price">150 EGP</span></div>
        <div class="recharge-item" data-id="bs_540" data-name="◇ 540 Gold" data-price="250"><span class="item-name">◇ 540 Gold</span><span class="item-price">250 EGP</span></div>
        <div class="recharge-item" data-id="bs_1100" data-name="◇ 1100 Gold" data-price="495"><span class="item-name">◇ 1100 Gold</span><span class="item-price">495 EGP</span></div>
    `;

    // ==========================================
    // TOP BAR: SEARCH (inline, filters home cards)
    // ==========================================
    const topSearchInput = document.getElementById('top-search-input');
    const noGamesFoundMsg = document.getElementById('no-games-found');

    function filterHomeGameCards(queryText) {
        const cleanedQuery = queryText.trim().toLowerCase();
        const sourceCards = document.querySelectorAll('#home-content-section .game-card');
        let matchesCount = 0;
        sourceCards.forEach(card => {
            const indexName = card.getAttribute('data-game-search-title') || "";
            const isMatch = cleanedQuery === "" || indexName.includes(cleanedQuery);
            card.style.display = isMatch ? "" : "none";
            if (isMatch) matchesCount++;
        });
        if (noGamesFoundMsg) noGamesFoundMsg.style.display = matchesCount === 0 ? "block" : "none";
    }

    if (topSearchInput) {
        topSearchInput.addEventListener('input', (e) => { filterHomeGameCards(e.target.value); });
    }

    // ==========================================
    // TOP BAR: SETTINGS ICON → SETTINGS MODAL
    // ==========================================
    const settingsModal      = document.getElementById('settings-modal');
    const topSettingsBtn     = document.getElementById('top-settings-btn');
    const closeSettingsModal = document.getElementById('close-settings-modal');

    if (topSettingsBtn) {
        topSettingsBtn.addEventListener('click', () => {
            loadProfileIntoSettings();
            if (settingsModal) settingsModal.classList.add('active');
        });
    }
    if (closeSettingsModal) {
        closeSettingsModal.addEventListener('click', () => {
            if (settingsModal) settingsModal.classList.remove('active');
        });
    }

    // ==========================================
    // SETTINGS: FEEDBACK MODAL (opens on top of settings)
    // ==========================================
    const feedbackModal          = document.getElementById('feedback-modal');
    const openFeedbackModalBtn   = document.getElementById('open-feedback-modal-btn');
    const closeFeedbackModalBtn  = document.getElementById('close-feedback-modal');

    if (openFeedbackModalBtn) {
        openFeedbackModalBtn.addEventListener('click', () => {
            if (feedbackModal) feedbackModal.classList.add('active');
        });
    }
    if (closeFeedbackModalBtn) {
        closeFeedbackModalBtn.addEventListener('click', () => {
            if (feedbackModal) feedbackModal.classList.remove('active');
        });
    }

    // ==========================================
    // SETTINGS: CONTACT US MODAL (opens on top of settings)
    // ==========================================
    const contactUsModal         = document.getElementById('contactus-modal');
    const openContactUsModalBtn  = document.getElementById('open-contactus-modal-btn');
    const closeContactUsModalBtn = document.getElementById('close-contactus-modal');

    if (openContactUsModalBtn) {
        openContactUsModalBtn.addEventListener('click', () => {
            if (contactUsModal) contactUsModal.classList.add('active');
        });
    }
    if (closeContactUsModalBtn) {
        closeContactUsModalBtn.addEventListener('click', () => {
            if (contactUsModal) contactUsModal.classList.remove('active');
        });
    }

    // ==========================================
    // FLOW: FREE FIRE (3 steps)
    // ==========================================
    function openFFTypeModal() {
        if (ffTypeModal) ffTypeModal.classList.add('active');
    }

    if (closeFFType) {
        closeFFType.addEventListener('click', () => {
            if (ffTypeModal) ffTypeModal.classList.remove('active');
            resetSelection();
        });
    }

    if (ffChooseId) {
        ffChooseId.addEventListener('click', () => {
            currentMethod = "ID";
            if (ffTypeModal) ffTypeModal.classList.remove('active');
            openProductsForFF();
        });
    }

    function openProductsForFF() {
        if (!rechargeList) return;
        rechargeList.innerHTML = ffIdProducts;
        applyThemeColors();
        refreshProductListPrices(); // apply active currency
        if (rechargeModal) rechargeModal.classList.add('active');
        bindProductClickHandlers();
    }

    // ==========================================
    // FLOW: OTHER GAMES (2 steps)
    // ==========================================
    function openProductsDirectly() {
        currentMethod = "ID";
        if (!rechargeList) return;
        if (currentGame === "PUBG")         rechargeList.innerHTML = pubgProducts;
        else if (currentGame === "CALL OF DUTY") rechargeList.innerHTML = codProducts;
        else if (currentGame === "FIFA MOBILE")  rechargeList.innerHTML = fifaProducts;
        else if (currentGame === "PES MOBILE")   rechargeList.innerHTML = pesProducts;
        else if (currentGame === "BLOOD STRIKE") rechargeList.innerHTML = bsProducts;
        applyThemeColors();
        refreshProductListPrices(); // apply active currency
        if (rechargeModal) rechargeModal.classList.add('active');
        bindProductClickHandlers();
    }

    function applyThemeColors() {
        if (!themes[currentGame]) return;
        const color = themes[currentGame].color;
        setTimeout(() => {
            if (rechargeList) {
                rechargeList.querySelectorAll('.recharge-item:not(.membership)').forEach(el => {
                    el.style.borderColor = color;
                });
            }
        }, 10);
    }

    // ==========================================
    // BACK BUTTON from Products → correct modal
    // ==========================================
    if (backToId) {
        backToId.addEventListener('click', () => {
            if (rechargeModal) rechargeModal.classList.remove('active');
            if (currentGame === "FREE FIRE") {
                openFFTypeModal();
            } else {
                resetSelection();
            }
        });
    }

    function openCredentialsModal() {
        if (!credentialsModal || !themes[currentGame] || !selectedProduct) return;
        const theme = themes[currentGame];

        if (credModalTitle) { credModalTitle.innerText = currentGame; credModalTitle.style.color = theme.color; }
        if (credModalIcon) { credModalIcon.src = theme.icon; credModalIcon.style.borderColor = theme.color; }

        if (idCredSection)  idCredSection.style.display  = "block";
        if (idInputSectionBox)  idInputSectionBox.style.borderColor  = theme.color;
        if (idField) idField.value = "";
        validateIdInput();

        if (confirmIdBtn && themes[currentGame]) {
            confirmIdBtn.style.background = `linear-gradient(to bottom, ${theme.color}, ${theme.accent})`;
        }

        if (rechargeModal)    rechargeModal.classList.remove('active');
        credentialsModal.classList.add('active');
    }

    if (backFromCreds) {
        backFromCreds.addEventListener('click', () => {
            if (credentialsModal) credentialsModal.classList.remove('active');
            if (rechargeModal)    rechargeModal.classList.add('active');
        });
    }

    // ==========================================
    // INPUT VALIDATION
    // ==========================================
    function validateIdInput() {
        if (!confirmIdBtn) return;
        const valid = idField && idField.value.trim().length > 4;
        confirmIdBtn.disabled = !valid;
        confirmIdBtn.style.cursor = valid ? 'pointer' : 'not-allowed';
        confirmIdBtn.style.opacity = valid ? '1' : '0.5';
    }

    if (idField) idField.addEventListener('input', validateIdInput);

    // ==========================================
    // CONFIRM ID → checkout
    // ==========================================
    if (confirmIdBtn) {
        confirmIdBtn.addEventListener('click', () => {
            authenticatedUserMeta.rawId = idField ? idField.value.trim() : "";
            if (credentialsModal) credentialsModal.classList.remove('active');
            compileAndOpenCheckoutModal();
        });
    }

    // ==========================================
    // PRODUCT SELECTION — tap a product to buy it directly
    // ==========================================
    function resetSelection() {
        selectedProduct = null;
        authenticatedUserMeta = { rawId: "" };
    }

    function bindProductClickHandlers() {
        if (!rechargeList) return;
        rechargeList.querySelectorAll('.recharge-item').forEach(itemNode => {
            const pId = itemNode.getAttribute('data-id');
            if (!pId) return;
            itemNode.onclick = () => {
                const pName  = itemNode.getAttribute('data-name');
                const pPrice = parseFloat(itemNode.getAttribute('data-price')); // always EGP base
                selectedProduct = { id: pId, name: pName, price: pPrice, game: currentGame, method: currentMethod };
                openCredentialsModal();
            };
        });
    }

    // ==========================================
    // CHECKOUT MODAL — price shown in active currency
    // ==========================================
    function compileAndOpenCheckoutModal() {
        const basketContainer    = document.getElementById('basket-items-wrapper');
        const totalPriceSumNode  = document.getElementById('basket-total-price-sum');

        if (!selectedProduct) {
            alert("Please choose a product first.");
            return;
        }

        if (basketContainer) {
            basketContainer.innerHTML = "";
            const rowEl = document.createElement('div');
            rowEl.className = 'basket-summary-row';
            rowEl.innerHTML = `
                <div class="basket-item-info">
                    <div class="basket-item-title">${selectedProduct.name}</div>
                    <div class="basket-item-meta">Game: ${selectedProduct.game}</div>
                </div>
                <div class="basket-item-cost">${formatPrice(selectedProduct.price)}</div>
            `;
            basketContainer.appendChild(rowEl);
        }

        if (totalPriceSumNode) totalPriceSumNode.innerText = formatPrice(selectedProduct.price);
        if (checkoutModal) checkoutModal.classList.add('active');
    }

    if (backToRecharge) {
        backToRecharge.addEventListener('click', () => {
            if (checkoutModal)    checkoutModal.classList.remove('active');
            if (rechargeModal)    rechargeModal.classList.add('active');
        });
    }

    // ==========================================
    // CHECKOUT CONFIRM → TELEGRAM
    // ==========================================
    function bindCheckoutButton(btn) {
        if (!btn) return;
        btn.addEventListener('click', () => {
            let timerSeconds = 6;
            btn.disabled = true;
            btn.style.cursor = "not-allowed";
            btn.style.background = "#555";
            const intervalLoop = setInterval(() => {
                timerSeconds--;
                if (timerSeconds > 0) {
                    let textDots = ".".repeat(((6 - timerSeconds) % 3) + 1);
                    btn.innerText = `processing${textDots}`;
                } else {
                    clearInterval(intervalLoop);
                    executeOrderCompletion();
                }
            }, 1000);
            btn.innerText = "processing.";
        });
    }

    bindCheckoutButton(document.getElementById('checkout-btn'));

    function showCheckoutError(message) {
        if (checkoutActionCont) {
            checkoutActionCont.innerHTML = `
                <div class="checkout-error-block">⚠ ${message}</div>
                <button id="checkout-btn" class="blue-btn">TRY AGAIN</button>
            `;
            bindCheckoutButton(document.getElementById('checkout-btn'));
        }
    }

    function executeOrderCompletion() {
        if (!selectedProduct) return;

        // Telegram message always sends EGP price (base currency) for clarity
        const productLine = `🎮 [${selectedProduct.game}] - ${selectedProduct.name} -> (${selectedProduct.price} EGP)`;
        const orderTotal = selectedProduct.price;

        const userAccessInfoString = `🆔 Target Player ID: ${authenticatedUserMeta.rawId}`;

        const customerProfile = getSavedProfile();
        const customerInfoString = `👤 Customer: ${customerProfile.username || 'N/A'}\n📞 Contact: ${customerProfile.phone || customerProfile.email || 'N/A'}`;

        const botPayload = `🛒 NEW MARKET ORDER\n\n${customerInfoString}\n\n${userAccessInfoString}\n\n📦 ITEM:\n${productLine}\n\n💰 TOTAL: ${orderTotal} EGP`;
        const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

        fetch(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: botPayload })
        })
        .then(res => res.json().then(data => ({ ok: res.ok && data.ok, data })))
        .then(({ ok }) => {
            if (!ok) throw new Error('Telegram API rejected the message');

            // Order actually confirmed — now it's safe to show success and clear the selection
            if (successNotification) successNotification.style.display = "block";
            if (checkoutActionCont) checkoutActionCont.innerHTML = `<div class="done-status-block">✅ DONE</div>`;
            resetSelection();
            setTimeout(() => {
                if (checkoutModal)         checkoutModal.classList.remove('active');
                if (successNotification)   successNotification.style.display = "none";
                if (checkoutActionCont) {
                    checkoutActionCont.innerHTML = `<button id="checkout-btn" class="blue-btn">CONFIRM & COMPLETE CHECKOUT</button>`;
                    bindCheckoutButton(document.getElementById('checkout-btn'));
                }
            }, 20000);
        })
        .catch(err => {
            console.error("Order transmission failed:", err);
            showCheckoutError("Couldn't send your order. Please check your connection and try again, or contact us on WhatsApp.");
        });
    }

    // ==========================================
    // HORIZONTAL SCROLL FOR GAME CARDS
    // Works with: touch swipe (mobile/tablet), mouse click-drag (PC),
    // mouse wheel (PC trackpads/mice), and left/right arrow buttons.
    // ==========================================
    (function initGameGridHorizontalScroll() {
        const scrollTrack = document.getElementById('game-grid-scroll');
        const btnLeft = document.getElementById('game-scroll-left');
        const btnRight = document.getElementById('game-scroll-right');
        if (!scrollTrack) return;

        let isDown = false;
        let didDrag = false;
        let startX = 0;
        let startScrollLeft = 0;

        function beginDrag(clientX) {
            isDown = true;
            didDrag = false;
            startX = clientX;
            startScrollLeft = scrollTrack.scrollLeft;
            scrollTrack.classList.add('is-dragging');
        }

        function moveDrag(clientX) {
            if (!isDown) return;
            const delta = clientX - startX;
            if (Math.abs(delta) > 4) didDrag = true;
            scrollTrack.scrollLeft = startScrollLeft - delta;
        }

        function endDrag() {
            isDown = false;
            scrollTrack.classList.remove('is-dragging');
        }

        // Mouse drag (desktop / PC)
        scrollTrack.addEventListener('mousedown', (e) => {
            beginDrag(e.pageX);
        });
        window.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            moveDrag(e.pageX);
        });
        window.addEventListener('mouseup', endDrag);
        scrollTrack.addEventListener('mouseleave', () => { if (isDown) endDrag(); });

        // Prevent a click firing right after a drag (so cards don't open by accident)
        scrollTrack.addEventListener('click', (e) => {
            if (didDrag) {
                e.stopPropagation();
                e.preventDefault();
            }
        }, true);

        // Touch swipe (Android / iOS) — native overflow-x handles this already,
        // but we track drag state too so a swipe doesn't trigger a card tap.
        scrollTrack.addEventListener('touchstart', (e) => {
            if (e.touches && e.touches.length === 1) {
                startX = e.touches[0].clientX;
                startScrollLeft = scrollTrack.scrollLeft;
                didDrag = false;
            }
        }, { passive: true });

        scrollTrack.addEventListener('touchmove', (e) => {
            if (e.touches && e.touches.length === 1) {
                if (Math.abs(e.touches[0].clientX - startX) > 4) didDrag = true;
            }
        }, { passive: true });

        // Mouse wheel: convert vertical wheel movement into horizontal scroll (PC)
        scrollTrack.addEventListener('wheel', (e) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                scrollTrack.scrollLeft += e.deltaY;
            }
        }, { passive: false });

        // Arrow buttons
        function cardScrollDistance() {
            const firstCard = scrollTrack.querySelector('.game-card');
            const cardWidth = firstCard ? firstCard.getBoundingClientRect().width : 200;
            const gap = parseFloat(getComputedStyle(scrollTrack).columnGap) || 18;
            return cardWidth + gap; // card width + real (fluid) gap
        }

        if (btnLeft) {
            btnLeft.addEventListener('click', () => {
                scrollTrack.scrollBy({ left: -cardScrollDistance() * 2, behavior: 'smooth' });
            });
        }
        if (btnRight) {
            btnRight.addEventListener('click', () => {
                scrollTrack.scrollBy({ left: cardScrollDistance() * 2, behavior: 'smooth' });
            });
        }

        // Keyboard support (left/right arrow keys when the strip is focused)
        scrollTrack.setAttribute('tabindex', '0');
        scrollTrack.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') scrollTrack.scrollBy({ left: cardScrollDistance(), behavior: 'smooth' });
            if (e.key === 'ArrowLeft') scrollTrack.scrollBy({ left: -cardScrollDistance(), behavior: 'smooth' });
        });
    })();

    // ==========================================
    // GAME CARD CLICK EVENTS
    // ==========================================
    const ffCard = document.querySelector('#home-content-section .ff-card');
    if (ffCard) ffCard.addEventListener('click', () => {
        currentGame = "FREE FIRE";
        openFFTypeModal();
    });

    const pubgCard = document.querySelector('#home-content-section .pubg-card');
    if (pubgCard) pubgCard.addEventListener('click', () => { currentGame = "PUBG"; openProductsDirectly(); });

    const codCard = document.querySelector('#home-content-section .cod-card');
    if (codCard) codCard.addEventListener('click', () => { currentGame = "CALL OF DUTY"; openProductsDirectly(); });

    const fifaCard = document.querySelector('#home-content-section .fifa-card');
    if (fifaCard) fifaCard.addEventListener('click', () => { currentGame = "FIFA MOBILE"; openProductsDirectly(); });

    const pesCard = document.querySelector('#home-content-section .pes-card');
    if (pesCard) pesCard.addEventListener('click', () => { currentGame = "PES MOBILE"; openProductsDirectly(); });

    const bsCard = document.querySelector('#home-content-section .bs-card');
    if (bsCard) bsCard.addEventListener('click', () => { currentGame = "BLOOD STRIKE"; openProductsDirectly(); });

    // ==========================================
    // SUPPORT / FEEDBACK SUBMIT → TELEGRAM
    // ==========================================
    const feedbackSubmitBtn  = document.getElementById('feedback-submit-btn');
    const feedbackTextarea   = document.getElementById('feedback-textarea-field');
    const feedbackInputBox   = document.getElementById('feedback-input-box');
    const feedbackThanksBox  = document.getElementById('feedback-thanks-box');

    if (feedbackSubmitBtn && feedbackTextarea) {
        feedbackSubmitBtn.addEventListener('click', () => {
            const msg = feedbackTextarea.value.trim();
            if (!msg) {
                feedbackTextarea.style.borderColor = '#ff3333';
                feedbackTextarea.focus();
                return;
            }
            feedbackTextarea.style.borderColor = '';

            // Disable button and show sending state
            feedbackSubmitBtn.disabled = true;
            feedbackSubmitBtn.textContent = 'Sending...';
            feedbackSubmitBtn.style.opacity = '0.6';
            feedbackSubmitBtn.style.cursor = 'not-allowed';

            const payload = `💬 FEEDBACK / SUPPORT MESSAGE\n\n${msg}`;
            const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

            fetch(telegramApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: payload })
            })
            .then(res => res.json())
            .then(data => {
                if (data.ok) {
                    // Success — show thanks box
                    if (feedbackInputBox)  feedbackInputBox.style.display  = 'none';
                    if (feedbackThanksBox) feedbackThanksBox.style.display = 'flex';
                    feedbackTextarea.value = '';
                    // Reset after 5 seconds so user can send another message
                    setTimeout(() => {
                        if (feedbackInputBox)  feedbackInputBox.style.display  = 'block';
                        if (feedbackThanksBox) feedbackThanksBox.style.display = 'none';
                        feedbackSubmitBtn.disabled = false;
                        feedbackSubmitBtn.textContent = 'SUBMIT';
                        feedbackSubmitBtn.style.opacity = '1';
                        feedbackSubmitBtn.style.cursor = 'pointer';
                    }, 5000);
                } else {
                    throw new Error('Telegram API error');
                }
            })
            .catch(() => {
                feedbackSubmitBtn.disabled = false;
                feedbackSubmitBtn.textContent = 'SUBMIT';
                feedbackSubmitBtn.style.opacity = '1';
                feedbackSubmitBtn.style.cursor = 'pointer';
                feedbackTextarea.style.borderColor = '#ff3333';
                alert('Failed to send. Please try again or contact us directly on WhatsApp.');
            });
        });
    }

    // ==========================================
    // ==========================================
    // LIGHT / DARK THEME TOGGLE (2-in-1 button)
    // ==========================================
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeColorMeta  = document.querySelector('meta[name="theme-color"]');

    function applyThemeColorMeta(theme) {
        if (themeColorMeta) {
            themeColorMeta.setAttribute('content', theme === 'light' ? '#f4f5f7' : '#0a0a0a');
        }
    }

    // Sync the meta tag with whatever theme the inline <head> script already applied
    applyThemeColorMeta(document.documentElement.getAttribute('data-theme') || 'dark');

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
            const next = current === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('shetos_theme', next);
            applyThemeColorMeta(next);
        });
    }

    // ==========================================================
    // HUB NAVIGATION: 2 large boxes → games  |  selling accounts
    // ==========================================================
    const hubSection      = document.getElementById('hub-section');
    const gamesSection    = document.getElementById('home-content-section');
    const accountsSection = document.getElementById('accounts-section');
    const searchWrapEl    = document.querySelector('.top-search-wrap');

    function showView(view) {
        if (hubSection)      hubSection.style.display      = view === 'hub'      ? '' : 'none';
        if (gamesSection)    gamesSection.style.display    = view === 'games'    ? '' : 'none';
        if (accountsSection) accountsSection.style.display = view === 'accounts' ? '' : 'none';
        // The search bar only makes sense for the games list
        if (searchWrapEl) searchWrapEl.classList.toggle('is-hidden', view !== 'games');
        window.scrollTo({ top: 0 });
        if (view === 'accounts') loadAccounts();
    }
    showView('hub');

    document.getElementById('hub-games-box')?.addEventListener('click', () => showView('games'));
    document.getElementById('hub-accounts-box')?.addEventListener('click', () => showView('accounts'));
    document.querySelectorAll('[data-hub-back]').forEach(b => b.addEventListener('click', () => showView('hub')));

    // ==========================================================
    // SELLING ACCOUNTS MARKETPLACE
    // ----------------------------------------------------------
    // To share accounts between ALL customers, put the URL of a
    // Firebase Realtime Database below (see the notes I sent you).
    // While it is empty, accounts are stored only in this browser.
    // ==========================================================
    const ACCOUNTS_DB_URL = 'https://shetosstore-90413-default-rtdb.europe-west1.firebasedatabase.app';
    const MAX_PHOTOS = 10;
    const MY_ACCOUNTS_KEY = 'shetos_my_accounts';
    const LOCAL_META_KEY  = 'shetos_local_acc_meta';
    const LOCAL_PHOTO_KEY = 'shetos_local_acc_photos_';

    const dbBase = ACCOUNTS_DB_URL.replace(/\/+$/, '');

    const isMine = (acc) => !!acc && !!acc.owner && acc.owner === (localStorage.getItem('shetos_session') || '');
    function getMyAccounts() {
        try { return JSON.parse(localStorage.getItem(MY_ACCOUNTS_KEY)) || {}; } catch (e) { return {}; }
    }
    function setMyAccounts(obj) { localStorage.setItem(MY_ACCOUNTS_KEY, JSON.stringify(obj)); }

    async function dbListAccounts() {
        if (dbBase) {
            const res = await fetch(`${dbBase}/accounts_meta.json`);
            if (!res.ok) throw new Error('list failed');
            const data = await res.json();
            return data ? Object.values(data) : [];
        }
        try { return Object.values(JSON.parse(localStorage.getItem(LOCAL_META_KEY)) || {}); } catch (e) { return []; }
    }
    async function dbGetPhotos(id) {
        if (dbBase) {
            const res = await fetch(`${dbBase}/account_photos/${id}.json`);
            if (!res.ok) throw new Error('photos failed');
            const data = await res.json();
            return Array.isArray(data) ? data.filter(Boolean) : (data ? Object.values(data) : []);
        }
        try { return JSON.parse(localStorage.getItem(LOCAL_PHOTO_KEY + id)) || []; } catch (e) { return []; }
    }
    async function dbSaveAccount(meta, photos) {
        if (dbBase) {
            const r1 = await fetch(`${dbBase}/account_photos/${meta.id}.json`, { method: 'PUT', body: JSON.stringify(photos) });
            if (!r1.ok) throw new Error('save photos failed');
            const r2 = await fetch(`${dbBase}/accounts_meta/${meta.id}.json`, { method: 'PUT', body: JSON.stringify(meta) });
            if (!r2.ok) throw new Error('save meta failed');
            return;
        }
        const all = (() => { try { return JSON.parse(localStorage.getItem(LOCAL_META_KEY)) || {}; } catch (e) { return {}; } })();
        all[meta.id] = meta;
        localStorage.setItem(LOCAL_PHOTO_KEY + meta.id, JSON.stringify(photos)); // may throw if storage is full
        localStorage.setItem(LOCAL_META_KEY, JSON.stringify(all));
    }
    async function dbDeleteAccount(id) {
        if (dbBase) {
            await fetch(`${dbBase}/accounts_meta/${id}.json`, { method: 'DELETE' });
            await fetch(`${dbBase}/account_photos/${id}.json`, { method: 'DELETE' });
            return;
        }
        const all = (() => { try { return JSON.parse(localStorage.getItem(LOCAL_META_KEY)) || {}; } catch (e) { return {}; } })();
        delete all[id];
        localStorage.setItem(LOCAL_META_KEY, JSON.stringify(all));
        localStorage.removeItem(LOCAL_PHOTO_KEY + id);
    }

    // ---------- image helpers ----------
    function resizeImageFile(fileOrDataUrl, maxSide, quality) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
                const canvas = document.createElement('canvas');
                canvas.width  = Math.max(1, Math.round(img.width * scale));
                canvas.height = Math.max(1, Math.round(img.height * scale));
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', quality));
                if (typeof fileOrDataUrl !== 'string') URL.revokeObjectURL(img.src);
            };
            img.onerror = () => reject(new Error('bad image'));
            img.src = typeof fileOrDataUrl === 'string' ? fileOrDataUrl : URL.createObjectURL(fileOrDataUrl);
        });
    }
    const isSafeImg = (s) => typeof s === 'string' && s.startsWith('data:image/');

    // ---------- accounts list ----------
    var accountsReady = false; // var on purpose (read by applyLanguage before this point runs)
    let accountsCache = [];
    const accountsGrid   = document.getElementById('accounts-grid');
    const accountsStatus = document.getElementById('accounts-status');

    function setAccountsStatus(text) {
        if (!accountsStatus) return;
        accountsStatus.textContent = text || '';
        accountsStatus.style.display = text ? 'block' : 'none';
    }

    async function loadAccounts() {
        accountsReady = true;
        setAccountsStatus(t('loading'));
        try {
            accountsCache = (await dbListAccounts()).filter(a => a && a.id);
            accountsCache.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            renderAccounts();
        } catch (e) {
            if (accountsGrid) accountsGrid.innerHTML = '';
            setAccountsStatus(t('loadError'));
        }
    }

    function renderAccounts() {
        if (!accountsGrid) return;
        accountsGrid.innerHTML = '';
        setAccountsStatus(accountsCache.length ? '' : t('noAccounts'));
        accountsCache.forEach(acc => {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'account-card';
            if (isSafeImg(acc.cover)) card.style.backgroundImage = `url("${acc.cover}")`;

            const shade = document.createElement('div');
            shade.className = 'account-card-shade';

            const title = document.createElement('div');
            title.className = 'account-card-title';
            title.textContent = t('accountForSelling');

            const meta = document.createElement('div');
            meta.className = 'account-card-meta';
            const g = document.createElement('span'); g.textContent = acc.game || '';
            const p = document.createElement('span'); p.textContent = formatPrice(Number(acc.price) || 0);
            meta.append(g, p);

            shade.append(title, meta);
            card.appendChild(shade);

            if (isMine(acc)) {
                const badge = document.createElement('span');
                badge.className = 'account-card-mine';
                badge.textContent = t('yours');
                card.appendChild(badge);
            }
            card.addEventListener('click', () => openAccountDetail(acc));
            accountsGrid.appendChild(card);
        });
    }

    // ---------- account details ----------
    const accountModal  = document.getElementById('account-modal');
    const accMainPhoto  = document.getElementById('acc-main-photo');
    const accThumbs     = document.getElementById('acc-thumbs');
    const accCounter    = document.getElementById('acc-photo-counter');
    const accPrev       = document.getElementById('acc-prev');
    const accNext       = document.getElementById('acc-next');
    const accDeleteBtn  = document.getElementById('acc-delete-btn');
    let accPhotos = [];
    let accIndex  = 0;
    let accOpenId = null;

    function showAccPhoto(i) {
        if (!accPhotos.length) { accMainPhoto.removeAttribute('src'); accCounter.textContent = ''; return; }
        accIndex = (i + accPhotos.length) % accPhotos.length;
        accMainPhoto.src = accPhotos[accIndex];
        accCounter.textContent = `${accIndex + 1}/${accPhotos.length}`;
        accThumbs.querySelectorAll('.acc-thumb').forEach((el, idx) => el.classList.toggle('active', idx === accIndex));
        const multi = accPhotos.length > 1;
        accPrev.style.display = accNext.style.display = multi ? '' : 'none';
    }

    async function openAccountDetail(acc) {
        accOpenId = acc.id;
        accOpenData = acc;
        document.getElementById('acc-game').textContent  = acc.game || '';
        document.getElementById('acc-price').textContent = formatPrice(Number(acc.price) || 0);
        document.getElementById('acc-info').textContent  = acc.info || '-';
        const phoneLink = document.getElementById('acc-phone');
        phoneLink.textContent = acc.phone || '';
        phoneLink.href = PHONE_REGEX.test(acc.phone || '') ? `https://wa.me/20${acc.phone.slice(1)}` : '#';
        accDeleteBtn.style.display = isMine(acc) ? '' : 'none';

        // show the cover instantly, then load every photo
        accPhotos = isSafeImg(acc.cover) ? [acc.cover] : [];
        accThumbs.innerHTML = '';
        showAccPhoto(0);
        accountModal.classList.add('active');

        try {
            const photos = (await dbGetPhotos(acc.id)).filter(isSafeImg);
            if (accOpenId !== acc.id) return;
            if (photos.length) accPhotos = photos;
            accThumbs.innerHTML = '';
            accPhotos.forEach((src, idx) => {
                const th = document.createElement('img');
                th.src = src; th.className = 'acc-thumb'; th.alt = '';
                th.addEventListener('click', () => showAccPhoto(idx));
                accThumbs.appendChild(th);
            });
            showAccPhoto(0);
        } catch (e) { /* cover stays visible */ }
    }

    let accOpenData = null;
    document.getElementById('acc-phone')?.addEventListener('click', () => {
        if (accOpenData) notifyBuyInterest(accOpenData);
    });

    accPrev?.addEventListener('click', () => showAccPhoto(accIndex - 1));
    accNext?.addEventListener('click', () => showAccPhoto(accIndex + 1));
    document.getElementById('close-account-modal')?.addEventListener('click', () => {
        accountModal.classList.remove('active'); accOpenId = null;
    });

    accDeleteBtn?.addEventListener('click', async () => {
        if (!accOpenId || !isMine(accOpenData)) return;
        if (!confirm(t('confirmDelete'))) return;
        accDeleteBtn.disabled = true;
        try {
            await dbDeleteAccount(accOpenId);
            const mine = getMyAccounts(); delete mine[accOpenId]; setMyAccounts(mine);
            accountModal.classList.remove('active'); accOpenId = null;
            loadAccounts();
        } catch (e) {
            alert(t('deleteError'));
        }
        accDeleteBtn.disabled = false;
    });

    // ---------- Telegram notifications for the marketplace ----------
    function tgSendText(text) {
        return fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text }),
            keepalive: true
        }).catch(() => {});
    }

    async function tgSendPhoto(dataUrl, caption) {
        try {
            const blob = await (await fetch(dataUrl)).blob();
            const fd = new FormData();
            fd.append('chat_id', TELEGRAM_CHAT_ID);
            fd.append('caption', caption.slice(0, 1000));
            fd.append('photo', blob, 'account.jpg');
            const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`, { method: 'POST', body: fd });
            const data = await res.json();
            if (!data.ok) throw new Error('photo rejected');
        } catch (e) {
            tgSendText(caption); // fall back to a plain text message
        }
    }

    function customerLine() {
        const c = getSavedProfile();
        return `👤 ${c.username || 'N/A'}\n📞 ${c.phone || c.email || 'N/A'}`;
    }

    function notifyAccountAdded(meta, photoCount) {
        const text = `🆕 ACCOUNT ADDED FOR SALE\n\n` +
            `🎮 Game: ${meta.game}\n💰 Price: ${meta.price} EGP\n` +
            `📞 Seller phone: ${meta.phone}\n📸 Photos: ${photoCount}\n` +
            `📝 Info: ${meta.info || '-'}\n\n` +
            `👤 Added by (profile):\n${customerLine()}\n\n🔑 ID: ${meta.id}`;
        tgSendPhoto(meta.cover, text);
    }

    function notifyBuyInterest(acc) {
        const text = `🛒 CUSTOMER WANTS TO BUY AN ACCOUNT\n\n` +
            `🎮 Game: ${acc.game}\n💰 Price: ${acc.price} EGP\n` +
            `📞 Seller phone: ${acc.phone}\n🔑 ID: ${acc.id}\n\n` +
            `👤 Buyer (profile):\n${customerLine()}`;
        tgSendText(text);
    }

    // ---------- sell page (receipt) ----------
    const sellPage      = document.getElementById('sell-page');
    const sellPhotoIn   = document.getElementById('sell-photo-input');
    const sellThumbs    = document.getElementById('sell-thumbs');
    const sellCount     = document.getElementById('sell-photo-count');
    const cameraAddBtn  = document.getElementById('camera-add-btn');
    const cameraBox     = document.getElementById('camera-box');
    const sellPhone     = document.getElementById('sell-phone');
    const sellPrice     = document.getElementById('sell-price');
    const sellInfo      = document.getElementById('sell-info');
    const sellGame      = document.getElementById('sell-game');
    const sellError     = document.getElementById('sell-error');
    const sellSaveBtn   = document.getElementById('sell-save-btn');
    let sellPhotos = []; // compressed data URLs, first one = cover

    function showSellError(msg) {
        if (!sellError) return;
        sellError.textContent = msg || '';
        sellError.classList.toggle('show', !!msg);
    }

    function renderSellThumbs() {
        sellThumbs.innerHTML = '';
        sellPhotos.forEach((src, idx) => {
            const cell = document.createElement('div');
            cell.className = 'sell-thumb';
            const img = document.createElement('img'); img.src = src; img.alt = '';
            const rm = document.createElement('button');
            rm.type = 'button'; rm.className = 'sell-thumb-remove'; rm.textContent = '×';
            rm.setAttribute('aria-label', 'Remove');
            rm.addEventListener('click', () => { sellPhotos.splice(idx, 1); renderSellThumbs(); });
            cell.append(img, rm);
            if (idx === 0) {
                const tag = document.createElement('span');
                tag.className = 'sell-thumb-cover'; tag.textContent = t('cover');
                cell.appendChild(tag);
            }
            sellThumbs.appendChild(cell);
        });
        sellCount.textContent = sellPhotos.length;
        cameraBox.classList.toggle('has-photos', sellPhotos.length > 0);
        cameraAddBtn.style.display = sellPhotos.length >= MAX_PHOTOS ? 'none' : '';
    }

    cameraAddBtn?.addEventListener('click', () => sellPhotoIn.click());

    sellPhotoIn?.addEventListener('change', async () => {
        const files = Array.from(sellPhotoIn.files || []).filter(f => f.type.startsWith('image/'));
        sellPhotoIn.value = '';
        const room = MAX_PHOTOS - sellPhotos.length;
        if (files.length > room) showSellError(t('maxPhotos'));
        else showSellError('');
        for (const f of files.slice(0, Math.max(room, 0))) {
            try { sellPhotos.push(await resizeImageFile(f, 900, 0.6)); } catch (e) { /* skip unreadable file */ }
        }
        renderSellThumbs();
    });

    sellPhone?.addEventListener('input', () => {
        sellPhone.value = sellPhone.value.replace(/[^0-9]/g, '').slice(0, 11);
    });

    function resetSellForm() {
        sellPhotos = [];
        [sellPhone, sellPrice, sellInfo, sellGame].forEach(el => { if (el) el.value = ''; });
        showSellError('');
        renderSellThumbs();
    }

    function openSellPage() {
        // pre-fill the phone from the customer's profile (they can change it)
        if (sellPhone && !sellPhone.value) sellPhone.value = getSavedProfile().phone || '';
        sellPage.style.display = 'block';
        sellPage.scrollTop = 0;
        document.body.style.overflow = 'hidden';
    }
    function closeSellPage() {
        sellPage.style.display = 'none';
        document.body.style.overflow = '';
        document.body.style.overflowX = 'hidden';
    }

    document.getElementById('open-sell-page-btn')?.addEventListener('click', openSellPage);
    document.getElementById('close-sell-page')?.addEventListener('click', closeSellPage);

    sellSaveBtn?.addEventListener('click', async () => {
        const phone = sellPhone.value.trim();
        const price = parseFloat(sellPrice.value);
        const game  = sellGame.value.trim();
        const info  = sellInfo.value.trim();

        if (!sellPhotos.length)        return showSellError(t('errPhotos'));
        if (!PHONE_REGEX.test(phone))  return showSellError(t('errPhone'));
        if (!(price > 0))              return showSellError(t('errPrice'));
        if (!game)                     return showSellError(t('errGame'));
        showSellError('');

        sellSaveBtn.disabled = true;
        sellSaveBtn.textContent = t('saving');
        try {
            const cover = await resizeImageFile(sellPhotos[0], 420, 0.6); // light thumbnail for the list
            const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
            const meta = { id, phone, price, game, info, cover, owner: localStorage.getItem('shetos_session') || '', createdAt: Date.now() };
            await dbSaveAccount(meta, sellPhotos);

            const mine = getMyAccounts(); mine[id] = true; setMyAccounts(mine);
            notifyAccountAdded(meta, sellPhotos.length);
            resetSellForm();
            closeSellPage();
            showView('accounts');
        } catch (e) {
            console.error('Save account failed:', e);
            showSellError(t('errSave'));
        }
        sellSaveBtn.disabled = false;
        sellSaveBtn.textContent = t('save');
    });

    renderSellThumbs();

    // ==========================================================
    // ACCOUNTS: LOGIN / SIGN UP  (name+phone  or  name+email)
    // ----------------------------------------------------------
    // Accounts live in Firebase under  /users/<key>
    //   phone account key : p_01xxxxxxxxx
    //   email account key : e_<hex of the lower-cased email>
    // ==========================================================

    // ---- WhatsApp number check (no code is sent any more) ------------
    // On sign up we only ask a small SERVER whether the phone number has a WhatsApp account.
    // The server must answer  POST <WA_CHECK_URL>/check  { phone: "201012345678" }
    //   ->  { ok: true, exists: true | false }
    const WA_CHECK_URL      = 'https://calm-voice-d016.adam-abdelqawy.workers.dev'; // empty = check is skipped
    const WA_CHECK_ON_LOGIN = false; // login already matches an existing account, so only sign up is checked
    const waCheckEnabled    = () => !!WA_CHECK_URL;

    const SESSION_KEY = 'shetos_session';
    const getSession  = () => localStorage.getItem(SESSION_KEY) || '';

    const AUTH_T = {
        en: {
            headLogin: "Login to your account", headSignup: "Create your account", headBack: "Welcome back",
            tabLogin: "Login", tabSignup: "Sign up",
            byPhone: "📱 Name + Phone", byEmail: "✉️ Name + Email",
            phName: "Enter your name", phPhone: "Phone number (01xxxxxxxxx)", phEmail: "Email",
            btnLogin: "Login", btnSignup: "Sign up", checking: "Checking...",
            errName: "Please enter your name.",
            errPhoneFmt: "Sorry, this is a wrong phone number.",
            errNotWA: "Sorry, this is a wrong phone number (it is not on WhatsApp).",
            errEmail: "Sorry, this is not an email.",
            errExists: "Sorry, but this account is already logged in. Sign up with another one.",
            errNoAccount: "No account found with this data. Please sign up first.",
            errWrong: "Wrong name or phone/email. Please try again.",
            errNet: "Connection problem. Please try again.",
            welcomeBack: "Welcome back", welcomeNew: "Welcome", loggedOut: "You have been logged out",
            nameSaved: "✔ Name saved", nameEmpty: "Name cannot be empty"
        },
        ar: {
            headLogin: "سجّل الدخول إلى حسابك", headSignup: "أنشئ حسابك", headBack: "مرحبًا بعودتك",
            tabLogin: "تسجيل الدخول", tabSignup: "إنشاء حساب",
            byPhone: "📱 الاسم + الهاتف", byEmail: "✉️ الاسم + الإيميل",
            phName: "اكتب اسمك", phPhone: "رقم الهاتف (01xxxxxxxxx)", phEmail: "الإيميل",
            btnLogin: "دخول", btnSignup: "إنشاء حساب", checking: "جاري التحقق...",
            errName: "من فضلك اكتب اسمك.",
            errPhoneFmt: "عذرًا، رقم الهاتف غير صحيح.",
            errNotWA: "عذرًا، رقم الهاتف غير صحيح (غير موجود على واتساب).",
            errEmail: "عذرًا، هذا ليس إيميلًا.",
            errExists: "عذرًا، هذا الحساب مسجّل دخول بالفعل. سجّل بحساب آخر.",
            errNoAccount: "لا يوجد حساب بهذه البيانات. أنشئ حسابًا أولًا.",
            errWrong: "الاسم أو الهاتف/الإيميل غير صحيح. حاول مرة أخرى.",
            errNet: "مشكلة في الاتصال. حاول مرة أخرى.",
            welcomeBack: "مرحبًا بعودتك", welcomeNew: "أهلًا بك", loggedOut: "تم تسجيل الخروج",
            nameSaved: "✔ تم حفظ الاسم", nameEmpty: "الاسم لا يمكن أن يكون فارغًا"
        }
    };
    function at(key) {
        const lang = localStorage.getItem('shetos_language') === 'ar' ? 'ar' : 'en';
        return AUTH_T[lang][key] ?? AUTH_T.en[key];
    }

    // ---- validation helpers ----
    const normName  = (s) => s.trim().replace(/\s+/g, ' ').toLowerCase();
    function isValidEmail(e) {
        // must contain exactly one "@" with text before and after it, and no spaces
        return /^[^\s@]+@[^\s@]+$/.test(e);
    }
    const hexOf = (str) => Array.from(new TextEncoder().encode(str)).map(b => b.toString(16).padStart(2, '0')).join('');
    const keyForPhone = (phone) => 'p_' + phone;
    const keyForEmail = (email) => 'e_' + hexOf(email.toLowerCase());

    // ---- users database (Firebase, with a local fallback) ----
    const LOCAL_USERS_KEY = 'shetos_local_users';
    const localUsers = () => { try { return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY)) || {}; } catch (e) { return {}; } };

    async function userGet(key) {
        if (dbBase) {
            const res = await fetch(`${dbBase}/users/${key}.json`);
            if (!res.ok) throw new Error('get user failed');
            return res.json();
        }
        return localUsers()[key] || null;
    }
    async function userCreate(key, record) {
        if (dbBase) {
            const res = await fetch(`${dbBase}/users/${key}.json`, { method: 'PUT', body: JSON.stringify(record) });
            if (!res.ok) throw new Error('create user failed');
            return;
        }
        const all = localUsers(); all[key] = record;
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(all));
    }
    async function userPatch(key, fields) {
        if (dbBase) {
            const res = await fetch(`${dbBase}/users/${key}.json`, { method: 'PATCH', body: JSON.stringify(fields) });
            if (!res.ok) throw new Error('update user failed');
            return;
        }
        const all = localUsers(); all[key] = Object.assign(all[key] || {}, fields);
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(all));
    }

    // ---- session ----
    function startSession(key, rec) {
        localStorage.setItem(SESSION_KEY, key);
        saveProfile(rec.name, rec.phone || '', rec.email || '');
    }
    function endSession() {
        localStorage.removeItem(SESSION_KEY);
        ['shetos_username', 'shetos_phone', 'shetos_email'].forEach(k => localStorage.removeItem(k));
    }

    // ---- confetti / welcome effect ----
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function launchConfetti(canvas, durationMs) {
        const ctx = canvas.getContext && canvas.getContext('2d');
        if (!ctx || reduceMotion) return;
        const W = canvas.width = window.innerWidth;
        const H = canvas.height = window.innerHeight;
        const colors = ['#ff6600', '#ffb067', '#00a2ff', '#ffffff', '#25D366', '#ffd700'];
        const parts = Array.from({ length: 140 }, () => ({
            x: W / 2 + (Math.random() - 0.5) * 120, y: H * 0.45,
            vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 13 - 4,
            size: 5 + Math.random() * 6, rot: Math.random() * 6,
            vr: (Math.random() - 0.5) * 0.4, color: colors[Math.floor(Math.random() * colors.length)]
        }));
        const t0 = performance.now();
        (function frame(now) {
            const elapsed = now - t0;
            ctx.clearRect(0, 0, W, H);
            parts.forEach(p => {
                p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
                ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
                ctx.globalAlpha = Math.max(0, 1 - elapsed / durationMs);
                ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                ctx.restore();
            });
            if (elapsed < durationMs) requestAnimationFrame(frame); else ctx.clearRect(0, 0, W, H);
        })(t0);
    }

    function playWelcome(title, name) {
        return new Promise(resolve => {
            const fx = document.createElement('div');
            fx.className = 'welcome-fx';
            const canvas = document.createElement('canvas');
            canvas.className = 'welcome-fx-canvas';
            const h = document.createElement('div'); h.className = 'welcome-fx-title'; h.textContent = title;
            const n = document.createElement('div'); n.className = 'welcome-fx-name';  n.textContent = name;
            fx.append(canvas, h, n);
            document.body.appendChild(fx);
            launchConfetti(canvas, 2200);
            setTimeout(() => { fx.classList.add('out'); }, 2100);
            setTimeout(() => { fx.remove(); resolve(); }, 2600);
        });
    }

    // ---- auth screen ----
    const authPage    = document.getElementById('profile-setup-page');
    const authHeading = document.getElementById('auth-heading');
    const authTabLogin  = document.getElementById('auth-tab-login');
    const authTabSignup = document.getElementById('auth-tab-signup');
    const authMethodPhone = document.getElementById('auth-method-phone');
    const authMethodEmail = document.getElementById('auth-method-email');
    const authName  = document.getElementById('auth-name');
    const authPhone = document.getElementById('auth-phone');
    const authEmail = document.getElementById('auth-email');
    const authError = document.getElementById('auth-error');
    const authSubmit = document.getElementById('auth-submit');
    let authMode = 'login';    // 'login' | 'signup'
    let authMethod = 'phone';  // 'phone' | 'email'
    let authBusy = false;
    let cameBackFromLogout = false;

    function showAuthError(msg) {
        authError.textContent = msg || '';
        authError.classList.toggle('show', !!msg);
        const field = authMethod === 'phone' ? authPhone : authEmail;
        [authName, authPhone, authEmail].forEach(f => f.classList.remove('field-invalid'));
        if (msg) field.classList.add('field-invalid');
    }

    function renderAuth() {
        authHeading.textContent = cameBackFromLogout && authMode === 'login'
            ? at('headBack') + ' 👋' : (authMode === 'login' ? at('headLogin') : at('headSignup'));
        authHeading.classList.toggle('welcome-back-heading', cameBackFromLogout && authMode === 'login');
        authTabLogin.textContent  = at('tabLogin');
        authTabSignup.textContent = at('tabSignup');
        authTabLogin.classList.toggle('active',  authMode === 'login');
        authTabSignup.classList.toggle('active', authMode === 'signup');
        authMethodPhone.textContent = at('byPhone');
        authMethodEmail.textContent = at('byEmail');
        authMethodPhone.classList.toggle('active', authMethod === 'phone');
        authMethodEmail.classList.toggle('active', authMethod === 'email');
        authName.placeholder  = at('phName');
        authPhone.placeholder = at('phPhone');
        authEmail.placeholder = at('phEmail');
        authPhone.style.display = authMethod === 'phone' ? '' : 'none';
        authEmail.style.display = authMethod === 'email' ? '' : 'none';
        authSubmit.textContent = authMode === 'login' ? at('btnLogin') : at('btnSignup');
        showAuthError('');
    }

    async function submitAuth() {
        if (authBusy) return;
        const name  = authName.value.trim().replace(/\s+/g, ' ');
        const phone = authPhone.value.trim();
        const email = authEmail.value.trim();

        // 1) local checks first (fast, no network)
        if (!name) { showAuthError(at('errName')); authName.classList.add('field-invalid'); return; }
        if (authMethod === 'phone' && !PHONE_REGEX.test(phone)) return showAuthError(at('errPhoneFmt'));
        if (authMethod === 'email' && !isValidEmail(email))     return showAuthError(at('errEmail'));

        authBusy = true; authSubmit.disabled = true; authSubmit.textContent = at('checking');
        showAuthError('');
        try {
            // 2) look the account up BEFORE sending any code (no code is wasted on a wrong login)
            const key = authMethod === 'phone' ? keyForPhone(phone) : keyForEmail(email);
            const existing = await userGet(key);
            if (authMode === 'signup' && existing) return showAuthError(at('errExists'));
            if (authMode === 'login') {
                if (!existing) return showAuthError(at('errNoAccount'));
                if (normName(existing.name || '') !== normName(name)) return showAuthError(at('errWrong'));
            }
            const ctx = { mode: authMode, method: authMethod, key, name, phone, email, existing };

            // 3) phone accounts: make sure the number is on WhatsApp (no code, just a check)
            if (authMethod === 'phone' && waCheckEnabled() && (authMode === 'signup' || WA_CHECK_ON_LOGIN)) {
                const r = await waCheck(phone);
                if (!r.ok) return showAuthError(r.error === 'not_on_whatsapp' ? at('errNotWA') : at('errNet'));
            }
            await completeAuth(ctx);
        } catch (e) {
            console.error('Auth failed:', e);
            showAuthError(at('errNet'));
        } finally {
            authBusy = false; authSubmit.disabled = false;
            authSubmit.textContent = authMode === 'login' ? at('btnLogin') : at('btnSignup');
        }
    }

    // creates the account (sign up) or just opens the session (login)
    async function completeAuth(ctx) {
        if (ctx.mode === 'signup') {
            const record = { name: ctx.name, method: ctx.method, createdAt: Date.now() };
            if (ctx.method === 'phone') record.phone = ctx.phone; else record.email = ctx.email.toLowerCase();
            await userCreate(ctx.key, record);
            startSession(ctx.key, record);
            await finishAuth(at('welcomeNew'), ctx.name);
        } else {
            startSession(ctx.key, ctx.existing);
            await finishAuth(at('welcomeBack'), ctx.existing.name);
        }
    }

    async function finishAuth(title, name) {
        await playWelcome(title + ',', name);
        if (authPage) authPage.remove();
        runIntroThenStore();
    }

    function bindAuthScreen() {
        authTabLogin.addEventListener('click',  () => { authMode = 'login';  renderAuth(); });
        authTabSignup.addEventListener('click', () => { authMode = 'signup'; renderAuth(); });
        authMethodPhone.addEventListener('click', () => { authMethod = 'phone'; renderAuth(); });
        authMethodEmail.addEventListener('click', () => { authMethod = 'email'; renderAuth(); });
        authPhone.addEventListener('input', () => {
            authPhone.value = authPhone.value.replace(/[^0-9]/g, '').slice(0, 11);
            if (authError.classList.contains('show')) showAuthError('');
        });
        [authName, authEmail].forEach(f => f.addEventListener('input', () => {
            if (authError.classList.contains('show')) showAuthError('');
        }));
        [authName, authPhone, authEmail].forEach(f => f.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') submitAuth();
        }));
        authSubmit.addEventListener('click', submitAuth);
    }

    // ==========================================================
    // WHATSAPP NUMBER CHECK
    // ==========================================================
    const waNumber = (phone) => '20' + phone.slice(1); // 01012345678 -> 201012345678

    async function waCheck(phone) {
        try {
            const res = await fetch(WA_CHECK_URL.replace(/\/+$/, '') + '/check', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: waNumber(phone) })
            });
            const d = await res.json();
            if (d && d.exists === true) return { ok: true };
            if (d && (d.exists === false || d.error === 'not_on_whatsapp')) return { ok: false, error: 'not_on_whatsapp' };
            return { ok: false, error: 'network' };
        } catch (e) { return { ok: false, error: 'network' }; }
    }

    // ---- entry point: already logged in → go on, otherwise show the auth screen ----
    function startAuthGate() {
        const key = getSession();
        const p = getSavedProfile();
        if (key && p.username) {
            if (authPage) authPage.remove();
            runIntroThenStore();
            // quietly make sure the account still exists in the database
            userGet(key).then(rec => {
                if (rec === null) { endSession(); location.reload(); }
                else if (rec && rec.name && rec.name !== p.username) { saveProfile(rec.name, rec.phone || '', rec.email || ''); loadProfileIntoSettings(); }
            }).catch(() => { /* offline: keep going */ });
            return;
        }
        if (localStorage.getItem('shetos_after_logout') === '1') {
            localStorage.removeItem('shetos_after_logout');
            cameBackFromLogout = true;
        }
        bindAuthScreen();
        renderAuth();
        if (cameBackFromLogout) {
            const canvas = document.createElement('canvas');
            canvas.className = 'welcome-fx-canvas auth-confetti';
            authPage.appendChild(canvas);
            launchConfetti(canvas, 2400);
            setTimeout(() => canvas.remove(), 2600);
        }
    }

    // ---- settings: edit NAME only + logout ----
    profileSaveBtn?.addEventListener('click', async () => {
        const name = (profileUsernameField.value || '').trim().replace(/\s+/g, ' ');
        if (!name) {
            profileEditError.textContent = at('nameEmpty');
            profileEditError.classList.add('show');
            return;
        }
        profileSaveBtn.disabled = true;
        try {
            const key = getSession();
            if (key) await userPatch(key, { name });
            const p = getSavedProfile();
            saveProfile(name, p.phone, p.email);
            loadProfileIntoSettings();
            profileEditError.classList.remove('show');
            profileEditView.style.display = 'none';
            profileDisplayView.style.display = 'flex';
            flashSaveStatus(at('nameSaved'));
        } catch (e) {
            profileEditError.textContent = at('errNet');
            profileEditError.classList.add('show');
        }
        profileSaveBtn.disabled = false;
    });

    document.getElementById('profile-logout-btn')?.addEventListener('click', () => {
        endSession();
        localStorage.setItem('shetos_after_logout', '1'); // shows "Welcome back" + effects after the reload
        location.reload();
    });

    startAuthGate();

    // ==========================================================
    // VISITOR COUNTER: tells the stats server about each visit
    // (once per browser session, so refreshing the page does not spam you)
    // ==========================================================
    const STATS_API_URL = 'https://shetos-stats.adam-abdelqawy.workers.dev'; // e.g. 'https://shetos-stats.YOURNAME.workers.dev'  (empty = counter is off)

    function trackVisit() {
        try {
            if (!STATS_API_URL) return;
            // Open  yoursite/?notrack=1  once on your own devices so YOUR visits are not counted
            // (and ?notrack=0 to count them again).
            const q = new URLSearchParams(location.search);
            if (q.get('notrack') === '1') localStorage.setItem('shetos_notrack', '1');
            if (q.get('notrack') === '0') localStorage.removeItem('shetos_notrack');
            if (localStorage.getItem('shetos_notrack') === '1') return;

            if (sessionStorage.getItem('shetos_visit_sent') === '1') return;
            sessionStorage.setItem('shetos_visit_sent', '1');

            let vid = localStorage.getItem('shetos_vid');
            if (!vid) {
                vid = (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
                    : Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
                localStorage.setItem('shetos_vid', vid);
            }
            fetch(STATS_API_URL.replace(/\/+$/, '') + '/visit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                keepalive: true,
                body: JSON.stringify({
                    vid,
                    lang: navigator.language || '',
                    ref: document.referrer || '',
                    name: getSavedProfile().username || ''
                })
            }).catch(() => {});
        } catch (e) { /* never break the site because of the counter */ }
    }
    trackVisit();

    // ==========================================
    // PWA: SERVICE WORKER REGISTRATION
    // ==========================================
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('service-worker.js')
                .then((registration) => {
                    // Force an immediate check for a newer service worker / cached assets,
                    // so phones don't keep showing an old cached version of the site.
                    registration.update();
                })
                .catch(() => {
                    // Fails silently on file:// or unsupported hosts — app still works fully online
                });
        });
    }

    // ==========================================
    // CLOSE MODALS BY CLICKING OUTSIDE
    // ==========================================
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            // Don't reset the selected product when closing currency, language, settings, feedback or contact-us modal
            if (['currency-modal', 'language-modal', 'settings-modal', 'feedback-modal', 'contactus-modal', 'account-modal'].includes(e.target.id)) {
                e.target.classList.remove('active');
                return;
            }
            e.target.classList.remove('active');
            [ffTypeModal, rechargeModal, credentialsModal, checkoutModal].forEach(m => {
                if (m) m.classList.remove('active');
            });
            resetSelection();
        }
    });
});