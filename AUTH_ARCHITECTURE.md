# Arsitektur Autentikasi & JWT (JSON Web Token)

Dokumen ini menjelaskan secara teknis bagaimana sistem autentikasi bekerja di balik layar pada aplikasi **Playground Express** ini.

## 1. Alur Autentikasi Secara Umum
Aplikasi ini tidak lagi menggunakan **Session berbasis Server** (seperti `express-session` yang menyimpan data di memori/database server). Sebaliknya, aplikasi ini menggunakan arsitektur **Stateless JWT (JSON Web Token)**.

Keuntungan utama:
- **Server tidak perlu mengingat sesi user.** Semua informasi penting (seperti ID, nama, dan email user) disimpan di dalam token JWT itu sendiri.
- **Lebih cepat & scalable.** Server tidak perlu melakukan query ke *session store* setiap kali user melakukan request.

## 2. Bagaimana JWT Dibuat? (Login Flow)
Ketika user berhasil melakukan otentikasi (baik lewat *Local Login* maupun *Google OAuth*), fungsi `setUserToken()` di dalam `routes/auth.js` akan dijalankan.

1. **Pembuatan Payload:** Server mengambil data penting dari object user (seperti `shortId`, `email`, `name`, `_id`, dan `passwordReset`) untuk dijadikan payload/isi dari JWT.
2. **Signing:** Data tersebut dienkripsi dan ditandatangani secara digital (di-*sign*) menggunakan `JWT_SECRET` yang ada di `.env` (menggunakan *package* `jsonwebtoken`). Token ini dibuat agar memiliki masa berlaku (contoh: 1 hari).

## 3. Di Mana JWT Disimpan? (Cookies)
Setelah token JWT tercipta, bagaimana cara memberikannya ke user agar otomatis terkirim setiap kali user membuka halaman web?

- **Disimpan di Cookie:** Token JWT disisipkan ke dalam *HTTP Response Header* sebagai Cookie bernama `token`.
- **Keamanan (httpOnly):** Kami mengatur opsi `httpOnly: true` saat menyimpan cookie ini. Ini sangat penting secara teknis karena:
  - Token **tidak bisa** dibaca, dicuri, atau dimodifikasi oleh script JavaScript (seperti XSS attacks) di sisi *client* (browser).
  - Token ini hanya bisa dibaca oleh server dan akan dikirimkan kembali ke server secara otomatis setiap kali browser melakukan *request* ke domain web kita.

```javascript
// Contoh di routes/auth.js
res.cookie('token', token, { 
  maxAge: 24 * 60 * 60 * 1000, // Berlaku 1 hari 
  httpOnly: true // Keamanan tingkat tinggi terhadap XSS
});
```

## 4. Bagaimana Server Membaca JWT? (Passport-JWT)
Setiap kali user membuka halaman apapun, *request* tersebut akan melewati middleware `checkAuth` di `app.js`.

1. `checkAuth` memanggil *Passport.js* dengan strategi `jwt` (didefinisikan di `passport/strategies/jwt.js`).
2. Terdapat fungsi `cookieExtractor` yang bertugas mengambil isi dari `req.cookies.token`.
3. Passport akan memverifikasi *signature* dari token tersebut menggunakan `JWT_SECRET` untuk memastikan token belum kadaluarsa dan tidak dimanipulasi oleh *hacker*.
4. Jika valid, Passport akan menerjemahkan isi token tersebut kembali menjadi object `user`.
5. Middleware `checkAuth` kemudian menyimpan object `user` tersebut ke dalam `req.user` (untuk dipakai oleh route backend) dan `res.locals.user` (untuk langsung dirender secara dinamis oleh template Pug).

## 5. Flow Lupa Password & Reset
Aplikasi ini memiliki fitur *reset password* yang menggabungkan kemampuan JWT, Hash, dan Nodemailer (SMTP).
1. User memasukkan email di halaman Lupa Password.
2. Server membuat **password acak 8 karakter** menggunakan `nanoid`.
3. Password acak ini di-hash (SHA1) dan disimpan ke database user, menggantikan password lamanya. Status field `passwordReset` di database diubah menjadi `true`.
4. Sistem mengirimkan password acak tersebut *dalam bentuk teks asli (plain text)* ke email user via Nodemailer.
5. User login menggunakan password acak tersebut.
6. Saat login sukses, server melihat bahwa di dalam payload JWT-nya, `passwordReset` bernilai `true`.
7. Karena `true`, user langsung di-*redirect* secara paksa (force redirect) ke halaman `/auth/update-password` dan tidak diperbolehkan mengakses halaman lain sampai mereka mengubah password acaknya menjadi password baru milik mereka sendiri.
