/**
 * Realtime Monitoring PHBTR — LWI012
 * Sumber Data:
 * - Realtime  : /monitoring_realtime
 * - Historical: /monitoring_history
 */

// ============================================================================
// KONFIGURASI BACKEND TRAFO & PHBTR (DAPAT DITAMBAH TRAFO LAIN DI MASA DEPAN)
// Data teknik & riwayat pemeliharaan diatur di sini (atau di node Firebase)
// dan hanya ditampilkan (read-only) pada Web Dashboard.
// ============================================================================
const ACTIVE_PHBTR_ID = 'LWI012';

const PHBTR_DATABASE_CONFIGS = {
  LWI012: {
    id: 'LWI012',
    name: 'PHBTR LWI012',
    capacityKva: 50,          // Kapasitas Trafo di backend: 50 kVA
    powerFactorAssumed: 0.85, // 50 kVA * 0.85 = 42.5 kW (42.500 W)
    firebaseUrl: 'https://pa-realtime-monitoing-phbtr-default-rtdb.asia-southeast1.firebasedatabase.app',
    realtimePath: 'monitoring_realtime',
    historyPath: 'monitoring_history',
    statusOperasi: 'Beroperasi Normal',
    deskripsiLokasi: 'Gardu Distribusi LWI012 — Monitoring Beban & Parameter Listrik 3-Fasa',

    // Data Teknik Transformator (Diisi manual di backend)
    trafoSpecs: [
      { label: 'Kode Gardu / Trafo', value: 'LWI012' },
      { label: 'Kapasitas Daya', value: '50 kVA' },
      { label: 'Daya Aktif Maksimum (PF 0,85)', value: '42,5 kW (42.500 W)' },
      { label: 'Tegangan Primer / Sekunder', value: '20 kV / 400 V (230 V Fasa-N)' },
      { label: 'Jumlah Fasa & Frekuensi', value: '3 Fasa / 50 Hz' },
      { label: 'Arus Nominal Sekunder (In)', value: '72,2 A / Fasa' },
      { label: 'Hubungan Belitan (Vector Group)', value: 'Dyn5' },
      { label: 'Sistem Pendinginan', value: 'ONAN (Oil Natural Air Natural)' },
      { label: 'Impedansi (%Z)', value: '4,0 %' }
    ],

    // Data Teknik PHBTR (Diisi manual di backend)
    phbtrSpecs: [
      { label: 'Kode Panel PHBTR', value: 'LWI012' },
      { label: 'Tegangan Kerja Nominal', value: '380 / 220 V AC (3P + N + PE)' },
      { label: 'Pengaman Utama (Incoming)', value: 'MCCB 3 Fasa 100 A' },
      { label: 'Jumlah Jurusan Keluaran', value: '2 Jurusan (NH Fuse)' },
      { label: 'Sensor & Modul Monitoring', value: '3x Peacefair PZEM-6L24 + ESP32' },
      { label: 'Parameter Terukur', value: '32 Parameter Listrik 3-Fasa (R, S, T)' },
      { label: 'Komunikasi & Database', value: 'Wi-Fi IoT → Firebase Realtime DB' },
      { label: 'Sistem Pentanahan (Grounding)', value: 'TN-C-S (< 5 Ohm)' },
      { label: 'Zona Waktu Pencatatan', value: 'WIT (UTC+9)' }
    ],

    // Data Riwayat Pemeliharaan (Diisi manual di backend, read-only di web)
    maintenanceHistory: [
      {
        tanggal: '2026-10-19',
        komponen: 'Panel PHBTR LWI012',
        jenis: 'Inspeksi Rutin',
        uraian: 'Pemeriksaan kekencangan terminasi busbar R-S-T-N, pembersihan panel, dan pengecekan NH Fuse tiap jurusan.',
        petugas: 'Tim Yantek',
        status: 'Normal'
      },
      {
        tanggal: '2026-09-20',
        komponen: 'PHBTR & Modul IoT',
        jenis: 'Pemeliharaan Preventif',
        uraian: 'Pemasangan & kalibrasi sensor arus/tegangan 3-fasa PZEM-6L24 serta pengujian pengiriman data ke Firebase.',
        petugas: 'Tim Yantek & Yoko',
        status: 'Selesai'
      },
      {
        tanggal: '2026-09-15',
        komponen: 'Panel PHBTR LWI012',
        jenis: 'Inspeksi Rutin',
        uraian: 'Pemeriksaan kekencangan terminasi busbar R-S-T-N, pembersihan panel, dan pengecekan NH Fuse tiap jurusan.',
        petugas: 'Tim Yantek',
        status: 'Normal'
      },
      {
        tanggal: '2026-09-08',
        komponen: 'Panel PHBTR LWI012',
        jenis: 'Penggantian Fuse Holder',
        uraian: 'Penggantian Fuse Holder yang gosong',
        petugas: 'Tim Yantek',
        status: 'Normal'
      },
      {
        tanggal: '2026-08-10',
        komponen: 'Trafo 50 kVA (LWI012)',
        jenis: 'Inspeksi & Pengukuran',
        uraian: 'Pengukuran tahanan pentanahan gardu, pemeriksaan keseimbangan beban fasa.',
        petugas: 'Tim Yantek',
        status: 'Normal'
      }
    ]
  }
};

const currentGardu = PHBTR_DATABASE_CONFIGS[ACTIVE_PHBTR_ID];
const DEFAULT_HISTORY_FETCH_LIMIT = 4000;
const CHART_DEFAULT_COUNT = 100;
const HISTORY_PAGE_SIZE = 100;

// Daftar 32 Kolom Lengkap sesuai struktur baku PZEM-6L24
const ALL_32_COLUMNS = [
  'timestamp',
  'frekuensi',
  'V r-n',
  'V s-n',
  'V t-n',
  'I r',
  'Is',
  'It',
  'P r',
  'P s',
  'P t',
  'Q r',
  'Q s',
  'Q t',
  'S r',
  'S s',
  'S t',
  'power faktor r',
  'power faktor s',
  'power faktor t',
  'sudut fase r',
  'sudut fase s',
  'sudut fase t',
  'E r',
  'E s',
  'E t',
  'P total',
  'Q total',
  'S total',
  'E total (kWh)',
  'energi reaktif total (kVARh)',
  'energi semu total (kVAh)'
];

// --- STATE APLIKASI ---
const state = {
  activePage: 'monitoring', // 'monitoring' | 'technical'
  records: [],              // Seluruh data dari /monitoring_history (urut kronologis)
  latestRecord: null,       // Data terbaru dari /monitoring_realtime
  chartRecords: [],         // Data yang sedang ditampilkan pada grafik Beban PHBTR
  chartStartDate: null,
  chartEndDate: null,
  chartEndOffset: 0,        // Offset geser sumbu X dari kanan (0 = data paling baru)

  // State bagian Historical (100 baris per halaman)
  historyPage: 1,
  fullHistoryLoaded: false,
  isLoadingFullHistory: false,

  // Koneksi Firebase
  firebaseApp: null,
  firebaseDb: null,
  firebaseRealtimeRef: null,
  firebaseRealtimeCallback: null,
  firebaseHistoryPushRef: null,
  firebaseHistoryPushCallback: null,
  firebaseHistoryTsRef: null,
  firebaseHistoryTsCallback: null,
  lastValidTimestampStr: null
};

let pTotalChart = null;

