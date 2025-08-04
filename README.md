# بوت معين المجتهدين | Mouin-Almojtahidin Bot

## 📋 نظرة عامة

بوت معين المجتهدين هو بوت تلغرام مصمم لإدارة مجموعات الكورسات التعليمية بطريقة احترافية وسهلة. يوفر البوت مجموعة شاملة من الميزات لتنظيم الدروس، تتبع الحضور، إدارة الواجبات، والتذكيرات الآلية.

## ✨ الميزات الرئيسية

### 🔔 التذكيرات الآلية
- إرسال تذكيرات قبل 24 ساعة وساعة واحدة من بداية كل درس
- إشعارات للمجموعة الرئيسية مع ذكر المستخدمين
- رسائل خاصة للمستخدمين المفعلين

### ❓ خدمة الأسئلة الشائعة
- عرض الأسئلة الشائعة وإجاباتها
- سهولة التحديث عبر ملف التكوين
- تنسيق احترافي وواضح

### 📢 الإعلانات
- نشر إعلانات للمجموعة والمستخدمين
- حفظ الإعلانات في قاعدة البيانات
- تتبع حالة الإرسال

### 📊 تتبع الحضور
- تسجيل حضور الطلاب للدروس
- إحصائيات مفصلة للحضور
- تقارير للمدراء

### 📈 إحصائيات شاملة للمدراء
- عدد المستخدمين الكلي والمفعلين
- معدلات الحضور لكل درس
- معدلات تسليم الواجبات

### 👤 ملفات المستخدمين
- عرض معلومات المستخدم الشخصية
- إحصائيات الحضور والواجبات
- حالة التفعيل والتذكيرات

### 🔐 نظام التحقق
- تفعيل المستخدمين بكود الأمان
- حماية البوت من الاستخدام غير المصرح
- تحقق من الصلاحيات

### 📝 إدارة الواجبات
- إضافة وتحديث وحذف الواجبات
- تقديم الإجابات وتقييمها آلياً
- إظهار الإجابة الصحيحة والنقاط

## 🛠️ التقنيات المستخدمة

- **Node.js** v22.15.0 مع ES Modules
- **Telegraf** للتكامل مع تلغرام
- **SQLite** لتخزين البيانات
- **node-schedule** للتذكيرات الآلية
- **dotenv** لمتغيرات البيئة

## 📦 التثبيت والإعداد

### 1. متطلبات النظام
```bash
node >= 22.15.0
npm >= 10.0.0
```

### 2. استنساخ المشروع
```bash
git clone https://github.com/your-username/Mouin-Almojtahidin-bot.git
cd Mouin-Almojtahidin-bot
```

### 3. تثبيت التبعيات
```bash
npm install
```

### 4. إعداد متغيرات البيئة
انسخ ملف `.env.example` إلى `.env` وقم بتعديل القيم:

```bash
cp .env.example .env
```

قم بتعديل الملف `.env`:
```env
# Telegram Bot Configuration
BOT_TOKEN=your_actual_bot_token_from_botfather

# Admin Configuration
ADMIN_USER_IDS=123456789,987654321
GROUP_ID=-100123456789
SUPPORT_CHANNEL=@YourSupportChannel
ADMIN_CHAT_ID=-100123456789

# User Verification
ACTIVATION_CODE=YOUR_SECRET_CODE

# Zoom Configuration
ZOOM_LINK=https://zoom.us/j/your_meeting_id?pwd=your_password
```

### 5. تشغيل البوت
```bash
npm start
```

للتطوير مع إعادة التشغيل الآلي:
```bash
npm run dev
```

## 📊 بنية قاعدة البيانات

### جدول المستخدمين (users)
| العمود | النوع | الوصف |
|---------|--------|--------|
| user_id | INTEGER PRIMARY KEY | معرف المستخدم |
| username | TEXT | اسم المستخدم |
| first_name | TEXT | الاسم الأول |
| join_date | DATETIME | تاريخ الانضمام |
| is_verified | BOOLEAN | حالة التفعيل |
| reminders_enabled | BOOLEAN | تفعيل التذكيرات |

### جدول الدروس (lessons)
| العمود | النوع | الوصف |
|---------|--------|--------|
| lesson_id | INTEGER AUTO | معرف الدرس |
| course_id | INTEGER | معرف الكورس |
| title | TEXT | عنوان الدرس |
| date | TEXT | التاريخ |
| time | TEXT | الوقت |
| zoom_link | TEXT | رابط الزوم |

### جدول الحضور (attendance)
| العمود | النوع | الوصف |
|---------|--------|--------|
| user_id | INTEGER | معرف المستخدم |
| lesson_id | INTEGER | معرف الدرس |
| attended_at | DATETIME | وقت تسجيل الحضور |

### جدول الإعلانات (announcements)
| العمود | النوع | الوصف |
|---------|--------|--------|
| announcement_id | INTEGER AUTO | معرف الإعلان |
| content | TEXT | محتوى الإعلان |
| published_at | DATETIME | وقت النشر |
| sent_to_group | BOOLEAN | تم الإرسال للمجموعة |

### جدول الواجبات (assignments)
| العمود | النوع | الوصف |
|---------|--------|--------|
| assignment_id | INTEGER AUTO | معرف الواجب |
| course_id | INTEGER | معرف الكورس |
| title | TEXT | عنوان الواجب |
| question | TEXT | السؤال |
| correct_answer | TEXT | الإجابة الصحيحة |
| deadline | TEXT | الموعد النهائي |

