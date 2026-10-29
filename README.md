# Zapchast Pro — React + Vite

Zapchast do‘koni uchun React asosidagi boshlang‘ich loyiha. Excel faylidagi mahsulotlar `src/data/products.json` fayliga import qilingan.

## Ishga tushirish

**Windows uchun eng oson usul:** ZIP faylni to‘liq chiqarib oling va `START_WINDOWS.bat` faylini ikki marta bosing. U kerakli kutubxonalarni o‘rnatib, Vite serverini ishga tushiradi.

Qo‘lda ishga tushirish uchun quyidagi amallarni bajaring:

1. Node.js LTS o‘rnating.
2. Terminalda loyiha papkasini oching:
   ```bash
   cd zapchast-pro-react
   ```
3. Kutubxonalarni o‘rnating:
   ```bash
   npm install
   ```
4. Ishlab chiqish serverini ishga tushiring:
   ```bash
   npm run dev
   ```
5. Terminal ko‘rsatgan mahalliy manzilni Chrome’da oching.

## Asosiy fayllar

- `index.html` — sahifa kirish fayli.
- `src/main.jsx` — React ilovasini ishga tushiradi.
- `src/App.jsx` — panel va funksiyalar.
- `src/styles.css` — dizayn va moslashuvchan ko‘rinish.
- `src/data/products.json` — Excel’dan import qilingan mahsulotlar.
- `src/lib/productImport.js` — Excel/CSV ustunlarini mahsulot maydonlariga moslaydi.

## Tekshiruv va build

```bash
npm test
npm run build
npm run preview
```

## Funksiyalar

- Dashboard va asosiy ko‘rsatkichlar
- Excel’dan kiritilgan 2,371 ta mahsulot qatori
- Mahsulot qidirish, qo‘shish, tahrirlash va tasdiqlash oynasi orqali o‘chirish
- Excel (.xlsx, .xls) va CSV ro‘yxatlarini import qilish; yangi mahsulotlar avtomatik qo‘shiladi, mos mavjud mahsulotlar yangilanadi
- Importda o‘zbekcha, inglizcha va ruscha ustun nomlarini aniqlash; `1,32` va `1.32` narx formatlarini qabul qilish
- Sotuv savatchasi, qoldiqni kamaytirish va sotuvlar tarixi
- Sotuv yakunida chek oynasi, chekni qayta ochish, printerdan chiqarish yoki PDF sifatida saqlash
- Ombor kirimi va harakatlar tarixi
- Xarajatlar, mijozlar va qarz to‘lovlari
- Moliya va hisobotlar
- CSV eksport va JSON zaxira/tiklash
- Telefon/planshetga moslashuvchan dizayn
- Dollar qiymatlarini `1,32` yoki `1.32` ko‘rinishida kiritish

## Muhim cheklovlar

- Hozircha ma’lumotlar faqat shu brauzerning `localStorage` xotirasida saqlanadi. Bir nechta qurilmada sinxron ishlashi uchun server va umumiy ma’lumotlar bazasi (masalan, Supabase) ulanishi kerak.
- Onlayn buyurtmalar bo‘limi hozircha katalog namunasi; haqiqiy mijoz buyurtmalari uchun public storefront va backend API kerak.
- Excel faylining varaqlarida narx ustunlari bir xil emas; ba’zi ustunlarda valyuta kursi/formula yoki so‘mdagi ekvivalent bor. Import qilingan tannarx va sotuv narxlarini do‘konda ishlatishdan oldin tekshirib tasdiqlash kerak.
- Excel importi uchun `xlsx` kutubxonasi `npm install` vaqtida o‘rnatiladi. Ushbu muhitda internet/tarmoq cheklovi sabab paketlarni o‘rnatish tugamadi; shu sababli `npm test` va production build natijasi tasdiqlanmagan.


## Excel import kutubxonasi xatosi (`Failed to resolve import "xlsx"`)

Loyihada `xlsx` paketi `package.json` ichida bor. Yangilangan loyiha papkasida terminal ochib quyidagini bajaring:

```bash
npm install
npm run dev
```

Windows foydalanuvchilari `START_WINDOWS.bat` ni ishga tushirishi mumkin; u endi har ishga tushganda paketlarni tekshiradi va yetishmayotganlarini o'rnatadi.


## Ushbu yangilanish
- Onlayn buyurtmalar paneli navigatsiyadan olib tashlandi.
- Asosiy ish jarayonlari: mahsulotlar, sotuv va chek, ombor/kirim, moliya, mijozlar/qarzlar, hisobotlar va zaxira.
- Excel import uchun `xlsx` kutubxonasi `package.json` ichida mavjud.

Ishga tushirish: `npm install`, so‘ng `npm run dev -- --host 0.0.0.0`.