// --- UTILITAS FORMAT ANGKA & WAKTU ---
function toNum(val, fallback = 0) {
  if (val === undefined || val === null || val === '') return fallback;
  if (typeof val === 'number') return isFinite(val) ? val : fallback;

  let str = String(val).trim();
  if (!str) return fallback;

  if (str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  }
  str = str.replace(/[^0-9.-]/g, '');
  const num = parseFloat(str);
  return isFinite(num) ? num : fallback;
}

function formatNumID(num, decimals = 1) {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return Number(num).toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function formatDateTimeString(d) {
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function getCurrentWorldClockWit() {
  const dWit = new Date(Date.now() + 9 * 3600 * 1000);
  const pad = n => String(n).padStart(2, '0');
  return `${dWit.getUTCFullYear()}-${pad(dWit.getUTCMonth() + 1)}-${pad(dWit.getUTCDate())} ${pad(dWit.getUTCHours())}:${pad(dWit.getUTCMinutes())}:${pad(dWit.getUTCSeconds())} WIT`;
}

function updateLiveWitClock() {
  const badge = document.getElementById('latestTimestampBadge');
  if (badge) {
    badge.textContent = getCurrentWorldClockWit();
  }
}

const FIREBASE_PUSH_CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
function decodeFirebasePushIdToWitString(pushKey) {
  if (!pushKey || typeof pushKey !== 'string' || !pushKey.startsWith('-') || pushKey.length < 8) {
    return null;
  }
  let timeMs = 0;
  for (let i = 0; i < 8; i++) {
    const idx = FIREBASE_PUSH_CHARS.indexOf(pushKey.charAt(i));
    if (idx === -1) return null;
    timeMs = timeMs * 64 + idx;
  }
  if (timeMs < 1577836800000 || timeMs > 4102444800000) return null;
  const dWit = new Date(timeMs + 9 * 3600 * 1000);
  const pad = n => String(n).padStart(2, '0');
  return `${dWit.getUTCFullYear()}-${pad(dWit.getUTCMonth() + 1)}-${pad(dWit.getUTCDate())} ${pad(dWit.getUTCHours())}:${pad(dWit.getUTCMinutes())}:${pad(dWit.getUTCSeconds())}`;
}

function parseFlexibleTimestamp(tsRaw) {
  if (!tsRaw) return null;
  if (tsRaw instanceof Date && !isNaN(tsRaw)) return tsRaw;

  if (typeof tsRaw === 'number' || /^\d{10,13}$/.test(String(tsRaw).trim())) {
    const num = Number(tsRaw);
    const ms = num < 1e12 ? num * 1000 : num;
    const d = new Date(ms);
    if (!isNaN(d.getTime())) return d;
  }

  const str = String(tsRaw).trim();
  if (str.startsWith('2036-') || str.startsWith('1970-')) return null;

  const ymdMatch = str.match(/^(\d{4})[\/\-_](\d{1,2})[\/\-_](\d{1,2})(?:[\sT_]+(\d{1,2})[:\-](\d{1,2})(?:[:\-](\d{1,2}))?)?/);
  if (ymdMatch) {
    return new Date(
      +ymdMatch[1],
      +ymdMatch[2] - 1,
      +ymdMatch[3],
      +(ymdMatch[4] || 0),
      +(ymdMatch[5] || 0),
      +(ymdMatch[6] || 0)
    );
  }

  const dmyMatch = str.match(/^(\d{1,2})[\/\-_](\d{1,2})[\/\-_](\d{4})(?:[\sT_]+(\d{1,2})[:\-](\d{1,2})(?:[:\-](\d{1,2}))?)?/);
  if (dmyMatch) {
    return new Date(
      +dmyMatch[3],
      +dmyMatch[2] - 1,
      +dmyMatch[1],
      +(dmyMatch[4] || 0),
      +(dmyMatch[5] || 0),
      +(dmyMatch[6] || 0)
    );
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}

// --- KONVERSI DATA FIREBASE KE STRUKTUR 32 PARAMETER PZEM-6L24 ---
function mapRowToRecord(rowInput, fallbackKey = '') {
  let rec = {};
  if (Array.isArray(rowInput)) {
    ALL_32_COLUMNS.forEach((colName, idx) => {
      if (idx === 0) {
        rec[colName] = rowInput[0] !== undefined && rowInput[0] !== null ? String(rowInput[0]).trim() : '-';
      } else {
        rec[colName] = toNum(rowInput[idx], 0);
      }
    });
  } else if (rowInput && typeof rowInput === 'object') {
    const keys = Object.keys(rowInput);
    const norm = s => String(s).toLowerCase().replace(/[\s_\-().\/]/g, '');
    const normMap = {};
    keys.forEach(k => {
      normMap[norm(k)] = rowInput[k];
    });

    const findVal = (targetCol, colIndex, aliases = []) => {
      for (const a of [targetCol, ...aliases]) {
        if (rowInput[a] !== undefined && rowInput[a] !== null && rowInput[a] !== '') {
          return rowInput[a];
        }
      }
      const targets = [targetCol, ...aliases].map(norm);
      for (const t of targets) {
        if (normMap[t] !== undefined && normMap[t] !== null && normMap[t] !== '') {
          return normMap[t];
        }
      }
      if (rowInput[colIndex] !== undefined) return rowInput[colIndex];
      return undefined;
    };

    let rawTs = findVal('timestamp', 0, ['waktu_wit', 'waktuwit', 'waktu', 'time', 'date', 'datetime', 'created_at', 'ts']);
    let tsStr = String(rawTs || '').trim();
    let isGlitchTs = false;

    if (!tsStr || tsStr.startsWith('2036-') || tsStr.startsWith('1970-')) {
      const histUnixMatch = String(fallbackKey || '').match(/^hist_(\d{10,13})$/);
      const decodedPushTs = decodeFirebasePushIdToWitString(fallbackKey);
      if (decodedPushTs) {
        tsStr = decodedPushTs;
      } else if (histUnixMatch) {
        const sec = Number(histUnixMatch[1]);
        const ms = sec < 1e12 ? sec * 1000 : sec;
        const dUtc = new Date(ms);
        const pad = n => String(n).padStart(2, '0');
        tsStr = `${dUtc.getUTCFullYear()}-${pad(dUtc.getUTCMonth() + 1)}-${pad(dUtc.getUTCDate())} ${pad(dUtc.getUTCHours())}:${pad(dUtc.getUTCMinutes())}:${pad(dUtc.getUTCSeconds())}`;
      } else if (fallbackKey === 'realtime') {
        tsStr = state.lastValidTimestampStr || formatDateTimeString(new Date());
      } else {
        isGlitchTs = true;
      }
    } else {
      state.lastValidTimestampStr = tsStr;
    }

    const vr = toNum(findVal('V r-n', 2, ['vA', 'va', 'vrn', 'vr', 'v_r', 'v1']));
    const vs = toNum(findVal('V s-n', 3, ['vB', 'vb', 'vsn', 'vs', 'v_s', 'v2']));
    const vt = toNum(findVal('V t-n', 4, ['vC', 'vc', 'vtn', 'vt', 'v_t', 'v3']));

    const ir = toNum(findVal('I r', 5, ['iA', 'ia', 'ir', 'i_r', 'i1']));
    const is = toNum(findVal('Is', 6, ['iB', 'ib', 'is', 'I s', 'i_s', 'i2']));
    const it = toNum(findVal('It', 7, ['iC', 'ic', 'it', 'I t', 'i_t', 'i3']));

    const pr = toNum(findVal('P r', 8, ['pA', 'pa', 'pr', 'p_r', 'p1']));
    const ps = toNum(findVal('P s', 9, ['pB', 'pb', 'ps', 'p_s', 'p2']));
    const pt = toNum(findVal('P t', 10, ['pC', 'pc', 'pt', 'p_t', 'p3']));

    const qr = toNum(findVal('Q r', 11, ['qA', 'qa', 'qr', 'q_r', 'q1']));
    const qs = toNum(findVal('Q s', 12, ['qB', 'qb', 'qs', 'q_s', 'q2']));
    const qt = toNum(findVal('Q t', 13, ['qC', 'qc', 'qt', 'q_t', 'q3']));

    const sr = toNum(findVal('S r', 14, ['sA', 'sa', 'sr', 's_r', 's1']));
    const ss = toNum(findVal('S s', 15, ['sB', 'sb', 'ss', 's_s', 's2']));
    const st = toNum(findVal('S t', 16, ['sC', 'sc', 'st', 's_t', 's3']));

    const er = toNum(findVal('E r', 23, ['eActA', 'eacta', 'er', 'ea', 'e_r', 'e1']));
    const es = toNum(findVal('E s', 24, ['eActB', 'eactb', 'es', 'eb', 'e_s', 'e2']));
    const et = toNum(findVal('E t', 25, ['eActC', 'eactc', 'et', 'ec', 'e_t', 'e3']));

    let pTot = toNum(findVal('P total', 26, ['pTot', 'ptot', 'ptotal', 'p_total']));
    if (pTot === 0 && (pr > 0 || ps > 0 || pt > 0)) {
      pTot = +(pr + ps + pt).toFixed(2);
    }

    let qTot = toNum(findVal('Q total', 27, ['qTot', 'qtot', 'qtotal', 'q_total']));
    if (qTot === 0 && (qr !== 0 || qs !== 0 || qt !== 0)) {
      qTot = +(qr + qs + qt).toFixed(2);
    }

    let sTot = toNum(findVal('S total', 28, ['sTot', 'stot', 'stotal', 's_total']));
    if (sTot === 0 && (sr > 0 || ss > 0 || st > 0)) {
      sTot = +(sr + ss + st).toFixed(2);
    }

    let eTot = toNum(findVal('E total (kWh)', 29, ['eActTot', 'eacttot', 'etotal', 'etotalkwh', 'e_total']));
    if (eTot === 0 && (er > 0 || es > 0 || et > 0)) {
      eTot = +(er + es + et).toFixed(2);
    }

    rec = {
      'timestamp': tsStr,
      'frekuensi': toNum(findVal('frekuensi', 1, ['freq', 'frequency', 'hz', 'f'])),
      'V r-n': vr,
      'V s-n': vs,
      'V t-n': vt,
      'I r': ir,
      'Is': is,
      'It': it,
      'P r': pr,
      'P s': ps,
      'P t': pt,
      'Q r': qr,
      'Q s': qs,
      'Q t': qt,
      'S r': sr,
      'S s': ss,
      'S t': st,
      'power faktor r': toNum(findVal('power faktor r', 17, ['pfA', 'pfa', 'pfr', 'pf_r'])),
      'power faktor s': toNum(findVal('power faktor s', 18, ['pfB', 'pfb', 'pfs', 'pf_s'])),
      'power faktor t': toNum(findVal('power faktor t', 19, ['pfC', 'pfc', 'pft', 'pf_t'])),
      'sudut fase r': toNum(findVal('sudut fase r', 20, ['angA', 'anga', 'angler', 'phir'])),
      'sudut fase s': toNum(findVal('sudut fase s', 21, ['angB', 'angb', 'angles', 'phis'])),
      'sudut fase t': toNum(findVal('sudut fase t', 22, ['angC', 'angc', 'anglet', 'phit'])),
      'E r': er,
      'E s': es,
      'E t': et,
      'P total': pTot,
      'Q total': qTot,
      'S total': sTot,
      'E total (kWh)': eTot,
      'energi reaktif total (kVARh)': toNum(findVal('energi reaktif total (kVARh)', 30, ['eReactTot', 'ereacttot', 'eqtotal', 'kvarh'])),
      'energi semu total (kVAh)': toNum(findVal('energi semu total (kVAh)', 31, ['eAppTot', 'eapptot', 'estotal', 'kvah'])),
      _isGlitchTs: isGlitchTs
    };
  }

  rec._fbKey = fallbackKey || '';
  rec._parsedDate = parseFlexibleTimestamp(rec['timestamp']);
  return rec;
}

function isMeasurementObject(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  return (
    obj.vA !== undefined ||
    obj.pTot !== undefined ||
    obj.waktu_wit !== undefined ||
    obj['V r-n'] !== undefined ||
    obj['P total'] !== undefined ||
    obj.timestamp !== undefined
  );
}

function getKeyCategoryOrder(key) {
  if (/^history_\d+$/.test(key)) return 1;
  if (key.startsWith('-')) return 2;
  if (/^hist_\d+$/.test(key)) return 3;
  if (key === 'realtime') return 4;
  return 2;
}

function sortHistoryRecords(records) {
  return [...records].sort((a, b) => {
    const ta = a._parsedDate ? a._parsedDate.getTime() : 0;
    const tb = b._parsedDate ? b._parsedDate.getTime() : 0;
    if (ta > 0 && tb > 0 && ta !== tb) {
      return ta - tb;
    }

    const ka = a._fbKey || '';
    const kb = b._fbKey || '';
    const catA = getKeyCategoryOrder(ka);
    const catB = getKeyCategoryOrder(kb);
    if (catA !== catB) return catA - catB;

    if (catA === 1) {
      return parseInt(ka.slice(8), 10) - parseInt(kb.slice(8), 10);
    }
    if (catA === 3) {
      return parseInt(ka.slice(5), 10) - parseInt(kb.slice(5), 10);
    }
    return ka.localeCompare(kb);
  });
}

function parseHistoryObjectToList(rawObj) {
  if (!rawObj || typeof rawObj !== 'object') return [];
  if (isMeasurementObject(rawObj)) {
    return [mapRowToRecord(rawObj, 'realtime')];
  }

  const list = [];
  for (const [key, val] of Object.entries(rawObj)) {
    if (val && typeof val === 'object' && isMeasurementObject(val)) {
      const rec = mapRowToRecord(val, key);
      const isAllZeroRow = rec['P total'] <= 0 && rec['V r-n'] <= 0 && rec['V s-n'] <= 0 && rec['V t-n'] <= 0;
      if (!rec._isGlitchTs && !isAllZeroRow) {
        list.push(rec);
      }
    }
  }
  return sortHistoryRecords(list);
}

function filterOutAbnormalZeroPTotal(recordsList) {
  return recordsList.filter((rec, idx, arr) => {
    const p = rec['P total'];
    if (p <= 0) return false;

    const prev = idx > 0 ? arr[idx - 1]['P total'] : 0;
    const next = idx < arr.length - 1 ? arr[idx + 1]['P total'] : 0;
    if (prev > 1000 && next > 1000 && p < prev * 0.05 && p < next * 0.05) {
      return false;
    }
    return true;
  });
}

function getLatestNonZeroMetric(colName) {
  if (state.latestRecord && state.latestRecord[colName] > 0) {
    return state.latestRecord[colName];
  }

  const n = state.records.length;
  for (let i = n - 1; i >= Math.max(0, n - 25); i--) {
    if (state.records[i][colName] > 0) {
      return state.records[i][colName];
    }
  }
  return state.latestRecord ? state.latestRecord[colName] : 0;
}

// --- KONEKSI FIREBASE REALTIME DATABASE ---
function setStatusBadge(type, text) {
  const dot = document.getElementById('statusDot');
  const label = document.getElementById('connectionStatusText');
  if (dot) dot.className = `status-dot ${type}`;
  if (label) label.textContent = text;
}

function detachFirebaseListeners() {
  if (state.firebaseRealtimeRef && state.firebaseRealtimeCallback) {
    try {
      state.firebaseRealtimeRef.off('value', state.firebaseRealtimeCallback);
    } catch (_) {}
  }
  if (state.firebaseHistoryPushRef && state.firebaseHistoryPushCallback) {
    try {
      state.firebaseHistoryPushRef.off('child_added', state.firebaseHistoryPushCallback);
    } catch (_) {}
  }
  if (state.firebaseHistoryTsRef && state.firebaseHistoryTsCallback) {
    try {
      state.firebaseHistoryTsRef.off('child_added', state.firebaseHistoryTsCallback);
      state.firebaseHistoryTsRef.off('child_changed', state.firebaseHistoryTsCallback);
    } catch (_) {}
  }
  state.firebaseRealtimeRef = null;
  state.firebaseRealtimeCallback = null;
  state.firebaseHistoryPushRef = null;
  state.firebaseHistoryPushCallback = null;
  state.firebaseHistoryTsRef = null;
  state.firebaseHistoryTsCallback = null;
}

function handleRealtimeSnapshot(rawRealtimeObj) {
  if (!rawRealtimeObj || typeof rawRealtimeObj !== 'object') return;
  const rec = mapRowToRecord(rawRealtimeObj, 'realtime');

  const criticalCols = ['P total', 'E total (kWh)', 'frekuensi', 'V r-n', 'V s-n', 'V t-n', 'I r', 'Is', 'It'];
  criticalCols.forEach(col => {
    if (rec[col] <= 0) {
      const fallbackVal = getLatestNonZeroMetric(col);
      if (fallbackVal > 0) rec[col] = fallbackVal;
    }
  });

  state.latestRecord = rec;
  setStatusBadge('live', `Live (${currentGardu.id})`);
  renderLatestMetrics();
}

function mergeHistoryRecords(newHistoryRecords) {
  if (!newHistoryRecords || newHistoryRecords.length === 0) return;

  const mapByKeyOrTs = new Map();

  state.records.forEach(r => {
    if (r._fbKey === 'realtime') return;
    const k = r._fbKey ? r._fbKey : `ts_${r['timestamp']}`;
    mapByKeyOrTs.set(k, r);
  });

  newHistoryRecords.forEach(r => {
    const isAllZeroRow = r['P total'] <= 0 && r['V r-n'] <= 0 && r['V s-n'] <= 0 && r['V t-n'] <= 0;
    if (r._isGlitchTs || isAllZeroRow) return;
    const k = r._fbKey ? r._fbKey : `ts_${r['timestamp']}`;
    mapByKeyOrTs.set(k, r);
  });

  const merged = sortHistoryRecords(Array.from(mapByKeyOrTs.values()));
  state.records = merged;

  if (!state.latestRecord && merged.length > 0) {
    state.latestRecord = merged[merged.length - 1];
  }

  setStatusBadge('live', `Live (${currentGardu.id})`);
  renderAllMonitoringViews();
}

async function fetchFirebaseFastInitialLoad() {
  const baseUrl = currentGardu.firebaseUrl.replace(/\/+$/, '');
  const rtPath = currentGardu.realtimePath;
  const histPath = currentGardu.historyPath;

  if (state.records.length === 0) {
    setStatusBadge('cloud', `Memuat ${currentGardu.id}...`);
  }

  try {
    const rtUrl = `${baseUrl}/${rtPath}.json`;
    const tsHistUrl = `${baseUrl}/${histPath}.json?orderBy=%22$key%22&startAt=%22hist_%22&endAt=%22hist_~%22`;
    const pushHistUrl = `${baseUrl}/${histPath}.json?orderBy=%22$key%22&startAt=%22-%22&endAt=%22-~%22`;

    const [rtRes, tsHistRes, pushRes] = await Promise.all([
      fetch(rtUrl).catch(() => null),
      fetch(tsHistUrl).catch(() => null),
      fetch(pushHistUrl).catch(() => null)
    ]);

    const initialFastList = [];

    if (pushRes && pushRes.ok) {
      const pushData = await pushRes.json();
      if (pushData && typeof pushData === 'object') {
        initialFastList.push(...parseHistoryObjectToList(pushData));
      }
    }

    if (tsHistRes && tsHistRes.ok) {
      const tsHistData = await tsHistRes.json();
      if (tsHistData && typeof tsHistData === 'object') {
        initialFastList.push(...parseHistoryObjectToList(tsHistData));
      }
    }

    if (initialFastList.length > 0) {
      mergeHistoryRecords(initialFastList);
    }

    if (rtRes && rtRes.ok) {
      const rtData = await rtRes.json();
      if (rtData && typeof rtData === 'object') {
        handleRealtimeSnapshot(rtData);
      }
    }

    // Muat juga blok history_35000..history_39999 dari /monitoring_history
    const startPrefix = 'history_35000';
    const recentHistUrl = `${baseUrl}/${histPath}.json?orderBy=%22$key%22&startAt=%22${startPrefix}%22&endAt=%22history_39999%22`;
    const recentRes = await fetch(recentHistUrl);
    if (recentRes.ok) {
      const recentData = await recentRes.json();
      if (recentData && typeof recentData === 'object') {
        const filteredRecentObj = {};
        for (const [k, v] of Object.entries(recentData)) {
          if (!/^history_\d+$/.test(k) || k.length >= startPrefix.length) {
            filteredRecentObj[k] = v;
          }
        }
        const recentList = parseHistoryObjectToList(filteredRecentObj);
        if (recentList.length > 0) {
          mergeHistoryRecords(recentList);
        }
      }
    }

    // Muat seluruh arsip di latar belakang agar lompat halaman (50, 100, 300, dst.) dan geser grafik mencakup semua data
    ensureFullHistoryLoadedIfNeeded();

    return true;
  } catch (err) {
    setStatusBadge('warning', 'Gangguan Koneksi');
    return false;
  }
}

async function ensureFullHistoryLoadedIfNeeded() {
  if (state.fullHistoryLoaded || state.isLoadingFullHistory) return;
  state.isLoadingFullHistory = true;

  try {
    const baseUrl = currentGardu.firebaseUrl.replace(/\/+$/, '');
    const histPath = currentGardu.historyPath;
    const res = await fetch(`${baseUrl}/${histPath}.json`);
    if (res.ok) {
      const allData = await res.json();
      const allList = parseHistoryObjectToList(allData);
      state.fullHistoryLoaded = true;
      mergeHistoryRecords(allList);
    }
  } catch (_) {
    // Gunakan data yang sudah ada di memori bila gagal
  } finally {
    state.isLoadingFullHistory = false;
    renderHistorySection();
  }
}

function connectFirebaseDatabase() {
  detachFirebaseListeners();
  fetchFirebaseFastInitialLoad();

  if (typeof firebase !== 'undefined' && firebase.database) {
    try {
      const config = {
        databaseURL: currentGardu.firebaseUrl.replace(/\/+$/, '')
      };

      if (!state.firebaseApp) {
        state.firebaseApp = firebase.initializeApp(config, 'phbtrApp_' + currentGardu.id);
      }

      state.firebaseDb = state.firebaseApp.database();

      // 1. Listener Realtime untuk /monitoring_realtime
      const rtRef = state.firebaseDb.ref(currentGardu.realtimePath);
      state.firebaseRealtimeRef = rtRef;
      state.firebaseRealtimeCallback = (snapshot) => {
        const val = snapshot.val();
        if (val && typeof val === 'object') {
          handleRealtimeSnapshot(val);
        }
      };
      rtRef.on('value', state.firebaseRealtimeCallback);

      // 2. Listener Realtime untuk /monitoring_history (hist_<timestamp>)
      const histPath = currentGardu.historyPath;
      const histTsRef = state.firebaseDb.ref(histPath).orderByKey().startAt('hist_').endAt('hist_~').limitToLast(50);
      state.firebaseHistoryTsRef = histTsRef;
      state.firebaseHistoryTsCallback = (snapshot) => {
        const val = snapshot.val();
        if (val && typeof val === 'object' && isMeasurementObject(val)) {
          const rec = mapRowToRecord(val, snapshot.key);
          if (!rec._isGlitchTs) {
            mergeHistoryRecords([rec]);
          }
        }
      };
      histTsRef.on('child_added', state.firebaseHistoryTsCallback);
      histTsRef.on('child_changed', state.firebaseHistoryTsCallback);

      // 3. Listener Realtime untuk /monitoring_history (Push ID -P5...)
      const histPushRef = state.firebaseDb.ref(histPath).orderByKey().startAt('-').endAt('-~').limitToLast(30);
      state.firebaseHistoryPushRef = histPushRef;
      state.firebaseHistoryPushCallback = (snapshot) => {
        const val = snapshot.val();
        if (val && typeof val === 'object' && isMeasurementObject(val)) {
          const rec = mapRowToRecord(val, snapshot.key);
          if (!rec._isGlitchTs) {
            mergeHistoryRecords([rec]);
          }
        }
      };
      histPushRef.on('child_added', state.firebaseHistoryPushCallback);
    } catch (sdkErr) {
      console.warn('Firebase SDK fallback:', sdkErr.message);
    }
  }
}

// --- KAPASITAS MAKSIMAL TRAFO DI BACKEND (50 kVA) ---
function getMaxTrafoWatts() {
  return currentGardu.capacityKva * currentGardu.powerFactorAssumed * 1000; // 50 * 0.85 * 1000 = 42500 W
}

// --- RENDER BAGIAN REALTIME ---
function renderLatestMetrics() {
  updateLiveWitClock();
  if (state.records.length === 0 && !state.latestRecord) return;

  const pTotalWatts = getLatestNonZeroMetric('P total');
  const pTotalKw = pTotalWatts / 1000;

  const maxTrafoWatts = getMaxTrafoWatts();
  const maxTrafoKw = maxTrafoWatts / 1000;
  const trafoPercent = maxTrafoWatts > 0 ? (pTotalWatts / maxTrafoWatts) * 100 : 0;

  document.getElementById('valPTotal').innerHTML = `${formatNumID(pTotalWatts, 1)} <small>W</small>`;
  document.getElementById('valPTotalKw').textContent = `${formatNumID(pTotalKw, 3)} kW`;

  const badgeEl = document.getElementById('trafoPercentBadge');
  badgeEl.textContent = `${formatNumID(trafoPercent, 1)}%`;

  const barEl = document.getElementById('trafoProgressBar');
  barEl.style.width = `${Math.min(100, Math.max(0, trafoPercent))}%`;

  document.getElementById('trafoCapLabel').textContent =
    `Maks: ${formatNumID(maxTrafoKw, 1)} kW (${currentGardu.capacityKva} kVA)`;

  const statusNote = document.getElementById('trafoStatusNote');
  if (trafoPercent >= 100) {
    statusNote.textContent = '⚠️ Status Beban: OVERLOAD (Melebihi Kapasitas Trafo 50 kVA!)';
    statusNote.style.color = '#ef4444';
    badgeEl.style.color = '#ef4444';
    barEl.style.background = '#ef4444';
  } else if (trafoPercent >= 80) {
    statusNote.textContent = '⚡ Status Beban: Beban Tinggi (> 80% Kapasitas Trafo)';
    statusNote.style.color = '#f59e0b';
    badgeEl.style.color = '#fbbf24';
    barEl.style.background = 'linear-gradient(90deg, #f59e0b, #ef4444)';
  } else {
    statusNote.textContent = '✅ Status Beban: Normal (< 80% Kapasitas Trafo)';
    statusNote.style.color = '#10b981';
    badgeEl.style.color = '#60a5fa';
    barEl.style.background = 'linear-gradient(90deg, #3b82f6, #10b981)';
  }

  // Arus & Unbalance
  const ir = getLatestNonZeroMetric('I r');
  const is = getLatestNonZeroMetric('Is');
  const it = getLatestNonZeroMetric('It');
  const iAvg = (ir + is + it) / 3;

  const devR = iAvg > 0 ? Math.abs(ir - iAvg) : 0;
  const devS = iAvg > 0 ? Math.abs(is - iAvg) : 0;
  const devT = iAvg > 0 ? Math.abs(it - iAvg) : 0;
  const maxDev = Math.max(devR, devS, devT);
  const unbalancePercent = iAvg > 0 ? (maxDev / iAvg) * 100 : 0;

  document.getElementById('valCurrentUnbalance').innerHTML = `${formatNumID(unbalancePercent, 2)} <small>%</small>`;
  document.getElementById('valCurrentAvg').textContent = `Rata-rata Arus (I avg): ${formatNumID(iAvg, 2)} A`;
  document.getElementById('maxDeviationLabel').textContent = `Selisih Maks: ${formatNumID(maxDev, 2)} A`;

  const unbBar = document.getElementById('unbalanceProgressBar');
  unbBar.style.width = `${Math.min(100, unbalancePercent * 2.5)}%`;

  const unbBadge = document.getElementById('unbalanceStatusBadge');
  if (unbalancePercent > 20) {
    unbBadge.textContent = 'Tidak Seimbang (>20%)';
    unbBadge.style.color = '#ef4444';
    unbBadge.style.borderColor = 'rgba(239,68,68,0.4)';
    unbBadge.style.background = 'rgba(239,68,68,0.15)';
  } else if (unbalancePercent > 10) {
    unbBadge.textContent = 'Waspada (10-20%)';
    unbBadge.style.color = '#fbbf24';
    unbBadge.style.borderColor = 'rgba(245,158,11,0.4)';
    unbBadge.style.background = 'rgba(245,158,11,0.15)';
  } else {
    unbBadge.textContent = 'Seimbang (<10%)';
    unbBadge.style.color = '#34d399';
    unbBadge.style.borderColor = 'rgba(16,185,129,0.4)';
    unbBadge.style.background = 'rgba(16,185,129,0.15)';
  }

  // Energi & Frekuensi
  const eTot = getLatestNonZeroMetric('E total (kWh)');
  const eqTot = getLatestNonZeroMetric('energi reaktif total (kVARh)');
  const esTot = getLatestNonZeroMetric('energi semu total (kVAh)');
  const freq = getLatestNonZeroMetric('frekuensi');

  document.getElementById('valETotal').innerHTML = `${formatNumID(eTot, 1)} <small>kWh</small>`;
  document.getElementById('subEnergyExtra').textContent =
    `Q tot: ${formatNumID(eqTot, 1)} kVARh | S tot: ${formatNumID(esTot, 1)} kVAh`;
  document.getElementById('valFrekuensi').innerHTML = `${formatNumID(freq, 2)} <small>Hz</small>`;

  // Tegangan & Arus Tiap Fasa
  const vr = getLatestNonZeroMetric('V r-n');
  const vs = getLatestNonZeroMetric('V s-n');
  const vt = getLatestNonZeroMetric('V t-n');

  document.getElementById('valVR').innerHTML = `${formatNumID(vr, 1)} <small>V</small>`;
  document.getElementById('valVS').innerHTML = `${formatNumID(vs, 1)} <small>V</small>`;
  document.getElementById('valVT').innerHTML = `${formatNumID(vt, 1)} <small>V</small>`;

  document.getElementById('valIR').innerHTML = `${formatNumID(ir, 2)} <small>A</small>`;
  document.getElementById('valIS').innerHTML = `${formatNumID(is, 2)} <small>A</small>`;
  document.getElementById('valIT').innerHTML = `${formatNumID(it, 2)} <small>A</small>`;

  const pctR = iAvg > 0 ? ((ir - iAvg) / iAvg) * 100 : 0;
  const pctS = iAvg > 0 ? ((is - iAvg) / iAvg) * 100 : 0;
  const pctT = iAvg > 0 ? ((it - iAvg) / iAvg) * 100 : 0;
  document.getElementById('devIR').textContent = `Deviasi: ${pctR >= 0 ? '+' : ''}${formatNumID(pctR, 1)}%`;
  document.getElementById('devIS').textContent = `Deviasi: ${pctS >= 0 ? '+' : ''}${formatNumID(pctS, 1)}%`;
  document.getElementById('devIT').textContent = `Deviasi: ${pctT >= 0 ? '+' : ''}${formatNumID(pctT, 1)}%`;
}

// --- INISIALISASI & RENDER GRAFIK BEBAN PHBTR ---
const stockCrosshairPlugin = {
  id: 'stockCrosshair',
  afterDraw(chart) {
    if (chart.tooltip?._active && chart.tooltip._active.length) {
      const activePoint = chart.tooltip._active[0];
      const ctx = chart.ctx;
      const x = activePoint.element.x;
      const topY = chart.scales.y.top;
      const bottomY = chart.scales.y.bottom;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.restore();
    }
  }
};

function initStockChart() {
  const ctx = document.getElementById('pTotalStockChart').getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 380);
  gradient.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
  gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

  pTotalChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Beban PHBTR',
          data: [],
          borderColor: '#10b981',
          backgroundColor: gradient,
          fill: true,
          borderWidth: 2,
          pointRadius: 1.5,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#34d399',
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 2,
          tension: 0.15
        }
      ]
    },
    plugins: [stockCrosshairPlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#93c5fd',
          bodyColor: '#34d399',
          bodyFont: { family: 'JetBrains Mono', weight: 'bold', size: 13 },
          titleFont: { family: 'JetBrains Mono', size: 12 },
          borderColor: 'rgba(59, 130, 246, 0.45)',
          borderWidth: 1,
          padding: 10,
          displayColors: false,
          callbacks: {
            title: (items) => {
              if (!items.length) return '';
              const idx = items[0].dataIndex;
              const rec = state.chartRecords[idx];
              return rec ? rec['timestamp'] : items[0].label;
            },
            label: (item) => {
              const val = Number(item.raw);
              return `${formatNumID(val, 1)} W (${formatNumID(val / 1000, 2)} kW)`;
            }
          }
        },
        zoom: {
          pan: {
            enabled: true,
            mode: 'x'
          },
          zoom: {
            wheel: {
              enabled: true,
              speed: 0.12
            },
            pinch: {
              enabled: true
            },
            mode: 'x'
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#94a3b8',
            maxRotation: 25,
            minRotation: 0,
            autoSkip: true,
            maxTicksLimit: 12,
            font: { family: 'JetBrains Mono', size: 10.5 }
          },
          grid: { color: 'rgba(255, 255, 255, 0.04)' }
        },
        y: {
          ticks: {
            color: '#94a3b8',
            font: { family: 'JetBrains Mono', size: 11 }
          },
          grid: { color: 'rgba(255, 255, 255, 0.06)' }
        }
      }
    }
  });
}