### جدول التسليمات (submissions)
| العمود | النوع | الوصف |
|---------|--------|--------|
| user_id | INTEGER | معرف المستخدم |
| assignment_id | INTEGER | معرف الواجب |
| answer | TEXT | الإجابة |
| submitted_at | DATETIME | وقت التسليم |
| score | INTEGER | النقاط |

## 🎯 الأوامر المتاحة

### أوامر المستخدمين
- `/start` - بدء استخدام البوت
- `/verify <كود>` - تفعيل الحساب
- `/profile` - عرض الملف الشخصي
- `/faq` - الأسئلة الشائعة
- `/attendance <رقم_الدرس>` - تسجيل الحضور
- `/submit <رقم_الواجب> <الإجابة>` - تقديم إجابة واجب

### أوامر المدراء
- `/stats` - عرض الإحصائيات
- `/publish <الرسالة>` - نشر إعلان
- `/addassignment <معرف_الكورس> <العنوان> <السؤال> <الإجابة> <الموعد>` - إضافة واجب
- `/updateassignment <معرف_الواجب> <الحقل> <القيمة>` - تحديث واجب
- `/deleteassignment <معرف_الواجب>` - حذف واجب

## 📝 بيانات تجريبية للاختبار

### إضافة دروس تجريبية
```sql
INSERT INTO lessons (course_id, title, date, time, zoom_link) VALUES 
(1, 'مقدمة في البرمجة', '2024-01-15', '19:00', 'https://zoom.us/j/example'),
(1, 'أساسيات الخوارزميات', '2024-01-17', '19:00', 'https://zoom.us/j/example'),
(1, 'هياكل البيانات', '2024-01-20', '19:00', 'https://zoom.us/j/example');
```

### إضافة واجب تجريبي
```sql
INSERT INTO assignments (course_id, title, question, correct_answer, deadline) VALUES 
(1, 'واجب الوحدة الأولى', 'ما هو تعريف البرمجة؟', 'البرمجة هي عملية كتابة التعليمات للحاسوب', '2024-01-25');
```

### تفعيل مستخدم تجريبي
```sql
INSERT INTO users (user_id, username, first_name, is_verified) VALUES 
(123456789, 'testuser', 'مستخدم تجريبي', 1);
```

## 🔧 هيكل الملفات

```
Mouin-Almojtahidin-bot/
├── bot/
│   ├── commands/          # معالجات الأوامر
│   │   ├── start.js       # أمر /start
│   │   ├── verify.js      # أمر /verify
│   │   ├── faq.js         # أمر /faq
│   │   ├── profile.js     # أمر /profile
│   │   ├── attendance.js  # أمر /attendance
│   │   ├── stats.js       # أمر /stats (مدراء)
│   │   ├── publish.js     # أمر /publish (مدراء)
│   │   └── assignment.js  # أوامر الواجبات
│   ├── utils/
│   │   ├── database.js    # إعداد قاعدة البيانات
│   │   └── reminders.js   # نظام التذكيرات
│   └── middlewares/
│       ├── logger.js      # تسجيل الأنشطة
│       └── verifyMiddleware.js # التحقق من التفعيل
├── data/
│   ├── mouin_almojtahidin.db  # قاعدة البيانات
│   ├── combined.log           # سجل الأنشطة
│   └── error.log              # سجل الأخطاء
├── config.js              # ملف التكوين
├── index.js              # نقطة بداية البوت
├── .env.example          # مثال متغيرات البيئة
├── package.json          # معلومات المشروع
└── README.md            # هذا الملف
```

## 🚨 استكشاف الأخطاء

### مشاكل شائعة وحلولها

#### البوت لا يستجيب
- تأكد من صحة `BOT_TOKEN`
- تحقق من اتصال الإنترنت
- راجع ملف `data/error.log`

#### مشاكل قاعدة البيانات
- تأكد من وجود مجلد `data`
- تحقق من صلاحيات الكتابة
- راجع رسائل الخطأ في الكونسول

#### التذكيرات لا تعمل
- تحقق من تنسيق التاريخ والوقت
- تأكد من أن التاريخ في المستقبل
- راجع سجل الأنشطة

### سجلات النظام
- **الأنشطة العامة**: `data/combined.log`
- **الأخطاء**: `data/error.log`
- **الكونسول**: عرض مباشر لحالة البوت

## 🔒 الأمان

### نصائح الأمان
- لا تشارك `BOT_TOKEN` مع أحد
- استخدم كود تفعيل قوي
- قم بتحديث معرفات المدراء بانتظام
- احتفظ بنسخة احتياطية من قاعدة البيانات

### النسخ الاحتياطي
```bash
# نسخ احتياطي من قاعدة البيانات
cp data/mouin_almojtahidin.db backup/db_$(date +%Y%m%d_%H%M%S).db

# نسخ احتياطي من السجلات
tar -czf backup/logs_$(date +%Y%m%d_%H%M%S).tar.gz data/*.log
```

## 🤝 المساهمة

نرحب بالمساهمات! لتقديم مساهمة:

1. Fork المشروع
2. إنشاء فرع للميزة (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push للفرع (`git push origin feature/AmazingFeature`)
5. فتح Pull Request

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT - راجع ملف [LICENSE](LICENSE) للتفاصيل.

## 📞 الدعم

للحصول على الدعم:
- إنشاء [Issue جديد](https://github.com/your-username/Mouin-Almojtahidin-bot/issues)
- التواصل عبر قناة الدعم المحددة في التكوين
- مراجعة الوثائق والأسئلة الشائعة

## 🎉 شكر خاص

شكر خاص لجميع المساهمين في تطوير هذا البوت ولمجتمع معين المجتهدين.

---

**تم التطوير بـ ❤️ لمجتمع معين المجتهدين**