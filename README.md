# Emerald - Personal Expense Tracker

**Ringkasan Proyek:** Sebuah aplikasi web minimalis berdesain modern yang dirancang khusus untuk mencatat dan melacak pengeluaran keuangan harian secara instan, guna menghilangkan kebingungan finansial pribadi.

* **Jenis Proyek:** Proyek Mandiri (Self-initiated Project)
* **Peran:** Full-Stack Developer & UI/UX Designer (Individual Project)
* **Kreator:** @vlahadiqa

---

### 1. The "Why" (Latar Belakang & Motivasi)
Aplikasi ini lahir sepenuhnya dari masalah nyata yang saya hadapi sehari-hari. Saya sering kali merasa kebingungan dan kesulitan saat harus menghitung atau mengingat kembali ke mana perginya uang saya dalam sehari. Banyak aplikasi pencatat keuangan di luar sana yang menawarkan fitur terlalu rumit, seperti akuntansi ganda, pelacakan investasi, atau grafik performa yang membingungkan. Padahal, kebutuhan dasar saya setiap harinya sangat sederhana: sebuah alat pencatat yang cepat, efisien, dan tanpa beban kognitif yang besar saat digunakan.

Didorong oleh filosofi *Essentialism*, saya membangun Emerald untuk menyelesaikan satu masalah spesifik tersebut dengan pendekatan yang berpusat pada kenyamanan pengguna (*user empathy*). Proyek ini merupakan wujud nyata dari metode *dogfooding*, di mana saya bertindak sebagai pengembang sekaligus pengguna utama yang merasakan langsung dampaknya dalam merapikan catatan finansial pribadi setiap hari.

### 2. The "How" (Proses Pengembangan & Tantangan)
Untuk menjawab masalah kebingungan mencatat pengeluaran harian tersebut, seluruh proses pengembangan teknis dan arsitektur desain aplikasi ini sengaja diarahkan untuk mempermudah penggunaan di dunia nyata:

* **Optimasi Tampilan Ponsel (Mobile-First Mindset):** Karena saya harus bisa mencatat pengeluaran di sela-sela aktivitas harian secara instan (tepat setelah membeli makan atau membayar ongkos transportasi), antarmuka Tailwind CSS dirancang agar sepenuhnya responsif di layar HP. Penggunaan efek *Glassmorphism* (`backdrop-blur-md` dan `bg-white/10`) memberikan estetika modern yang menenangkan tanpa mengorbankan kecepatan muat halaman saat diakses di luar rumah.
* **Fitur Pencatatan Waktu (Jam & Menit) secara Riil:** Kebingungan melacak uang sering terjadi karena beberapa pengeluaran dilakukan pada hari yang sama namun di waktu berbeda. Oleh karena itu, saya mengubah input tanggal menjadi format waktu riil (`datetime-local`) dan menyesuaikan database MySQL menjadi `DATETIME`. Dengan begitu, pengeluaran "Makan Siang" dan "Kopi Sore" dapat terpisah secara akurat, membantu saya mengingat kembali alur aktivitas finansial dengan sangat mudah.
* **Sistem Fleksibilitas Status (Dual-State Management):** Agar aplikasi ini siap bertransisi dari sekadar bahan demonstrasi menjadi alat pakai nyata sehari-hari, saya membangun logika *asynchronous JavaScript* khusus. Aplikasi memiliki tombol simulasi untuk kebutuhan pengujian visual, sekaligus tombol "Kosongkan Data" yang secara instan membersihkan database (*Empty State*) menjadi lembaran bersih siap pakai untuk mencatat pengeluaran asli saya tanpa tercampur data fiktif.
* **Pemisahan Logika yang Ringan (Clean Backend):** Agar proses input data tidak terhambat oleh *loading* yang lama di HP, saya memisahkan tampilan HTML dengan pemrosesan PHP murni via *Fetch API*. Data nominal otomatis diformat menjadi Rupiah di layar menggunakan JavaScript agar tidak terjadi salah ketik angka, namun dikirim sebagai angka murni ke database agar pemrosesan data berjalan secepat kilat.

### 3. The "What" (Hasil & Dampak)
Emerald berhasil bertransformasi menjadi sebuah solusi digital pribadi yang adaptif, ringan, dan bebas hambatan. Aplikasi ini secara dinamis mampu mengkalkulasi total pengeluaran berdasarkan kategori waktu (Hari Ini, Minggu Ini, Bulan Ini) secara akurat dari database MySQL. Dampak terbesar yang saya rasakan secara personal adalah hilangnya rasa cemas dan kebingungan dalam melacak arus keluar uang harian; saya kini memiliki kendali penuh dan visibilitas total terhadap setiap Rupiah yang dikeluarkan langsung dari genggaman ponsel saya.

### 4. Pelajaran yang Dipetik (Learnings & Reflection)
* **Kedewasaan Menentukan Ruang Lingkup (*The Power of Scoping*):** Menahan diri untuk tidak membuat fitur pemasukan atau perhitungan utang yang rumit adalah keputusan desain terbaik. Fokus pada satu masalah utama (pelacakan pengeluaran harian) justru menghasilkan produk yang jauh lebih fungsional, rapi, dan benar-benar terpakai setiap hari.
* **Craftsmanship dalam Menyelesaikan Masalah Pribadi:** Membangun aplikasi untuk kebutuhan diri sendiri (*dogfooding*) mengajarkan saya bahwa kualitas sebuah perangkat lunak tidak hanya dinilai dari kecanggihan fiturnya, melainkan seberapa baik detail *micro-interaction* (seperti *scrollbar* tipis ala iOS dan kerapatan *padding* tabel) mampu mereduksi kebingungan pengguna saat berinteraksi dengan data harian mereka.