function getBaseChartFilteredList() {
  let validChartList = filterOutAbnormalZeroPTotal(state.records);

  if (state.chartStartDate || state.chartEndDate) {
    validChartList = validChartList.filter(rec => {
      if (!rec._parsedDate) return false;
      const t = rec._parsedDate.getTime();
      if (state.chartStartDate && t < state.chartStartDate.getTime()) return false;
      if (state.chartEndDate && t > state.chartEndDate.getTime()) return false;
      return true;
    });
  }
  return validChartList;
}

function renderChartSection() {
  const baseList = getBaseChartFilteredList();
  const totalValid = baseList.length;
  let displayList = baseList;

  const slider = document.getElementById('chartPanSlider');

  if (state.chartStartDate || state.chartEndDate) {
    // Jika rentang tanggal dipilih namun datanya sangat banyak, tetap dukung digeser dengan slider apabila > CHART_DEFAULT_COUNT
    if (totalValid > CHART_DEFAULT_COUNT && state.chartEndOffset > 0) {
      const maxOffset = Math.max(0, totalValid - CHART_DEFAULT_COUNT);
      const clampedOffset = Math.min(maxOffset, Math.max(0, state.chartEndOffset));
      const endIdx = totalValid - clampedOffset;
      const startIdx = Math.max(0, endIdx - CHART_DEFAULT_COUNT);
      displayList = baseList.slice(startIdx, endIdx);
    }
    if (slider) {
      const maxOffset = Math.max(0, totalValid - CHART_DEFAULT_COUNT);
      slider.max = String(maxOffset);
      slider.value = String(Math.max(0, maxOffset - state.chartEndOffset));
    }
  } else {
    // Mode default: 100 data dengan dukungan geser kiri/kanan pada sumbu X (tanggal)
    const maxOffset = Math.max(0, totalValid - CHART_DEFAULT_COUNT);
    if (state.chartEndOffset > maxOffset) state.chartEndOffset = maxOffset;
    if (state.chartEndOffset < 0) state.chartEndOffset = 0;

    const endIdx = totalValid - state.chartEndOffset;
    const startIdx = Math.max(0, endIdx - CHART_DEFAULT_COUNT);
    displayList = baseList.slice(startIdx, endIdx);

    if (slider) {
      slider.max = String(maxOffset);
      slider.value = String(maxOffset - state.chartEndOffset);
    }
  }

  state.chartRecords = displayList;

  if (pTotalChart) {
    pTotalChart.data.labels = displayList.map(r => r['timestamp']);
    pTotalChart.data.datasets[0].data = displayList.map(r => r['P total']);
    pTotalChart.update('none');
  }
}

