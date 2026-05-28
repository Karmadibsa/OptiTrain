document.addEventListener('DOMContentLoaded', () => {

    // ─── State ────────────────────────────────────────────────────────────────
    let selectedDays = new Set(); // Set of 'YYYY-MM-DD' strings

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // First day of the currently displayed month
    let viewDate = new Date(today.getFullYear(), today.getMonth(), 1);

    // ─── DOM refs ─────────────────────────────────────────────────────────────
    const calGrid         = document.getElementById('calendarGrid');
    const calMonthLabel   = document.getElementById('calMonthLabel');
    const selectedCountEl = document.getElementById('selectedCount');
    const clearBtn        = document.getElementById('clearBtn');
    const priceMonthInput = document.getElementById('priceMonth');
    const priceWeekInput  = document.getElementById('priceWeek');
    const priceDayInput   = document.getElementById('priceDay');
    const finalPriceEl    = document.getElementById('finalPrice');
    const recommendationEl = document.getElementById('recommendationText');
    const monthlyCostEl   = document.getElementById('monthlyCostDisplay');
    const savingsEl       = document.getElementById('savingsText');
    const funFactEl       = document.getElementById('funFact');
    const detailsSection  = document.getElementById('detailsSection');

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

    // Returns 'YYYY-MM-DD' of the Monday of the week containing dateStr
    function getMondayOfWeek(dateStr) {
        const d = strToDate(dateStr);
        const dow = (d.getDay() + 6) % 7; // 0=Mon … 6=Sun
        d.setDate(d.getDate() - dow);
        return dateToStr(d);
    }

    // ISO 8601 week key: 'YYYY-Www'
    function getISOWeekKey(dateStr) {
        const d = strToDate(dateStr);
        const dow = (d.getDay() + 6) % 7;
        const thu = new Date(d);
        thu.setDate(d.getDate() - dow + 3); // Thursday of the ISO week
        const y = thu.getFullYear();
        const yearStart = new Date(y, 0, 1);
        const weekNo = Math.ceil((((thu - yearStart) / 86400000) + 1) / 7);
        return `${y}-W${String(weekNo).padStart(2, '0')}`;
    }

    function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    function formatMonthKey(mk) {
        const [y, m] = mk.split('-').map(Number);
        return capitalize(
            new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        );
    }

    // ─── Persistence ──────────────────────────────────────────────────────────
    function saveState() {
        localStorage.setItem('optitrain_data', JSON.stringify({
            selectedDays: Array.from(selectedDays),
            prices: {
                month: priceMonthInput.value,
                week:  priceWeekInput.value,
                day:   priceDayInput.value,
            }
        }));
    }

    function loadState() {
        try {
            const saved = localStorage.getItem('optitrain_data');
            if (!saved) return;
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed.selectedDays)) {
                parsed.selectedDays.forEach(d => selectedDays.add(d));
            }
            if (parsed.prices) {
                if (parsed.prices.month) priceMonthInput.value = parsed.prices.month;
                if (parsed.prices.week)  priceWeekInput.value  = parsed.prices.week;
                if (parsed.prices.day)   priceDayInput.value   = parsed.prices.day;
            }
        } catch (e) { /* ignore corrupt storage */ }
    }

    // ─── Calendar rendering ───────────────────────────────────────────────────
    const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

    window.prevMonth = function () {
        viewDate.setMonth(viewDate.getMonth() - 1);
        renderCalendar();
    };

    window.nextMonth = function () {
        viewDate.setMonth(viewDate.getMonth() + 1);
        renderCalendar();
    };

    window.toggleDay = function (dateStr) {
        if (selectedDays.has(dateStr)) selectedDays.delete(dateStr);
        else selectedDays.add(dateStr);
        renderCalendar();
        calculate();
    };

    window.clearAll = function () {
        selectedDays.clear();
        renderCalendar();
        calculate();
    };

    function renderCalendar() {
        const year  = viewDate.getFullYear();
        const month = viewDate.getMonth();

        calMonthLabel.textContent = capitalize(
            new Date(year, month, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        );

        // Header row
        let html = '';
        DAY_LABELS.forEach(d => { html += `<div class="cal-header">${d}</div>`; });

        const firstDow    = (new Date(year, month, 1).getDay() + 6) % 7; // 0=Mon
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const todayStr    = dateToStr(today);

        // ── Leading overflow: last days of the previous month ──────────────
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

        // ── Current month ──────────────────────────────────────────────────
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

        // ── Trailing overflow: first days of next month to fill the row ────
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

        // Count badge & clear button
        const n = selectedDays.size;
        selectedCountEl.textContent = n > 0 ? `${n} jour${n > 1 ? 's' : ''}` : '';
        selectedCountEl.style.display = n > 0 ? 'inline' : 'none';
        clearBtn.style.display = n > 0 ? 'flex' : 'none';
    }

    // ─── SNCF Calculation ─────────────────────────────────────────────────────
    //
    // Rules applied:
    //   • Per real ISO week (Mon→Sun): if weekly pass < days×day_price → buy weekly
    //   • Each ISO week is attributed to the calendar month of its Monday
    //   • Per calendar month: if monthly pass ≤ sum of weekly/daily costs → buy monthly
    //   • Total = sum of optimal cost per month
    //
    function calculate() {
        const P_month = parseFloat(priceMonthInput.value) || 0;
        const P_week  = parseFloat(priceWeekInput.value)  || 0;
        const P_day   = parseFloat(priceDayInput.value)   || 0;

        if (selectedDays.size === 0) {
            finalPriceEl.innerText = '—';
            recommendationEl.innerHTML = '<i class="fa-regular fa-calendar-days"></i> Clique sur tes jours sur site';
            recommendationEl.style.background = 'rgba(255,255,255,0.06)';
            savingsEl.innerText = '';
            funFactEl.innerText = '';
            detailsSection.innerHTML = '';
            monthlyCostEl.innerText = `${P_month}€`;
            return;
        }

        // Step 1 — Group selected days by ISO week
        const weekMap = {}; // weekKey → { count, monday }
        selectedDays.forEach(dateStr => {
            const wk = getISOWeekKey(dateStr);
            if (!weekMap[wk]) weekMap[wk] = { count: 0, monday: getMondayOfWeek(dateStr) };
            weekMap[wk].count++;
        });

        // Step 2 — Compute cost per week, bucket into the month of each week's Monday
        const monthMap = {}; // 'YYYY-MM' → { flexCost, weeks[] }
        Object.entries(weekMap).forEach(([wk, { count, monday }]) => {
            const monthKey = monday.slice(0, 7); // 'YYYY-MM'
            const useWeekly = P_week > 0 && P_week < count * P_day;
            const cost   = useWeekly ? P_week : count * P_day;
            const method = useWeekly
                ? 'Abonnement Hebdo'
                : count === 1 ? '1 Ticket journée' : `${count} Tickets journée`;

            if (!monthMap[monthKey]) monthMap[monthKey] = { flexCost: 0, weeks: [] };
            monthMap[monthKey].flexCost += cost;
            monthMap[monthKey].weeks.push({ wk, count, cost, method });
        });

        // Step 3 — Per-month: flex vs mensuel
        let totalOptimal = 0;
        const strategy = [];

        Object.entries(monthMap).sort().forEach(([mk, { flexCost, weeks }]) => {
            const useMonthly = P_month > 0 && P_month <= flexCost;
            const optimal    = useMonthly ? P_month : flexCost;
            totalOptimal += optimal;
            strategy.push({
                mk,
                weeks: weeks.sort((a, b) => a.wk.localeCompare(b.wk)),
                flexCost,
                useMonthly,
                optimal,
            });
        });

        const numMonths    = strategy.length;
        const totalMonthly = P_month * numMonths;
        const savings      = totalMonthly - totalOptimal;

        // ── Update result panel ───────────────────────────────────────────────
        finalPriceEl.innerText = fmtEur(totalOptimal);

        monthlyCostEl.innerText = numMonths > 1
            ? `${totalMonthly}€  (${numMonths} × ${P_month}€)`
            : `${P_month}€`;

        // Recommendation badge
        const allMonthly = strategy.every(m => m.useMonthly);
        const allFlex    = strategy.every(m => !m.useMonthly);

        if (allMonthly) {
            recommendationEl.innerHTML = "<i class='fa-solid fa-id-card'></i> Prends le Mensuel !";
            recommendationEl.style.background = "linear-gradient(135deg, #f59e0b, #d97706)";
            savingsEl.innerText = savings < 0
                ? `Le flex te coûterait ${Math.abs(savings).toFixed(0)}€ de plus.`
                : '';
        } else if (allFlex) {
            recommendationEl.innerHTML = "<i class='fa-solid fa-shuffle'></i> Mix Flex (Hebdo + Tickets)";
            recommendationEl.style.background = "linear-gradient(135deg, var(--primary), var(--secondary))";
            savingsEl.innerHTML = savings > 0.5
                ? `Tu économises <span class="savings-tag">-${savings.toFixed(0)}€</span> vs Mensuel`
                : "C'est kif-kif avec le mensuel.";
        } else {
            recommendationEl.innerHTML = "<i class='fa-solid fa-code-branch'></i> Stratégie Mixte";
            recommendationEl.style.background = "linear-gradient(135deg, #6366f1, #10b981)";
            savingsEl.innerHTML = savings > 0.5
                ? `Tu économises <span class="savings-tag">-${savings.toFixed(0)}€</span> au global`
                : '';
        }

        // Detailed breakdown
        let html = '';
        strategy.forEach(({ mk, weeks, flexCost, useMonthly, optimal }) => {
            html += `
            <div class="detail-month">
                <div class="detail-month-header">
                    <span>${formatMonthKey(mk)}</span>
                    <span class="detail-month-tag ${useMonthly ? 'tag-monthly' : 'tag-flex'}">
                        ${useMonthly ? `🎫 Mensuel — ${P_month}€` : `🔀 Flex — ${flexCost}€`}
                    </span>
                </div>
                <ul class="details-list">`;

            weeks.forEach(({ wk, count, cost, method }) => {
                const weekNum = wk.split('-W')[1];
                html += `
                <li class="details-item">
                    <span>Sem. ${weekNum} &nbsp;<small style="color:var(--text-muted)">${count}j</small></span>
                    <span class="detail-method">${method} <span class="detail-cost">${cost}€</span></span>
                </li>`;
            });

            if (useMonthly) {
                html += `
                <li class="details-item details-saving">
                    <span>→ Flex aurait coûté : ${flexCost}€</span>
                    <span style="color:var(--accent)">Économie : ${(flexCost - P_month).toFixed(0)}€</span>
                </li>`;
            }

            html += `</ul></div>`;
        });

        html += `
        <div class="details-total">
            <span>Total Optimal</span>
            <span>${fmtEur(totalOptimal)}</span>
        </div>`;

        detailsSection.innerHTML = html;
        detailsSection.style.display = 'block';

        updateFunFact(savings);
        saveState();
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
        "C'est N% de ton loyer (si tu vis dans une boîte à chaussures).",
    ];

    function updateFunFact(savings) {
        if (savings < 5) {
            funFactEl.innerText = savings < 0
                ? "Pas d'économies sur cette config, c'est la vie."
                : "Pas de grosses économies, mais c'est le principe qui compte.";
            return;
        }
        const kebabs = Math.floor(savings / 7);
        const idx = Math.floor(Math.random() * funFacts.length);
        let text = funFacts[idx].replace(/N/g, kebabs);
        if (text.includes('Bitcoin')) text = `Investis ces ${Math.round(savings)}€ dans le Shiba Inu (non conseil financier).`;
        if (text.includes('%')) text = text.replace(/(\d+)%/, Math.round((savings / 500) * 100) + '%');
        funFactEl.innerText = text;
    }

    // ─── Event listeners ──────────────────────────────────────────────────────
    [priceMonthInput, priceWeekInput, priceDayInput].forEach(inp => {
        inp.addEventListener('input', calculate);
    });

    // ─── Init ─────────────────────────────────────────────────────────────────
    loadState();
    renderCalendar();
    calculate();
});
