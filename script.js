document.addEventListener('DOMContentLoaded', () => {
    // State
    let weeks = [5, 2, 0, 3]; // Default: 4 weeks

    // DOM Elements
    const weeksContainer = document.getElementById('weeksContainer');
    const priceMonthInput = document.getElementById('priceMonth');
    const priceWeekInput = document.getElementById('priceWeek');
    const priceDayInput = document.getElementById('priceDay');
    
    // Output Elements
    const finalPriceEl = document.getElementById('finalPrice');
    const recommendationEl = document.getElementById('recommendationText');
    const monthlyCostEl = document.getElementById('monthlyCostDisplay');
    const savingsEl = document.getElementById('savingsText');
    const funFactEl = document.getElementById('funFact');
    const detailsSection = document.getElementById('detailsSection');

    // Fun facts database
    const funFacts = [
        "C'est l'équivalent de N kebabs économisés !",
        "De quoi te payer N cafés à la machine.",
        "Tu pourrais acheter N paquets de pâtes avec ça.",
        "Investis ces économies dans le Bitcoin (ou pas).",
        "C'est N% de ton loyer (si tu vis dans une boîte à chaussures)."
    ];

    // Persistence
    function saveState() {
        const state = {
            weeks: weeks,
            prices: {
                month: priceMonthInput.value,
                week: priceWeekInput.value,
                day: priceDayInput.value
            }
        };
        localStorage.setItem('optitrain_data', JSON.stringify(state));
    }

    function loadState() {
        const saved = localStorage.getItem('optitrain_data');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.weeks && Array.isArray(parsed.weeks)) weeks = parsed.weeks;
                if (parsed.prices) {
                    if(parsed.prices.month) priceMonthInput.value = parsed.prices.month;
                    if(parsed.prices.week) priceWeekInput.value = parsed.prices.week;
                    if(parsed.prices.day) priceDayInput.value = parsed.prices.day;
                }
            } catch (e) { console.error("Could not load state", e); }
        }
    }

    // Core Logic
    window.renderWeeks = function() {
        weeksContainer.innerHTML = '';
        weeks.forEach((days, index) => {
            const row = document.createElement('div');
            row.className = 'week-row';
            row.innerHTML = `
                <span>Semaine ${index + 1}</span>
                <div class="week-controls">
                    <button class="btn-circle" onclick="updateDays(${index}, -1)" aria-label="Diminuer jours"><i class="fa-solid fa-minus"></i></button>
                    <span class="days-count" style="color: ${getDayColor(days)}">${days}j</span>
                    <button class="btn-circle" onclick="updateDays(${index}, 1)" aria-label="Augmenter jours"><i class="fa-solid fa-plus"></i></button>
                    <button class="btn-circle btn-delete" onclick="removeWeek(${index})" aria-label="Supprimer semaine"><i class="fa-solid fa-trash" style="font-size:0.7rem"></i></button>
                </div>
            `;
            weeksContainer.appendChild(row);
        });
        calculate();
    }

    function getDayColor(d) {
        if(d === 0) return '#94a3b8';
        if(d === 1) return '#facc15'; // Yellow
        if(d >= 2) return '#10b981'; // Green (Worth a weekly sub)
        return '#fff';
    }

    window.updateDays = function(index, change) {
        let newVal = weeks[index] + change;
        if (newVal < 0) newVal = 0;
        if (newVal > 7) newVal = 7;
        weeks[index] = newVal;
        renderWeeks();
    }

    window.addWeek = function() {
        weeks.push(0);
        renderWeeks();
    }

    window.removeWeek = function(index) {
        weeks.splice(index, 1);
        renderWeeks();
    }

    function calculate() {
        const P_month = parseFloat(priceMonthInput.value) || 0;
        const P_week = parseFloat(priceWeekInput.value) || 0;
        const P_day = parseFloat(priceDayInput.value) || 0;

        let optimizedTotal = 0;
        let strategyDetails = [];

        weeks.forEach((days, index) => {
            let cost, method;
            // Business Logic: Weekly sub if >= 2 days, else Daily tickets
            if (days >= 2) {
                cost = P_week;
                method = "Hebdo";
            } else {
                cost = (days * P_day);
                method = (days === 0) ? "Aucun" : `${days}x Ticket`;
            }
            optimizedTotal += cost;
            strategyDetails.push({ week: index + 1, days, cost, method });
        });

        // Compare with monthly
        const takeMonthly = P_month < optimizedTotal;
        const bestPrice = Math.min(P_month, optimizedTotal);
        const savings = Math.abs(P_month - optimizedTotal);

        // Update UI Text
        monthlyCostEl.innerText = P_month + "€";
        finalPriceEl.innerText = bestPrice + "€";
        
        updateRecommendation(takeMonthly, savings, P_month, optimizedTotal);
        updateDetails(strategyDetails, optimizedTotal, P_month, takeMonthly);
        
        saveState();
    }

    function updateRecommendation(takeMonthly, savings, P_month, totalFlex) {
        if (takeMonthly) {
            recommendationEl.innerHTML = "<i class='fa-solid fa-id-card'></i> Prends le Mensuel !";
            recommendationEl.style.background = "linear-gradient(135deg, #f59e0b, #d97706)"; // Amber/Orange
            savingsEl.innerText = `L'option flexible te coûterait ${Math.round(savings)}€ de plus.`;
            updateFunFact(0); 
        } else {
            recommendationEl.innerHTML = "<i class='fa-solid fa-shuffle'></i> Mix Flex (Hebdo + Tickets)";
            recommendationEl.style.background = "linear-gradient(135deg, var(--primary), var(--secondary))";
            if(savings > 0) {
                savingsEl.innerHTML = `Tu économises <span class="savings-tag">-${Math.round(savings)}€</span> vs Mensuel`;
                updateFunFact(savings);
            } else {
                savingsEl.innerText = "C'est kif-kif avec le mensuel.";
                updateFunFact(0);
            }
        }
    }

    function updateDetails(strategies, totalFlex, P_month, takeMonthly) {
        let html = '<ul class="details-list">';
        
        strategies.forEach(item => {
            const isWeekly = item.method === 'Hebdo';
            html += `
                <li class="details-item">
                    <span>Sem. ${item.week} <small style="color:var(--text-muted)">(${item.days}j)</small></span>
                    <span style="color:${isWeekly ? 'var(--primary)' : 'var(--text-muted)'}">
                        ${item.method} (${item.cost}€)
                    </span>
                </li>`;
        });

        html += `
            <li class="details-total">
                <span>Total Flex</span>
                <span>${totalFlex}€</span>
            </li>
        </ul>`;

        if (takeMonthly) {
            html += `<p class="details-summary" style="color:#f59e0b;">
                ⚠️ Le mensuel (${P_month}€) est plus avantageux cette fois ci.
            </p>`;
        } else {
            html += `<p class="details-summary" style="color:var(--accent);">
                ✅ Le mix flex est la meilleure option.
            </p>`;
        }

        detailsSection.innerHTML = html;
        // Ensure it is visible by default (CSS handles basics, but just to be safe)
        detailsSection.style.display = 'block'; 
    }

    function updateFunFact(savings) {
        if (savings < 5) {
            funFactEl.innerText = "Pas de grosses économies, mais c'est le principe qui compte.";
            return;
        }
        const kebabs = Math.floor(savings / 7); 
        const randomIndex = Math.floor(Math.random() * funFacts.length);
        let text = funFacts[randomIndex].replace('N', kebabs);
        
        if (text.includes("Bitcoin")) text = "Investis ces " + Math.round(savings) + "€ dans le Shiba Inu (non conseil financier).";
        if (text.includes("N%")) {
            const percentage = Math.round((savings / 500) * 100); // Dummy rent 500
            text = text.replace('N%', percentage + "%");
        }
        
        funFactEl.innerText = text;
    }

    // Event Listeners
    [priceMonthInput, priceWeekInput, priceDayInput].forEach(inp => {
        inp.addEventListener('input', calculate);
    });

    // Initialize
    loadState();
    renderWeeks();
});