// --- RENDER BAGIAN HISTORICAL (100 BARIS LANGSUNG PER HALAMAN + LOMPAT HALAMAN) ---
/**
 * Menyusun daftar nomor halaman seperti:
 * 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ... 50 ... 100 ... 200 ... 300 ... 400
 * ditambah halaman di sekitar halaman aktif saat ini.
 */
function buildSmartPaginationItems(currentPage, totalPages) {
  const pageSet = new Set();

  // Selalu tampilkan halaman 1 s/d 10
  for (let p = 1; p <= Math.min(10, totalPages); p++) {
    pageSet.add(p);
  }

  // Tampilkan kelipatan 50 & 100 (50, 100, 150, 200, 250, 300, 350, 400, 500...)
  const milestones = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000];
  milestones.forEach(m => {
    if (m <= totalPages) pageSet.add(m);
  });

  // Selalu tampilkan halaman terakhir
  if (totalPages >= 1) {
    pageSet.add(totalPages);
  }

  // Tampilkan halaman di sekitar halaman yang sedang dibuka agar mudah berpindah
  for (let p = currentPage - 2; p <= currentPage + 2; p++) {
    if (p >= 1 && p <= totalPages) {
      pageSet.add(p);
    }
  }

  const sortedPages = Array.from(pageSet).sort((a, b) => a - b);
  const items = [];

  for (let i = 0; i < sortedPages.length; i++) {
    const p = sortedPages[i];
    if (i > 0 && p - sortedPages[i - 1] > 1) {
      items.push('...');
    }
    items.push(p);
  }

  return items;
}

