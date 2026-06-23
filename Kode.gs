/**
 * =========================================================================
 * RUANG SADHANA BY GNP v2026 - BACKEND CORE (KODE.GS) - OPTIMASI TOTAL
 * Status: 100% Steril, Hemat Kuota Google I/O, & Booting Super Cepat
 * =========================================================================
 */

// ============================================================================
// 🔐 KONFIGURASI UTAMA SHEET ID & GITHUB - TERKUNCI AMAN DI MEMORI SCRIPT (.GS)
// ============================================================================
// ID Spreadsheet Utama untuk pengaturan, data pendaftaran, dan log kedatangan
const ADMIN_SS_ID = "1iTqo83VqSQ8tnh8KGeZ4gHP3q6fYMbvQb7jqBWPokBw";
const LAGU_SS_ID  = "1MoB0Yeydrf1yO6DmD2zvk2FyrgU7zuqzMIYJsr2xXPs"; 
const ADMIN_PASSWORD = "8484";
const GITHUB_USER  = "wijayatkgnr-wq";
const GITHUB_REPO  = "laguBhajan";
// ============================================================================

/**
 * FUNGSI UTAMA WEB APP (ROUTING URL)
 * Tugas: Menyaring parameter URL untuk memutuskan tampilan utama atau laporan log kedatangan
 * Alamat Akses Laporan: URL_APLIKASI_WEB?buka=log
 */
