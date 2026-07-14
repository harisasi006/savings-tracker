// --- STATE & INITIALIZATION ---
let transactions = [];
let initialSavings = 10000;
let monthlyLimit = 5000; // Default monthly spending limit
let activePersonFilter = null; // Store active filter for people directory
let currentTxType = 'sent'; // 'sent' = debit, 'received' = credit
let collapsedMonths = {}; // Keeps track of collapsed month categories

// DOM Elements
const totalSavingsEl = document.getElementById('total-savings-val');
const totalReceivedEl = document.getElementById('total-received-val');
const totalSentEl = document.getElementById('total-sent-val');
const remainingBalanceEl = document.getElementById('remaining-balance-val');

// Warning banner elements
const alertBanner = document.getElementById('alert-banner');
const alertBannerText = document.getElementById('alert-banner-text');

// Form inputs
const txForm = document.getElementById('tx-form');
const inputName = document.getElementById('input-name');
const inputAmount = document.getElementById('input-amount');
const inputDate = document.getElementById('input-date');
const inputCustomCategory = document.getElementById('input-custom-category');

// Labels and buttons to change dynamically
const labelName = document.getElementById('label-name');
const labelAmount = document.getElementById('label-amount');
const submitBtn = document.getElementById('submit-btn');

// Toggle buttons
const toggleSentBtn = document.getElementById('toggle-sent');
const toggleReceivedBtn = document.getElementById('toggle-received');

const peopleSection = document.getElementById('people-section');
const peopleListContainer = document.getElementById('people-list-container');

const searchBar = document.getElementById('search-bar');
const txListContainer = document.getElementById('tx-list-container');

// Settings Modal elements
const settingsModal = document.getElementById('settings-modal');
const openSettingsBtn = document.getElementById('open-settings-btn');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const settingsForm = document.getElementById('settings-form');
const savingsBudgetInput = document.getElementById('savings-budget-input');
const monthlyLimitInput = document.getElementById('monthly-limit-input');
const resetDbBtn = document.getElementById('reset-db-btn');

// Backup & PDF elements
const exportBtn = document.getElementById('export-btn');
const importBtnTrigger = document.getElementById('import-btn-trigger');
const importFileInput = document.getElementById('import-file-input');
const printPdfBtn = document.getElementById('print-pdf-btn');

// Color Palette for Categories
const categoryColors = {
  'Loan/Repayment': '#818cf8',  // Indigo
  'Gift/Help': '#fb7185',       // Rose
  'Food/Groceries': '#fbbf24',  // Amber
  'Shopping': '#38bdf8',       // Sky
  'Medical': '#f87171',        // Red
  'Other': '#a1a1aa'           // Zinc
};