function renderHistorySection() {
  const tbody = document.getElementById('historyTableBody');
  const paginationContainer = document.getElementById('historyPaginationNumbers');

  if (state.records.length === 0) {
    tbody.innerHTML = `<tr><td colspan="32" style="text-align:center;">Memuat data dari Firebase...</td></tr>`;
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }

  // Urutan dari paling baru ke paling lama (100 baris per halaman langsung)
  const reversed = [...state.records].reverse();
  const totalItems = reversed.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / HISTORY_PAGE_SIZE));

  if (state.historyPage > totalPages) state.historyPage = totalPages;
  if (state.historyPage < 1) state.historyPage = 1;

  const startIdx = (state.historyPage - 1) * HISTORY_PAGE_SIZE;
  const pageRows = reversed.slice(startIdx, startIdx + HISTORY_PAGE_SIZE);

  tbody.innerHTML = pageRows.map(r => renderHistoryRowHtml(r)).join('');

  if (paginationContainer) {
    const pageItems = buildSmartPaginationItems(state.historyPage, totalPages);
    const prevDisabled = state.historyPage <= 1 ? 'disabled' : '';
    const nextDisabled = state.historyPage >= totalPages ? 'disabled' : '';

    let html = `<button type="button" class="page-num-btn" data-page="${state.historyPage - 1}" ${prevDisabled} title="Halaman Sebelumnya">&laquo;</button>`;

    pageItems.forEach(item => {
      if (item === '...') {
        html += `<span class="page-ellipsis">...</span>`;
      } else {
        const activeClass = item === state.historyPage ? 'active' : '';
        html += `<button type="button" class="page-num-btn ${activeClass}" data-page="${item}">${item}</button>`;
      }
    });

    html += `<button type="button" class="page-num-btn" data-page="${state.historyPage + 1}" ${nextDisabled} title="Halaman Berikutnya">&raquo;</button>`;
    paginationContainer.innerHTML = html;
  }
}

