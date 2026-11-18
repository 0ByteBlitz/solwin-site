// Live $SLW numbers from Solana devnet, read straight from the program's
// accounts. No libraries, no wallet, read-only RPC calls. Only textContent is
// written, never HTML. Account layout: program/programs/solwin/src/lib.rs
// `Config` (8-byte discriminator, then fields in order); checked against the
// client decoder in src/chain/solwin.ts.
'use strict';

(function () {
    const RPC = 'https://api.devnet.solana.com';
    const CONFIG = 'AoeymeKAbQWFT31DKyn2im2fdbb5QPxEs5FfH49QXrPW';   // PDA ["config"]
    const RESERVE = '8ggv7SSvyWePWvxUERCPfDKFDjcYnzkpLSUSoQ4B96rD';  // PDA ["reserve"]
    const TREASURY_SPACE = 9;                                       // 8 + Treasury { bump: u8 }
    const SLW_UNIT = 1000000n;
    const LAMPORTS_PER_SOL = 1000000000n;
    const SUPPLY_CAP = 1000000000n * SLW_UNIT;
    const OFF = { floor: 200, paused: 224, minted: 225, burned: 233 };
    const CONFIG_LEN = 243;

    const $ = (id) => document.getElementById(id);
    const set = (id, text) => { const el = $(id); if (el) el.textContent = text; };

    async function rpc(method, params) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 10000);
        try {
            const res = await fetch(RPC, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
                signal: ctrl.signal,
                referrerPolicy: 'no-referrer',
                credentials: 'omit',
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const body = await res.json();
            if (body.error) throw new Error(body.error.message || 'RPC error');
            return body.result;
        } finally {
            clearTimeout(timer);
        }
    }

    function b64(s) {
        const bin = atob(s);
        const out = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        return out;
    }

    function u64(bytes, at) {
        return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getBigUint64(at, true);
    }

    // Whole units with grouping, from base units (BigInt) and a unit size.
    function fmtUnits(base, unit, digits) {
        const whole = base / unit;
        const frac = base % unit;
        let s = whole.toLocaleString('en-US');
        if (digits > 0) {
            const f = (frac * 10n ** BigInt(digits) / unit).toString().padStart(digits, '0').replace(/0+$/, '');
            if (f) s += '.' + f;
        }
        return s;
    }

    function era(minted) {
        let remaining = SUPPLY_CAP - minted;
        if (remaining <= 0n) return null;
        let e = 0;
        while (e < 63 && remaining <= SUPPLY_CAP >> BigInt(e + 1)) e++;
        return e;
    }

    async function load() {
        const pulse = $('live-pulse');
        try {
            const [cfg, reserve, rent] = await Promise.all([
                rpc('getAccountInfo', [CONFIG, { encoding: 'base64', commitment: 'confirmed' }]),
                rpc('getBalance', [RESERVE, { commitment: 'confirmed' }]),
                rpc('getMinimumBalanceForRentExemption', [TREASURY_SPACE]),
            ]);
            if (!cfg || !cfg.value) throw new Error('config account not found');
            const data = b64(cfg.value.data[0]);
            if (data.length !== CONFIG_LEN) throw new Error('unexpected config size ' + data.length);

            const floor = u64(data, OFF.floor);          // lamports per whole $SLW
            const minted = u64(data, OFF.minted);        // base units
            const burned = u64(data, OFF.burned);
            const paused = data[OFF.paused] === 1;
            const circ = minted - burned;
            const lamports = BigInt(reserve.value);
            const available = lamports > BigInt(rent) ? lamports - BigInt(rent) : 0n;

            set('live-minted', fmtUnits(minted, SLW_UNIT, 0));
            set('live-burned', fmtUnits(burned, SLW_UNIT, 0));
            set('live-circ', fmtUnits(circ, SLW_UNIT, 0));
            set('live-floor', fmtUnits(floor, LAMPORTS_PER_SOL, 6));
            set('live-reserve', fmtUnits(available, LAMPORTS_PER_SOL, 3));

            // liability = circulating × floor, in lamports
            const liability = circ * floor / SLW_UNIT;
            set('live-backing', liability === 0n ? 'n/a' : (Number(available * 10000n / liability) / 100).toFixed(1) + '%');

            const e = era(minted);
            set('live-era', (e === null ? 'Supply cap reached.' : 'Current halving era: ' + e + '.') +
                (paused ? ' New bets are paused.' : '') +
                (circ === 0n ? ' Nothing has been minted yet: devnet spins open once the vault holds 25+ SOL.' : ''));
            set('live-status', 'Read from the program on Solana devnet just now (confirmed). Refresh to update.');
            if (pulse) pulse.className = 'pulse ok';
        } catch (err) {
            set('live-status', "Couldn't read devnet right now (" + (err && err.message ? err.message : 'network error') + '). The numbers below are unavailable; try again later.');
            if (pulse) pulse.className = 'pulse err';
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
    else load();
})();
