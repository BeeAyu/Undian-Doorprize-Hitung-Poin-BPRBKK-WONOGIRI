"use strict";
const $=id=>document.getElementById(id);
const state={peserta:[],pemenang:[],kandidat:null,timer:null,berjalan:false,menunggu:false,imageUrl:null,hadiahTambahan:[],gambarHadiahByNama:{},hadiahAktif:'HADIAH UTAMA'};
const DB_NAME='BPRBKK_Doorprize_DB', DB_STORE='state', DB_KEY='main';
function openDB(){return new Promise((resolve,reject)=>{if(!('indexedDB' in window)){reject(new Error('Browser ini tidak mendukung penyimpanan lokal.'));return}const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(DB_STORE))req.result.createObjectStore(DB_STORE)};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('Database lokal gagal dibuka.'))})}
let saveQueue=Promise.resolve();
function snapshot(){return {peserta:state.peserta,pemenang:state.pemenang,kandidat:state.kandidat,menunggu:state.menunggu,hadiahTambahan:state.hadiahTambahan,gambarHadiahByNama:state.gambarHadiahByNama,hadiahAktif:e.hadiah.value.trim()||state.hadiahAktif,interval:e.interval.value,minSaldo:e.minSaldo.value,kelipatanSaldo:e.kelipatanSaldo.value,status:e.status.textContent,updatedAt:new Date().toISOString()}}
function saveState(){const data=snapshot();saveQueue=saveQueue.then(async()=>{const db=await openDB();await new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).put(data,DB_KEY);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)});db.close()}).catch(err=>{console.error('Penyimpanan otomatis gagal:',err);msg('Peringatan: penyimpanan otomatis gagal. Klik SIMPAN BACKUP.');});return saveQueue}
async function loadState(){try{const db=await openDB();const data=await new Promise((resolve,reject)=>{const req=db.transaction(DB_STORE,'readonly').objectStore(DB_STORE).get(DB_KEY);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error)});db.close();if(!data)return false;state.peserta=Array.isArray(data.peserta)?data.peserta:[];state.pemenang=Array.isArray(data.pemenang)?data.pemenang:[];state.kandidat=data.kandidat||null;state.menunggu=!!data.menunggu&&!!state.kandidat;state.hadiahTambahan=Array.isArray(data.hadiahTambahan)?data.hadiahTambahan:[];state.gambarHadiahByNama=data.gambarHadiahByNama||{};state.hadiahAktif=data.hadiahAktif||'HADIAH UTAMA';if(data.interval)e.interval.value=data.interval;if(data.minSaldo!==undefined)e.minSaldo.value=data.minSaldo;if(data.kelipatanSaldo!==undefined)e.kelipatanSaldo.value=data.kelipatanSaldo;if(state.peserta.length&&state.peserta.some(p=>!Number.isInteger(Number(p.kuponAwal))||!Number.isInteger(Number(p.kuponAkhir))))assignCouponNumbers(state.peserta);renderPrizeOptions();e.hadiah.value=state.hadiahAktif;e.pilihanHadiah.value=state.hadiahAktif;e.pilihanHadiahFS.value=state.hadiahAktif;e.judul.textContent=state.hadiahAktif.toUpperCase();setImage(getPrizeImage(state.hadiahAktif));renderWinners();stats();buttons();if(state.menunggu)showCandidate(state.kandidat);else if(state.pemenang.length){const w=state.pemenang[state.pemenang.length-1];showApproved(w);e.banner.classList.remove('hidden');e.resmi.textContent=`${w.nama} — Undian ${w.nomorUndian} — Rekening ${maskAccount(w.rekening)}`}else if(state.peserta.length){e.kupon.textContent='000000';e.nama.textContent='DATA PESERTA DIPULIHKAN';e.alamat.textContent='Data tetap tersimpan; tidak perlu mengunggah Excel kembali.'}const eligible=state.peserta.filter(p=>peluang(p)>0).length;e.status.textContent=state.peserta.length?`Data dipulihkan otomatis: ${state.peserta.length.toLocaleString('id-ID')} rekening; ${eligible.toLocaleString('id-ID')} memenuhi saldo minimum Rp${minSaldoValue().toLocaleString('id-ID')}; ${state.pemenang.length.toLocaleString('id-ID')} pemenang. Total ${state.peserta.reduce((sum,p)=>sum+peluang(p),0).toLocaleString('id-ID')} nomor kupon; yang diacak adalah nomor kupon. Peluang per kelipatan Rp${kelipatanValue().toLocaleString('id-ID')}.`:'Belum ada data peserta.';return true}catch(err){console.warn('Pemulihan otomatis tidak tersedia:',err);return false}}
const e={file:$('fileExcel'),hadiah:$('namaHadiah'),pilihanHadiah:$('pilihanHadiah'),pilihanHadiahFS:$('pilihanHadiahFS'),image:$('gambarHadiahInput'),interval:$('interval'),minSaldo:$('minSaldo'),kelipatanSaldo:$('kelipatanSaldo'),mulai:$('btnMulai'),stop:$('btnStop'),sah:$('btnSah'),batal:$('btnResetKandidat'),mulaiFS:$('btnMulaiFS'),stopFS:$('btnStopFS'),sahFS:$('btnSahFS'),keluarFS:$('btnKeluarFS'),batalFS:$('btnResetKandidatFS'),fullscreen:$('btnFullscreen'),export:$('btnExport'),backup:$('btnBackup'),restore:$('fileBackup'),total:$('totalPeserta'),totalKupon:$('totalKupon'),menang:$('totalMenang'),sisa:$('totalSisa'),status:$('statusImport'),judul:$('judulHadiah'),gambar:$('gambarHadiah'),placeholder:$('placeholderHadiah'),kupon:$('nomorKupon'),nama:$('namaPemenang'),alamat:$('alamatPemenang'),detail:$('detailPemenang'),banner:$('winnerBanner'),resmi:$('pemenangResmi'),tbody:$('daftarPemenang'),toast:$('toast')};
const PRIZE_IMAGES={
  "TELEVISI LED 43'": "./assets/hadiah/televisi.png",
  "MESIN CUCI": "./assets/hadiah/mesin-cuci.png",
  "RICE COOKER": "./assets/hadiah/magiccom.png",
  "KIPAS ANGIN": "./assets/hadiah/kipas-angin.png",
  "KOMPOR GAS": "./assets/hadiah/kompor-gas.png",
};
function getPrizeImage(name){const key=String(name||'').trim().toUpperCase();return state.gambarHadiahByNama[key]||PRIZE_IMAGES[key]||'./assets/hadiah/hadiah-utama.png'}
function renderPrizeOptions(){const defaults=['TELEVISI LED','MESIN CUCI','RICE COOKER','KIPAS ANGIN','KOMPOR GAS'];const all=[...new Set([...defaults,...state.hadiahTambahan])];for(const sel of [e.pilihanHadiah,e.pilihanHadiahFS]){const previous=sel.value;sel.innerHTML=all.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');if(all.includes(previous))sel.value=previous;}}
function applyPrizeChoice(value,source){const v=String(value||'HADIAH UTAMA').trim().toUpperCase();if(e.hadiah)e.hadiah.value=v;if(e.pilihanHadiah&&source!=='main')e.pilihanHadiah.value=v;if(e.pilihanHadiahFS&&source!=='fs')e.pilihanHadiahFS.value=v;state.hadiahAktif=v;e.judul.textContent=v;setImage(getPrizeImage(v));saveState();}
function addPrize(){const name=e.hadiah.value.trim().toUpperCase();if(!name){msg('Isi nama hadiah terlebih dahulu.');e.hadiah.focus();return}if(!state.hadiahTambahan.includes(name)&&!Object.keys(PRIZE_IMAGES).includes(name)){state.hadiahTambahan.push(name)}renderPrizeOptions();e.pilihanHadiah.value=name;e.pilihanHadiahFS.value=name;state.hadiahAktif=name;applyPrizeChoice(name,'main');msg(`Hadiah ${name} ditambahkan dan tersedia di fullscreen.`)}

function msg(s){e.toast.textContent=s;e.toast.classList.add('show');clearTimeout(msg.t);msg.t=setTimeout(()=>e.toast.classList.remove('show'),3500)}
function norm(s){return String(s??'').trim().toUpperCase().replace(/[\s_-]+/g,'')}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function randomIndex(n){if(n<=0)throw Error('Tidak ada rekening tersedia.');if(window.crypto&&crypto.getRandomValues){const range=4294967296,limit=Math.floor(range/n)*n,a=new Uint32Array(1);do{crypto.getRandomValues(a)}while(a[0]>=limit);return a[0]%n}return Math.floor(Math.random()*n)}
function account(v){return String(v??'').trim().replace(/\.0$/,'')}
function parseSaldo(value){
 let s=String(value??'').trim().replace(/[^0-9,.-]/g,'');
 if(!s)return 0;
 if(s.includes('.')&&s.includes(',')){s=s.replace(/\./g,'').replace(',','.');}
 else if(s.includes(',')){const a=s.split(',');s=(a[a.length-1].length<=2&&a.length===2)?a[0].replace(/\./g,'')+'.'+a[1]:s.replace(/,/g,'');}
 else if(s.includes('.')){const a=s.split('.');if(a.length>1&&a[a.length-1].length===3)s=s.replace(/\./g,'');else if(a.length>2)s=s.replace(/\./g,'');}
 const n=Number(s);return Number.isFinite(n)&&n>0?n:0;
}
function minSaldoValue(){const n=Number(e.minSaldo.value);return Number.isFinite(n)&&n>=0?n:50000}
function kelipatanValue(){const n=Number(e.kelipatanSaldo.value);return Number.isFinite(n)&&n>0?n:50000}
function peluang(p){const saldo=parseSaldo(p.saldo);if(saldo<minSaldoValue())return 0;return Math.max(1,Math.floor(saldo/kelipatanValue()));}
function assignCouponNumbers(list=state.peserta){
 // Setiap peluang saldo menjadi satu nomor kupon nyata yang tetap.
 let next=1;
 for(const p of list){
  const count=peluang(p);
  p.jumlahKupon=count;
  if(count>0){p.kuponAwal=next;p.kuponAkhir=next+count-1;next+=count;}
  else {p.kuponAwal=null;p.kuponAkhir=null;}
 }
 return next-1;
}
function pickWeighted(list){
 // Yang diacak adalah NOMOR KUPON, bukan rekening/nasabah secara langsung.
 // Rentang kupon tiap rekening ditetapkan saat impor dan tetap konsisten.
 let total=0;
 for(const p of list){
  const count=peluang(p);
  if(count<=0)continue;
  if(!Number.isInteger(Number(p.kuponAwal))||!Number.isInteger(Number(p.kuponAkhir))||Number(p.kuponAkhir)-Number(p.kuponAwal)+1!==count){
   // Dukungan data lama / pengaturan saldo yang berubah.
   assignCouponNumbers(state.peserta);
   break;
  }
 }
 for(const p of list)total+=peluang(p);
 if(!total)throw Error('Tidak ada nomor kupon dari rekening yang memenuhi saldo minimum.');
 let r=randomIndex(total);
 for(const p of list){
  const count=peluang(p);if(count<=0)continue;
  if(r<count){const nomor=String(Number(p.kuponAwal)+r).padStart(6,'0');return {...p,nomorUndian:nomor,nomorKuponTerpilih:nomor};}
  r-=count;
 }
 throw Error('Nomor kupon tidak dapat ditentukan.');
}
function headerIndex(headers, aliases){const wanted=aliases.map(norm);return headers.findIndex(h=>wanted.includes(norm(h)))}
async function parseExcel(file){
 if(!window.XLSX)throw Error('Pustaka Excel belum termuat. Periksa koneksi internet, lalu muat ulang halaman.');
 const ab=await file.arrayBuffer();
 const wb=XLSX.read(ab,{type:'array',raw:false,cellText:true});
 if(!wb.SheetNames.length)throw Error('File Excel tidak memiliki sheet.');
 const sheet=wb.Sheets[wb.SheetNames[0]];
 const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',raw:false,blankrows:false});
 if(!rows.length)throw Error('Sheet Excel kosong.');
 // Cari baris header pada 30 baris pertama, sehingga judul laporan di atas tabel tidak menggagalkan impor.
 let headerRow=-1, ix={};
 for(let r=0;r<Math.min(rows.length,30);r++){
  const h=rows[r].map(v=>String(v??'').trim());
  const rekening=headerIndex(h,['NO_REKENING','NOMOR_REKENING','NO REKENING']);
  const nama=headerIndex(h,['NAMA','NAMA PESERTA']);
  if(rekening>=0&&nama>=0){headerRow=r;ix={no:headerIndex(h,['NO','NOMOR']),rekening,nama,alamat:headerIndex(h,['ALAMAT']),saldo:headerIndex(h,['SALDO_AKHIR','SALDO AKHIR','SALDO']),kode:headerIndex(h,['KODE_KANTOR','KODE KANTOR']),kantor:headerIndex(h,['NAMA_KANTOR','NAMA KANTOR'])};break;}
 }
 if(headerRow<0)throw Error('Header tidak ditemukan. Pastikan ada kolom NO_REKENING, NAMA, dan SALDO_AKHIR pada satu baris. Judul laporan boleh berada di atas tabel, maksimal 30 baris.');
 if(ix.saldo<0)throw Error('Kolom SALDO_AKHIR wajib ada agar kelayakan dan peluang undian dapat dihitung.');
 const val=(row,i)=>i<0?'':String(row[i]??'').trim();
 const raw=rows.slice(headerRow+1).map(row=>({sumberNo:val(row,ix.no),rekening:account(val(row,ix.rekening)),nama:val(row,ix.nama),alamat:val(row,ix.alamat),saldo:val(row,ix.saldo),kode:val(row,ix.kode),kantor:val(row,ix.kantor)})).filter(p=>p.rekening&&p.nama);
 if(!raw.length)throw Error('Header ditemukan, tetapi tidak ada data valid. Pastikan NO_REKENING dan NAMA terisi di bawah baris header.');
 const byAccount=new Map();
 for(const p of raw){
  const key=accountKey(p.rekening);
  if(!byAccount.has(key))byAccount.set(key,p);
  else if(byAccount.get(key).nama.toUpperCase()!==p.nama.toUpperCase())throw Error('Nomor rekening '+p.rekening+' muncul dengan nama berbeda. Periksa data Excel.');
 }
 // Nomor undian dibuat acak terhadap urutan baris Excel, lalu disimpan bersama data.
 // Satu rekening mendapat satu nomor undian unik; saldo memengaruhi peluang terpilih.
 const unique=Array.from(byAccount.values());
 const numbers=Array.from({length:unique.length},(_,i)=>i+1);
 for(let i=numbers.length-1;i>0;i--){const j=randomIndex(i+1);[numbers[i],numbers[j]]=[numbers[j],numbers[i]];}
 const list=unique.map((p,i)=>({...p,id:String(i+1),nomorUndian:String(numbers[i]).padStart(6,'0')}));
 return {list,duplikat:raw.length-list.length};
}
function accountKey(value){return String(value??'').trim().replace(/[\s.-]/g,'');}
function available(){const won=new Set(state.pemenang.map(p=>accountKey(p.rekening??p.no_rekening)));return state.peserta.filter(p=>!won.has(accountKey(p.rekening??p.no_rekening))&&peluang(p)>0)}
function stats(){const eligible=state.peserta.filter(p=>peluang(p)>0);const totalPeluang=eligible.reduce((sum,p)=>sum+peluang(p),0);if(e.total)e.total.textContent=eligible.length.toLocaleString('id-ID');if(e.totalKupon)e.totalKupon.textContent=totalPeluang.toLocaleString('id-ID');e.menang.textContent=state.pemenang.length.toLocaleString('id-ID');e.sisa.textContent=available().length.toLocaleString('id-ID');}
function buttons(){const ok=state.peserta.length>0&&available().length>0&&!state.berjalan&&!state.menunggu;e.mulai.disabled=!ok;e.mulaiFS.disabled=!ok;e.stop.disabled=!state.berjalan;e.stopFS.disabled=!state.berjalan;e.sah.disabled=!state.menunggu||!state.kandidat;e.sahFS.disabled=!state.menunggu||!state.kandidat;e.batal.disabled=!state.menunggu;if(e.batalFS)e.batalFS.disabled=!state.menunggu}
function maskAccount(value){const digits=String(value??'').replace(/\D/g,'');if(digits.length<=5)return 'XX.XXX';return digits.slice(0,2)+'.XXX.XX.XX'+digits.slice(-3)}
function showRolling(p){if(!p)return;e.kupon.textContent=p.nomorUndian;e.nama.textContent='PESERTA SEDANG DIACAK';e.alamat.textContent='Identitas peserta disembunyikan selama pengacakan';if(e.detail)e.detail.textContent='PT BPR BKK WONOGIRI (Perseroda)'}
function getNamaKantorTampilan(p){const kode=String(p?.kode??p?.KODE_KANTOR??p?.kode_kantor??'').trim();const nama=String(p?.kantor??p?.NAMA_KANTOR??p?.nama_kantor??'').trim();if(kode==='01'||kode==='1')return 'Kantor Pusat Operasional';return nama||'Nama kantor tidak tersedia'}
function showCandidate(p){if(!p)return;e.kupon.textContent=p.nomorUndian;e.nama.textContent=p.nama;e.alamat.textContent=p.alamat||'Alamat tidak tersedia';if(e.detail)e.detail.innerHTML=`<span class="detail-line">KANDIDAT — BELUM DISAHKAN</span><span class="detail-line">No. Rekening: ${esc(maskAccount(p.rekening))}</span><span class="detail-line detail-office">${esc(getNamaKantorTampilan(p))}</span>`}
function showApproved(p){if(!p)return;e.kupon.textContent=p.nomorUndian;e.nama.textContent=p.nama;e.alamat.textContent=p.alamat||'Alamat tidak tersedia';if(e.detail)e.detail.innerHTML=`<span class="detail-line">No. Rekening: ${esc(maskAccount(p.rekening))}</span><span class="detail-line detail-office">${esc(getNamaKantorTampilan(p))}</span>`}
function stopTimer(){if(state.timer){clearInterval(state.timer);state.timer=null}state.berjalan=false}
function renderWinners(){if(!state.pemenang.length){e.tbody.innerHTML='<tr><td colspan="7" class="empty-state">Belum ada pemenang.</td></tr>';return}e.tbody.innerHTML=state.pemenang.map((p,i)=>`<tr><td>${i+1}</td><td><strong>${esc(p.nomorUndian)}</strong></td><td>${esc(p.hadiah)}</td><td><strong>${esc(maskAccount(p.rekening))}</strong><div class="office-under-account"><span>${esc(getNamaKantorTampilan(p))}</span></div></td><td>${esc(p.nama)}</td><td>${esc(p.alamat||'-')}</td><td>${esc(new Date(p.waktu).toLocaleString('id-ID'))}</td></tr>`).join('')}
e.file.addEventListener('change',async ev=>{const f=ev.target.files?.[0];if(!f)return;if(state.berjalan)stopTimer();state.peserta=[];state.pemenang=[];state.kandidat=null;state.menunggu=false;stats();buttons();e.status.textContent='Membaca file Excel...';try{const result=await parseExcel(f);state.peserta=result.list;const totalKuponDibuat=assignCouponNumbers(state.peserta);const eligibleCount=state.peserta.filter(p=>peluang(p)>0).length;const excluded=state.peserta.length-eligibleCount;e.status.textContent=`Berhasil memuat ${state.peserta.length.toLocaleString('id-ID')} rekening unik; ${eligibleCount.toLocaleString('id-ID')} memenuhi saldo minimum dan ${excluded.toLocaleString('id-ID')} tidak memenuhi syarat. Total kupon: ${totalKuponDibuat.toLocaleString('id-ID')}. Setiap nomor kupon diundi secara acak; peluang dihitung dari kelipatan saldo Rp${kelipatanValue().toLocaleString('id-ID')}.${result.duplikat?` ${result.duplikat} baris rekening duplikat diabaikan`:''}`;renderWinners();stats();buttons();e.kupon.textContent='000000';e.nama.textContent='SIAP MEMULAI PENGUNDIAN';e.alamat.textContent='Identitas peserta akan ditampilkan setelah tombol SAH';if(e.detail)e.detail.textContent='Data peserta disembunyikan selama pengacakan';e.banner.classList.add('hidden');await saveState();msg('Data peserta berhasil diimpor dan disimpan otomatis.')}catch(err){e.status.textContent=err.message;msg(err.message);console.error(err)}});
function start(){if(state.berjalan||state.menunggu)return;if(!available().length){msg('Tidak ada rekening peserta tersisa.');return}const prize=e.hadiah.value.trim();if(!prize){msg('Isi nama hadiah terlebih dahulu.');e.hadiah.focus();return}e.judul.textContent=prize.toUpperCase();e.banner.classList.add('hidden');state.kandidat=null;state.menunggu=false;state.berjalan=true;buttons();state.timer=setInterval(()=>{const list=available();if(!list.length){stopTimer();buttons();return}showRolling(pickWeighted(list))},Number(e.interval.value)||75);saveState();msg('Pengacakan dimulai.')}
function stop(){if(!state.berjalan)return;stopTimer();const list=available();if(!list.length){buttons();msg('Tidak ada rekening peserta tersisa.');return}state.kandidat=pickWeighted(list);state.menunggu=true;showCandidate(state.kandidat);buttons();saveState();msg('Kandidat ditampilkan. Tekan SAH untuk memasukkan ke daftar pemenang, atau BATALKAN KANDIDAT untuk mengulang.')}
function approve(){if(!state.menunggu||!state.kandidat){msg('Belum ada kandidat untuk disahkan.');return}const p=state.kandidat,prize=e.hadiah.value.trim();if(!prize){msg('Nama hadiah wajib diisi.');return}if(state.pemenang.some(x=>accountKey(x.rekening??x.no_rekening)===accountKey(p.rekening))){msg('Rekening ini sudah pernah menang dan tidak dapat menang lagi.');state.kandidat=null;state.menunggu=false;buttons();return}const win={...p,hadiah:prize,waktu:new Date().toISOString()};state.pemenang.push(win);state.kandidat=null;state.menunggu=false;e.banner.classList.remove('hidden');e.resmi.textContent=`${win.nama} — Undian ${win.nomorUndian} — Rekening ${maskAccount(win.rekening)}`;showApproved(p);renderWinners();stats();buttons();saveState();msg('Pemenang berhasil disahkan.')}
function cancelCandidate(){if(!state.menunggu)return;state.kandidat=null;state.menunggu=false;e.banner.classList.add('hidden');e.kupon.textContent='000000';e.nama.textContent='KANDIDAT DIBATALKAN';e.alamat.textContent='Tekan MULAI untuk mengulang pengacakan.';if(e.detail)e.detail.textContent='';buttons();saveState();msg('Kandidat dibatalkan.')}
function setImage(src){e.gambar.onload=()=>{e.gambar.style.display='block';e.placeholder.style.display='none'};e.gambar.onerror=()=>{e.gambar.style.display='none';e.placeholder.style.display='flex'};e.gambar.src=src}
e.image.addEventListener('change',ev=>{const f=ev.target.files?.[0];if(!f)return;if(!f.type.startsWith('image/')){msg('Pilih file gambar yang valid.');return}const reader=new FileReader();reader.onload=async()=>{const key=e.hadiah.value.trim().toUpperCase()||'HADIAH UTAMA';state.gambarHadiahByNama[key]=String(reader.result);setImage(state.gambarHadiahByNama[key]);state.hadiahAktif=key;await saveState();msg('Gambar hadiah tersimpan di browser dan tetap ada setelah refresh.')};reader.onerror=()=>msg('Gambar tidak dapat dibaca.');reader.readAsDataURL(f)});e.pilihanHadiah.addEventListener('change',()=>applyPrizeChoice(e.pilihanHadiah.value,'main'));e.pilihanHadiahFS.addEventListener('change',()=>applyPrizeChoice(e.pilihanHadiahFS.value,'fs'));$('btnTambahHadiah').addEventListener('click',addPrize);e.interval.addEventListener('change',saveState);for(const field of [e.minSaldo,e.kelipatanSaldo]){field.addEventListener('change',()=>{if(field===e.minSaldo&&minSaldoValue()<0)field.value='50000';if(field===e.kelipatanSaldo&&kelipatanValue()<=0)field.value='50000';if(state.berjalan){stopTimer();msg('Pengaturan saldo berubah; pengacakan dihentikan. Tekan MULAI kembali.')}if(state.menunggu){state.kandidat=null;state.menunggu=false;e.kupon.textContent='000000';e.nama.textContent='PENGATURAN SALDO DIPERBARUI';e.alamat.textContent='Kandidat sebelumnya dibatalkan. Silakan mulai pengacakan kembali.';e.banner.classList.add('hidden')}if(!state.pemenang.length)assignCouponNumbers(state.peserta);stats();buttons();saveState();const eligible=state.peserta.filter(p=>peluang(p)>0).length;const kuponTotal=state.peserta.reduce((sum,p)=>sum+peluang(p),0);e.status.textContent=`${eligible.toLocaleString('id-ID')} rekening memenuhi syarat saldo minimum Rp${minSaldoValue().toLocaleString('id-ID')}. Total ${kuponTotal.toLocaleString('id-ID')} nomor kupon; setiap nomor kupon diundi secara acak. Peluang berdasarkan kelipatan Rp${kelipatanValue().toLocaleString('id-ID')}.`;});}e.hadiah.addEventListener('input',()=>{const v=e.hadiah.value.trim().toUpperCase();e.judul.textContent=v||'HADIAH UNDIAN';state.hadiahAktif=v;if(e.pilihanHadiah&&Array.from(e.pilihanHadiah.options).some(o=>o.value===v))e.pilihanHadiah.value=v;if(e.pilihanHadiahFS&&Array.from(e.pilihanHadiahFS.options).some(o=>o.value===v))e.pilihanHadiahFS.value=v});
function exportWinners(){if(!state.pemenang.length){msg('Belum ada pemenang.');return}if(!window.XLSX){msg('Library Excel belum tersedia.');return}const rows=state.pemenang.map((p,i)=>({NO:i+1,NOMOR_UNDIAN:p.nomorUndian,HADIAH:p.hadiah,NO_REKENING:p.rekening,NAMA:p.nama,ALAMAT:p.alamat,SALDO_AKHIR:p.saldo,KODE_KANTOR:p.kode,NAMA_KANTOR:p.kantor,STATUS:'SAH',WAKTU:new Date(p.waktu).toLocaleString('id-ID')}));const ws=XLSX.utils.json_to_sheet(rows),wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Pemenang');XLSX.writeFile(wb,'HASIL_UNDIAN_DOORPRIZE.xlsx')}
function download(name,content,type='application/json'){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function backup(){download('BACKUP_UNDIAN_DOORPRIZE.json',JSON.stringify({app:'Undian Doorprize Pro',version:2,createdAt:new Date().toISOString(),peserta:state.peserta,pemenang:state.pemenang,hadiahTambahan:state.hadiahTambahan,gambarHadiahByNama:state.gambarHadiahByNama,hadiahAktif:e.hadiah.value},null,2));msg('File backup dibuat. Simpan dengan aman.')}
e.restore.addEventListener('change',async ev=>{const f=ev.target.files?.[0];if(!f)return;try{const d=JSON.parse(await f.text());if(!Array.isArray(d.peserta)||!Array.isArray(d.pemenang))throw Error('Struktur backup tidak valid.');const accounts=new Set(d.peserta.map(p=>accountKey(p.rekening??p.no_rekening??'')));const seen=new Set();for(const w of d.pemenang){const k=accountKey(w.rekening??w.no_rekening??'');if(k&&seen.has(k))throw Error('Backup tidak valid: satu rekening tercatat menang lebih dari sekali.');if(k)seen.add(k);if(k&&!accounts.has(k))throw Error('Backup berisi pemenang yang tidak cocok dengan peserta.')}state.peserta=d.peserta;if(state.peserta.length&&state.peserta.some(p=>!Number.isInteger(Number(p.kuponAwal))||!Number.isInteger(Number(p.kuponAkhir))))assignCouponNumbers(state.peserta);state.hadiahTambahan=Array.isArray(d.hadiahTambahan)?d.hadiahTambahan:[];state.gambarHadiahByNama=d.gambarHadiahByNama||{};renderPrizeOptions();state.pemenang=d.pemenang.map(p=>({...p,nomorUndian:p.nomorUndian||p.kupon||'000000',rekening:p.rekening||p.no_rekening||''}));state.kandidat=null;state.menunggu=false;stopTimer();renderWinners();stats();buttons();e.hadiah.value=d.hadiahAktif||'HADIAH UTAMA';applyPrizeChoice(e.hadiah.value,'main');await saveState();e.status.textContent=`Backup dipulihkan: ${state.peserta.length} rekening, ${state.pemenang.length} pemenang.`;msg('Backup berhasil dipulihkan.')}catch(err){msg('Gagal memulihkan: '+err.message)}finally{ev.target.value=''}});
e.mulai.addEventListener('click',start);e.mulaiFS.addEventListener('click',start);e.stop.addEventListener('click',stop);e.stopFS.addEventListener('click',stop);e.sah.addEventListener('click',approve);e.sahFS.addEventListener('click',approve);e.batal.addEventListener('click',cancelCandidate);if(e.batalFS)e.batalFS.addEventListener('click',cancelCandidate);e.export.addEventListener('click',exportWinners);e.backup.addEventListener('click',backup);
async function enterFS(){try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen()}catch(err){msg('Browser menolak fullscreen. Mode tampilan tetap diaktifkan.')}document.body.classList.add('fullscreen-mode');e.fullscreen.textContent='✕ KELUAR FULLSCREEN'}async function exitFS(){if(document.fullscreenElement){try{await document.exitFullscreen()}catch(err){}}document.body.classList.remove('fullscreen-mode');e.fullscreen.textContent='⛶ FULLSCREEN'}e.fullscreen.addEventListener('click',()=>document.body.classList.contains('fullscreen-mode')?exitFS():enterFS());e.keluarFS.addEventListener('click',exitFS);document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&document.body.classList.contains('fullscreen-mode')){document.body.classList.remove('fullscreen-mode');e.fullscreen.textContent='⛶ FULLSCREEN'}});
$('logoBpr').addEventListener('error',ev=>{ev.currentTarget.style.display='none';ev.currentTarget.parentElement.textContent='BPR';ev.currentTarget.parentElement.style.color='#104ca5';ev.currentTarget.parentElement.style.fontWeight='900'});
renderPrizeOptions();e.pilihanHadiah.value='HADIAH UTAMA';e.pilihanHadiahFS.value='HADIAH UTAMA';e.hadiah.value='HADIAH UTAMA';e.judul.textContent='HADIAH UTAMA';setImage('./assets/hadiah/hadiah-utama.png');stats();buttons();loadState().then(restored=>{if(!restored){saveState()}else{msg('Data undian dipulihkan otomatis dari penyimpanan browser.')}});window.addEventListener('beforeunload',()=>{if(state.berjalan)stopTimer();saveState()});