function renderHistoryRowHtml(r) {
  return `
    <tr>
      <td class="sticky-col">${r['timestamp']}</td>
      <td>${formatNumID(r['frekuensi'], 2)}</td>
      <td class="col-r">${formatNumID(r['V r-n'], 1)}</td>
      <td class="col-s">${formatNumID(r['V s-n'], 1)}</td>
      <td class="col-t">${formatNumID(r['V t-n'], 1)}</td>
      <td class="col-r">${formatNumID(r['I r'], 2)}</td>
      <td class="col-s">${formatNumID(r['Is'], 2)}</td>
      <td class="col-t">${formatNumID(r['It'], 2)}</td>
      <td class="col-r">${formatNumID(r['P r'], 1)}</td>
      <td class="col-s">${formatNumID(r['P s'], 1)}</td>
      <td class="col-t">${formatNumID(r['P t'], 1)}</td>
      <td class="col-r">${formatNumID(r['Q r'], 1)}</td>
      <td class="col-s">${formatNumID(r['Q s'], 1)}</td>
      <td class="col-t">${formatNumID(r['Q t'], 1)}</td>
      <td class="col-r">${formatNumID(r['S r'], 1)}</td>
      <td class="col-s">${formatNumID(r['S s'], 1)}</td>
      <td class="col-t">${formatNumID(r['S t'], 1)}</td>
      <td class="col-r">${formatNumID(r['power faktor r'], 2)}</td>
      <td class="col-s">${formatNumID(r['power faktor s'], 2)}</td>
      <td class="col-t">${formatNumID(r['power faktor t'], 2)}</td>
      <td class="col-r">${formatNumID(r['sudut fase r'], 2)}</td>
      <td class="col-s">${formatNumID(r['sudut fase s'], 2)}</td>
      <td class="col-t">${formatNumID(r['sudut fase t'], 2)}</td>
      <td class="col-r">${formatNumID(r['E r'], 1)}</td>
      <td class="col-s">${formatNumID(r['E s'], 1)}</td>
      <td class="col-t">${formatNumID(r['E t'], 1)}</td>
      <td class="col-p">${formatNumID(r['P total'], 1)}</td>
      <td>${formatNumID(r['Q total'], 1)}</td>
      <td>${formatNumID(r['S total'], 1)}</td>
      <td class="col-e">${formatNumID(r['E total (kWh)'], 1)}</td>
      <td>${formatNumID(r['energi reaktif total (kVARh)'], 1)}</td>
      <td>${formatNumID(r['energi semu total (kVAh)'], 1)}</td>
    </tr>
  `;
}