function doGet(e) {
  // Sistem otomatis membaca nomor versi dari menu Project Settings yang kita buat tadi
  const nomorVersiDariSheet = PropertiesService.getScriptProperties().getProperty('VERSION') || "3.18";

  const parameterBuka = e && e.parameter ? e.parameter.buka : null;
  
  // 1. JALUR HALAMAN LAPORAN LOG (TETAP DIJAGA UTUH ORIGINAL)
  if (parameterBuka === "log") {
    const tLog = HtmlService.createTemplateFromFile("LaporanLog");
    tLog.nomorVersiResmiSistem = nomorVersiDariSheet; // Titipkan versi ke halaman log
    return tLog.evaluate()
        .setTitle("Laporan Log Kehadiran Umat")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  // 2. JALUR HALAMAN UTAMA MAIN (TETAP DIJAGA UTUH ORIGINAL)
  const tMain = HtmlService.createTemplateFromFile("Main");
  tMain.nomorVersiResmiSistem = nomorVersiDariSheet; // Titipkan versi ke halaman utama
  return tMain.evaluate()
      .setTitle("Ruang Sadhana by GNP v2026")
      .addMetaTag("viewport", "width=device-width, initial-scale=1")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// === JALUR OTOMATIS: DIPANGGIL JAVASCRIPT DI BACKGROUND SETIAP 5 MENIT ===
function ambilVersiTerbaruServer() {
  return PropertiesService.getScriptProperties().getProperty('VERSION') || "3.18";
}

/**
 * DATABASE LAGU UTAMA
 * Tugas: Menarik seluruh daftar lagu dari semua sheet kecuali "Sheet1",
 * diurutkan secara alfabetis berdasarkan judul lagu untuk setiap kategori.
 */
/**
 * PERBAIKAN MUTLAK STEP 1: AMBIL DATA SELURUH LAGU DENGAN INDEKS MATRIKS AKURAT (ANTI-KOSONG)
 */
function getSemuaLagu() {
  const ssLagu = SpreadsheetApp.openById(LAGU_SS_ID);
  if (!ssLagu) return [];
  
  const sheets = ssLagu.getSheets().sort((a, b) => a.getIndex() - b.getIndex());
  const excludedSheets = ["Sheet1"];
  let allSongs = [];

  sheets.forEach(sh => {
    const name = sh.getName();
    if (!excludedSheets.includes(name)) {
      const lastRow = sh.getLastRow();
      if (lastRow > 1) {
        const values = sh.getRange(2, 1, lastRow - 1, 6).getValues();
        
        let songsInSheet = values
          .filter(row => row && row)
          .map(row => ({ 
            id: row[0].toString().trim(), 
            judul: row[1] ? row[1].toString().trim() : "", 
            kategori: name,
            lirik: row[2] ? row[2].toString().trim() : "", 
            filo:  row[3] ? row[3].toString().trim() : "-",  
            glos:  row[4] ? row[4].toString().trim() : "",  
            mp3:   row[5] ? row[5].toString().trim() : ""   
          }));
        
        songsInSheet.sort((a, b) => a.judul.localeCompare(b.judul));
        allSongs = allSongs.concat(songsInSheet);
      }
    }
  });
  return allSongs;
}


/**
 * TAHAP 1: ROMBAK BAGASI INITIAL (SINKRONISASI TAS DATA PRE-FETCH)
 * Tugas: Memaketkan data Vital sekaligus dalam satu kali perjalanan internet
 * Efisiensi: Memanfaatkan memori terpusat tunggal agar booting instan & hemat kuota
 */
function getBundledInitialData() {
  try {
    var dataLiveDriveMentah = "";
    try {
      if (typeof ambilDaftarBlokirDriveSecaraLive === "function") {
        dataLiveDriveMentah = ambilDaftarBlokirDriveSecaraLive();
      }
    } catch (errDrive) {
      console.log("Gagal prapemuatan bagasi Drive, dilewati aman: " + errDrive.message);
    }

    // Mengambil data terpusat ke memori agar fungsi-fungsi di bawahnya tidak memanggil Sheet lagi
    const dataSevaTerpusat = getDataLengkapSeva();

    return {
      songs: typeof getSemuaLagu === "function" ? getSemuaLagu() : [],
      seva: dataSevaTerpusat,
      liveBlokirDrive: dataLiveDriveMentah 
    };
  } catch (e) {
    return { error: e.message };
  }
}
/**
 * DATA SEVA MURNI REAL-TIME & MASTER MEMORI PUSAT (SUPER FAST FETCH)
 * Tugas: Menarik seluruh parameter dari Sheets (DataSetting & DataSeva) dalam SATU KALI pengambilan data.
 * Efisiensi: Mengeliminasi pembacaan berulang, semua disimpan di memori objek config.
 */
function getDataLengkapSeva(waktuAcak) {
  const ss = SpreadsheetApp.openById(ADMIN_SS_ID);
  const shSet = ss.getSheetByName("DataSetting");
  const shSeva = ss.getSheetByName("DataSeva");
  
  let config = { 
    hari: "4", waktu: "19:00", maxLagu: "", autoSlot: false, pwAdmin: "", 
    backupFolderId: "", members: {}, memberFavorites: {}, quotes: [], warna: [], 
    daftarLatihan: [], slotTerisi: [], logSuksesBackup: "",
    angkaFilterB10Bawaan: "0",
    bhajanSpesialB11Bawaan: false,
    bhajanSpesialB12Bawaan: false, 
    memberSettings: {},
    kamusNamaOtomatis: {},        
    listMemberMandiriTampak: [],
    versiDbLagu: "0",
    githubUser: GITHUB_USER,
    githubRepo: GITHUB_REPO,
    // 🔥 SUNTIKAN SAKTI 1: Siapkan wadah grup teks murni agar aman dilewati gerbang Google Cloud
    formasiGrupOtomatis: []
  };


  // 1. MEMBACA TAB DATASETTING (B1-B12 dan Kolom F-G)
  if (shSet) {
    const v = shSet.getRange("B1:B12").getValues();
    config.hari = (v[0] && v[0][0] != null) ? String(v[0][0]) : "4";
    config.waktu = (v[1] && v[1][0] != null) ? String(v[1][0]) : "19:00";
    config.maxLagu = (v[2] && v[2][0] != null) ? String(v[2][0]) : "";
    config.autoSlot = (v[3] && v[3][0] != null) ? String(v[3][0]).trim().toUpperCase() === "TRUE" : false;
    config.pwAdmin = (v[4] && v[4][0] != null) ? String(v[4][0]).trim() : ""; 
    config.backupFolderId = (v[5] && v[5][0] != null) ? String(v[5][0]).trim() : "";
    config.logSuksesBackup = (v[8] && v[8][0] != null) ? String(v[8][0]) : "";
    config.angkaFilterB10Bawaan = (v[9] && v[9][0] != null) ? String(v[9][0]).trim() : "0";
    
    var nilaiB11Mentah = v[10] ? v[10][0] : false;
    config.bhajanSpesialB11Bawaan = nilaiB11Mentah === true || String(nilaiB11Mentah).trim().toUpperCase() === "TRUE";

    var nilaiB12Mentah = v[11] ? v[11][0] : false;
    config.bhajanSpesialB12Bawaan = nilaiB12Mentah === true || String(nilaiB12Mentah).trim().toUpperCase() === "TRUE";

    // 🎯 SUNTIKAN SAKTI SERVER: Baca sel B15 agar data riwayat Drive ikut terkirim live ke HP jemaat
    var nilaiB15Mentah = shSet.getRange("B15").getValue();
    config.keranjangRiwayatDriveClean = (nilaiB15Mentah != null) ? String(nilaiB15Mentah).trim() : "";


    const lastRowSet = shSet.getLastRow();
    if (lastRowSet >= 2) {
      const extraData = shSet.getRange(2, 6, lastRowSet - 1, 2).getValues();
      extraData.forEach(r => {
        if (r[0] && String(r[0]).trim() !== "") config.warna.push(String(r[0]).trim());
        if (r[1] && String(r[1]).trim() !== "") {
          const val = String(r[1]).trim();
          const matches = [...val.matchAll(/"([^"]+)"/g)];
          if (matches && matches.length >= 2) {
            config.quotes.push({ text: matches[0][1], source: matches[1][1] });
          } else {
            config.quotes.push({ text: val.replace(/"/g, ""), source: "Anonim" });
          }
        }
      });
    }
  }

  // 2. MEMBACA TAB DATASEVA (Kolom A sampai L - Disatukan Bersih & Tanpa Duplikasi)
  if (shSeva) {
    const lastRowSeva = shSeva.getLastRow();
    if (lastRowSeva >= 2) {
      const totalDataSeva = shSeva.getRange(2, 1, lastRowSeva - 1, Math.min(shSeva.getLastColumn(), 12)).getValues();
      
      totalDataSeva.forEach(baris => {
        if (baris) {
          // A. Pemrosesan Data Slot Lagu (Kolom A - G / Indeks 0 - 6)
          let rowSlot = baris.slice(0, 7).map(cell => (cell == null ? "" : String(cell).trim()));
          
          if (rowSlot[0] !== "" && rowSlot[4] !== "" && rowSlot[4] !== "0") {
            var linkAudioDinamis = dapatkanLinkTransitGitHubMurni(rowSlot[4]);
            rowSlot[7] = linkAudioDinamis; 
            
            let dataFormatHP = {
              "0": rowSlot[0], // Nomor Slot Physical
              "1": rowSlot[1], // ID Member penyanyi
              "2": rowSlot[2], // Nama penyanyi
              "3": rowSlot[3], // Judul kategori
              "4": rowSlot[4], // ID Lagu
              "5": rowSlot[5], // Judul Lagu
              "6": rowSlot[6], // Angka Nada Pengunci (-5 s/d +5)
              "7": rowSlot[7]  // Link Transit Audio murni
            };
            
            config.daftarLatihan.push(dataFormatHP);
            config.slotTerisi.push(rowSlot[0]);
          }

          // B. Pemrosesan Data Member & Akun Mandiri (Kolom H - L / Indeks 7 - 11)
          if (baris.length >= 12) {
            var kolomH_id      = baris[7];
            var kolomI_nama    = baris[8];
            var kolomJ_favorit = baris[9];
            var kolomK_kunci   = baris[10];
            var kolomL_default = baris[11];

            if (kolomH_id && String(kolomH_id).trim() !== "") {
              const key = String(kolomH_id).toLowerCase().trim();
              const idUpper = key.toUpperCase();
              const namaClean = kolomI_nama ? String(kolomI_nama).trim() : "";
              
              config.members[key] = namaClean;
              
              config.memberFavorites[key] = [];
              if (kolomJ_favorit && String(kolomJ_favorit).trim() !== "") {
                config.memberFavorites[key] = String(kolomJ_favorit).split(",").map(id => id.trim()).filter(id => id !== "");
              }

              var cekK = kolomK_kunci === true || String(kolomK_kunci).trim().toUpperCase() === "TRUE";
              var cekL = kolomL_default === true || String(kolomL_default).trim().toUpperCase() === "TRUE";

              config.memberSettings[key] = { kunciFavorit: cekK, defaultKategori: cekL };
              
              if (idUpper !== "ANONIM" && !idUpper.includes("ANONIM-")) {
                config.kamusNamaOtomatis[idUpper] = namaClean;
                config.listMemberMandiriTampak.push({ id: idUpper, nama: namaClean });
              }
            }
          }
        }
      });

      // Hilangkan duplikasi nomor slot terisi dan urutkan nama member secara alfabetis alami
      config.slotTerisi = [...new Set(config.slotTerisi)];
      config.listMemberMandiriTampak.sort((a, b) => 
        a.id.toString().localeCompare(b.id.toString(), undefined, { numeric: true, sensitivity: 'base' })
      );
    }
  }

  // 3. LOCK REFRESH ANTI-LOOP HANTU (Pembulatan Menit Terdekat)
  try {
    if (LAGU_SS_ID && LAGU_SS_ID !== "" && LAGU_SS_ID !== "0") {
      const waktuMentah = DriveApp.getFileById(LAGU_SS_ID).getLastUpdated().getTime();
      config.versiDbLagu = (Math.floor(waktuMentah / 60000) * 60000).toString();
    } else {
      config.versiDbLagu = "0";
    }
  } catch (errVersi) {
    config.versiDbLagu = new Date().getTime().toString(); 
  }

  // 🔥 SUNTIKAN SAKTI 2: Lampirkan struktur formasi grup otomatis dari DataSetting A21-B21 ke bawah
  try {
    const dataGrupAsli = getStrukturFormasiGrupSetting() || [];
    config.formasiGrupOtomatis = dataGrupAsli.map(function(grup) {
      return {
        indexBaris: grup.indexBaris,
        nama: grup.nama,
        anggotaRaw: grup.anggotaRaw // Kirim Teks Murni murni, sangat aman bagi Google Cloud!
      };
    });
  } catch(errGrup) { config.formasiGrupOtomatis = []; }

  return config;
}


// 🚀 SUNTIKAN PENYELAMAT ADMIN: Fungsi shortcut agar panel admin & daftar member langsung menggunakan data terpusat yang sama
function getBundledAdminDataServer() {
  return getDataLengkapSeva("admin_bypass_" + new Date().getTime());
}

/**
 * FUNGSI 2: SELEKTIF UPDATE CLOUD
 * Tugas: Menulis perubahan status centang jemaat langsung ke Kolom K atau Kolom L di Sheets.
 */
function perbaruiOpsiDataSeva(idUser, tipeOpsi, nilaiBaru) {
  if (!idUser || idUser.toUpperCase().trim() === "ANONIM") return "Ditolak: Akun ANONIM tidak diizinkan mengubah pengaturan.";
  
  var idBersih = idUser.toString().trim().toUpperCase();
  const ss = SpreadsheetApp.openById(ADMIN_SS_ID);
  const sheet = ss.getSheetByName("DataSeva");
  if (!sheet) return "Gagal: Tab DataSeva tidak ditemukan.";
  
  var totalBaris = sheet.getLastRow();
  if (totalBaris < 2) return "Gagal: Belum ada data member.";
  
  var dataId = sheet.getRange(2, 8, totalBaris - 1, 1).getValues();
  var barisTarget = -1;
  
  for (var i = 0; i < dataId.length; i++) {
    if (dataId[i][0].toString().trim().toUpperCase() === idBersih) {
      barisTarget = i + 2;
      break;
    }
  }
  
  if (barisTarget === -1) return "Gagal: ID Pengguna tidak ditemukan di database.";
  var kolomTarget = (tipeOpsi === "KUNCI") ? 11 : 12;
  
  sheet.getRange(barisTarget, kolomTarget).setValue(nilaiBaru);
  return "Sukses: Opsi " + tipeOpsi + " untuk " + idBersih + " berhasil diubah menjadi " + nilaiBaru;
}

/**
 * SIMPAN PENDAFTARAN SEVA MANDIRI (100% BERSIH KE TAB DATASEVA)
 */
function simpanSeva(obj) { 
  const ss = SpreadsheetApp.openById(ADMIN_SS_ID); 
  const shSeva = ss.getSheetByName("DataSeva"); 
  const nomorSlot = parseInt(obj.nomor); 
  const barisTarget = nomorSlot + 1; 
  const waktuSekarang = new Date(); 
  const idMember = obj.idMember.toString().toUpperCase().trim(); 
  const idLaguClean = obj.idLagu.toString().trim();
  
  const locale = ss.getSpreadsheetLocale(); 
  const p = (locale.indexOf('id') !== -1 || locale.indexOf('ID') !== -1) ? ";" : ","; 
  
  const rumusNama = '=IFERROR(VLOOKUP(B' + barisTarget + p + '$H:$I' + p + '2' + p + 'FALSE); "ID Tidak Terdaftar")'; 
  const lastRow = shSeva.getLastRow(); 
  
  // 1. Catat data seva administrasi jemaat ke spreadsheet
  if (barisTarget > lastRow) { 
    shSeva.appendRow([obj.nomor, idMember, rumusNama, obj.judul, obj.idLagu, waktuSekarang, "0"]); 
  } else { 
    shSeva.getRange(barisTarget, 1, 1, 2).setValues([[obj.nomor, idMember]]); 
    shSeva.getRange(barisTarget, 3).setFormula(rumusNama); 
    shSeva.getRange(barisTarget, 4, 1, 4).setValues([[obj.judul, obj.idLagu, waktuSekarang, "0"]]); 
  } 

  // ============================================================================
  // 🗑️ BLOK TRANSIT DUPLIKASI MP3 DRIVE KE GITHUB DIHAPUS TOTAL DI SINI
  // Urusan copy-paste file sudah ditiadakan karena semua lagu sudah tersimpan abadi di GitHub Pages.
  // ============================================================================
  
  // 2. Logika pencatatan riwayat lagu favorit jemaat (Dijaga utuh original)
  try {
    const totalRowSeva = shSeva.getLastRow();
    if (totalRowSeva >= 2 && idMember !== "ANONIM" && !idMember.includes("ANONIM-")) {
      const dataMembersLog = shSeva.getRange(2, 8, totalRowSeva - 1, 1).getValues();
      let rowMemberIdx = -1;
      
      for (let i = 0; i < dataMembersLog.length; i++) {
        if (dataMembersLog[i] && dataMembersLog[i].toString().toUpperCase().trim() === idMember) {
          rowMemberIdx = i;
          break;
        }
      }
      
      if (rowMemberIdx !== -1) {
        const barisTargetMember = rowMemberIdx + 2;
        const selFavoritMember = shSeva.getRange(barisTargetMember, 10); 
        const teksFavoritLamaMember = selFavoritMember.getValue().toString().trim();
        
        let daftarLaguAktifMember = teksFavoritLamaMember !== "" ? teksFavoritLamaMember.split(",").map(id => id.trim()).filter(id => id !== "") : [];
        
        if (daftarLaguAktifMember.indexOf(idLaguClean) === -1 && idLaguClean !== "") {
          daftarLaguAktifMember.push(idLaguClean);
          selFavoritMember.setValue(daftarLaguAktifMember.join(","));
        }
      }
    }
  } catch (errFavorit) {
    console.log("Otomatisasi favorit dilewati aman.");
  }
  
  SpreadsheetApp.flush();
  return "✅ Berhasil mendaftar!"; 
}




/**
 * REVISI MASTER FINAL: UPDATE ID SLOT SEVA DENGAN AUTO LOG LIVE
 */
function updateIdSeva(slot, idBaru) {
  const ss = SpreadsheetApp.openById(ADMIN_SS_ID);
  const sh = ss.getSheetByName("DataSeva");
  if (!sh) return "❌ Error: Tab DataSeva tidak ditemukan.";
  
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return "❌ Belum ada data pendaftaran.";
  
  const data = sh.getRange(2, 1, lastRow - 1, 1).getValues();
  const index = data.findIndex(row => row[0].toString().trim() === slot.toString().trim());
  
  if (index !== -1) {
    const baris = index + 2;
    const idCleanUpper = idBaru.toString().toUpperCase().trim();
    
    const locale = ss.getSpreadsheetLocale(); 
    const p = (locale.indexOf('id') !== -1 || locale.indexOf('ID') !== -1) ? ";" : ","; 
    const rumusNamaBaru = '=IFERROR(VLOOKUP(B' + baris + p + '$H:$I' + p + '2' + p + 'FALSE); "ID Tidak Terdaftar")';
    
    // 🚀 PERBAIKAN BUG MUTLAK: Hanya menimpa ID di Kolom B dan Rumus di Kolom C
    sh.getRange(baris, 2).setValue(idCleanUpper);
    sh.getRange(baris, 3).setFormula(rumusNamaBaru);
    
    // 🗑️ BARIS PENGHAPUS JUDUL LAGU (Kolom 4, 5, 6) DI BAWAH INI SUDAH DIHAPUS TOTAL:
    // sh.getRange(baris, 4, 1, 3).setValues([["", "", waktuSekarang]]); -> DIBUANG AGAR LAGU TIDAK HILANG
    
    SpreadsheetApp.flush();
    
    try {
      if (idCleanUpper !== "" && idCleanUpper !== "ANONIM") {
        catatKedatanganOtomatis(idCleanUpper);
      }
    } catch (errLog) {
      console.log("Pencatatan log otomatis admin dilewati aman: " + errLog.message);
    }
    
    SpreadsheetApp.flush();
    return `✅ Berhasil Ganti ID Slot ${slot} tanpa menghapus data lagu! Kehadiran Member Baru Telah Sukses Tercatat!`;
  }
  return "❌ Slot tidak ditemukan.";
}




/**
 * HAPUS DATA SLOT SEVA (MURNI ADMINISTRASI SPREADSHEET - SECEPAT KILAT)
 * Tugas: Menghapus pendaftaran satu slot di spreadsheet tanpa mengganggu file MP3 di GitHub
 */
function hapusSlotSeva(slot) {
  try {
    const sh = SpreadsheetApp.openById(ADMIN_SS_ID).getSheetByName("DataSeva");
    const dataSlot = sh.getRange(2, 1, Math.max(1, sh.getLastRow() - 1), 1).getValues();
    const index = dataSlot.findIndex(r => r.toString() === slot.toString());
    
    if (index !== -1) {
      // ============================================================================
      // 🗑️ BLOK KEGIATAN MENYIMPANG DIHAPUS TOTAL DI SINI:
      // Dua baris kode 'idLaguJemaatBatal' dan 'hapusSatuMp3DiGitHub' sudah dibuang.
      // File fisik MP3 dibiarkan tetap siaga abadi di GitHub Pages agar anti-404.
      // ============================================================================

      // Baris pembersihan asli kepunyaan Anda (Dijaga 100% utuh original):
      sh.getRange(index + 2, 1, 1, 7).clearContent();
      SpreadsheetApp.flush();
      return `✅ Slot ${slot} berhasil dihapus!`;
    }
    return "⚠ Slot tidak ditemukan.";
  } catch (e) { return "❌ Error: " + e.message; }
}


/**
 * AMBIL DETAIL SATU SLOT
 */
function getSatuSlot(no) {
  const sh = SpreadsheetApp.openById(ADMIN_SS_ID).getSheetByName("DataSeva");
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return null;

  const data = sh.getRange(2, 1, lastRow - 1, 5).getValues();
  const target = data.find(row => row[0].toString() === no.toString());

  if (target) {
    const nama = target[2] ? target[2].toString().trim() : "";
    if (nama === "" || nama === "ID Tidak Terdaftar") return null;
    return { nama: nama, judul: target[3].toString() };
  }
  return null;
}
/**
 * SIMPAN MASTER ANGGOTA BARU / UPDATE NAMA
 */
function simpanMember(id, nama) {
  const ss = SpreadsheetApp.openById(ADMIN_SS_ID);
  const sh = ss.getSheetByName("DataSeva");
  const lastRow = sh.getLastRow();
  const idUpper = id.toUpperCase().trim();
  if (lastRow < 1) return "❌ Struktur Sheet belum siap (Header kosong).";
  
  const kolomAwal = 8; // Kolom 8 = Kolom H (ID)
  const dataID = sh.getRange(2, kolomAwal, Math.max(lastRow - 1, 1), 1).getValues();
  const index = dataID.findIndex(r => r.toString().toUpperCase() === idUpper);

  if (index !== -1) {
    // JIKA ID SUDAH ADA: Hanya perbarui Nama di Kolom 9 (Kolom I)
    sh.getRange(index + 2, 9).setValue(nama); 
    SpreadsheetApp.flush();
    return `✅ Member ${idUpper} diperbarui!`;
  } else {
    // JIKA ID BARU: Ambil nilai favorit default dari tab DataSetting B14
    let favoritDefault = "";
    try {
      const shSetting = ss.getSheetByName("DataSetting");
      if (shSetting) {
        favoritDefault = shSetting.getRange("B14").getValue();
      }
    } catch(err) {
      console.log("Gagal mengambil DataSetting!B14: " + err.toString());
    }

    const barisBaru = lastRow + 1;
    
    // Mengisi 5 kolom sekaligus berdampingan: 
    // Kolom H (ID), I (Nama), J (Favorit), K (True), L (True)
    sh.getRange(barisBaru, kolomAwal, 1, 5).setValues([[idUpper, nama, favoritDefault, true, true]]);
    
    // Proses pengurutan (Sort) otomatis bawaan Anda
    const currentLastColumn = sh.getLastColumn();
    const jumlahKolom = Math.max(5, currentLastColumn - kolomAwal + 1); 
    const totalBarisData = sh.getLastRow() - 1;
    if (totalBarisData > 0) {
      sh.getRange(2, kolomAwal, totalBarisData, jumlahKolom).sort({column: kolomAwal, ascending: true});
    }
    SpreadsheetApp.flush(); 
    return `✅ Member Baru ${idUpper} ditambah dengan default setting dan diurutkan rapi!`;
  }
}


/**
 * HAPUS MASTER ANGGOTA TOTAL
 */
function hapusMember(id) {
  const ss = SpreadsheetApp.openById(ADMIN_SS_ID);
  const sh = ss.getSheetByName("DataSeva"); 
  const lastRow = sh.getLastRow();
  const lastColumn = sh.getLastColumn();
  if (lastRow < 2) return "❌ Belum ada data member.";
  
  const kolomAwal = 8; 
  const jumlahKolom = Math.max(3, lastColumn - kolomAwal + 1); 
  const dataID = sh.getRange(2, kolomAwal, lastRow - 1, 1).getValues();
  const idUpper = id.toString().toUpperCase().trim();
  const index = dataID.findIndex(r => r.toString().toUpperCase() === idUpper);
  
  if (index !== -1) {
    const barisTarget = index + 2;
    sh.getRange(barisTarget, kolomAwal, 1, jumlahKolom).clearContent();
    const totalBarisData = sh.getLastRow() - 1;
    if (totalBarisData > 0) {
      sh.getRange(2, kolomAwal, totalBarisData, jumlahKolom).sort({column: kolomAwal, ascending: true});
    }
    SpreadsheetApp.flush(); 

    if (typeof eksekusiSapuJagatPembersihanIdGrupLokal === "function") {
      eksekusiSapuJagatPembersihanIdGrupLokal(idUpper); 
    }

    return `✅ Member ${id} beserta semua lagu favoritnya berhasil dihapus!`;
  }
  return "❌ Member tidak ditemukan.";
}

/**
 * SIMPAN PARAMETER PANEL ADMIN (EDISI INSTAN REFRESH v2026)
 * Tugas: Menuliskan perubahan parameter langsung ke sel B1, B2, B3, B4, B10, dan B11.
 * Fitur Unggulan: Menghapus cache Drive secara paksa agar perubahan langsung berefek tanpa restart!
 */
function simpanSetting(obj) {
  const ss = SpreadsheetApp.openById(ADMIN_SS_ID);
  const shSet = ss.getSheetByName("DataSetting");
  if (!shSet) return { status: "gagal", pesan: "❌ Gagal: Tab DataSetting tidak ditemukan.", dataDrive: "" };
  
  // 📍 CEK PERUBAHAN: Baca nilai lama di B10 sebelum ditimpa data baru
  var nilaiFilterLama = shSet.getRange("B10").getValue().toString().trim();
  var nilaiFilterBaru = obj.angkaFilterB10 ? obj.angkaFilterB10.toString().trim() : "0";
  var apakahFilterBerubah = (nilaiFilterLama !== nilaiFilterBaru);
  
  // 1. Tulis data konfigurasi baru ke Sheets (Tetap kode asli Anda)
  shSet.getRange("B1").setValue(obj.hari);
  shSet.getRange("B2").setValue(obj.waktu);
  shSet.getRange("B3").setValue(obj.maxLagu);
  shSet.getRange("B4").setValue(obj.autoSlot ? "TRUE" : "FALSE");
  
  shSet.getRange("B10").setValue(nilaiFilterBaru);
  
  var sVal = obj.bhajanSpesialB11 ? "TRUE" : "FALSE";
  shSet.getRange("B11").setValue(sVal);
  
  // 📍 BARU: Menyimpan nilai sakelar B12 ke Spreadsheet (TRUE/FALSE murni)
  var sValB12 = obj.bhajanSpesialB12 ? "TRUE" : "FALSE";
  shSet.getRange("B12").setValue(sValB12);
  
  // 2. Paksa Google Sheets menuangkan data ke sistem penyimpanan detik ini juga
  SpreadsheetApp.flush();
  
  // 🚀 SUNTIKAN SAKELAR KILAT: Hapus paksa memori cache antrean lama di server Google
  try {
    const cache = CacheService.getScriptCache();
    cache.remove("BLOKIR_DRIVE_CACHE_KEY");
    console.log("🧹 [CACHE CLEARED] Memori lama dibersihkan. Aturan baru langsung aktif secara live!");
  } catch (errCache) {
    console.log("Pembersihan cache gagal dikosongkan, dilewati aman: " + errCache.message);
  }
  
  // 📍 EKSEKUSI CERDAS: Hanya scan Drive jika nilai B10 benar-benar berubah
  if (apakahFilterBerubah) {
    perbaruiDanKunciDaftarBlokirDrive();
  }
  
  // Ambil isi sel B15 yang paling segar untuk dititipkan ke HP Admin
  var stringDriveTerbaru = shSet.getRange("B15").getValue().toString().trim();
  
  // 📍 STRATEGI BARU: Kembalikan paket data lengkap agar HP Admin tidak perlu ambil data ulang
  return {
    status: "sukses",
    pesan: "✅ Konfigurasi Aplikasi Berhasil Diperbarui & Langsung Aktif Secara Live!",
    dataDrive: stringDriveTerbaru
  };
}



/**
 * AUTO RESET MINGGUAN (DIPICU TRIGGER JAM 23.00 - 00.00)
 * VERSI TANPA PEMBUATAN FILE BACKUP
 */
function autoBackupDanResetSeva() { 
  const ss = SpreadsheetApp.openById(ADMIN_SS_ID); 
  const shSetting = ss.getSheetByName("DataSetting"); 
  const shSeva = ss.getSheetByName("DataSeva");
  const shLog = ss.getSheetByName("Log");
  
  try { 
    const dataMemori = getDataLengkapSeva();
    const hariBhajan = parseInt(dataMemori.hari); 
    const logTerakhir = dataMemori.logSuksesBackup;          
    const isBhajanSpesialAktif = (dataMemori.bhajanSpesialB11Bawaan === true);

    const now = new Date(); 
    const tglHariIni = Utilities.formatDate(now, "GMT+08:00", "yyyy-MM-dd"); 
    const jamTerpilih = Utilities.formatDate(now, "GMT+08:00", "HH:mm:ss");
    
    const hariEksekusi = (hariBhajan + 1) % 7;

    if (now.getDay() === hariEksekusi) { 
      if (logTerakhir.includes(tglHariIni)) return; 

      const tglB = new Date(now); 
      tglB.setDate(now.getDate() - 1); 
      const tglFormatLog = Utilities.formatDate(tglB, "GMT+08:00", "yyyy-MM-dd"); 
      
      // Mengunci nilai baris terakhir untuk efisiensi kecepatan skrip
      const totalBarisSeva = shSeva.getLastRow();
      const shRiwayat = ss.getSheetByName("Riwayat");

      // ============================================================================
      // 📍 KAPSUL WAKTU: REKAM ISI DATA SEVA AKTIF KE TAB RIWAYAT SEBELUM DIHAPUS
      // ============================================================================
      if (shRiwayat && totalBarisSeva > 1) {
        // Mengambil data Seva dari Kolom A sampai F (6 Kolom)
        const seluruhDataSeva = shSeva.getRange(2, 1, totalBarisSeva - 1, 6).getValues();
        
        const arrayKapsulWaktuSesiIni = seluruhDataSeva.reduce((acc, baris) => {
          // Memetakan indeks array (0-5) untuk Kolom A-F agar format riwayat presisi
          const slotNo   = baris[0] ? baris[0].toString().trim() : "";
          const namaUmat = baris[2] ? baris[2].toString().trim() : "";
          const judulLg  = baris[3] ? baris[3].toString().trim() : "";
          const idLg     = baris[4] ? baris[4].toString().trim() : "";
          
          let stampJam = baris[5] ? Utilities.formatDate(new Date(baris[5]), "GMT+08:00", "yyyy-MM-dd HH:mm") : tglFormatLog;
          if (isBhajanSpesialAktif) stampJam += "::Spesial";

          if (idLg && namaUmat && namaUmat !== "0" && namaUmat !== "ID Tidak Terdaftar") {
            acc.push(`${slotNo}:::${namaUmat}:::${judulLg}:::${idLg}:::${stampJam}`);
          }
          return acc;
        }, []);
        
        if (arrayKapsulWaktuSesiIni.length > 0) {
          shRiwayat.appendRow([arrayKapsulWaktuSesiIni.join("|||")]);
          console.log("📝 Sukses menimbun sejarah sesi ini ke tab Riwayat Kolom A.");
        }
      }
      // ============================================================================
      
      // Proses Pembersihan Data Aktif (Reset Kolom A-G)
      if (totalBarisSeva > 1) {
        shSeva.getRange(2, 1, totalBarisSeva - 1, 7).clearContent(); 
      }
      
      const totalBarisLog = shLog ? shLog.getLastRow() : 0;
      if (totalBarisLog > 1) {
        shLog.getRange(2, 1, totalBarisLog - 1, 3).clearContent(); 
      }
      
      // Segarkan proteksi internal drive
      perbaruiDanKunciDaftarBlokirDrive();

      // Reset Pengaturan Sistem ke Kondisi Semula
      shSetting.getRange("B1:B2").setValues([["4"], ["19:00"]]);
      shSetting.getRange("B4").setValue(false);
      shSetting.getRange("B11").setValue(false);
      shSetting.getRange("B12").setValue(false);
      shSetting.getRange("B9").setValue(`Sukses: ${tglHariIni}. Jadwal Kembali ke Kamis. [${jamTerpilih}]`); 
     
    } else {
      const sisa = (hariEksekusi + 7 - now.getDay()) % 7;
      shSetting.getRange("B9").setValue(`Menunggu H+1 (${sisa} hari lagi) [${jamTerpilih}]`);
    }
    SpreadsheetApp.flush();
  } catch (e) { shSetting.getRange("B9").setValue("ERR: " + e.message); } 
}





/**
 * HAPUS & RESET DARURAT MANUAL ADMIN (VERSI PENANDA SPESIAL)
 * TANPA PEMBUATAN FILE BACKUP DRIVE
 */
function hapusDanBackupManual() {
  const ss = SpreadsheetApp.openById(ADMIN_SS_ID);
  const shSetting = ss.getSheetByName("DataSetting");
  const shSeva = ss.getSheetByName("DataSeva");
  const shLog = ss.getSheetByName("Log");
  
  try {
    // Baca status sakelar Bhajan Spesial dari sel B11
    const bhajanSpesialVal = shSetting.getRange("B11").getValue();
    const isBhajanSpesialAktif = (bhajanSpesialVal === true || bhajanSpesialVal.toString().toUpperCase() === "TRUE");

    const now = new Date();
    const tglHariIni = Utilities.formatDate(now, "GMT+08:00", "yyyy-MM-dd");
    const jamTerpilih = Utilities.formatDate(now, "GMT+08:00", "HH:mm:ss");

    // Cache baris terakhir untuk efisiensi kecepatan skrip
    const totalBarisSeva = shSeva.getLastRow();
    const shRiwayat = ss.getSheetByName("Riwayat");

    // ============================================================================
    // 📍 KAPSUL WAKTU: REKAM DATA SEVA AKTIF KE TAB RIWAYAT SEBELUM DIHAPUS
    // ============================================================================
    if (shRiwayat && totalBarisSeva > 1) {
      // Mengambil data Seva dari Kolom A sampai F (6 Kolom)
      const seluruhDataSeva = shSeva.getRange(2, 1, totalBarisSeva - 1, 6).getValues();
      
      const arrayKapsulWaktuSesiIni = seluruhDataSeva.reduce((acc, baris) => {
        // Memetakan indeks array (0-5) untuk Kolom A-F agar format riwayat presisi
        const slotNo   = baris[0] ? baris[0].toString().trim() : "";
        const namaUmat = baris[2] ? baris[2].toString().trim() : "";
        const judulLg  = baris[3] ? baris[3].toString().trim() : "";
        const idLg     = baris[4] ? baris[4].toString().trim() : "";
        
        // Antisipasi jika baris[5] bukan objek Date murni agar tidak crash
        let stampJam = tglHariIni + " 00:00";
        if (baris[5]) {
          try {
            let tesDate = new Date(baris[5]);
            if (!isNaN(tesDate.getTime())) {
              stampJam = Utilities.formatDate(tesDate, "GMT+08:00", "yyyy-MM-dd HH:mm");
            } else {
              // Jika berupa string jam biasa (cth: "18:30"), gabungkan dengan tanggal hari ini
              stampJam = tglHariIni + " " + baris[5].toString().trim();
            }
          } catch(err) {
            stampJam = tglHariIni + " 00:00";
          }
        }

        // JALUR KHUSUS BHAJAN SPESIAL: Jika aktif, titipkan kata ::Spesial di ujung stamp waktu
        if (isBhajanSpesialAktif) {
          stampJam += "::Spesial";
        }

        if (idLg && namaUmat && namaUmat !== "0" && namaUmat !== "ID Tidak Terdaftar") {
          acc.push(`${slotNo}:::${namaUmat}:::${judulLg}:::${idLg}:::${stampJam}`);
        }
        return acc;
      }, []);
      
      if (arrayKapsulWaktuSesiIni.length > 0) {
        shRiwayat.appendRow([arrayKapsulWaktuSesiIni.join("|||")]);
        console.log("📝 Sukses menimbun sejarah manual sesi ini ke tab Riwayat Kolom A.");
      }
    }
    // ============================================================================

    // Proses Pembersihan Data Aktif (Reset Kolom A-G)
    if (totalBarisSeva > 1) {
      shSeva.getRange(2, 1, totalBarisSeva - 1, 7).clearContent();
    }

    // Ikut bersihkan tab Log agar seimbang dengan versi otomatis
    const totalBarisLog = shLog ? shLog.getLastRow() : 0;
    if (totalBarisLog > 1) {
      shLog.getRange(2, 1, totalBarisLog - 1, 3).clearContent();
    }

    // Segarkan data filter B15 setelah tab Riwayat mendapat timbunan data baru
    perbaruiDanKunciDaftarBlokirDrive();

    // Setel ulang parameter sakelar admin pada tab DataSetting
    shSetting.getRange("B1:B2").setValues([["4"], ["19:00"]]);
    shSetting.getRange("B4").setValue(false);
    shSetting.getRange("B11").setValue(false); 
    shSetting.getRange("B12").setValue(false); // 📍 Berhasil disetel otomatis menjadi FALSE
    
    // Format Asli Sukses Manual ditambah cetakan Jam di akhir tanpa tambahan kata lain
    shSetting.getRange("B9").setValue(`Sukses Manual Reset: ${tglHariIni} [${jamTerpilih}]`);
    
    SpreadsheetApp.flush();
    return "Sukses";
  } catch (e) { throw new Error(e.message); }
}





/**
 * ROMBAKAN FINAL: AMBIL DAFTAR BERKAS ARSIP MURNI DARI TAB RIWAYAT (PECAT GOOGLE DRIVE)
 */
function getInitialData() {
  try {
    const ss = SpreadsheetApp.openById(ADMIN_SS_ID);
    const shRiwayat = ss.getSheetByName("Riwayat");
    if (!shRiwayat) return { files: [], firstFileData: [] };

    const lastRowRiwayat = shRiwayat.getLastRow();
    if (lastRowRiwayat < 1) return { files: [], firstFileData: [] };

    // 1. Tarik seluruh baris string data dari tab Riwayat Kolom A
    const seluruhDataKapsul = shRiwayat.getRange(1, 1, lastRowRiwayat, 1).getValues();

    let fileListTiruan = [];

    // 2. STRATEGI MONITOR BARIS: Buat manifest daftar file tiruan berdasarkan isi tab Riwayat
    // Looping berjalan mundur dari baris paling bawah (paling baru) ke baris atas (lama)
    for (let r = seluruhDataKapsul.length - 1; r >= 0; r--) {
      let stringSesiPanjang = seluruhDataKapsul[r] ? seluruhDataKapsul[r].toString().trim() : "";
      if (stringSesiPanjang === "") continue;

      // Cari komponen Stamp/Tanggal di dalam teks baris tersebut untuk dijadikan Nama File
      // Kita pecah pendaftar pertama (indeks 0) untuk mengintip tanggal sesinya
      let listPendaftar = stringSesiPanjang.split("|||");
      let pendaftarPertama = listPendaftar[0];
      
      let teksTanggalSesi = "Sesi Tidak Diketahui";
      if (pendaftarPertama) {
        let komponen = pendaftarPertama.split(":::");
        if (komponen && komponen.length >= 5) {
          // Ambil tanggal dari komponen Stamp (Indeks 4)
          let stampMentah = komponen[4] ? komponen[4].toString().trim() : "";
          if (stampMentah !== "") {
            // Bersihkan teks ::Spesial jika ada agar visual nama file rapi
            teksTanggalSesi = stampMentah.replace("::Spesial", " Sesi Spesial");
          }
        }
      }

      // Masukkan ke dalam list dengan ID samaran berupa nomor indeks barisnya
      fileListTiruan.push({
        id: String(seluruhDataKapsul.length - 1 - r), // Mengunci ID samaran urutan indeks HP (0, 1, 2, dst)
        name: teksTanggalSesi // Menampilkan tanggal sesi yang riil sebagai nama berkas di layar
      });
    }

    // 3. AMBIL DATA HALAMAN PERTAMA (TERBARU) SECARA INSTAN
    // Karena halaman pertama (indeks 0) adalah baris paling bawah, kita panggil getSheetData(0)
    let dataHalamanPertama = [];
    if (fileListTiruan.length > 0) {
      dataHalamanPertama = getSheetData(0); 
    }

    console.log("🏁 STARTUP RIWAYAT SUKSES: Berhasil merakit " + fileListTiruan.length + " sesi dari active sheet.");
    return { 
      files: fileListTiruan, 
      firstFileData: dataHalamanPertama 
    };

  } catch (errInitData) {
    console.log("❌ Gagal merakit data awal riwayat: " + errInitData.message);
    return { files: [], firstFileData: [] };
  }
}

/**
 * PERBAIKAN MUTLAK: HITUNG POSISI BARIS MURNI MULAI DARI BARIS 1 (ANTI-LOMPAT)
 */
function getSheetData(indeksHalamanHP) {
  try {
    const ss = SpreadsheetApp.openById(ADMIN_SS_ID);
    const shRiwayat = ss.getSheetByName("Riwayat");
    if (!shRiwayat) return [];

    const lastRowRiwayat = shRiwayat.getLastRow();
    if (lastRowRiwayat < 1) return []; 

    // Ambil angka kiriman halaman dari HP (0, 1, 2, dst)
    var nomorHalaman = parseInt(indeksHalamanHP);
    if (isNaN(nomorHalaman) || nomorHalaman < 0) {
      nomorHalaman = 0;
    }

    // HITUNG BARIS MURNI: Baris terakhir dikurangi nomor halaman dari HP
    let nomorBarisTarget = lastRowRiwayat - nomorHalaman;

    // PENGAMAN BARIS 1: Batasi agar data paling lama berhenti tepat di Baris 1 murni
    if (nomorBarisTarget < 1 || nomorBarisTarget > lastRowRiwayat) {
      console.log("⚠️ Target baris (" + nomorBarisTarget + ") berada di luar jangkauan data fisik sheet.");
      return [];
    }

    // ============================================================================
    // 🚀 REVOLUSI INSTAN KILAT: AMBIL 1 BARIS TARGET LANGSUNG (ANTI-DOWNLOAD ULANG)
    // Server dilarang mendownload ribuan baris dari atas, murni hanya sedot 1 sel kaku!
    // ============================================================================
    let stringSesiDipilih = shRiwayat.getRange(nomorBarisTarget, 1).getValue().toString().trim();
    if (stringSesiDipilih === "") return [];
    // ============================================================================

    let arrayHasilFormatAsli = [];

    // Bongkar string kapsul waktu sesi ini
    let listPendaftar = stringSesiDipilih.split("|||");
    for (let i = 0; i < listPendaftar.length; i++) {
      let pendaftar = listPendaftar[i];
      if (!pendaftar || pendaftar.trim() === "") continue;

      let komponen = pendaftar.split(":::");
      if (komponen && komponen.length >= 4) {
        let slotNo   = komponen[0] ? komponen[0].toString().trim() : "";
        let namaUmat = komponen[1] ? komponen[1].toString().trim() : "";
        let judulLg  = komponen[2] ? komponen[2].toString().trim() : "";
        let idLg     = komponen[3] ? komponen[3].toString().trim() : "";
        
        if (idLg !== "" && namaUmat !== "" && namaUmat !== "0" && namaUmat !== "ID Tidak Terdaftar") {
          arrayHasilFormatAsli.push({
            slot: slotNo,
            nama: namaUmat,
            judul: judulLg,
            idLagu: idLg
          });
        }
      }
    }

    console.log("🎯 SUKSES HITUNG BARIS KILAT: Membongkar data Baris ke-" + nomorBarisTarget + " untuk halaman HP: " + nomorHalaman);
    return arrayHasilFormatAsli;

  } catch (errGetSheet) {
    console.log("Gagal mengambil data arsip dari tab Riwayat: " + errGetSheet.message);
    return [];
  }
}


/**
 * PERBAIKAN MUTLAK: REKAPAN TAHUNAN MURNI MENGHITUNG SESI BIASA DENGAN INDEKS MATRIKS AKURAT
 */
function getAkumulasiDataTahunan(tahunTarget) {
  try {
    const ss = SpreadsheetApp.openById(ADMIN_SS_ID);
    const shRiwayat = ss.getSheetByName("Riwayat");
    if (!shRiwayat) return [];

    const lastRowRiwayat = shRiwayat.getLastRow();
    if (lastRowRiwayat < 1) return [];

    // 1. Tarik seluruh baris string sejarah dari tab Riwayat Kolom A
    const seluruhDataKapsul = shRiwayat.getRange(1, 1, lastRowRiwayat, 1).getValues();

    // Kamus sementara di server untuk menghitung akumulasi total lagu
    var kamusHitungLagu = {};
    var stringTahunTarget = String(tahunTarget || "").trim();

    // 2. MESIN PEMBONGKAR KAPSUL WAKTU BERJALAN
    for (var i = 0; i < seluruhDataKapsul.length; i++) {
      var stringSesiPanjang = seluruhDataKapsul[i] ? seluruhDataKapsul[i].toString().trim() : "";
      if (stringSesiPanjang === "") continue;

      // Pecah string sesi berdasarkan pemisah ||| untuk memisahkan tiap pendaftar
      var listPendaftarSesi = stringSesiPanjang.split("|||");
      
      listPendaftarSesi.forEach(function (pendaftar) {
        if (!pendaftar || pendaftar.trim() === "") return;

        // Bongkar komponen lengkap (Slot:::Nama:::Judul:::ID:::Stamp)
        var komponen = pendaftar.split(":::");
        if (komponen && komponen.length >= 5) {
          // 🔥 KUNCI PERBAIKAN: Pasang nomor kotak indeks array secara presisi agar data terbaca utuh
          var judulLg   = komponen[2] ? komponen[2].toString().trim() : "";
          var idLgValid = komponen[3] ? komponen[3].toString().trim() : "";
          var stampWaktu = komponen[4] ? komponen[4].toString().trim() : "";

          // 📍 KAWAT PENYARING: Jika pendaftaran ini mengandung tanda ::Spesial, LANGSUNG LOMPATI (SKIP)
          if (stampWaktu.indexOf("::Spesial") !== -1) {
            return; // Mengabaikan lagu sesi spesial dari hitungan rekap tahunan harian
          }

          // Periksa apakah tahun pada tanggal stamp cocok dengan tahun target pilihan jemaat
          if (idLgValid !== "" && stampWaktu.indexOf(stringTahunTarget) === 0) {
            
            if (!kamusHitungLagu[idLgValid]) {
              kamusHitungLagu[idLgValid] = {
                idLagu: idLgValid,
                judul: judulLg,
                jumlah: 0
              };
            }
            // Tambahkan hitungan +1 murni hanya untuk sesi-sesi biasa harian
            kamusHitungLagu[idLgValid].jumlah += 1;
          }
        }
      });
    }

    // 3. KONVERSI KAMUS MENJADI FORMAT ARRAY STRUKTUR ASLI UNTUK HP
    var arrayHasilAkhirUntukHP = [];
    var kunciKamus = Object.keys(kamusHitungLagu);
    
    kunciKamus.forEach(function (kunci) {
      arrayHasilAkhirUntukHP.push(kamusHitungLagu[kunci]);
    });

    console.log("📈 Sukses merakit rekap akumulasi tahun " + stringTahunTarget + " (Murni Sesi Biasa).");
    return arrayHasilAkhirUntukHP;

  } catch (errRekap) {
    console.log("❌ Gagal merakit rekap tahunan dari tab Riwayat: " + errRekap.message);
    return [];
  }
}



function verifikasiPasswordAdminServer(pwInput) {
  try {
    // 1. Jalankan fungsi pembaca asli Anda tanpa mengubah satu huruf pun
    const dataMemori = getDataLengkapSeva();
    
    // 🎯 SINKRON GLOBAL MUTLAK: Ambil nilai sandi langsung dari variabel global Anda di paling atas proyek
    var kataSandiSahServer = (typeof ADMIN_PASSWORD !== "undefined") ? ADMIN_PASSWORD.toString().trim() : "";
    var inputKetikHP = pwInput ? pwInput.toString().trim() : "";

    // 2. Cocokkan inputan HP secara presisi dengan kata sandi global Anda
    if (inputKetikHP !== "" && inputKetikHP === kataSandiSahServer) {
      
      // 3. Hanya tandai status verifikasi sebagai true tanpa menyimpan password asli ke lokal/RAM
      dataMemori.pwAdmin = true; 
      
      return { sukses: true, data: dataMemori };
    }
    return { sukses: false, pesan: "Password Salah!" };
  } catch (e) { 
    return { sukses: false, pesan: "Error Sistem: " + e.message }; 
  }
}



/**
 * AMBIL RIWAYAT TAB LOG KEDATANGAN
 */
function ambilSeluruhDataLog() {
  const ss = SpreadsheetApp.openById(ADMIN_SS_ID);
  const shLog = ss.getSheetByName("Log");
  if (!shLog) return [];
  const lastRow = shLog.getLastRow();
  if (lastRow < 2) return []; 
  return shLog.getRange(2, 1, lastRow - 1, 3).getDisplayValues().reverse();
}

/**
 * PENCARIAN NAMA SENYAP LEWAT ID 9 DIGIT (VERSI OPTIMAL MEMORI)
 */
function ambilNamaUmatLewatIdSenyap(idMember) {
  try {
    const idClean = idMember ? idMember.toString().toUpperCase().trim() : "";
    if (idClean !== "" && idClean.length === 9) {
      const dataMemori = getDataLengkapSeva();
      if (dataMemori.kamusNamaOtomatis && dataMemori.kamusNamaOtomatis[idClean]) {
        return dataMemori.kamusNamaOtomatis[idClean];
      }
    }
    return "Anonim";
  } catch (e) { return "Anonim"; }
}

/**
 * BUNDLING DATA ADMIN PANEL KONTROL KILAT (VERSI RINGAN MEMORI)
 */
function getBundledAdminDataServer() {
  const superData = getDataLengkapSeva();
  return {
    kamusNamaOtomatis: superData.kamusNamaOtomatis,
    listMemberMandiriTampak: superData.listMemberMandiriTampak
  };
}
/**
 * LIVE ENGINE LIVE FILTER JALUR DRIVE (VERSI BERSIH TOTAL - TANPA CACHE)
 * Tugas: Menyisir berkas arsip secara kronologis langsung dari folder Google Drive fisik.
 */
function ambilDaftarBlokirDriveSecaraLive() {
  try {
    const ss = SpreadsheetApp.openById(ADMIN_SS_ID);
    const shSet = ss.getSheetByName("DataSetting");
    if (!shSet) return "";

    // PENGALIHAN STRATEGIS: Langsung ambil string yang sudah siap di sel B15
    const hasilStringFinal = shSet.getRange("B15").getValue().toString().trim();
    
    return hasilStringFinal;

  } catch (e) {
    console.log("Gagal live filter jalur drive dari datasheet: " + e.message);
    return "";
  }
}




/**
 * MASTER ENGINE PENCATAT LOG KEDATANGAN UMAT (EDISI OPTIMAL & RINGAN)
 * Tugas: Murni mengonversi ID ke Nama dan langsung menulis baris baru ke sheet Log.
 */
function catatKedatanganOtomatis(idMember) {
  const ss = SpreadsheetApp.openById(ADMIN_SS_ID);
  let shLog = ss.getSheetByName("Log");
  
  // Jika tab Log belum ada, buat otomatis beserta Headernya
  if (!shLog) {
    shLog = ss.insertSheet("Log");
    shLog.getRange("A1:C1").setValues([["Nama", "Tanggal", "Jam"]]).setFontWeight("bold");
  }
  
  try {
    var idInput = idMember ? idMember.toString().trim() : "";
    let namaUmat = idInput !== "" ? idInput : "ANONIM"; 
    
    // Validasi & Konversi ID 9 Digit menjadi Nama Asli dari DataSeva
    if (idInput !== "" && idInput !== "ANONIM" && idInput !== "null" && idInput !== "undefined" && !idInput.includes("Anonim-")) {
      if (idInput.length === 9) {
        namaUmat = idInput;
        const shSeva = ss.getSheetByName("DataSeva");
        if (shSeva) {
          const lastRowSeva = shSeva.getLastRow();
          if (lastRowSeva >= 2) {
            const dataMembers = shSeva.getRange(2, 8, lastRowSeva - 1, 2).getValues();
            for (let i = 0; i < dataMembers.length; i++) {
              if (dataMembers[i]['0'].toString().toUpperCase().trim() === idInput.toUpperCase()) {
                namaUmat = dataMembers[i]['1'].toString().trim(); 
                break;
              }
            }
          }
        }
      }
    }
    
    // 🚀 PROSES INSTAN: Langsung ambil waktu dan cetak ke baris paling bawah sheet Log
    const waktuSekarang = new Date();
    const tglSekarang = Utilities.formatDate(waktuSekarang, "GMT+08:00", "yyyy-MM-dd");
    const jamSekarang = Utilities.formatDate(waktuSekarang, "GMT+08:00", "HH:mm:ss");
    
    shLog.appendRow([namaUmat, tglSekarang, jamSekarang]);
    SpreadsheetApp.flush();
    return "Sukses";
    
  } catch (err) {
    console.log("Gagal mencatat kedatangan otomatis: " + err.message);
    return "Error";
  }
}


// ====== GRUP_FAVORIT_BONGKAR_PASANG_START ======
function getStrukturFormasiGrupSetting() {
  try {
    const ss = SpreadsheetApp.openById(ADMIN_SS_ID);
    const shSet = ss.getSheetByName("DataSetting");
    if (!shSet) return [];
    const lastRow = shSet.getLastRow();
    if (lastRow < 21) return []; 
    const dataMentah = shSet.getRange(21, 1, lastRow - 20, 2).getValues();
    let listGrupFormasi = [];
    dataMentah.forEach(function(baris, indeks) {
      var namaGrup = baris[0] ? baris[0].toString().trim() : "";
      var stringIdAnggota = baris[1] ? baris[1].toString().toUpperCase().trim() : "";
      if (namaGrup !== "" && stringIdAnggota !== "") {
        listGrupFormasi.push({
          indexBaris: 21 + indeks,
          nama: namaGrup,
          anggotaRaw: stringIdAnggota,
          arrayId: stringIdAnggota.split(",")
        });
      }
    });
    return listGrupFormasi;
  } catch (err) { return []; }
}
function simpanFormasiGrupOtomatis(barisTarget, namaGrupBaru, arrayIdAnggotaBaru) {
  try {
    const ss = SpreadsheetApp.openById(ADMIN_SS_ID);
    const shSet = ss.getSheetByName("DataSetting");
    if (!shSet) return "❌ Error: Tab DataSetting tidak ditemukan.";
    
    var bTarget = parseInt(barisTarget) || 0;
    var namaClean = namaGrupBaru ? namaGrupBaru.toString().trim() : "";
    let idUnik = [];
    
    if (arrayIdAnggotaBaru && Array.isArray(arrayIdAnggotaBaru)) {
      arrayIdAnggotaBaru.forEach(function(id) {
        var idStr = id.toString().toUpperCase().trim();
        if (idStr !== "" && idUnik.indexOf(idStr) === -1) { idUnik.push(idStr); }
      });
    }
    
    if (idUnik.length <= 1) {
      if (bTarget >= 21) {
        shSet.getRange(bTarget, 1, 1, 2).clearContent();
        SpreadsheetApp.flush();
        var lastRowPost = Math.max(shSet.getLastRow(), 21);
        shSet.getRange(21, 1, lastRowPost - 20 + 1, 2).sort({column: 1, ascending: true});
        SpreadsheetApp.flush();
        return "💥 Grup otomatis dibubarkan karena anggota aktif tersisa <= 1 orang.";
      }
      return "⚠ Pembuatan dibatalkan: Anggota minimal harus 2 orang.";
    }
    
    // 🔥 PENGUNCI GAYA BARU: Berikan tanda petik tunggal (') di depan agar Google Sheets mengunci format teks murni (Plain Text)
    var stringIdAnggotaAman = "'" + idUnik.join(",");

    if (bTarget >= 21) {
      shSet.getRange(bTarget, 1, 1, 2).clearContent();
      SpreadsheetApp.flush();
      shSet.getRange(bTarget, 1).setValue(namaClean);
      shSet.getRange(bTarget, 2).setValue(stringIdAnggotaAman);
    } else {
      var barisDitemukan = 21;
      var lastRowMaks = Math.max(shSet.getLastRow(), 21);
      var dataEksis = shSet.getRange(21, 1, lastRowMaks - 20 + 1, 1).getValues();
      
      for (var k = 0; k < dataEksis.length; k++) {
        if (dataEksis[k].toString().trim() === "") {
          barisDitemukan = 21 + k;
          break;
        }
        if (k === dataEksis.length - 1) barisDitemukan = 21 + k + 1;
      }
      shSet.getRange(barisDitemukan, 1).setValue(namaClean);
      shSet.getRange(barisDitemukan, 2).setValue(stringIdAnggotaAman);
    }
    
    SpreadsheetApp.flush();
    var lastRowFinal = Math.max(shSet.getLastRow(), 21);
    shSet.getRange(21, 1, lastRowFinal - 20 + 1, 2).sort({column: 1, ascending: true});
    SpreadsheetApp.flush();
    return "✅ Grup " + namaClean + " Sukses Diperbarui dengan " + idUnik.length + " Anggota.";
  } catch (err) { return "❌ Gagal: " + err.message; }
}




function googleLoadGrupIndependen() {
  try {
    if (typeof getStrukturFormasiGrupSetting === "function") return getStrukturFormasiGrupSetting();
    return [];
  } catch (e) { return []; }
}

function leburHakFavoritKelompokMassal(arrayIdAnggotaBaru) {
  try {
    if (!arrayIdAnggotaBaru || !Array.isArray(arrayIdAnggotaBaru)) return;
    const ss = SpreadsheetApp.openById(ADMIN_SS_ID);
    const shSeva = ss.getSheetByName("DataSeva");
    if (!shSeva) return;
    const lastRowSeva = shSeva.getLastRow();
    if (lastRowSeva < 2) return;
    var dataUmatDiSeva = shSeva.getRange(2, 8, lastRowSeva - 1, 3).getValues();
    let keranjangLaguGabungan = [];
    arrayIdAnggotaBaru.forEach(function(idTarget) {
      var targetClean = idTarget.toString().toUpperCase().trim();
      for (var i = 0; i < dataUmatDiSeva.length; i++) {
        var idDiSheet = dataUmatDiSeva[i] ? dataUmatDiSeva[i].toString().toUpperCase().trim() : "";
        var stringFavoritDiSheet = dataUmatDiSeva[i] ? dataUmatDiSeva[i].toString().trim() : "";
        if (idDiSheet === targetClean && stringFavoritDiSheet !== "") {
          var arrayLaguFav = stringFavoritDiSheet.split(",");
          arrayLaguFav.forEach(function(idLagu) {
            var idLgClean = idLagu.toString().trim();
            if (idLgClean !== "" && keranjangLaguGabungan.indexOf(idLgClean) === -1) {
              keranjangLaguGabungan.push(idLgClean);
            }
          });
        }
      }
    });
    var stringHasilLeberan = keranjangLaguGabungan.join(",");
    arrayIdAnggotaBaru.forEach(function(idTarget) {
      var targetClean = idTarget.toString().toUpperCase().trim();
      for (var j = 0; j < dataUmatDiSeva.length; j++) {
        var idDiSheet = dataUmatDiSeva[j] ? dataUmatDiSeva[j].toString().toUpperCase().trim() : "";
        if (idDiSheet === targetClean) {
          shSeva.getRange(j + 2, 10).setValue(stringHasilLeberan);
          break;
        }
      }
    });
    SpreadsheetApp.flush();
    console.log("✅ [MERGE SUCCESS] Folder favorit seluruh anggota diseragamkan.");
  } catch (err) { console.log("Gagal melebur hak favorit kelompok massal: " + err.message); }
}

function eksekusiSapuJagatPembersihanIdGrupLokal(idMemberTerhapus) {
  try {
    var idCleanGrup = idMemberTerhapus ? idMemberTerhapus.toString().toUpperCase().trim() : "";
    if (idCleanGrup === "") return "OFF";
    
    const ssGrup = SpreadsheetApp.openById(ADMIN_SS_ID);
    const shSetGrup = ssGrup.getSheetByName("DataSetting");
    if (!shSetGrup) return "OFF";
    
    var lastRowSetGrup = shSetGrup.getLastRow();
    if (lastRowSetGrup < 21) return "OFF";
    
    var dataGrupMentah = shSetGrup.getRange(21, 1, lastRowSetGrup - 20 + 1, 2).getValues();
    
    dataGrupMentah.forEach(function(baris, indeks) {
      if (!baris || baris.length < 2) return;
      
      var namaGrupAktif = baris.slice(0, 1).toString().trim();
      var stringAnggotaGrup = baris.slice(1, 2).toString().toUpperCase().trim();
      
      if (namaGrupAktif !== "" && stringAnggotaGrup !== "") {
        var arrayAnggotaGrup = stringAnggotaGrup.split(",").map(function(x) { 
          return x.toString().toUpperCase().trim(); 
        });
        
        if (arrayAnggotaGrup.indexOf(idCleanGrup) !== -1) {
          arrayAnggotaGrup = arrayAnggotaGrup.filter(function(mId) { return mId !== idCleanGrup; });
          var barisSheetAktif = 21 + indeks;
          
          if (arrayAnggotaGrup.length <= 1) {
            shSetGrup.getRange(barisSheetAktif, 1, 1, 2).clearContent();
            console.log("💥 [AUTO-BUBAR] Grup " + namaGrupAktif + " otomatis dihapus bersih.");
          } else {
            shSetGrup.getRange(barisSheetAktif, 2).setValue(arrayAnggotaGrup.join(","));
            console.log("✂️ ID " + idCleanGrup + " sukses dipotong keluar dari grup " + namaGrupAktif);
          }
        }
      }
    });
    SpreadsheetApp.flush(); 
    var lastRowFinalPost = Math.max(shSetGrup.getLastRow(), 21);
    shSetGrup.getRange(21, 1, lastRowFinalPost - 20 + 1, 2).sort({column: 1, ascending: true});
    SpreadsheetApp.flush();
    return "SUKSES_SAPU_DAN_SORTIR";
  } catch (err) {
    console.log("Gagal total menjalankan operasi sapu jagat: " + err.message);
    return "ERROR";
  }
}

function updateLaguSeva(nomorSlot, idLaguBaru, judulLaguBaru) {
  try {
    var ss = SpreadsheetApp.openById(ADMIN_SS_ID);
    var sheet = ss.getSheetByName("DataSeva"); 
    if (!sheet) throw new Error("Sheet dengan nama 'DataSeva' tidak ditemukan.");
    
    var data = sheet.getDataRange().getValues();
    var barisDitemukan = -1;
    var idLaguLamaYangAkanDiganti = ""; 
    
    for (var i = 1; i < data.length; i++) {
      // Amankan pembacaan kolom Slot (Kolom A -> indeks 0) - Dijaga utuh original
      var slotDiSheet = data[i][0] ? data[i][0].toString().trim() : "";
      
      if (slotDiSheet === nomorSlot.toString().trim()) {
        barisDitemukan = i + 1; 
        
        // Ambil data lagu lama (Dijaga utuh original untuk keperluan pencatatan log)
        if (data[i] && data[i][4] !== undefined && data[i][4] !== null) {
          idLaguLamaYangAkanDiganti = data[i][4].toString().trim();
        }
        break;
      }
    }
    
    if (barisDitemukan === -1) throw new Error("Nomor slot " + nomorSlot + " tidak ditemukan.");
    
    console.log("ID Lagu Lama Terdeteksi: " + (idLaguLamaYangAkanDiganti || "KOSONG/TIDAK ADA"));

    // ============================================================================
    // 🗑️ REVISI BLOK 1: KEGIATAN MENYIMPANG HAPUS FILE MP3 DI GITHUB DIHAPUS TOTAL!
    // File fisik lagu lama dibiarkan tetap utuh abadi di GitHub Pages demi keamanan bhakta lain.
    // Kita hanya murni membersihkan konten kolom G (Status Nada) di spreadsheet.
    // ============================================================================
    sheet.getRange(barisDitemukan, 7).clearContent();
    SpreadsheetApp.flush();

    // ============================================================================
    // 2. PROSES ISI LAGU BARU DI SHEET & SETEL KUNCI NADA KE "0" (DIJAGA UTUH ORIGINAL)
    // ============================================================================
    var idLaguClean = idLaguBaru ? idLaguBaru.toString().trim() : "";
    var judulLaguClean = judulLaguBaru ? judulLaguBaru.toString().trim() : "";
    
    // Menimpa Kolom D (Judul Lagu) dan Kolom E (ID Lagu) secara akurat pada baris target
    sheet.getRange(barisTarget || barisDitemukan, 4, 1, 2).setValues([[ judulLaguClean, idLaguClean ]]);
    sheet.getRange(barisDitemukan, 7).setValue("0"); // Setel ulang status nada ke posisi standar 0
    SpreadsheetApp.flush(); 

    // ============================================================================
    // 🗑️ REVISI BLOK 3: KEGIATAN MENYIMPANG COPY-PASTE MP3 BARU KE GITHUB DIHAPUS TOTAL!
    // Urusan pencarian idFileMp3DriveAsli dan transit GitHub sudah ditiadakan 100%.
    // ============================================================================
    
    SpreadsheetApp.flush(); 
    return true;
  } catch(e) { 
    throw new Error(e.message); 
  }
}






function syncBatchFavoritServer(idUser, paketLaguArray) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("DataSeva");
    var shSet = ss.getSheetByName("DataSetting");

    if (!sheet) return "Gagal: Sheet DataSeva tidak ditemukan.";

    var targetIdUser = (idUser || "").toString().toUpperCase().trim();
    if (!targetIdUser) return "Gagal: ID User kosong.";

    var stringLagu = (paketLaguArray && paketLaguArray.length > 0)
      ? paketLaguArray.join(",")
      : "";

    var stringLaguAman = stringLagu !== "" ? "'" + stringLagu : "";

    // =========================
    // DETEKSI KELOMPOK
    // =========================

    var daftarIdTargetSerentak = [targetIdUser];
    var grupDitemukan = false;

    if (shSet) {
      var lastRowSet = shSet.getLastRow();

      if (lastRowSet >= 21) {
        var dataGrupMentah =
          shSet.getRange(21, 2, lastRowSet - 20, 1).getValues();

        for (var g = 0; g < dataGrupMentah.length; g++) {

          var isiSel = (dataGrupMentah[g][0] || "")
            .toString()
            .toUpperCase()
            .trim();

          if (!isiSel) continue;

          var arrayAnggotaGrup = isiSel
            .split(",")
            .map(function(id) {
              return id.trim();
            })
            .filter(function(id) {
              return id !== "";
            });

          if (arrayAnggotaGrup.indexOf(targetIdUser) !== -1) {
            daftarIdTargetSerentak = arrayAnggotaGrup;
            grupDitemukan = true;
            break;
          }
        }
      }
    }

    // =========================
    // INDEX DATASEVA
    // =========================

    var lastRow = sheet.getLastRow();
    var data = lastRow > 0
      ? sheet.getRange(1, 1, lastRow, 10).getValues()
      : [];

    var mapBaris = {};

    for (var i = 0; i < data.length; i++) {
      var idKolomH = (data[i][7] || "")
        .toString()
        .toUpperCase()
        .trim();

      if (idKolomH) {
        mapBaris[idKolomH] = i + 1;
      }
    }

    // =========================
    // UPDATE SEMUA ANGGOTA GRUP
    // =========================

    var logHasil = [];

    daftarIdTargetSerentak.forEach(function(idTarget) {

      idTarget = (idTarget || "").toString().toUpperCase().trim();

      if (!idTarget) return;

      var barisDitemukan = mapBaris[idTarget] || -1;

      if (barisDitemukan !== -1) {

        sheet.getRange(barisDitemukan, 10).setValue(stringLaguAman);

        logHasil.push(
          idTarget +
          " => UPDATE (Baris " +
          barisDitemukan +
          ")"
        );

      } else {

        sheet.appendRow([
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          idTarget,
          "-",
          stringLaguAman
        ]);

        logHasil.push(
          idTarget +
          " => CREATE BARU"
        );
      }
    });

    SpreadsheetApp.flush();

    return (
      "SYNC FAVORIT BERHASIL\n" +
      "User Pengubah: " + targetIdUser + "\n" +
      "Grup Ditemukan: " + grupDitemukan + "\n" +
      "Jumlah Anggota Grup: " + daftarIdTargetSerentak.length + "\n" +
      "Daftar Grup: [" + daftarIdTargetSerentak.join(", ") + "]\n" +
      "Hasil: " + logHasil.join(" | ")
    );

  } catch (error) {

    return (
      "ERROR SERVER\n" +
      error.toString() +
      "\n" +
      (error.stack || "")
    );

  }
}



function perbaruiDanKunciDaftarBlokirDrive() {
  try {
    const ss = SpreadsheetApp.openById(ADMIN_SS_ID);
    const shSet = ss.getSheetByName("DataSetting");
    if (!shSet) return;

    // 1. Ambil parameter angka filter minggu dari sel B10 datasheet asli Anda
    const angkaFilter = parseInt(shSet.getRange("B10").getValue());
    if (isNaN(angkaFilter) || angkaFilter <= 0) {
      shSet.getRange("B15").setValue("");
      console.log("ℹ️ Angka filter kosong atau <= 0. Sel B15 dikosongkan.");
      return;
    }

    const shRiwayat = ss.getSheetByName("Riwayat");
    if (!shRiwayat) {
      shSet.getRange("B15").setValue("");
      console.log("⚠️ Tab Riwayat tidak ditemukan. Sel B15 dikosongkan.");
      return;
    }

    const lastRowRiwayat = shRiwayat.getLastRow();
    if (lastRowRiwayat < 1) {
      shSet.getRange("B15").setValue("");
      console.log("ℹ️ Tab Riwayat masih kosong melompong. Sel B15 dikosongkan.");
      return;
    }

    // Tarik seluruh data string dari tab Riwayat Kolom A
    const seluruhDataKapsul = shRiwayat.getRange(1, 1, lastRowRiwayat, 1).getValues();

    let idTerlarangArray = [];
    let jumlahSesiBiasaTerhitung = 0;

    // 2. LOOPS MUNDUR CERDAS (MENERIMA SAKELAR FILTER SECARA SEKUENSAL):
    // Kita sisir dari baris paling bawah (paling baru) mundur ke atas
    for (let idx = seluruhDataKapsul.length - 1; idx >= 0; idx--) {
      let stringSesiPanjang = seluruhDataKapsul[idx] ? seluruhDataKapsul[idx].toString().trim() : "";
      if (stringSesiPanjang === "") continue;

      // 📍 KAWAT PENYARING UTAMA: Jika baris log ini mengandung tanda ::Spesial, LOMPATI TOTAL (SKIP)!
      // Data sesi spesial tidak boleh masuk sel B15 dan tidak boleh mengurangi jatah kuota angkaFilter harian
      if (stringSesiPanjang.includes("::Spesial")) {
        console.log("🛡️ Menghalangi data Sesi Spesial masuk ke sel B15. Dilewati aman...");
        continue; 
      }

      // Jika baris ini adalah sesi biasa, naikkan hitungan jumlah sesi biasa yang berhasil ditangkap
      jumlahSesiBiasaTerhitung++;
      
      // Jika jumlah sesi biasa yang diambil sudah memenuhi batas angkaFilter Admin, hentikan pencarian ke atas!
      if (jumlahSesiBiasaTerhitung > angkaFilter) {
        break;
      }

      // Hitung sisa antrean mundur secara adil (Sesi biasa paling bawah mendapat angka tertinggi)
      let sisaAntrean = angkaFilter - (jumlahSesiBiasaTerhitung - 1);

      let listPendaftarSesi = stringSesiPanjang.split("|||");
      listPendaftarSesi.forEach(function (pendaftar) {
        if (!pendaftar || pendaftar.trim() === "") return;

        let komponen = pendaftar.split(":::");
        if (komponen && komponen.length >= 4) {
          let idLgValid = komponen[3] ? komponen[3].toString().trim() : "";
          let stampWaktu = komponen[4] ? komponen[4].toString().trim() : "";
          let judulLg = komponen[2] ? komponen[2].toString().trim() : "";
          
          let tglNormal = "";
          if (stampWaktu !== "") {
            let hanyaTglTeks = stampWaktu.split(" ")[0]; // Ambil bagian tanggalnya saja (YYYY-MM-DD)
            let pecahanTgl = hanyaTglTeks.split("-");
            if (pecahanTgl && pecahanTgl.length >= 3) {
              tglNormal = pecahanTgl.reverse().join("-"); // Balik menjadi DD-MM-YYYY
            }
          }

          if (idLgValid !== "") {
            // Gabungkan menjadi format string token lama agar klop 100% dengan HP jemaat
            idTerlarangArray.push(
              idLgValid + ":::" + tglNormal + ":::" + sisaAntrean
            );
          }
        }
      });
    }

    // ============================================================================
    // PENGUNCIAN AKHIR: KUNCI STRING HASIL KE DATASHEET B15 DENGAN INSTAN
    // ============================================================================
    const hasilStringFinal = idTerlarangArray.join("|||");
    shSet.getRange("B15").setValue(hasilStringFinal);
    console.log("🔒 SUKSES FILTER: Sel B15 berhasil disegarkan murni dari sesi biasa harian.");

  } catch (e) {
    console.log("❌ Gagal menyaring data untuk B15: " + e.message);
  }
}





/**
 * Fungsi ini bisa dipanggil langsung oleh Server (.gs) maupun oleh HP jemaat
 */
function dapatkanLinkTransitGitHubMurni(idLagu) {
  var cleanId = idLagu ? idLagu.toString().trim() : "";
  return "https://" + GITHUB_USER + ".github.io/" + GITHUB_REPO + "/" + cleanId + ".mp3";
}




/**
 * GERBANG SINKRONISASI NADA: UPDATE ANGKA NADA PILIHAN PENYENYI KE SPREADSHEET
 * Diaktifkan saat tombol "Kunci Nada Dasar Saya" di HP ditekan oleh penyanyi asli
 */
/**
 * HUBUNGAN SINKRONISASI JARI: KIRIM ANGKA SETELAN NADA BARU SANG PENYANYI KE SPREADSHEET
 */
/**
 * HUBUNGAN SINKRONISASI JARI: KIRIM ANGKA SETELAN NADA BARU SANG PENYANYI KE SPREADSHEET
 */
function kunciSetelanNadaPenyanyiKeCloud(slotNoFisik) {
  var elDropdown = document.getElementById('select-pitch-shifter');
  if (!elDropdown) return;
  
  var angkaNadaTerpilih = elDropdown.value.toString().trim();
  loading(true);
  
  if (google && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler(function(pesanSukses) {
        loading(false);
        
        // 🌟 PERBAIKAN UTAMA: Gunakan alert bawaan HP agar bebas dari ReferenceError
        alert("🔒 Sairam!\n\nSetelan nada dasar Anda resmi dikunci di posisi (" + angkaNadaTerpilih + ") terpusat.\n\nSeluruh jemaat pengiring sekarang otomatis ikut mendengarkan versi nada ini!");
        
        // Perbarui data cache lokal agar visual layar langsung tersinkron detik ini juga
        if (window.cacheDataSevaLokal && window.cacheDataSevaLokal.daftarLatihan) {
          for (var i = 0; i < window.cacheDataSevaLokal.daftarLatihan.length; i++) {
            if (window.cacheDataSevaLokal.daftarLatihan[i] && window.cacheDataSevaLokal.daftarLatihan[i]['0'].toString().trim() === slotNoFisik.toString().trim()) {
              window.cacheDataSevaLokal.daftarLatihan[i]['6'] = angkaNadaTerpilih;
              break;
            }
          }
        }
        bukaLagu(window.currentId, 'latihan');
      })
      .withFailureHandler(function(err) {
        loading(false);
        alert("⚠ Gagal mengunci nada ke cloud: " + err.message);
      })
      .simpanSetelanNadaPenyanyi(slotNoFisik, angkaNadaTerpilih);
  }
}


// ============================================================================
// 🔒 GANDENGAN MUTLAK: FUNGSI PENERIMA KUNCIAN NADA SEVA JEMAAT (DI SINI!)
// ============================================================================
function simpanSetelanNadaPenyanyi(nomorSlot, angkaNadaBaru) {
  try {
    const ss = SpreadsheetApp.openById(ADMIN_SS_ID);
    const shSeva = ss.getSheetByName("DataSeva");
    if (!shSeva) return "Gagal: Tab DataSeva tidak ditemukan.";

    const barisTarget = parseInt(nomorSlot) + 1;
    
    // Tulis angka nada baru langsung ke Kolom G (Kolom ke-7) DataSeva
    shSeva.getRange(barisTarget, 7).setValue(angkaNadaBaru.toString().trim());
    
    SpreadsheetApp.flush();
    return "✅ Nada dasar berhasil dikunci terpusat!";
  } catch (errSetel) {
    return "Gagal mengunci nada di server: " + errSetel.message;
  }
}

