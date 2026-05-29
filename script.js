document.addEventListener('DOMContentLoaded', () => {

    // ─── State ────────────────────────────────────────────────────────────────
    let selectedDays = new Set(); // 'YYYY-MM-DD'
    let stationFrom  = null;      // { id (UIC), name, city, dept }
    let stationTo    = null;
    let profile      = 'adult';   // 'adult' | 'young' | 'senior' | 'chomeur'

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let viewDate = new Date(today.getFullYear(), today.getMonth(), 1);

    // ─── DOM refs ─────────────────────────────────────────────────────────────
    const calGrid          = document.getElementById('calendarGrid');
    const calMonthLabel    = document.getElementById('calMonthLabel');
    const selectedCountEl  = document.getElementById('selectedCount');
    const clearBtn         = document.getElementById('clearBtn');
    const priceMonthInput  = document.getElementById('priceMonth');
    const priceWeekInput   = document.getElementById('priceWeek');
    const priceDayInput    = document.getElementById('priceDay');
    const finalPriceEl     = document.getElementById('finalPrice');
    const recommendationEl = document.getElementById('recommendationText');
    const monthlyCostEl    = document.getElementById('monthlyCostDisplay');
    const savingsEl        = document.getElementById('savingsText');
    const funFactEl        = document.getElementById('funFact');
    const detailsSection   = document.getElementById('detailsSection');
    // Station DOM
    const inputFrom    = document.getElementById('stationFrom');
    const inputTo      = document.getElementById('stationTo');
    const dropFrom     = document.getElementById('dropdownFrom');
    const dropTo       = document.getElementById('dropdownTo');
    const clearFromBtn = document.getElementById('clearFrom');
    const clearToBtn   = document.getElementById('clearTo');
    const tariffStatus = document.getElementById('tariffStatus');

    // ─── Date helpers ─────────────────────────────────────────────────────────
    function dateToStr(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    function strToDate(s) {
        const [y, m, d] = s.split('-').map(Number);
        return new Date(y, m - 1, d);
    }
    function getMondayOfWeek(dateStr) {
        const d = strToDate(dateStr);
        const dow = (d.getDay() + 6) % 7;
        d.setDate(d.getDate() - dow);
        return dateToStr(d);
    }
    function getISOWeekKey(dateStr) {
        const d = strToDate(dateStr);
        const dow = (d.getDay() + 6) % 7;
        const thu = new Date(d);
        thu.setDate(d.getDate() - dow + 3);
        const y = thu.getFullYear();
        const yearStart = new Date(y, 0, 1);
        const weekNo = Math.ceil((((thu - yearStart) / 86400000) + 1) / 7);
        return `${y}-W${String(weekNo).padStart(2, '0')}`;
    }
    function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
    function formatMonthKey(mk) {
        const [y, m] = mk.split('-').map(Number);
        return capitalize(new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
    }

    // ─── Configuration (config.js chargé avant ce script) ────────────────────
    const _CFG          = window.OPTITRAIN_CONFIG || {};
    const AFFILIATE_URL  = _CFG.affiliateUrl  || 'https://www.sncf-connect.com/app/fr-fr/information/abonnements-trajets-reguliers';
    const AFFILIATE_NAME = _CFG.affiliateName || 'SNCF Connect';

    // ─── Station search (SNCF Open Data — sans token, CORS natif) ────────────

    const SNCF_API = 'https://ressources.data.sncf.com/api/explore/v2.1/catalog/datasets/referentiel-gares-voyageurs/records';

    async function searchStationsAPI(query, signal) {
        const url = new URL(SNCF_API);
        url.searchParams.set('q', query);
        url.searchParams.set('select', 'nom_gare,gare_uic_code,commune_libellemin,departement_libellemin');
        url.searchParams.set('limit', '10');
        // Pas de order_by : le moteur de recherche Opendatasoft gère la pertinence

        const resp = await fetch(url, { signal });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();

        return (data.results || [])
            .map(r => ({
                id:   r.gare_uic_code || '',
                name: r.nom_gare      || '',
                city: capitalize((r.commune_libellemin    || '').toLowerCase()),
                dept: capitalize((r.departement_libellemin || '').toLowerCase()),
            }))
            .filter(r => r.id && r.name);
    }

    function showDropdownLoading(drop) {
        drop.innerHTML = `<div class="station-loading">
            <i class="fa-solid fa-circle-notch fa-spin"></i> Recherche…
        </div>`;
        drop.classList.add('open');
    }

    function openDropdown(drop, results, onSelect) {
        if (!results.length) {
            drop.innerHTML = '<div class="station-loading">Aucune gare trouvée</div>';
            drop.classList.add('open');
            return;
        }
        drop.innerHTML = results.map(s => `
            <div class="station-option" data-id="${s.id}">
                <span class="option-name">${s.name}</span>
                <span class="option-region">${s.city}${s.dept ? ' · ' + s.dept : ''}</span>
            </div>`).join('');
        drop.classList.add('open');
        drop.querySelectorAll('.station-option').forEach(el => {
            el.addEventListener('mousedown', e => {
                e.preventDefault();
                const station = results.find(s => s.id === el.dataset.id);
                if (station) onSelect(station);
            });
        });
    }

    function closeAllDropdowns() {
        dropFrom.classList.remove('open');
        dropTo.classList.remove('open');
    }

    // ─── Price memory (localStorage par trajet + profil) ─────────────────────

    function routeKey() {
        if (!stationFrom || !stationTo) return null;
        // Clé symétrique : même résultat A→B et B→A
        return [stationFrom.id, stationTo.id].sort().join('-');
    }

    function priceStorageKey() {
        const rk = routeKey();
        return rk ? `optitrain_route_${rk}_${profile}` : null;
    }

    function loadRoutePrices() {
        const k = priceStorageKey();
        if (!k) return null;
        try {
            const raw = localStorage.getItem(k);
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    }

    function saveRoutePrices() {
        const k = priceStorageKey();
        if (!k) return;
        const day   = parseFloat(priceDayInput.value)   || 0;
        const week  = parseFloat(priceWeekInput.value)  || 0;
        const month = parseFloat(priceMonthInput.value) || 0;
        if (!day && !week && !month) return; // rien à sauvegarder
        const payload = { day, week, month, updatedAt: dateToStr(today) };
        localStorage.setItem(k, JSON.stringify(payload));
        // Met à jour le badge sans vider les champs
        showMemoryBadge(payload.updatedAt);
    }

    function showMemoryBadge(updatedAt) {
        const d = new Date(updatedAt + 'T12:00:00');
        const label = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
        tariffStatus.className = 'tariff-status status-ok';
        tariffStatus.innerHTML = `
            <i class="fa-solid fa-floppy-disk"></i>
            Prix mémorisés · mis à jour le ${label}
            <a href="${AFFILIATE_URL}" target="_blank" rel="noopener sponsored" class="verify-link">
                Revérifier ↗
            </a>`;
    }

    function updatePriceStatus() {
        if (!stationFrom || !stationTo) {
            tariffStatus.className = 'tariff-status';
            tariffStatus.innerHTML = '';
            return;
        }

        const saved = loadRoutePrices();

        if (saved) {
            priceMonthInput.value = saved.month || '';
            priceWeekInput.value  = saved.week  || '';
            priceDayInput.value   = saved.day   || '';
            showMemoryBadge(saved.updatedAt);
            calculate();
        } else {
            // Pas de prix en mémoire → on vide les inputs et on affiche le CTA
            priceMonthInput.value = '';
            priceWeekInput.value  = '';
            priceDayInput.value   = '';

            const from = stationFrom.name;
            const to   = stationTo.name;

            tariffStatus.className = 'tariff-status status-info';
            tariffStatus.innerHTML = `
                <div class="no-price-cta">
                    <div class="no-price-label">
                        <i class="fa-solid fa-circle-info"></i>
                        Aucun prix mémorisé pour <strong>${from} → ${to}</strong> (${profileLabel()})
                    </div>
                    <a href="${AFFILIATE_URL}"
                       target="_blank" rel="noopener sponsored" class="btn-find-prices">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                        Trouver mes tarifs officiels →
                    </a>
                    <p class="no-price-hint">Saisis tes prix ci-dessus — ils seront mémorisés automatiquement.</p>
                </div>`;
            calculate(); // relance avec inputs vides
        }
    }

    function profileLabel() {
        const labels = { adult: '+26 ans', young: '−26 ans', senior: 'Senior', chomeur: "Dem. d'emploi" };
        return labels[profile] || profile;
    }

    // ─── Station selection / interaction ─────────────────────────────────────

    function selectStation(side, station) {
        if (side === 'from') {
            stationFrom           = station;
            inputFrom.value       = station.name;
            clearFromBtn.style.display = 'flex';
            dropFrom.classList.remove('open');
        } else {
            stationTo             = station;
            inputTo.value         = station.name;
            clearToBtn.style.display = 'flex';
            dropTo.classList.remove('open');
        }
        updatePriceStatus();
        saveState();
    }

    window.clearStation = function(side) {
        if (side === 'from') {
            stationFrom = null;
            inputFrom.value = '';
            clearFromBtn.style.display = 'none';
        } else {
            stationTo = null;
            inputTo.value = '';
            clearToBtn.style.display = 'none';
        }
        tariffStatus.className = 'tariff-status';
        tariffStatus.innerHTML = '';
        saveState();
    };

    window.swapStations = function() {
        [stationFrom, stationTo] = [stationTo, stationFrom];
        inputFrom.value = stationFrom ? stationFrom.name : '';
        inputTo.value   = stationTo   ? stationTo.name   : '';
        clearFromBtn.style.display = stationFrom ? 'flex' : 'none';
        clearToBtn.style.display   = stationTo   ? 'flex' : 'none';
        updatePriceStatus();
        saveState();
    };

    window.setProfile = function(p) {
        profile = p;
        ['adult', 'young', 'senior', 'chomeur'].forEach(id => {
            const btn = document.getElementById('btn' + id.charAt(0).toUpperCase() + id.slice(1));
            if (btn) btn.classList.toggle('active', id === p);
        });
        updatePriceStatus(); // recharge les prix pour ce profil
        saveState();
    };

    function apiErrorMsg(e) {
        if (window.location.protocol === 'file:') {
            return '<i class="fa-solid fa-triangle-exclamation"></i> Ouvre le site sur Netlify — la recherche nécessite une connexion.';
        }
        if (e.message && e.message.startsWith('HTTP')) {
            return '<i class="fa-solid fa-triangle-exclamation"></i> Service SNCF indisponible — réessaie dans un instant.';
        }
        return '<i class="fa-solid fa-triangle-exclamation"></i> Pas de connexion — vérifie ton réseau.';
    }

    // Input listeners avec AbortController pour annuler les requêtes obsolètes
    let debounceFrom, debounceTo;
    let abortFrom = new AbortController();
    let abortTo   = new AbortController();

    inputFrom.addEventListener('input', () => {
        stationFrom = null;
        clearFromBtn.style.display = 'none';
        tariffStatus.className = 'tariff-status';
        tariffStatus.innerHTML = '';

        clearTimeout(debounceFrom);
        abortFrom.abort();
        abortFrom = new AbortController();

        const q = inputFrom.value.trim();
        if (q.length < 2) { dropFrom.classList.remove('open'); return; }

        showDropdownLoading(dropFrom);

        debounceFrom = setTimeout(async () => {
            try {
                const results = await searchStationsAPI(q, abortFrom.signal);
                openDropdown(dropFrom, results, s => selectStation('from', s));
            } catch (e) {
                if (e.name !== 'AbortError') {
                    dropFrom.innerHTML = `<div class="station-loading">${apiErrorMsg(e)}</div>`;
                }
            }
        }, 300);
    });

    inputTo.addEventListener('input', () => {
        stationTo = null;
        clearToBtn.style.display = 'none';
        tariffStatus.className = 'tariff-status';
        tariffStatus.innerHTML = '';

        clearTimeout(debounceTo);
        abortTo.abort();
        abortTo = new AbortController();

        const q = inputTo.value.trim();
        if (q.length < 2) { dropTo.classList.remove('open'); return; }

        showDropdownLoading(dropTo);

        debounceTo = setTimeout(async () => {
            try {
                const results = await searchStationsAPI(q, abortTo.signal);
                openDropdown(dropTo, results, s => selectStation('to', s));
            } catch (e) {
                if (e.name !== 'AbortError') {
                    dropTo.innerHTML = `<div class="station-loading">${apiErrorMsg(e)}</div>`;
                }
            }
        }, 300);
    });

    inputFrom.addEventListener('blur', () => setTimeout(closeAllDropdowns, 150));
    inputTo.addEventListener('blur',   () => setTimeout(closeAllDropdowns, 150));

    // ─── Persistence (session globale) ────────────────────────────────────────
    // Note : les PRIX sont stockés par trajet+profil dans des clés séparées.
    // Ce saveState ne gère que le contexte : gares, profil, jours sélectionnés.

    function saveState() {
        localStorage.setItem('optitrain_session', JSON.stringify({
            selectedDays: Array.from(selectedDays),
            stationFrom,
            stationTo,
            profile,
        }));
    }

    function loadState() {
        try {
            const raw = localStorage.getItem('optitrain_session');
            if (!raw) return;
            const s = JSON.parse(raw);
            if (Array.isArray(s.selectedDays)) s.selectedDays.forEach(d => selectedDays.add(d));
            if (s.stationFrom) {
                stationFrom = s.stationFrom;
                inputFrom.value = stationFrom.name;
                clearFromBtn.style.display = 'flex';
            }
            if (s.stationTo) {
                stationTo = s.stationTo;
                inputTo.value = stationTo.name;
                clearToBtn.style.display = 'flex';
            }
            if (s.profile) {
                profile = s.profile;
                ['adult', 'young', 'senior', 'chomeur'].forEach(id => {
                    const btn = document.getElementById('btn' + id.charAt(0).toUpperCase() + id.slice(1));
                    if (btn) btn.classList.toggle('active', id === profile);
                });
            }
        } catch { /* ignore */ }
    }

    // ─── Auto-save des prix (1 s après saisie) ────────────────────────────────
    let autoSaveTimer;
    function onPriceChange() {
        calculate();
        if (!stationFrom || !stationTo) return;
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(saveRoutePrices, 1000);
    }

    // ─── Calendar rendering ───────────────────────────────────────────────────
    const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

    window.prevMonth = function() { viewDate.setMonth(viewDate.getMonth() - 1); renderCalendar(); };
    window.nextMonth = function() { viewDate.setMonth(viewDate.getMonth() + 1); renderCalendar(); };

    window.toggleDay = function(dateStr) {
        if (selectedDays.has(dateStr)) selectedDays.delete(dateStr);
        else selectedDays.add(dateStr);
        renderCalendar();
        calculate();
        saveState();
    };

    window.clearAll = function() {
        selectedDays.clear();
        renderCalendar();
        calculate();
        saveState();
    };

    function renderCalendar() {
        const year  = viewDate.getFullYear();
        const month = viewDate.getMonth();

        calMonthLabel.textContent = capitalize(
            new Date(year, month, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        );

        let html = '';
        DAY_LABELS.forEach(d => { html += `<div class="cal-header">${d}</div>`; });

        const firstDow    = (new Date(year, month, 1).getDay() + 6) % 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const todayStr    = dateToStr(today);

        // Jours du mois précédent
        const prevYear  = month === 0 ? year - 1 : year;
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevLast  = new Date(prevYear, prevMonth + 1, 0).getDate();
        for (let i = 0; i < firstDow; i++) {
            const d       = prevLast - firstDow + 1 + i;
            const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const isPast  = strToDate(dateStr) < today;
            const isSel   = selectedDays.has(dateStr);
            let cls = 'cal-day cal-overflow';
            if (isPast) cls += ' cal-past';
            if (isSel)  cls += ' cal-selected';
            const click = isPast ? '' : `onclick="toggleDay('${dateStr}')"`;
            html += `<div class="${cls}" ${click}>${d}</div>`;
        }

        // Jours du mois courant
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const date    = strToDate(dateStr);
            const isPast  = date < today;
            const isToday = dateStr === todayStr;
            const isSel   = selectedDays.has(dateStr);
            const isWE    = date.getDay() === 0 || date.getDay() === 6;
            let cls = 'cal-day';
            if (isPast && !isToday) cls += ' cal-past';
            if (isToday)  cls += ' cal-today';
            if (isSel)    cls += ' cal-selected';
            if (isWE && !isSel) cls += ' cal-weekend';
            const click = (isPast && !isToday) ? '' : `onclick="toggleDay('${dateStr}')"`;
            html += `<div class="${cls}" ${click}>${d}</div>`;
        }

        // Jours du mois suivant
        const nextYear  = month === 11 ? year + 1 : year;
        const nextMonth = month === 11 ? 0 : month + 1;
        const filled    = firstDow + daysInMonth;
        const trailing  = filled % 7 === 0 ? 0 : 7 - (filled % 7);
        for (let d = 1; d <= trailing; d++) {
            const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const isSel   = selectedDays.has(dateStr);
            let cls = 'cal-day cal-overflow';
            if (isSel) cls += ' cal-selected';
            html += `<div class="${cls}" onclick="toggleDay('${dateStr}')">${d}</div>`;
        }

        calGrid.innerHTML = html;

        const n = selectedDays.size;
        selectedCountEl.textContent = n > 0 ? `${n} jour${n > 1 ? 's' : ''}` : '';
        selectedCountEl.style.display = n > 0 ? 'inline' : 'none';
        clearBtn.style.display = n > 0 ? 'flex' : 'none';
    }

    // ─── SNCF Calculation ─────────────────────────────────────────────────────
    const affiliateCtaEl  = document.getElementById('affiliateCta');
    const affiliateLinkEl = document.getElementById('affiliateLink');

    function setAffiliateCta(visible) {
        if (!affiliateCtaEl || !affiliateLinkEl) return;
        if (visible) {
            affiliateLinkEl.href = AFFILIATE_URL;
            affiliateLinkEl.querySelector('.aff-name').textContent = AFFILIATE_NAME;
            affiliateCtaEl.style.display = 'block';
        } else {
            affiliateCtaEl.style.display = 'none';
        }
    }

    function calculate() {
        const P_month = parseFloat(priceMonthInput.value) || 0;
        const P_week  = parseFloat(priceWeekInput.value)  || 0;
        const P_day   = parseFloat(priceDayInput.value)   || 0;

        if (selectedDays.size === 0) {
            finalPriceEl.innerText = '—';
            recommendationEl.innerHTML = '<i class="fa-regular fa-calendar-days"></i> Sélectionne tes gares et tes jours';
            recommendationEl.style.background = 'rgba(255,255,255,0.06)';
            savingsEl.innerText = '';
            funFactEl.innerText = '';
            detailsSection.innerHTML = '';
            monthlyCostEl.innerText = P_month ? `${P_month}€` : '—';
            setAffiliateCta(false);
            return;
        }

        if (!P_day && !P_week && !P_month) {
            finalPriceEl.innerText = '—';
            recommendationEl.innerHTML = '<i class="fa-solid fa-pen"></i> Saisis tes tarifs pour voir le résultat';
            recommendationEl.style.background = 'rgba(255,255,255,0.06)';
            savingsEl.innerText = ''; funFactEl.innerText = ''; detailsSection.innerHTML = '';
            monthlyCostEl.innerText = '—';
            setAffiliateCta(false);
            return;
        }

        // Grouper par semaine ISO
        const weekMap = {};
        selectedDays.forEach(dateStr => {
            const wk = getISOWeekKey(dateStr);
            if (!weekMap[wk]) weekMap[wk] = { count: 0, monday: getMondayOfWeek(dateStr) };
            weekMap[wk].count++;
        });

        // Coût par semaine → attribuer au mois du lundi
        const monthMap = {};
        Object.entries(weekMap).forEach(([wk, { count, monday }]) => {
            const mk = monday.slice(0, 7);
            const useWeekly = P_week > 0 && P_week < count * P_day;
            const cost   = useWeekly ? P_week : count * P_day;
            const method = useWeekly ? 'Abonnement Hebdo' : count === 1 ? '1 Ticket' : `${count} Tickets`;
            if (!monthMap[mk]) monthMap[mk] = { flexCost: 0, weeks: [] };
            monthMap[mk].flexCost += cost;
            monthMap[mk].weeks.push({ wk, count, cost, method });
        });

        // Optimisation mensuelle
        let totalOptimal = 0;
        const strategy = [];
        Object.entries(monthMap).sort().forEach(([mk, { flexCost, weeks }]) => {
            const useMonthly = P_month > 0 && P_month <= flexCost;
            const optimal    = useMonthly ? P_month : flexCost;
            totalOptimal += optimal;
            strategy.push({ mk, weeks: weeks.sort((a, b) => a.wk.localeCompare(b.wk)), flexCost, useMonthly, optimal });
        });

        const numMonths    = strategy.length;
        const totalMonthly = P_month * numMonths;
        const savings      = totalMonthly - totalOptimal;

        // Affichage
        finalPriceEl.innerText = fmtEur(totalOptimal);
        monthlyCostEl.innerText = numMonths > 1 ? `${totalMonthly}€  (${numMonths} × ${P_month}€)` : `${P_month}€`;

        const allMonthly = strategy.every(m => m.useMonthly);
        const allFlex    = strategy.every(m => !m.useMonthly);
        if (allMonthly) {
            recommendationEl.innerHTML = "<i class='fa-solid fa-id-card'></i> Prends le Mensuel !";
            recommendationEl.style.background = "linear-gradient(135deg, #f59e0b, #d97706)";
            savingsEl.innerText = savings < 0 ? `Le flex te coûterait ${Math.abs(savings).toFixed(0)}€ de plus.` : '';
        } else if (allFlex) {
            recommendationEl.innerHTML = "<i class='fa-solid fa-shuffle'></i> Mix Flex (Hebdo + Tickets)";
            recommendationEl.style.background = "linear-gradient(135deg, var(--primary), var(--secondary))";
            savingsEl.innerHTML = savings > 0.5
                ? `Tu économises <span class="savings-tag">-${savings.toFixed(0)}€</span> vs Mensuel`
                : "C'est kif-kif avec le mensuel.";
        } else {
            recommendationEl.innerHTML = "<i class='fa-solid fa-code-branch'></i> Stratégie Mixte";
            recommendationEl.style.background = "linear-gradient(135deg, #6366f1, #10b981)";
            savingsEl.innerHTML = savings > 0.5 ? `Tu économises <span class="savings-tag">-${savings.toFixed(0)}€</span> au global` : '';
        }

        let html = '';
        strategy.forEach(({ mk, weeks, flexCost, useMonthly }) => {
            html += `<div class="detail-month">
                <div class="detail-month-header">
                    <span>${formatMonthKey(mk)}</span>
                    <span class="detail-month-tag ${useMonthly ? 'tag-monthly' : 'tag-flex'}">
                        ${useMonthly ? `🎫 Mensuel — ${P_month}€` : `🔀 Flex — ${flexCost}€`}
                    </span>
                </div>
                <ul class="details-list">`;
            weeks.forEach(({ wk, count, cost, method }) => {
                html += `<li class="details-item">
                    <span>Sem. ${wk.split('-W')[1]} <small style="color:var(--text-muted)">${count}j</small></span>
                    <span class="detail-method">${method} <span class="detail-cost">${cost}€</span></span>
                </li>`;
            });
            if (useMonthly) {
                html += `<li class="details-item details-saving">
                    <span>→ Flex aurait coûté : ${flexCost}€</span>
                    <span style="color:var(--accent)">Économie : ${(flexCost - P_month).toFixed(0)}€</span>
                </li>`;
            }
            html += `</ul></div>`;
        });
        html += `<div class="details-total"><span>Total Optimal</span><span>${fmtEur(totalOptimal)}</span></div>`;
        detailsSection.innerHTML = html;
        detailsSection.style.display = 'block';

        setAffiliateCta(true);
        updateFunFact(savings);
    }

    function fmtEur(n) {
        return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '€';
    }

    // ─── Fun facts ────────────────────────────────────────────────────────────
    const funFacts = [
        "C'est l'équivalent de N kebabs économisés !",
        "De quoi te payer N cafés à la machine.",
        "Tu pourrais acheter N paquets de pâtes avec ça.",
        "Investis ces économies dans le Bitcoin (ou pas).",
    ];
    function updateFunFact(savings) {
        if (savings < 5) {
            funFactEl.innerText = savings < 0 ? "Pas d'économies sur cette config." : '';
            return;
        }
        const kebabs = Math.floor(savings / 7);
        const text = funFacts[Math.floor(Math.random() * funFacts.length)].replace(/N/g, kebabs);
        funFactEl.innerText = text;
    }

    // ─── Event listeners ──────────────────────────────────────────────────────
    [priceMonthInput, priceWeekInput, priceDayInput].forEach(inp => {
        inp.addEventListener('input', onPriceChange);
    });

    // ─── Init ─────────────────────────────────────────────────────────────────
    loadState();
    renderCalendar();
    updatePriceStatus();
    calculate();
});