function renderAllMonitoringViews() {
  renderLatestMetrics();
  renderChartSection();
  renderHistorySection();
}

// --- PARSER TANGGAL DARI INPUT DATE ("YYYY-MM-DD") ---
function parseDateInputStart(dateStr) {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
}

function parseDateInputEnd(dateStr) {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T23:59:59.999`);
  return isNaN(d.getTime()) ? null : d;
}

// --- FITUR EXPORT EXCEL BERDASARKAN RENTANG TANGGAL ---
async function exportHistoryToExcel() {
  const startVal = document.getElementById('exportStartDate').value;
  const endVal = document.getElementById('exportEndDate').value;
  const startDate = parseDateInputStart(startVal);
  const endDate = parseDateInputEnd(endVal);

  const btn = document.getElementById('btnExportExcelRange');
  const origText = btn.textContent;

  if (startDate && !state.fullHistoryLoaded) {
    const earliestLoaded = state.records[0]?._parsedDate;
    if (!earliestLoaded || startDate < earliestLoaded) {
      btn.disabled = true;
      btn.textContent = '⏳ Mengambil Arsip...';
      await ensureFullHistoryLoadedIfNeeded();
      btn.disabled = false;
      btn.textContent = origText;
    }
  }

  let source = [...state.records];
  if (startDate || endDate) {
    source = source.filter(rec => {
      if (!rec._parsedDate) return false;
      const t = rec._parsedDate.getTime();
      if (startDate && t < startDate.getTime()) return false;
      if (endDate && t > endDate.getTime()) return false;
      return true;
    });
  }

  if (source.length === 0) {
    alert('Tidak ada data pada rentang tanggal yang dipilih untuk diekspor.');
    return;
  }

  const exportRows = source.map(rec => {
    const rowObj = {};
    ALL_32_COLUMNS.forEach(col => {
      rowObj[col] = rec[col];
    });
    return rowObj;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportRows, { header: ALL_32_COLUMNS });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `History_${currentGardu.id}`);

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  XLSX.writeFile(workbook, `Historical_${currentGardu.id}_${stamp}.xlsx`);
}

// --- RENDER HALAMAN 2: DATA TEKNIK TRAFO, PHBTR, & RIWAYAT PEMELIHARAAN ---
function renderTechnicalPage() {
  document.getElementById('garduCodeBadge').textContent = currentGardu.id;
  document.getElementById('techGarduTitle').textContent =
    `Gardu ${currentGardu.id} — Kapasitas ${currentGardu.capacityKva} kVA`;
  document.getElementById('techGarduLocation').textContent = currentGardu.deskripsiLokasi;
  document.getElementById('techCodePill').textContent = currentGardu.id;
  document.getElementById('techCapPill').textContent = `${currentGardu.capacityKva} kVA`;
  document.getElementById('techStatusPill').textContent = currentGardu.statusOperasi;

  const trafoListEl = document.getElementById('trafoSpecList');
  trafoListEl.innerHTML = currentGardu.trafoSpecs.map(item => `
    <div class="spec-row">
      <span class="spec-label">${item.label}</span>
      <span class="spec-value">${item.value}</span>
    </div>
  `).join('');

  const phbtrListEl = document.getElementById('phbtrSpecList');
  phbtrListEl.innerHTML = currentGardu.phbtrSpecs.map(item => `
    <div class="spec-row">
      <span class="spec-label">${item.label}</span>
      <span class="spec-value">${item.value}</span>
    </div>
  `).join('');

  const maintBodyEl = document.getElementById('maintenanceTableBody');
  const maintList = currentGardu.maintenanceHistory || [];
  document.getElementById('maintenanceCountBadge').textContent = `${maintList.length} Riwayat Tercatat`;

  if (maintList.length === 0) {
    maintBodyEl.innerHTML = `<tr><td colspan="7" style="text-align:center;">Belum ada catatan riwayat pemeliharaan.</td></tr>`;
  } else {
    maintBodyEl.innerHTML = maintList.map((m, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${m.tanggal}</td>
        <td><strong>${m.komponen}</strong></td>
        <td>${m.jenis}</td>
        <td>${m.uraian}</td>
        <td>${m.petugas}</td>
        <td><span class="maint-status-badge">${m.status}</span></td>
      </tr>
    `).join('');
  }
}

