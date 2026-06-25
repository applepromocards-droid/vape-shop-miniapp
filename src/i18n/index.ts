export type Lang = "ru" | "en";

const T = {
  ru: {
    // Nav
    nav_catalog:   "Каталог",
    nav_favorites: "Избранное",
    nav_cart:      "Корзина",
    nav_profile:   "Профиль",

    // Catalog
    search_placeholder: "Поиск вкусов и устройств…",
    categories:         "Категории",
    all_link:           "все →",
    coming_soon:        "Скоро здесь появятся товары.",

    // ProductCard
    out_of_stock: "Нет в наличии",
    pick:         "Выбрать",

    // FlavorPicker
    puffs:           "затяжек",
    no_stock_flavor: "Нет в наличии",

    // Favorites
    fav_title:       "Избранное",
    fav_empty_title: "Ничего не сохранено",
    fav_empty_sub:   "Нажмите ♡ на карточке товара, чтобы добавить в избранное",

    // Cart
    cart_title:       "Корзина",
    cart_empty_title: "Корзина пуста",
    cart_empty_sub:   "Добавьте товары из каталога",
    cart_delivery:    "Доставка",
    cart_free:        "Бесплатно 🎁",
    cart_calculated:  "рассчитывается при оформлении",
    cart_total:       "Итого",
    cart_checkout:    "Оформить заказ",
    cart_items:    (n: number) => `Товары (${n})`,
    cart_add_more: (n: number) => `🎁 Добавь ещё ${n} ${n === 1 ? "товар" : "товара"} для бесплатной доставки`,

    // Checkout
    checkout_title:              "Оформление заказа",
    checkout_delivery_method:    "Способ получения",
    checkout_delivery:           "Доставка",
    checkout_free:               "бесплатно",
    checkout_pickup:             "Самовывоз",
    checkout_address_label:      "Адрес доставки",
    checkout_address_placeholder:"Улица, дом, квартира",
    checkout_free_note:          "🎁 Доставка бесплатна при заказе от 3 товаров",
    checkout_next:               "Далее →",
    checkout_payment:            "Способ оплаты",
    checkout_cash:               "Наличными",
    checkout_on_delivery:        "при получении",
    checkout_card:               "Картой",
    checkout_promo_label:        "Промокод",
    checkout_promo_placeholder:  "Введите промокод",
    checkout_promo_error:        "Ошибка",
    checkout_conn_error:         "Ошибка соединения",
    checkout_order_error:        "Ошибка при оформлении, попробуйте ещё раз",
    checkout_your_order:         "Ваш заказ",
    checkout_placing:            "Оформляем...",
    checkout_success_title:      "Заказ принят!",
    checkout_success_sub:        "Администратор свяжется с вами в ближайшее время",
    checkout_promo_applied: (code: string) => `🎟 ${code} — скидка применена`,
    checkout_place: (total: number, cur: string) => `Заказать · ${total} ${cur}`,

    // Orders
    orders_title:       "Мои заказы",
    orders_loading:     "Загрузка...",
    orders_empty_title: "Заказов пока нет",
    orders_empty_sub:   "Ваши заказы будут отображаться здесь",
    order_pickup:       "Самовывоз",
    order_total:        "Итого:",
    status_new:       "В обработке",
    status_done:      "Выполнен",
    status_cancelled: "Отменён",

    // Addresses
    addresses_title:       "Адреса доставки",
    addresses_loading:     "Загрузка...",
    addresses_empty_title: "Нет сохранённых адресов",
    addresses_empty_sub:   "Адреса сохраняются автоматически при оформлении доставки",

    // Profile
    profile_orders:    "Мои заказы",
    profile_addresses: "Адреса доставки",
    profile_referral:  "Реферальная программа",
    profile_support:   "Поддержка",
    profile_admin:     "Управление каталогом",

    // Referral
    ref_title:             "Реферальная программа",
    ref_hero:              "Приведи 3 друга —\nполучи бесплатную курилку!",
    ref_my:                "Твои рефералы",
    ref_reward:            "🎁 Награда отправлена в Telegram!",
    ref_how_title:         "Как это работает?",
    ref_how_1:             "Скажи другу свой @username",
    ref_how_2:             "Он указывает тебя при первом запуске",
    ref_how_3:             "После его первого заказа тебе засчитается +1",
    ref_who:               "Кто тебя пригласил?",
    ref_saved:             "✅ Сохранено!",
    ref_save:              "Сохранить",
    ref_saving:            "Сохранение...",
    ref_note:              "Указать можно только один раз. Засчитается после твоего первого завершённого заказа.",
    ref_no_username_title: "Нет @username в Telegram",
    ref_no_username_text:  "Для участия в реферальной программе тебе нужен @username. Установи его в настройках Telegram, затем перезапусти приложение.",
    ref_disabled:          "Недоступно без @username",
    ref_pending:  (n: number) => `⏳ ${n} ${n === 1 ? "друг ещё не сделал" : "друга ещё не сделали"} первый заказ`,
    ref_set_by:   (u: string) => `✅ Указан @${u}`,
    ref_share:    (u: string) => `Твой тег: @${u} — поделись с друзьями`,

    // AgeGate
    age_title:        "Подтверждение возраста",
    age_no:           "Нет",
    age_legal:        "Никотин вызывает привыкание. Курение вредит вашему здоровью.",
    age_denied_title: "Доступ ограничен",
    age_text:      (n: number) => `Магазин содержит никотиносодержащую продукцию. Вам есть ${n} лет?`,
    age_yes:       (n: number) => `Мне есть ${n}`,
    age_denied_text: (n: number) => `Этот раздел предназначен только для лиц старше ${n} лет. Продажа несовершеннолетним запрещена.`,

    // ReferralOnboarding
    ref_ob_title:   "Тебя кто-то пригласил?",
    ref_ob_sub:     "Введи @username человека, который поделился с тобой магазином. Они получат бонус за каждого приглашённого!",
    ref_ob_confirm: "Подтвердить",
    ref_ob_saving:  "Сохранение...",
    ref_ob_skip:    "Пропустить",
  },
  en: {
    // Nav
    nav_catalog:   "Catalog",
    nav_favorites: "Favorites",
    nav_cart:      "Cart",
    nav_profile:   "Profile",

    // Catalog
    search_placeholder: "Search flavors and devices…",
    categories:         "Categories",
    all_link:           "all →",
    coming_soon:        "Products coming soon.",

    // ProductCard
    out_of_stock: "Out of stock",
    pick:         "Choose",

    // FlavorPicker
    puffs:           "puffs",
    no_stock_flavor: "Out of stock",

    // Favorites
    fav_title:       "Favorites",
    fav_empty_title: "Nothing saved",
    fav_empty_sub:   "Tap ♡ on a product card to add to favorites",

    // Cart
    cart_title:       "Cart",
    cart_empty_title: "Cart is empty",
    cart_empty_sub:   "Add items from the catalog",
    cart_delivery:    "Delivery",
    cart_free:        "Free 🎁",
    cart_calculated:  "calculated at checkout",
    cart_total:       "Total",
    cart_checkout:    "Checkout",
    cart_items:    (n: number) => `Items (${n})`,
    cart_add_more: (n: number) => `🎁 Add ${n} more ${n === 1 ? "item" : "items"} for free delivery`,

    // Checkout
    checkout_title:              "Checkout",
    checkout_delivery_method:    "Delivery method",
    checkout_delivery:           "Delivery",
    checkout_free:               "free",
    checkout_pickup:             "Pickup",
    checkout_address_label:      "Delivery address",
    checkout_address_placeholder:"Street, house, apartment",
    checkout_free_note:          "🎁 Free delivery for orders of 3+ items",
    checkout_next:               "Next →",
    checkout_payment:            "Payment method",
    checkout_cash:               "Cash",
    checkout_on_delivery:        "on delivery",
    checkout_card:               "Card",
    checkout_promo_label:        "Promo code",
    checkout_promo_placeholder:  "Enter promo code",
    checkout_promo_error:        "Error",
    checkout_conn_error:         "Connection error",
    checkout_order_error:        "Checkout error, please try again",
    checkout_your_order:         "Your order",
    checkout_placing:            "Placing...",
    checkout_success_title:      "Order placed!",
    checkout_success_sub:        "The admin will contact you shortly",
    checkout_promo_applied: (code: string) => `🎟 ${code} — discount applied`,
    checkout_place: (total: number, cur: string) => `Order · ${total} ${cur}`,

    // Orders
    orders_title:       "My Orders",
    orders_loading:     "Loading...",
    orders_empty_title: "No orders yet",
    orders_empty_sub:   "Your orders will appear here",
    order_pickup:       "Pickup",
    order_total:        "Total:",
    status_new:       "Processing",
    status_done:      "Completed",
    status_cancelled: "Cancelled",

    // Addresses
    addresses_title:       "Delivery Addresses",
    addresses_loading:     "Loading...",
    addresses_empty_title: "No saved addresses",
    addresses_empty_sub:   "Addresses are saved automatically when you place a delivery order",

    // Profile
    profile_orders:    "My Orders",
    profile_addresses: "Delivery Addresses",
    profile_referral:  "Referral Program",
    profile_support:   "Support",
    profile_admin:     "Manage Catalog",

    // Referral
    ref_title:             "Referral Program",
    ref_hero:              "Invite 3 friends —\nget a free vape!",
    ref_my:                "Your referrals",
    ref_reward:            "🎁 Reward sent to Telegram!",
    ref_how_title:         "How it works",
    ref_how_1:             "Share your @username with a friend",
    ref_how_2:             "They enter your username on first launch",
    ref_how_3:             "After their first order you get +1",
    ref_who:               "Who invited you?",
    ref_saved:             "✅ Saved!",
    ref_save:              "Save",
    ref_saving:            "Saving...",
    ref_note:              "Can only be set once. Counts after your first completed order.",
    ref_no_username_title: "No @username in Telegram",
    ref_no_username_text:  "You need a Telegram @username to join the referral program. Set it in Telegram settings, then restart the app.",
    ref_disabled:          "Unavailable without @username",
    ref_pending:  (n: number) => `⏳ ${n} ${n === 1 ? "friend hasn't" : "friends haven't"} placed their first order yet`,
    ref_set_by:   (u: string) => `✅ Set to @${u}`,
    ref_share:    (u: string) => `Your tag: @${u} — share with friends`,

    // AgeGate
    age_title:        "Age Verification",
    age_no:           "No",
    age_legal:        "Nicotine is addictive. Smoking is harmful to your health.",
    age_denied_title: "Access Restricted",
    age_text:      (n: number) => `This shop sells nicotine products. Are you ${n} or older?`,
    age_yes:       (n: number) => `I'm ${n}+`,
    age_denied_text: (n: number) => `This shop is for users ${n}+. Sale of nicotine products to minors is prohibited.`,

    // ReferralOnboarding
    ref_ob_title:   "Were you invited?",
    ref_ob_sub:     "Enter the @username of the person who shared this shop with you. They'll get a bonus for each friend they bring!",
    ref_ob_confirm: "Confirm",
    ref_ob_saving:  "Saving...",
    ref_ob_skip:    "Skip",
  },
} as const;

export type Translations = typeof T.ru;

export function getTranslations(lang: Lang): Translations {
  return T[lang] as Translations;
}
