// State management
let state = {
    funds: [],
    selectedScenarios: {} // fundId -> scenarioId mapping
};

let fundIdCounter = 0;
let scenarioIdCounter = 0;
let hashUpdateTimeout = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Load state from URL hash or use defaults
    if (window.location.hash) {
        loadStateFromHash();
    } else {
        // Default state
        const defaultCurve = [0, 0, 0.02, 0.05, 0.08, 0.12, 0.2, 0.35, 0.55, 0.8, 1.0];
        addFund('Fund A', 200, 20, 2, 2, [], [
            { id: 0, name: 'Base Case', grossReturnMultiple: 5 }
        ], 15, 80, 4, 1, defaultCurve, 10);
        state.selectedScenarios[0] = 0; // fund id 0, scenario id 0
    }

    // Render initial state
    renderFunds();
    renderScenarioSelectors();
    calculate();

    // Set up event listeners
    document.getElementById('addFundBtn').addEventListener('click', () => {
        const fundName = `Fund ${String.fromCharCode(65 + state.funds.length)}`;

        // Duplicate settings from the first fund (or use defaults if no funds)
        const templateFund = state.funds[0];
        if (templateFund) {
            addFund(
                fundName,
                templateFund.size,
                templateFund.carryPercent,
                templateFund.mgmtFeePercent,
                templateFund.fundCycle,
                JSON.parse(JSON.stringify(templateFund.hurdles)), // deep copy
                [{ id: scenarioIdCounter++, name: 'Base Case', grossReturnMultiple: templateFund.scenarios[0].grossReturnMultiple }],
                templateFund.numGPs,
                templateFund.carryPoolPercent,
                templateFund.vestingPeriod,
                templateFund.cliffPeriod,
                [...templateFund.realizationCurve], // copy array
                templateFund.years
            );
        } else {
            const defaultCurve = [0, 0, 0.02, 0.05, 0.08, 0.12, 0.2, 0.35, 0.55, 0.8, 1.0];
            addFund(fundName, 200, 20, 2, 2, [], [
                { id: scenarioIdCounter++, name: 'Base Case', grossReturnMultiple: 5 }
            ], 15, 80, 4, 1, defaultCurve, 10);
        }

        renderFunds();
        renderScenarioSelectors();
        calculate();
    });

    document.getElementById('shareBtn').addEventListener('click', shareLink);

    // Auto-calculate on any input change
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('calc-input') ||
            e.target.classList.contains('fund-input') ||
            e.target.classList.contains('scenario-input')) {
            updateStateFromInputs();
            calculate();
        }
    });
});

// Add a new fund
function addFund(name, size, carryPercent, mgmtFeePercent, fundCycle, hurdles, scenarios, numGPs, carryPoolPercent, vestingPeriod, cliffPeriod, realizationCurve, years) {
    const fundId = fundIdCounter++;
    const fund = {
        id: fundId,
        name,
        size,
        carryPercent,
        mgmtFeePercent,
        fundCycle,
        hurdles: hurdles || [],
        scenarios: scenarios || [
            { id: scenarioIdCounter++, name: 'Base Case', grossReturnMultiple: 5 }
        ],
        numGPs: numGPs || 15,
        carryPoolPercent: carryPoolPercent || 80,
        vestingPeriod: vestingPeriod || 4,
        cliffPeriod: cliffPeriod || 1,
        realizationCurve: realizationCurve || [0, 0, 0.02, 0.05, 0.08, 0.12, 0.2, 0.35, 0.55, 0.8, 1.0],
        years: years || 10
    };
    state.funds.push(fund);
    // Set default selected scenario to the first scenario of this fund
    state.selectedScenarios[fundId] = fund.scenarios[0].id;
    debouncedUpdateHash();
}

// Calculate IRR for a scenario
function calculateIRR(multiple, years) {
    if (years <= 0) return 0;
    const irr = Math.pow(multiple, 1 / years) - 1;
    return (irr * 100).toFixed(1);
}