// Returns a stable, distinct color based on the category name
function getCategoryColor(category) {
  if (categoryColors[category]) {
    return categoryColors[category];
  }
  // Generate a stable color based on string hashing (for custom categories)
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Keep hue between 0-360, saturation at 65%, and lightness at 60% for neon aesthetic
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 65%, 60%)`;
}

// Load Data from LocalStorage on Startup
function loadData() {
  const storedSavings = localStorage.getItem('mf_initial_savings');
  if (storedSavings !== null) {
    initialSavings = parseFloat(storedSavings);
  }

  const storedLimit = localStorage.getItem('mf_monthly_limit');
  if (storedLimit !== null) {
    monthlyLimit = parseFloat(storedLimit);
  } else {
    localStorage.setItem('mf_monthly_limit', monthlyLimit.toString());
  }

  const storedTx = localStorage.getItem('mf_transactions');
  if (storedTx !== null) {
    transactions = JSON.parse(storedTx);
  }
}

// Save Data to LocalStorage
function saveData() {
  localStorage.setItem('mf_initial_savings', initialSavings.toString());
  localStorage.setItem('mf_monthly_limit', monthlyLimit.toString());
  localStorage.setItem('mf_transactions', JSON.stringify(transactions));
}

// Currency Formatter Utility
function formatCurrency(amount) {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(absAmount);
  return isNegative ? `-${formatted}` : formatted;
}

// Set Default Date to Today
function setDefaultDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  inputDate.value = `${year}-${month}-${day}`;
}

// --- TOGGLE LOGIC (Sent vs Received) ---
if (toggleSentBtn && toggleReceivedBtn) {
  toggleSentBtn.addEventListener('click', () => {
    currentTxType = 'sent';
    toggleSentBtn.classList.add('active');
    toggleReceivedBtn.classList.remove('active');
    
    labelName.textContent = "Who did you pay? (Person Name)";
    labelAmount.textContent = "Amount Sent (₹)";
    submitBtn.textContent = "Save Payment Record";
    submitBtn.style.background = "linear-gradient(135deg, var(--color-red), var(--color-orange))";
  });

  toggleReceivedBtn.addEventListener('click', () => {
    currentTxType = 'received';
    toggleReceivedBtn.classList.add('active');
    toggleSentBtn.classList.remove('active');
    
    labelName.textContent = "Who paid you? (Person Name)";
    labelAmount.textContent = "Amount Received (₹)";
    submitBtn.textContent = "Save Credit Record";
    submitBtn.style.background = "linear-gradient(135deg, var(--color-green), #00b0ff)";
  });
}

// --- CATEGORY CHANGE LOGIC ---
const categoryRadios = document.querySelectorAll('input[name="category"]');
categoryRadios.forEach(radio => {
  radio.addEventListener('change', (e) => {
    if (e.target.value === 'Other') {
      inputCustomCategory.style.display = 'block';
      inputCustomCategory.focus();
    } else {
      inputCustomCategory.style.display = 'none';
      inputCustomCategory.value = '';
    }
  });
});

// --- CALCULATION & RENDERING ---

function calculateAndRender() {
  // 1. Calculate Totals
  let totalSent = 0;
  let totalReceived = 0;
  let currentMonthSpent = 0;

  const currentYearMonth = new Date().toISOString().slice(0, 7); // Format: "YYYY-MM"

  transactions.forEach(tx => {
    const type = tx.type || 'sent';
    const txAmount = tx.amount;

    if (type === 'sent') {
      totalSent += txAmount;
      // Calculate current month's expenses
      if (tx.date && tx.date.slice(0, 7) === currentYearMonth) {
        currentMonthSpent += txAmount;
      }
    } else {
      totalReceived += txAmount;
    }
  });

  const remainingBalance = initialSavings + totalReceived - totalSent;

  // 2. Render Warning Alert Banner if limit is exceeded
  if (currentMonthSpent > monthlyLimit && monthlyLimit > 0) {
    alertBanner.style.display = 'flex';
    alertBannerText.innerHTML = `⚠️ <b>Monthly Warning:</b> You spent <b>${formatCurrency(currentMonthSpent)}</b> this month, exceeding your limit of <b>${formatCurrency(monthlyLimit)}</b>!`;
  } else {
    alertBanner.style.display = 'none';
  }

  // 3. Render Cards
  totalSavingsEl.textContent = formatCurrency(initialSavings);
  totalReceivedEl.textContent = formatCurrency(totalReceived);
  totalSentEl.textContent = formatCurrency(totalSent);
  remainingBalanceEl.textContent = formatCurrency(remainingBalance);

  if (remainingBalance < 0) {
    remainingBalanceEl.className = 'card-value red';
  } else {
    remainingBalanceEl.className = 'card-value green';
  }

  // 4. Draw Donut Chart Slices & Legend
  drawCategoryDonutChart();

  // 5. Render People Directory
  renderPeopleDirectory();

  // 6. Render Transaction List
  renderTransactionList();
}

// --- CANVAS CATEGORY DONUT CHART ---
function drawCategoryDonutChart() {
  const canvas = document.getElementById('chart-canvas');
  const legendContainer = document.getElementById('chart-legend');
  if (!canvas || !legendContainer) return;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Filter spending categories
  const spendingsByCategory = {};
  let totalSpending = 0;

  transactions.forEach(tx => {
    const type = tx.type || 'sent';
    if (type === 'sent') {
      spendingsByCategory[tx.category] = (spendingsByCategory[tx.category] || 0) + tx.amount;
      totalSpending += tx.amount;
    }
  });

  legendContainer.innerHTML = '';

  if (totalSpending === 0) {
    // Render placeholder circle if no spending
    ctx.beginPath();
    ctx.arc(70, 70, 50, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 18;
    ctx.stroke();
    legendContainer.innerHTML = '<span class="legend-item">No spending recorded.</span>';
    return;
  }

  let startAngle = -0.5 * Math.PI; // Start at top center

  Object.keys(spendingsByCategory).forEach(category => {
    const amount = spendingsByCategory[category];
    const percentage = (amount / totalSpending);
    const sliceAngle = percentage * 2 * Math.PI;

    // Draw Arc Slice
    ctx.beginPath();
    ctx.arc(70, 70, 50, startAngle, startAngle + sliceAngle);
    ctx.strokeStyle = getCategoryColor(category);
    ctx.lineWidth = 18;
    ctx.lineCap = 'butt';
    ctx.stroke();

    startAngle += sliceAngle;

    // Render legend item
    const legendItem = document.createElement('div');
    legendItem.className = 'legend-item';
    legendItem.innerHTML = `
      <span class="legend-dot" style="background-color: ${getCategoryColor(category)};"></span>
      <span>${category} (${Math.round(percentage * 100)}%)</span>
    `;
    legendContainer.appendChild(legendItem);
  });
}

// --- PEOPLE DIRECTORY FILTERS ---
function renderPeopleDirectory() {
  peopleListContainer.innerHTML = '';
  
  if (transactions.length === 0) {
    peopleSection.style.display = 'none';
    return;
  }

  peopleSection.style.display = 'block';

  // Calculate net balances per person
  const netPerPerson = {};
  transactions.forEach(tx => {
    const normalName = tx.name.trim();
    const type = tx.type || 'sent';
    const modifier = type === 'sent' ? 1 : -1;
    netPerPerson[normalName] = (netPerPerson[normalName] || 0) + (tx.amount * modifier);
  });

  // "Show All" chip
  const allChip = document.createElement('div');
  allChip.className = `people-chip ${activePersonFilter === null ? 'active' : ''}`;
  allChip.innerHTML = `
    <h4>Show All</h4>
    <span>${transactions.length} items</span>
  `;
  allChip.addEventListener('click', () => {
    activePersonFilter = null;
    calculateAndRender();
  });
  peopleListContainer.appendChild(allChip);

  // Individual chips
  Object.keys(netPerPerson).forEach(name => {
    const chip = document.createElement('div');
    const isActive = activePersonFilter === name;
    chip.className = `people-chip ${isActive ? 'active' : ''}`;
    
    const balanceVal = netPerPerson[name];
    let label = '';
    
    if (balanceVal > 0) {
      label = `Paid ${formatCurrency(balanceVal)}`;
    } else if (balanceVal < 0) {
      label = `Recv ${formatCurrency(Math.abs(balanceVal))}`;
    } else {
      label = `Settled (₹0)`;
    }

    chip.innerHTML = `
      <h4>${name}</h4>
      <span class="${balanceVal < 0 ? 'green' : ''}">${label}</span>
    `;
    chip.addEventListener('click', () => {
      activePersonFilter = isActive ? null : name;
      calculateAndRender();
    });
    peopleListContainer.appendChild(chip);
  });
}

// --- COLLAPSIBLE MONTH-GROUPED LISTS ---
function renderTransactionList() {
  txListContainer.innerHTML = '';

  const searchQuery = searchBar.value.trim().toLowerCase();
  
  // Filter transactions
  let filteredTx = transactions;

  if (activePersonFilter) {
    filteredTx = filteredTx.filter(tx => tx.name.trim().toLowerCase() === activePersonFilter.toLowerCase());
  }

  if (searchQuery) {
    filteredTx = filteredTx.filter(tx => 
      tx.name.toLowerCase().includes(searchQuery) ||
      tx.category.toLowerCase().includes(searchQuery)
    );
  }

  if (filteredTx.length === 0) {
    txListContainer.innerHTML = `
      <div class="empty-state">
        <p>${transactions.length === 0 ? "No transaction records saved yet." : "No matching records found."}</p>
      </div>
    `;
    return;
  }

  // Group transactions by calendar month "YYYY-MM"
  const grouped = {};
  filteredTx.forEach(tx => {
    // Default to today if date is missing
    const dateStr = tx.date || new Date().toISOString().slice(0, 10);
    const yearMonth = dateStr.slice(0, 7); // "YYYY-MM"
    if (!grouped[yearMonth]) {
      grouped[yearMonth] = [];
    }
    grouped[yearMonth].push(tx);
  });

  // Sort months descending (newest month first)
  const sortedMonths = Object.keys(grouped).sort().reverse();

  sortedMonths.forEach(monthKey => {
    const monthTxList = grouped[monthKey];
    
    // Calculate total spent and received for this specific month
    let monthSpent = 0;
    let monthReceived = 0;

    monthTxList.forEach(tx => {
      const type = tx.type || 'sent';
      if (type === 'sent') {
        monthSpent += tx.amount;
      } else {
        monthReceived += tx.amount;
      }
    });

    // Format Month title (e.g. "July 2026")
    const dateObj = new Date(monthKey + "-02"); // Add offset to avoid timezone shifts
    const monthNameFormatted = dateObj.toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric'
    });

    // Create Month Group Container
    const monthGroup = document.createElement('div');
    const isCollapsed = collapsedMonths[monthKey] === true;
    monthGroup.className = `month-group ${isCollapsed ? 'collapsed' : ''}`;
    monthGroup.setAttribute('data-month', monthKey);

    monthGroup.innerHTML = `
      <div class="month-header">
        <h3>${monthNameFormatted}</h3>
        <div class="month-header-info">
          ${monthSpent > 0 ? `<span class="spent">Sent: ${formatCurrency(monthSpent)}</span>` : ''}
          ${monthReceived > 0 ? `<span class="recv">Recv: ${formatCurrency(monthReceived)}</span>` : ''}
          <div class="month-chevron">
            <!-- Chevron Down Icon -->
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>
      </div>
      <div class="month-content"></div>
    `;

    const monthContent = monthGroup.querySelector('.month-content');

    // Add list row items to month content container
    // Sort transactions inside month (newest day first)
    monthTxList.sort((a, b) => new Date(b.date) - new Date(a.date));

    monthTxList.forEach(tx => {
      const item = document.createElement('div');
      item.className = 'tx-item';

      const type = tx.type || 'sent';
      const formattedDay = new Date(tx.date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short'
      });

      const isReceived = type === 'received';
      const sign = isReceived ? '+' : '-';
      const amountClass = isReceived ? 'tx-amount green' : 'tx-amount red';

      item.innerHTML = `
        <div class="tx-info">
          <div class="tx-name">${escapeHTML(tx.name)}</div>
          <div class="tx-meta">
            <span class="tx-category">${escapeHTML(tx.category)}</span>
            <span>•</span>
            <span>${formattedDay}</span>
          </div>
        </div>
        <div class="tx-right">
          <div class="${amountClass}">${sign}${formatCurrency(tx.amount)}</div>
          <button class="btn-delete" title="Delete record" data-id="${tx.id}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
      `;

      const deleteBtn = item.querySelector('.btn-delete');
      deleteBtn.addEventListener('click', (e) => {
        const txId = e.currentTarget.getAttribute('data-id');
        deleteTransaction(txId);
      });

      monthContent.appendChild(item);
    });

    // Toggle collapse handler
    const mHeader = monthGroup.querySelector('.month-header');
    mHeader.addEventListener('click', () => {
      const collapsed = monthGroup.classList.toggle('collapsed');
      collapsedMonths[monthKey] = collapsed; // Save collapsed state locally in session
    });

    txListContainer.appendChild(monthGroup);
  });
}

function escapeHTML(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// --- ACTION METHODS ---

// Add a transaction
txForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const nameValue = inputName.value.trim();
  const amountValue = parseFloat(inputAmount.value);
  const dateValue = inputDate.value;
  
  const checkedRadio = document.querySelector('input[name="category"]:checked');
  let categoryValue = checkedRadio ? checkedRadio.value : 'Other';

  if (categoryValue === 'Other') {
    const customVal = inputCustomCategory.value.trim();
    categoryValue = customVal !== '' ? customVal : 'Other';
  }

  if (!nameValue || isNaN(amountValue) || !dateValue) return;

  const newTx = {
    id: Date.now().toString(),
    name: nameValue,
    amount: amountValue,
    date: dateValue,
    category: categoryValue,
    type: currentTxType
  };

  transactions.push(newTx);
  saveData();
  calculateAndRender();

  // Reset fields
  inputName.value = '';
  inputAmount.value = '';
  inputCustomCategory.value = '';
  inputCustomCategory.style.display = 'none';
  setDefaultDate();
  
  inputName.focus();
});

// Delete a transaction
function deleteTransaction(id) {
  const targetTx = transactions.find(t => t.id === id);
  if (!targetTx) return;

  const type = targetTx.type || 'sent';
  const label = type === 'sent' ? 'Sent to' : 'Received from';

  const confirmMsg = `Delete this transaction record?\n\n${label}: ${targetTx.name}\nAmount: ${type === 'sent' ? '-' : '+'}${formatCurrency(targetTx.amount)}\nDate: ${targetTx.date}`;
  if (confirm(confirmMsg)) {
    transactions = transactions.filter(t => t.id !== id);
    saveData();
    calculateAndRender();
  }
}

// Search input handler
searchBar.addEventListener('input', () => {
  renderTransactionList();
});

// --- SETTINGS MODAL DIALOG ---

openSettingsBtn.addEventListener('click', () => {
  savingsBudgetInput.value = initialSavings;
  monthlyLimitInput.value = monthlyLimit;
  settingsModal.style.display = 'flex';
  savingsBudgetInput.focus();
});

function closeSettings() {
  settingsModal.style.display = 'none';
}

closeSettingsBtn.addEventListener('click', closeSettings);

settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) {
    closeSettings();
  }
});

settingsForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const newBudget = parseFloat(savingsBudgetInput.value);
  const newLimit = parseFloat(monthlyLimitInput.value);

  if (!isNaN(newBudget) && newBudget >= 0) {
    initialSavings = newBudget;
  }
  if (!isNaN(newLimit) && newLimit >= 0) {
    monthlyLimit = newLimit;
  }

  saveData();
  calculateAndRender();
  closeSettings();
});

// --- RESET DATABASE SAFETY LOCK ---
if (resetDbBtn) {
  resetDbBtn.addEventListener('click', () => {
    // Safety verification prompt
    const typedConfirm = prompt("⚠️ WARNING: This will permanently delete ALL your transaction records and reset your budget.\n\nTo confirm, type the word RESET below:");
    if (typedConfirm === 'RESET') {
      localStorage.clear();
      transactions = [];
      initialSavings = 10000;
      monthlyLimit = 5000;
      collapsedMonths = {};
      saveData();
      calculateAndRender();
      closeSettings();
      alert('All database tables cleared successfully!');
    } else if (typedConfirm !== null) {
      alert('Reset cancelled. Confirmation word did not match.');
    }
  });
}

// --- EXPORT & IMPORT BACKUP SYSTEM ---

exportBtn.addEventListener('click', () => {
  const dataStr = JSON.stringify({
    initialSavings: initialSavings,
    monthlyLimit: monthlyLimit,
    transactions: transactions
  }, null, 2);
  
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const tempLink = document.createElement('a');
  tempLink.href = url;
  
  const dateStr = new Date().toISOString().split('T')[0];
  tempLink.download = `memofinance_backup_${dateStr}.json`;
  
  document.body.appendChild(tempLink);
  tempLink.click();
  document.body.removeChild(tempLink);
  URL.revokeObjectURL(url);
});

importBtnTrigger.addEventListener('click', () => {
  importFileInput.click();
});

importFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const parsedData = JSON.parse(evt.target.result);
      
      if ('initialSavings' in parsedData && Array.isArray(parsedData.transactions)) {
        initialSavings = parseFloat(parsedData.initialSavings);
        if ('monthlyLimit' in parsedData) {
          monthlyLimit = parseFloat(parsedData.monthlyLimit);
        }
        transactions = parsedData.transactions;
        
        saveData();
        calculateAndRender();
        alert('Backup restored successfully!');
      } else {
        alert('Invalid backup file structure.');
      }
    } catch (err) {
      alert('Failed to read the backup file: Invalid JSON format.');
    }
  };
  reader.readAsText(file);
  
  importFileInput.value = '';
});

// --- PRINT PDF REPORT TRIGGER ---
if (printPdfBtn) {
  printPdfBtn.addEventListener('click', () => {
    // Open all collapsed month sections before printing to ensure all rows display in the PDF
    Object.keys(collapsedMonths).forEach(monthKey => {
      collapsedMonths[monthKey] = false;
    });
    calculateAndRender();
    
    // Trigger browser printing window
    window.print();
  });
}

// --- MAIN RUN ON PAGE LOAD ---
loadData();
setDefaultDate();
calculateAndRender();
