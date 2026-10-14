UNDian DOORPRIZE SPEKTAMADES 2026 - PT BPR BKK WONOGIRI (Perseroda)

PERBAIKAN TERBARU
- Nomor undian ditampilkan enam digit (000001, 000002, dst.).
- Saat pengacakan, informasi rekening/nama/alamat/kantor disembunyikan hingga STOP.
- Setelah STOP: nomor undian, nomor rekening tersamar, nama, alamat, dan kantor ditampilkan tanpa label tambahan.
- Nomor rekening pada layar dan daftar pemenang ditampilkan tersamar, contoh 01/xxx.xxx566.
- Download semua nomor undian menghasilkan Excel .xlsx dengan dua sheet: Rekap per Rekening dan Rincian Nomor Undian.
- Rekap per rekening memuat poin total, nomor undian awal, nomor undian akhir, dan total nomor undian.
- Data rekening, pemenang, pengaturan saldo/kelipatan, kecepatan, dan hadiah terakhir disimpan otomatis di browser dan dipulihkan setelah refresh pada browser/perangkat yang sama.

CARA PAKAI
1. Ekstrak ZIP.
2. Buka index.html melalui Chrome/Edge, atau unggah semua file dan folder ke GitHub Pages.
3. Import Excel/CSV peserta dengan kolom NO_REKENING, NAMA, SALDO_AKHIR, ALAMAT, NAMA_KANTOR/KODE_KANTOR.
4. Atur saldo minimum dan kelipatan saldo.
5. Klik Download Semua Nomor Undian untuk memperoleh Excel rekap serta detail nomor.
6. Jalankan pengundian: MULAI > STOP > SAH.
7. Gunakan SIMPAN BACKUP secara berkala untuk menyimpan salinan JSON di luar browser.

CONTOH
Saldo Rp1.000.000 dengan kelipatan Rp50.000 = 20 poin/nomor undian. Kolom rekap menunjukkan rentang nomor undian awal dan akhir rekening tersebut, misalnya 000001 sampai 000020.

CATATAN PENYIMPANAN
Penyimpanan otomatis menggunakan localStorage browser pada perangkat dan domain yang sama. Menghapus data situs/browser, memakai browser/perangkat lain, atau kapasitas browser penuh dapat menghilangkan data lokal. Gunakan SIMPAN BACKUP untuk salinan permanen dan PULIHKAN BACKUP untuk memulihkan data. Data yang tersimpan di localStorage tidak otomatis dibagikan ke perangkat lain.

Ekspor Excel menggunakan SheetJS dari CDN; koneksi internet diperlukan untuk memuat pustaka tersebut.