// Render all funds
function renderFunds() {
    const container = document.getElementById('fundsContainer');
    container.innerHTML = '';

    state.funds.forEach((fund, fundIndex) => {
        const fundCard = document.createElement('div');
        fundCard.className = 'fund-card';
        fundCard.innerHTML = `
            <div class="fund-card-header">
                <input type="text" value="${fund.name}"
                       class="fund-input"
                       data-fund="${fund.id}"
                       data-field="name"
                       placeholder="Fund Name">
                ${fundIndex > 0 ? `<button class="btn btn-danger" onclick="removeFund(${fund.id})">Remove</button>` : ''}
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>
                        <span>Fund Size</span>
                        <span class="tooltip-icon" data-tooltip="Total fund size in millions of dollars">?</span>
                    </label>
                    <div style="position: relative;">
                        <input type="number"
                               class="fund-input"
                               data-fund="${fund.id}"
                               data-field="size"
                               value="${fund.size}"
                               min="0"
                               step="1"
                               style="padding-right: 35px;">
                        <span style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: #718096; font-size: 0.9em; pointer-events: none;">$M</span>
                    </div>
                </div>
                <div class="form-group">
                    <label>
                        <span>Carry</span>
                        <span class="tooltip-icon" data-tooltip="Base carried interest percentage before any hurdles">?</span>
                    </label>
                    <div style="position: relative;">
                        <input type="number"
                               class="fund-input"
                               data-fund="${fund.id}"
                               data-field="carryPercent"
                               value="${fund.carryPercent}"
                               min="0"
                               max="100"
                               step="0.1"
                               style="padding-right: 25px;">
                        <span style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: #718096; font-size: 0.9em; pointer-events: none;">%</span>
                    </div>
                </div>
                <div class="form-group">
                    <label>
                        <span>Fund Cycle</span>
                        <span class="tooltip-icon" data-tooltip="Years between raising each new fund (e.g., 2 years = new fund every 2 years)">?</span>
                    </label>
                    <div style="position: relative;">
                        <input type="number"
                               class="fund-input"
                               data-fund="${fund.id}"
                               data-field="fundCycle"
                               value="${fund.fundCycle}"
                               min="0.5"
                               step="0.5"
                               style="padding-right: 35px;">
                        <span style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: #718096; font-size: 0.9em; pointer-events: none;">Yrs</span>
                    </div>
                </div>
                <div class="form-group">
                    <label>
                        <span>Fund Life</span>
                        <span class="tooltip-icon" data-tooltip="Expected life of each fund in years">?</span>
                    </label>
                    <div style="position: relative;">
                        <input type="number"
                               class="fund-input"
                               data-fund="${fund.id}"
                               data-field="years"
                               value="${fund.years}"
                               min="1"
                               step="1"
                               style="padding-right: 35px;">
                        <span style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: #718096; font-size: 0.9em; pointer-events: none;">Yrs</span>
                    </div>
                </div>
            </div>

            <div class="form-grid" style="margin-top: 10px;">
                <div class="form-group">
                    <label>
                        <span># of Equal GPs</span>
                        <span class="tooltip-icon" data-tooltip="Total number of General Partners who will share the carry pool equally">?</span>
                    </label>
                    <input type="number"
                           class="fund-input"
                           data-fund="${fund.id}"
                           data-field="numGPs"
                           value="${fund.numGPs}"
                           min="1"
                           step="1">
                </div>
                <div class="form-group">
                    <label>
                        <span>Carry Pool to GPs</span>
                        <span class="tooltip-icon" data-tooltip="Percentage of total carried interest allocated to General Partners">?</span>
                    </label>
                    <div style="position: relative;">
                        <input type="number"
                               class="fund-input"
                               data-fund="${fund.id}"
                               data-field="carryPoolPercent"
                               value="${fund.carryPoolPercent}"
                               min="0"
                               max="100"
                               step="1"
                               style="padding-right: 25px;">
                        <span style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: #718096; font-size: 0.9em; pointer-events: none;">%</span>
                    </div>
                </div>
                <div class="form-group">
                    <label>
                        <span>Vesting Period</span>
                        <span class="tooltip-icon" data-tooltip="Time period over which carry vests for each fund">?</span>
                    </label>
                    <div style="position: relative;">
                        <input type="number"
                               class="fund-input"
                               data-fund="${fund.id}"
                               data-field="vestingPeriod"
                               value="${fund.vestingPeriod}"
                               min="0"
                               step="0.5"
                               style="padding-right: 35px;">
                        <span style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: #718096; font-size: 0.9em; pointer-events: none;">Yrs</span>
                    </div>
                </div>
                <div class="form-group">
                    <label>
                        <span>Cliff Period</span>
                        <span class="tooltip-icon" data-tooltip="Minimum time before any carry vests">?</span>
                    </label>
                    <div style="position: relative;">
                        <input type="number"
                               class="fund-input"
                               data-fund="${fund.id}"
                               data-field="cliffPeriod"
                               value="${fund.cliffPeriod}"
                               min="0"
                               step="0.5"
                               style="padding-right: 35px;">
                        <span style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: #718096; font-size: 0.9em; pointer-events: none;">Yrs</span>
                    </div>
                </div>
            </div>

            <div style="margin-top: 10px;">
                <div class="fund-section-header">
                    <span>Hurdles</span>
                    <span class="tooltip-icon" data-tooltip="Performance thresholds that increase carry % at higher return multiples">?</span>
                </div>
                <div id="hurdles-${fund.id}">
                    ${fund.hurdles.map((hurdle, hIndex) => `
                        <div class="hurdle-item">
                            <input type="number"
                                   placeholder="2"
                                   value="${hurdle.multiple}"
                                   data-fund="${fund.id}"
                                   data-hurdle="${hIndex}"
                                   data-field="multiple"
                                   class="fund-input"
                                   step="0.1"
                                   style="max-width: 60px;">
                            <span style="color: #718096; font-weight: 600;">x</span>
                            <span style="color: #718096;">→</span>
                            <input type="number"
                                   placeholder="25"
                                   value="${hurdle.carryPercent}"
                                   data-fund="${fund.id}"
                                   data-hurdle="${hIndex}"
                                   data-field="carryPercent"
                                   class="fund-input"
                                   step="0.1"
                                   style="max-width: 60px;">
                            <span style="color: #718096; font-size: 0.85em;">%</span>
                            <button class="btn btn-danger" onclick="removeHurdle(${fund.id}, ${hIndex})">✕</button>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-primary btn-small add-hurdle-btn" onclick="addHurdle(${fund.id})">+ Add Hurdle</button>
            </div>

            <div style="margin-top: 10px;">
                <div class="fund-section-header">
                    <span>Return Scenarios</span>
                    <span class="tooltip-icon" data-tooltip="Different return outcomes to model (e.g., base case, upside, downside)">?</span>
                </div>
                <div id="scenarios-${fund.id}">
                    ${fund.scenarios.map((scenario, sIndex) => {
                        const irr = calculateIRR(scenario.grossReturnMultiple, fund.years);
                        return `
                            <div class="scenario-card">
                                <div class="scenario-card-header">
                                    <input type="text" value="${scenario.name}"
                                           class="scenario-input"
                                           data-fund="${fund.id}"
                                           data-scenario="${scenario.id}"
                                           data-field="name"
                                           placeholder="Scenario Name">
                                    ${sIndex > 0 ? `<button class="btn btn-danger" onclick="removeScenario(${fund.id}, ${scenario.id})">✕</button>` : ''}
                                </div>
                                <div class="scenario-field">
                                    <label>Gross Return</label>
                                    <input type="number"
                                           class="scenario-input"
                                           data-fund="${fund.id}"
                                           data-scenario="${scenario.id}"
                                           data-field="grossReturnMultiple"
                                           value="${scenario.grossReturnMultiple}"
                                           min="0"
                                           step="0.1">
                                    <span style="color: #92400e; font-weight: 600;">x</span>
                                </div>
                                <div class="scenario-field">
                                    <label>Gross IRR</label>
                                    <div class="calculated">${irr}%</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                ${fund.scenarios.length < 5 ? `<button class="btn btn-primary btn-small add-hurdle-btn" onclick="addScenario(${fund.id})">+ Add Scenario</button>` : ''}
            </div>

            <div style="margin-top: 10px;">
                <div class="fund-section-header">
                    <span>Realization Curve</span>
                    <span class="tooltip-icon" data-tooltip="Pattern of when fund returns are realized over time">?</span>
                </div>
                <div class="curve-presets">
                    <button class="btn btn-small curve-preset-btn" onclick="setFundRealizationPreset(${fund.id}, 'standard')" onmouseenter="showCurvePreview(this, 'standard', ${fund.id})" onmouseleave="hideCurvePreview(this)">Standard</button>
                    <button class="btn btn-small curve-preset-btn" onclick="setFundRealizationPreset(${fund.id}, 'aggressive')" onmouseenter="showCurvePreview(this, 'aggressive', ${fund.id})" onmouseleave="hideCurvePreview(this)">Aggressive</button>
                    <button class="btn btn-small curve-preset-btn" onclick="setFundRealizationPreset(${fund.id}, 'linear')" onmouseenter="showCurvePreview(this, 'linear', ${fund.id})" onmouseleave="hideCurvePreview(this)">Linear</button>
                </div>
            </div>
        `;
        container.appendChild(fundCard);
    });
}

// Render scenario selectors
function renderScenarioSelectors() {
    const container = document.getElementById('scenarioSelectors');
    container.innerHTML = '';

    state.funds.forEach(fund => {
        const selectorDiv = document.createElement('div');
        selectorDiv.style.cssText = 'display: flex; align-items: center; gap: 8px;';

        const label = document.createElement('label');
        label.textContent = `${fund.name}:`;
        label.style.cssText = 'font-weight: 600; color: var(--text-secondary); font-size: 0.9em;';

        const select = document.createElement('select');
        select.style.cssText = 'padding: 6px 10px; border: 1.5px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.9em; background: var(--bg-primary); cursor: pointer; transition: all 0.2s;';
        select.dataset.fundId = fund.id;

        fund.scenarios.forEach(scenario => {
            const option = document.createElement('option');
            option.value = scenario.id;
            option.textContent = scenario.name;
            if (state.selectedScenarios[fund.id] === scenario.id) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        select.addEventListener('change', (e) => {
            state.selectedScenarios[fund.id] = parseInt(e.target.value);
            calculate();
            debouncedUpdateHash();
        });

        selectorDiv.appendChild(label);
        selectorDiv.appendChild(select);
        container.appendChild(selectorDiv);
    });
}

// Update state from inputs
function updateStateFromInputs() {
    // Update funds from inputs
    document.querySelectorAll('.fund-input').forEach(input => {
        const fundId = parseInt(input.dataset.fund);
        const field = input.dataset.field;
        const fund = state.funds.find(f => f.id === fundId);

        if (fund) {
            if (field === 'name') {
                fund.name = input.value;
                // Update scenario selector label
                renderScenarioSelectors();
            } else if (input.dataset.hurdle !== undefined) {
                const hurdleIndex = parseInt(input.dataset.hurdle);
                if (field === 'multiple') {
                    fund.hurdles[hurdleIndex].multiple = parseFloat(input.value);
                } else if (field === 'carryPercent') {
                    fund.hurdles[hurdleIndex].carryPercent = parseFloat(input.value);
                }
            } else {
                fund[field] = parseFloat(input.value);
                // If years changed, update all IRR displays for this fund's scenarios
                if (field === 'years') {
                    fund.scenarios.forEach(scenario => {
                        const irr = calculateIRR(scenario.grossReturnMultiple, fund.years);
                        const scenarioCard = document.querySelector(`[data-scenario="${scenario.id}"]`)?.closest('.scenario-card');
                        const irrDisplay = scenarioCard?.querySelector('.calculated');
                        if (irrDisplay) {
                            irrDisplay.textContent = `${irr}%`;
                        }
                    });
                }
            }
        }
    });

    // Update scenarios from inputs and refresh IRR displays
    document.querySelectorAll('.scenario-input').forEach(input => {
        const fundId = parseInt(input.dataset.fund);
        const scenarioId = parseInt(input.dataset.scenario);
        const field = input.dataset.field;
        const fund = state.funds.find(f => f.id === fundId);
        const scenario = fund?.scenarios.find(s => s.id === scenarioId);

        if (scenario) {
            if (field === 'name') {
                scenario.name = input.value;
                // Update scenario selector dropdown
                renderScenarioSelectors();
            } else {
                scenario[field] = parseFloat(input.value);
                // Update IRR display for this scenario
                const irr = calculateIRR(scenario.grossReturnMultiple, fund.years);
                const irrDisplay = input.closest('.scenario-card')?.querySelector('.calculated');
                if (irrDisplay) {
                    irrDisplay.textContent = `${irr}%`;
                }
            }
        }
    });

    debouncedUpdateHash();
}

// Add hurdle to fund
function addHurdle(fundId) {
    const fund = state.funds.find(f => f.id === fundId);
    if (fund) {
        fund.hurdles.push({ multiple: 2, carryPercent: 25 });
        renderFunds();
        debouncedUpdateHash();
        calculate();
    }
}

// Remove hurdle from fund
function removeHurdle(fundId, hurdleIndex) {
    const fund = state.funds.find(f => f.id === fundId);
    if (fund) {
        fund.hurdles.splice(hurdleIndex, 1);
        renderFunds();
        debouncedUpdateHash();
        calculate();
    }
}

// Add scenario to fund
function addScenario(fundId) {
    const fund = state.funds.find(f => f.id === fundId);
    if (fund && fund.scenarios.length < 5) {
        const newScenario = {
            id: scenarioIdCounter++,
            name: `Scenario ${fund.scenarios.length + 1}`,
            grossReturnMultiple: 5
        };
        fund.scenarios.push(newScenario);
        renderFunds();
        renderScenarioSelectors();
        debouncedUpdateHash();
        calculate();
    }
}

// Remove scenario from fund
function removeScenario(fundId, scenarioId) {
    const fund = state.funds.find(f => f.id === fundId);
    if (fund && fund.scenarios.length > 1) {
        fund.scenarios = fund.scenarios.filter(s => s.id !== scenarioId);

        // Update selected scenario if we deleted the active one
        if (state.selectedScenarios[fundId] === scenarioId && fund.scenarios.length > 0) {
            state.selectedScenarios[fundId] = fund.scenarios[0].id;
        }

        renderFunds();
        renderScenarioSelectors();
        debouncedUpdateHash();
        calculate();
    }
}

// Remove fund
function removeFund(fundId) {
    if (state.funds.length <= 1) return;
    state.funds = state.funds.filter(f => f.id !== fundId);

    // Remove the selected scenario entry for this fund
    delete state.selectedScenarios[fundId];

    renderFunds();
    renderScenarioSelectors();
    debouncedUpdateHash();
    calculate();
}

// Calculate carry for a fund
function calculateFundCarry(fund, returns) {
    const multiple = returns / fund.size;
    const profit = returns - fund.size;

    let carryRate = fund.carryPercent / 100;
    const sortedHurdles = [...fund.hurdles].sort((a, b) => a.multiple - b.multiple);

    for (const hurdle of sortedHurdles) {
        if (multiple >= hurdle.multiple) {
            carryRate = hurdle.carryPercent / 100;
        }
    }

    return carryRate * Math.max(0, profit);
}

// Calculate vesting - now takes fund parameters
function calculateVesting(yearsWorked, fundCycle, vestingPeriod, cliffPeriod) {
    if (yearsWorked < cliffPeriod) return 0;

    let totalVesting = 0;
    let fundStartYear = 0;
    let fundIndex = 0;

    while (fundStartYear < yearsWorked && fundIndex < 20) {
        const yearsIntoThisFund = yearsWorked - fundStartYear;
        const vestingProgress = Math.min(yearsIntoThisFund / vestingPeriod, 1);
        totalVesting += Math.max(0, vestingProgress);

        fundStartYear += fundCycle;
        fundIndex++;
    }

    return totalVesting;
}

// Calculate weighted realization - now takes fund parameters
function calculateWeightedRealization(yearsWorked, yearsFromToday, fundCycle, vestingPeriod, realizationCurve) {
    let weightedRealization = 0;
    let fundStartYear = 0;
    let fundIndex = 0;

    while (fundStartYear < yearsWorked && fundIndex < 20) {
        const yearsIntoThisFund = yearsWorked - fundStartYear;
        const vestingProgress = Math.min(yearsIntoThisFund / vestingPeriod, 1);

        if (vestingProgress > 0) {
            const yearsSinceFundStart = yearsFromToday - fundStartYear;
            const realizationPercent = getRealizationAtYear(yearsSinceFundStart, realizationCurve);
            weightedRealization += vestingProgress * realizationPercent;
        }

        fundStartYear += fundCycle;
        fundIndex++;
    }

    return weightedRealization;
}

// Get realization percentage at a given year - now takes curve parameter
function getRealizationAtYear(year, realizationCurve) {
    if (year <= 0) return 0;
    if (year >= 10) return 1;

    const index = Math.floor(year);
    const fraction = year - index;

    const r1 = realizationCurve[index] || 0;
    const r2 = realizationCurve[index + 1] || 1;

    return r1 + (r2 - r1) * fraction;
}

// Main calculation function - aggregates all funds
function calculate() {
    if (state.funds.length === 0) return;

    const maxYears = 20;
    let tableHTML = '<table><thead><tr>';
    tableHTML += '<th class="empty-corner"></th>';
    tableHTML += '<th class="years-from-today-header">Years from Today</th>';

    // Column headers (just numbers)
    for (let year = 1; year <= maxYears; year++) {
        tableHTML += `<th>${year}</th>`;
    }
    tableHTML += '</tr></thead><tbody>';

    // Rows (years worked)
    for (let yearsWorked = 1; yearsWorked <= maxYears; yearsWorked++) {
        if (yearsWorked === 1) {
            tableHTML += `<tr><th class="years-worked-header" rowspan="${maxYears}">Years<br>Worked</th>`;
        } else {
            tableHTML += '<tr>';
        }
        tableHTML += `<td>${yearsWorked}</td>`;

        for (let yearsFromToday = 1; yearsFromToday <= maxYears; yearsFromToday++) {
            if (yearsFromToday < yearsWorked) {
                tableHTML += '<td class="empty">-</td>';
            } else {
                // Aggregate carry from all funds
                let totalCarryForCell = 0;
                const fundBreakdowns = [];

                state.funds.forEach(fund => {
                    // Use selected scenario for this fund
                    const selectedScenarioId = state.selectedScenarios[fund.id];
                    const scenario = fund.scenarios.find(s => s.id === selectedScenarioId) || fund.scenarios[0];
                    if (!scenario) return;

                    // Calculate total carry pool for this fund
                    const returns = fund.size * scenario.grossReturnMultiple;
                    const carry = calculateFundCarry(fund, returns);

                    // Calculate per GP share for this fund
                    const gpPoolShare = carry * (fund.carryPoolPercent / 100);
                    const perGPShare = gpPoolShare / fund.numGPs;

                    // Calculate vintage breakdowns
                    const vintageBreakdowns = [];
                    let fundStartYear = 0;
                    let vintageIndex = 0;

                    while (fundStartYear < yearsWorked && vintageIndex < 20) {
                        const yearsIntoThisVintage = yearsWorked - fundStartYear;
                        const vestingProgress = Math.min(yearsIntoThisVintage / fund.vestingPeriod, 1);

                        if (vestingProgress > 0 && yearsIntoThisVintage >= fund.cliffPeriod) {
                            const yearsSinceVintageStart = yearsFromToday - fundStartYear;
                            const realizationPercent = getRealizationAtYear(yearsSinceVintageStart, fund.realizationCurve);
                            const vintageCarry = vestingProgress * realizationPercent * perGPShare;

                            if (vintageCarry > 0.01) {
                                vintageBreakdowns.push({
                                    vintage: vintageIndex + 1,
                                    yearsIn: Math.round(yearsIntoThisVintage * 10) / 10,
                                    realization: Math.round(realizationPercent * 100),
                                    amount: vintageCarry
                                });
                            }
                        }

                        fundStartYear += fund.fundCycle;
                        vintageIndex++;
                    }

                    const totalFundCarry = vintageBreakdowns.reduce((sum, v) => sum + v.amount, 0);

                    if (totalFundCarry > 0.01) {
                        fundBreakdowns.push({
                            name: fund.name,
                            amount: totalFundCarry,
                            vintages: vintageBreakdowns
                        });
                    }

                    totalCarryForCell += totalFundCarry;
                });

                if (totalCarryForCell > 0.01) {
                    // Encode breakdown data as JSON in data attribute
                    const breakdownData = JSON.stringify(fundBreakdowns);
                    tableHTML += `<td class="value" data-breakdown='${breakdownData.replace(/'/g, "&#39;")}' data-years-worked="${yearsWorked}" data-years-from-today="${yearsFromToday}" data-total="${totalCarryForCell.toFixed(1)}" onmouseenter="showCellTooltip(this)" onmouseleave="hideCellTooltip(this)">$${totalCarryForCell.toFixed(1)}M</td>`;
                } else {
                    tableHTML += '<td class="empty">-</td>';
                }
            }
        }

        tableHTML += '</tr>';
    }

    tableHTML += '</tbody></table>';
    document.getElementById('resultsTable').innerHTML = tableHTML;
}

// Share link functionality
function shareLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        showToast('Link copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showToast('Failed to copy link');
    });
}

// Show toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Toggle advanced settings
function toggleAdvanced() {
    const content = document.getElementById('advancedContent');
    const header = document.querySelector('.collapsible');

    if (content.style.display === 'none') {
        content.style.display = 'block';
        header.classList.add('open');
    } else {
        content.style.display = 'none';
        header.classList.remove('open');
    }
}

// Realization curve drawing and interaction
function drawCurve() {
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const topPadding = 60;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - padding - topPadding;

    ctx.clearRect(0, 0, width, height);

    // Draw title
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#667eea';
    ctx.textAlign = 'center';
    ctx.fillText('Fund Realization Curve', width / 2, 25);

    // Draw axes
    ctx.strokeStyle = '#cbd5e0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, topPadding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw grid and labels
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#718096';
    ctx.textAlign = 'center';

    for (let i = 0; i <= 10; i++) {
        const x = padding + (i / 10) * chartWidth;
        const y = height - padding;

        if (i % 2 === 0) {
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, topPadding);
            ctx.lineTo(x, y);
            ctx.stroke();

            ctx.fillText(`Y${i}`, x, y + 18);
        }
    }

    ctx.textAlign = 'right';
    ctx.font = '12px sans-serif';
    for (let i = 0; i <= 10; i += 2) {
        const y = height - padding - (i / 10) * chartHeight;

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();

        ctx.fillText(`${i * 10}%`, padding - 8, y + 4);
    }

    // Draw curve
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.beginPath();

    for (let i = 0; i <= 10; i++) {
        const x = padding + (i / 10) * chartWidth;
        const y = height - padding - (state.realizationCurve[i] || 0) * chartHeight;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();

    // Draw control points
    for (let i = 0; i <= 10; i++) {
        const x = padding + (i / 10) * chartWidth;
        const y = height - padding - (state.realizationCurve[i] || 0) * chartHeight;

        ctx.fillStyle = '#667eea';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

function handleCanvasMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const padding = 40;
    const topPadding = 60;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - padding - topPadding;

    for (let i = 0; i <= 10; i++) {
        const px = padding + (i / 10) * chartWidth;
        const py = canvas.height - padding - (state.realizationCurve[i] || 0) * chartHeight;

        const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
        if (dist < 10) {
            draggingPoint = i;
            break;
        }
    }
}

function handleCanvasMouseMove(e) {
    if (draggingPoint === null) return;

    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;

    const padding = 40;
    const topPadding = 60;
    const chartHeight = canvas.height - padding - topPadding;

    let newValue = 1 - (y - topPadding) / chartHeight;
    newValue = Math.max(0, Math.min(1, newValue));

    state.realizationCurve[draggingPoint] = newValue;

    drawCurve();
    calculate();
    debouncedUpdateHash();
}

function handleCanvasMouseUp() {
    draggingPoint = null;
}

// Preset realization curves - per fund
function setFundRealizationPreset(fundId, preset) {
    const fund = state.funds.find(f => f.id === fundId);
    if (!fund) return;

    switch (preset) {
        case 'linear':
            fund.realizationCurve = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
            break;
        case 'standard':
            fund.realizationCurve = [0, 0, 0.02, 0.05, 0.08, 0.12, 0.2, 0.35, 0.55, 0.8, 1.0];
            break;
        case 'aggressive':
            fund.realizationCurve = [0, 0.05, 0.15, 0.3, 0.5, 0.7, 0.85, 0.95, 1.0, 1.0, 1.0];
            break;
    }
    calculate();
    debouncedUpdateHash();
}

// Debounced URL hash update
function debouncedUpdateHash() {
    if (hashUpdateTimeout) {
        clearTimeout(hashUpdateTimeout);
    }
    hashUpdateTimeout = setTimeout(() => {
        updateHash();
    }, 2000);
}

// URL hash encoding/decoding
function updateHash() {
    const compressed = compressState(state);
    window.history.replaceState(null, '', '#' + compressed);
}

function compressState(state) {
    const data = {
        f: state.funds.map(f => ({
            n: f.name,
            s: f.size,
            c: f.carryPercent,
            m: f.mgmtFeePercent,
            y: f.fundCycle,
            fy: f.years,
            h: f.hurdles,
            sc: f.scenarios.map(s => ({
                n: s.name,
                g: s.grossReturnMultiple
            })),
            gps: f.numGPs,
            cp: f.carryPoolPercent,
            vp: f.vestingPeriod,
            cl: f.cliffPeriod,
            rc: f.realizationCurve
        })),
        ss: state.selectedScenarios
    };

    const json = JSON.stringify(data);
    return btoa(encodeURIComponent(json));
}

function decompressState(hash) {
    try {
        const json = decodeURIComponent(atob(hash));
        const data = JSON.parse(json);

        let maxScenarioId = 0;

        const funds = data.f.map((f, i) => {
            const scenarios = f.sc.map((s, j) => {
                maxScenarioId = Math.max(maxScenarioId, i * 100 + j + 1);
                return {
                    id: i * 100 + j,
                    name: s.n,
                    grossReturnMultiple: s.g
                };
            });

            return {
                id: i,
                name: f.n,
                size: f.s,
                carryPercent: f.c,
                mgmtFeePercent: f.m,
                fundCycle: f.y,
                hurdles: f.h,
                scenarios,
                numGPs: f.gps || 15,
                carryPoolPercent: f.cp || 80,
                vestingPeriod: f.vp || 4,
                cliffPeriod: f.cl || 1,
                realizationCurve: f.rc || [0, 0, 0.02, 0.05, 0.08, 0.12, 0.2, 0.35, 0.55, 0.8, 1.0],
                years: f.fy || 10
            };
        });

        // Restore selectedScenarios, or initialize with first scenario of each fund
        let selectedScenarios = data.ss || {};
        if (Object.keys(selectedScenarios).length === 0) {
            funds.forEach(fund => {
                selectedScenarios[fund.id] = fund.scenarios[0].id;
            });
        }

        return {
            funds,
            selectedScenarios
        };
    } catch (e) {
        console.error('Failed to decode hash:', e);
        return null;
    }
}

function loadStateFromHash() {
    const hash = window.location.hash.substring(1);
    const loadedState = decompressState(hash);

    if (loadedState) {
        state = loadedState;
        fundIdCounter = state.funds.length;
        scenarioIdCounter = Math.max(...state.funds.flatMap(f => f.scenarios.map(s => s.id))) + 1;
    }
}

// Cell tooltip functions
function showCellTooltip(cell) {
    const breakdownData = cell.dataset.breakdown;
    const yearsWorked = cell.dataset.yearsWorked;
    const yearsFromToday = cell.dataset.yearsFromToday;
    const total = cell.dataset.total;

    if (!breakdownData) return;

    const fundBreakdowns = JSON.parse(breakdownData);

    let tooltipHTML = `
        <div class="cell-tooltip" style="min-width: 300px; position: absolute; z-index: 1000;">
            <div class="tooltip-row" style="border-bottom: 2px solid rgba(255,255,255,0.4); margin-bottom: 10px; padding-bottom: 8px;">
                <span class="tooltip-label">Years Worked:</span>
                <span class="tooltip-value">${yearsWorked}</span>
            </div>
            <div class="tooltip-row" style="border-bottom: 2px solid rgba(255,255,255,0.4); margin-bottom: 12px; padding-bottom: 8px;">
                <span class="tooltip-label">Years from Today:</span>
                <span class="tooltip-value">${yearsFromToday}</span>
            </div>`;

    // Show breakdown by fund and vintage
    fundBreakdowns.forEach((fb, idx) => {
        tooltipHTML += `
            <div style="margin-bottom: 12px; ${idx > 0 ? 'margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.2);' : ''}">
                <div style="font-weight: 700; color: #a5b4fc; margin-bottom: 6px; font-size: 0.95em;">${fb.name}</div>`;

        fb.vintages.forEach(v => {
            tooltipHTML += `
                <div class="tooltip-row" style="font-size: 0.85em; margin-bottom: 4px; padding-left: 10px;">
                    <span class="tooltip-label">Vintage ${v.vintage} (${v.yearsIn}y, ${v.realization}% realized)</span>
                    <span class="tooltip-value">$${v.amount.toFixed(1)}M</span>
                </div>`;
        });

        tooltipHTML += `
                <div class="tooltip-row" style="margin-top: 6px; padding-left: 10px; font-weight: 600;">
                    <span class="tooltip-label">${fb.name} Total:</span>
                    <span class="tooltip-value">$${fb.amount.toFixed(1)}M</span>
                </div>
            </div>`;
    });

    tooltipHTML += `
            <div class="tooltip-row" style="margin-top: 12px; padding-top: 12px; border-top: 2px solid rgba(255,255,255,0.4); font-size: 1.05em;">
                <span class="tooltip-label" style="font-weight: 700;">Grand Total:</span>
                <span class="tooltip-value" style="font-weight: 700; color: #a5b4fc;">$${total}M</span>
            </div>
        </div>`;

    cell.insertAdjacentHTML('beforeend', tooltipHTML);

    // Position the tooltip to stay within viewport
    const tooltip = cell.querySelector('.cell-tooltip');
    if (tooltip) {
        const cellRect = cell.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        // Determine vertical position (above or below cell)
        const spaceBelow = viewportHeight - cellRect.bottom;
        const spaceAbove = cellRect.top;

        if (spaceBelow >= tooltipRect.height || spaceBelow > spaceAbove) {
            // Position below cell
            tooltip.style.top = '100%';
            tooltip.style.bottom = 'auto';
            tooltip.style.marginTop = '8px';
        } else {
            // Position above cell
            tooltip.style.bottom = '100%';
            tooltip.style.top = 'auto';
            tooltip.style.marginBottom = '8px';
        }

        // Determine horizontal position (centered, but adjusted if needed)
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translateX(-50%)';

        // Check if tooltip goes off screen horizontally
        const tooltipRectAfter = tooltip.getBoundingClientRect();
        if (tooltipRectAfter.left < 0) {
            // Tooltip goes off left edge
            tooltip.style.left = '0';
            tooltip.style.transform = 'translateX(0)';
        } else if (tooltipRectAfter.right > viewportWidth) {
            // Tooltip goes off right edge
            tooltip.style.left = 'auto';
            tooltip.style.right = '0';
            tooltip.style.transform = 'translateX(0)';
        }
    }
}

function hideCellTooltip(cell) {
    const tooltip = cell.querySelector('.cell-tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

// Curve preview functions
function getCurveData(preset) {
    switch (preset) {
        case 'linear':
            return [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
        case 'standard':
            return [0, 0, 0.02, 0.05, 0.08, 0.12, 0.2, 0.35, 0.55, 0.8, 1.0];
        case 'aggressive':
            return [0, 0.05, 0.15, 0.3, 0.5, 0.7, 0.85, 0.95, 1.0, 1.0, 1.0];
        default:
            return [0, 0, 0.02, 0.05, 0.08, 0.12, 0.2, 0.35, 0.55, 0.8, 1.0];
    }
}

function showCurvePreview(button, preset, fundId) {
    // Get fund years
    const fund = state.funds.find(f => f.id === fundId);
    const fundYears = fund ? fund.years : 10;

    const curve = getCurveData(preset);
    const width = 300;
    const height = 160;
    const padding = 30;
    const topPadding = 20;

    // Create tooltip with canvas
    const tooltip = document.createElement('div');
    tooltip.className = 'curve-preview-tooltip';
    const canvas = document.createElement('canvas');
    canvas.className = 'curve-preview-canvas';
    canvas.width = width;
    canvas.height = height;
    tooltip.appendChild(canvas);
    button.appendChild(tooltip);

    // Draw curve
    const ctx = canvas.getContext('2d');
    const chartWidth = width - 2 * padding;
    const chartHeight = height - padding - topPadding;

    ctx.clearRect(0, 0, width, height);

    // Draw axes
    ctx.strokeStyle = '#cbd5e0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, topPadding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw grid and labels - use fund years
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#718096';
    ctx.textAlign = 'center';

    // Determine step size for x-axis labels (show ~5 labels)
    const numLabels = 5;
    const step = Math.ceil(fundYears / numLabels);
    for (let i = 0; i <= fundYears; i += step) {
        const x = padding + (i / fundYears) * chartWidth;
        const y = height - padding;

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, topPadding);
        ctx.lineTo(x, y);
        ctx.stroke();

        ctx.fillText(`Y${i}`, x, y + 15);
    }

    ctx.textAlign = 'right';
    for (let i = 0; i <= 10; i += 5) {
        const y = height - padding - (i / 10) * chartHeight;

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();

        ctx.fillText(`${i * 10}%`, padding - 5, y + 3);
    }

    // Draw curve - map curve points to fund years
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.beginPath();

    for (let i = 0; i <= 10; i++) {
        // Map curve point i to the corresponding position in fundYears
        const yearPosition = (i / 10) * fundYears;
        const x = padding + (yearPosition / fundYears) * chartWidth;
        const y = height - padding - (curve[i] || 0) * chartHeight;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();

    // Draw control points
    for (let i = 0; i <= 10; i++) {
        const yearPosition = (i / 10) * fundYears;
        const x = padding + (yearPosition / fundYears) * chartWidth;
        const y = height - padding - (curve[i] || 0) * chartHeight;

        ctx.fillStyle = '#667eea';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Position tooltip to stay within viewport
    // Need to wait for next frame to get accurate dimensions
    requestAnimationFrame(() => {
        const tooltipRect = tooltip.getBoundingClientRect();
        const buttonRect = button.getBoundingClientRect();
        const viewportWidth = window.innerWidth;

        // Check if tooltip goes off left edge
        if (tooltipRect.left < 0) {
            // Move tooltip to align with left edge of viewport
            const offset = Math.abs(tooltipRect.left) + 10; // 10px padding from edge
            tooltip.style.left = `calc(50% + ${offset}px)`;
        } else if (tooltipRect.right > viewportWidth) {
            // Move tooltip to align with right edge of viewport
            const overflow = tooltipRect.right - viewportWidth;
            const offset = overflow + 10; // 10px padding from edge
            tooltip.style.left = `calc(50% - ${offset}px)`;
        }
    });
}

function hideCurvePreview(button) {
    const tooltip = button.querySelector('.curve-preview-tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

// Make functions globally accessible
window.removeFund = removeFund;
window.addHurdle = addHurdle;
window.removeHurdle = removeHurdle;
window.addScenario = addScenario;
window.removeScenario = removeScenario;
window.setFundRealizationPreset = setFundRealizationPreset;
window.showCellTooltip = showCellTooltip;
window.hideCellTooltip = hideCellTooltip;
window.showCurvePreview = showCurvePreview;
window.hideCurvePreview = hideCurvePreview;