// --- NAVIGASI ANTAR HALAMAN (DATA PENGUKURAN vs DATA TEKNIK & PEMELIHARAAN) ---
function switchPage(pageName) {
  state.activePage = pageName;
  const pageMon = document.getElementById('pageMonitoring');
  const pageTech = document.getElementById('pageTechnical');
  const tabMon = document.getElementById('tabMonitoringBtn');
  const tabTech = document.getElementById('tabTechnicalBtn');

  if (pageName === 'technical') {
    pageMon.classList.add('hidden');
    pageTech.classList.remove('hidden');
    tabMon.classList.remove('active');
    tabTech.classList.add('active');
  } else {
    pageTech.classList.add('hidden');
    pageMon.classList.remove('hidden');
    tabTech.classList.remove('active');
    tabMon.classList.add('active');
    if (pTotalChart) pTotalChart.resize();
  }
}

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
  updateLiveWitClock();
  setInterval(updateLiveWitClock, 1000);

  renderTechnicalPage();
  initStockChart();
  connectFirebaseDatabase();

  // Buka popup kalender langsung saat kotak tanggal diklik
  document.querySelectorAll('.input-date-picker').forEach(inp => {
    inp.addEventListener('click', () => {
      if (typeof inp.showPicker === 'function') {
        try { inp.showPicker(); } catch (_) {}
      }
    });
  });

  // Navigasi 2 Halaman
  document.getElementById('tabMonitoringBtn').addEventListener('click', () => switchPage('monitoring'));
  document.getElementById('tabTechnicalBtn').addEventListener('click', () => switchPage('technical'));

  // Tombol Refresh
  document.getElementById('btnManualRefresh').addEventListener('click', () => {
    fetchFirebaseFastInitialLoad();
  });

  // Pilih Tanggal Otomatis pada Grafik Beban PHBTR (Langsung Filter Saat Tanggal Dipilih)
  const handleAutoChartDateChange = async () => {
    const startVal = document.getElementById('chartStartDate').value;
    const endVal = document.getElementById('chartEndDate').value;
    state.chartStartDate = parseDateInputStart(startVal);
    state.chartEndDate = parseDateInputEnd(endVal);
    state.chartEndOffset = 0;

    if (state.chartStartDate && !state.fullHistoryLoaded) {
      const earliestLoaded = state.records[0]?._parsedDate;
      if (!earliestLoaded || state.chartStartDate < earliestLoaded) {
        await ensureFullHistoryLoadedIfNeeded();
      }
    }

    renderChartSection();
    if (pTotalChart) pTotalChart.resetZoom();
  };

  document.getElementById('chartStartDate').addEventListener('change', handleAutoChartDateChange);
  document.getElementById('chartEndDate').addEventListener('change', handleAutoChartDateChange);

  document.getElementById('btnResetChartFilter').addEventListener('click', () => {
    state.chartStartDate = null;
    state.chartEndDate = null;
    state.chartEndOffset = 0;
    document.getElementById('chartStartDate').value = '';
    document.getElementById('chartEndDate').value = '';
    renderChartSection();
    if (pTotalChart) pTotalChart.resetZoom();
  });

  // Slider Geser Sumbu X (Tanggal) Menyatu di Bawah Tanggal Grafik
  document.getElementById('chartPanSlider').addEventListener('input', (e) => {
    const slider = e.target;
    const maxOffset = parseInt(slider.max, 10) || 0;
    const val = parseInt(slider.value, 10) || 0;
    state.chartEndOffset = Math.max(0, maxOffset - val);
    renderChartSection();
  });

  // Kontrol Zoom Grafik di Bawah Grafik
  document.getElementById('btnZoomIn').addEventListener('click', () => {
    if (pTotalChart) pTotalChart.zoom(1.25);
  });
  document.getElementById('btnZoomOut').addEventListener('click', () => {
    if (pTotalChart) pTotalChart.zoom(0.8);
  });
  document.getElementById('btnResetZoom').addEventListener('click', () => {
    if (pTotalChart) pTotalChart.resetZoom();
  });

  // Klik Nomor Halaman pada Bagian Historical (1..10, 50, 100, dst.)
  document.getElementById('historyPaginationNumbers').addEventListener('click', (e) => {
    const btn = e.target.closest('.page-num-btn');
    if (!btn || btn.disabled) return;
    const targetPage = parseInt(btn.dataset.page, 10);
    if (!isNaN(targetPage) && targetPage >= 1) {
      state.historyPage = targetPage;
      renderHistorySection();
    }
  });

  // Export Excel berdasarkan rentang tanggal
  document.getElementById('btnExportExcelRange').addEventListener('click', exportHistoryToExcel);
});
