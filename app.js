// --- STATE & INITIALIZATION ---
let transactions = [];
let initialSavings = 10000;
let activePersonFilter = null; // Store active filter for people directory

// DOM Elements
const totalSavingsEl = document.getElementById('total-savings-val');
const totalSentEl = document.getElementById('total-sent-val');
const remainingBalanceEl = document.getElementById('remaining-balance-val');

const txForm = document.getElementById('tx-form');
const inputName = document.getElementById('input-name');
const inputAmount = document.getElementById('input-amount');
const inputDate = document.getElementById('input-date');

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

// Backup elements
const exportBtn = document.getElementById('export-btn');
const importBtnTrigger = document.getElementById('import-btn-trigger');
const importFileInput = document.getElementById('import-file-input');

// Load Data from LocalStorage on Startup
function loadData() {
  const storedSavings = localStorage.getItem('mf_initial_savings');
  if (storedSavings !== null) {
    initialSavings = parseFloat(storedSavings);
  } else {
    // Save default initial savings if not present
    localStorage.setItem('mf_initial_savings', initialSavings.toString());
  }

  const storedTx = localStorage.getItem('mf_transactions');
  if (storedTx !== null) {
    transactions = JSON.parse(storedTx);
  }
}

// Save Data to LocalStorage
function saveData() {
  localStorage.setItem('mf_initial_savings', initialSavings.toString());
  localStorage.setItem('mf_transactions', JSON.stringify(transactions));
}

// Currency Formatter Utility
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

// Set Default Date to Today
function setDefaultDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  inputDate.value = `${year}-${month}-${day}`;
}

// --- CALCULATION & RENDERING ---

function calculateAndRender() {
  // 1. Calculate Totals
  const totalSent = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const remainingBalance = initialSavings - totalSent;

  // 2. Render Cards
  totalSavingsEl.textContent = formatCurrency(initialSavings);
  totalSentEl.textContent = formatCurrency(totalSent);
  remainingBalanceEl.textContent = formatCurrency(remainingBalance);

  // Apply visual warning class if balance is negative or zero
  if (remainingBalance < 0) {
    remainingBalanceEl.className = 'card-value red';
  } else {
    remainingBalanceEl.className = 'card-value green';
  }

  // 3. Render People Directory
  renderPeopleDirectory();

  // 4. Render Transaction List
  renderTransactionList();
}

// Build list of unique people paid
function renderPeopleDirectory() {
  peopleListContainer.innerHTML = '';
  
  if (transactions.length === 0) {
    peopleSection.style.display = 'none';
    return;
  }

  peopleSection.style.display = 'block';

  // Calculate totals spent per person
  const totalsPerPerson = {};
  transactions.forEach(tx => {
    // Normalize name to handle capitalization mismatches
    const normalName = tx.name.trim();
    totalsPerPerson[normalName] = (totalsPerPerson[normalName] || 0) + tx.amount;
  });

  // Create a chip for "All Transactions" to clear filters
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

  // Add individual people chips
  Object.keys(totalsPerPerson).forEach(name => {
    const chip = document.createElement('div');
    const isActive = activePersonFilter === name;
    chip.className = `people-chip ${isActive ? 'active' : ''}`;
    chip.innerHTML = `
      <h4>${name}</h4>
      <span>Paid ${formatCurrency(totalsPerPerson[name])}</span>
    `;
    chip.addEventListener('click', () => {
      activePersonFilter = isActive ? null : name; // Toggle filter on click
      calculateAndRender();
    });
    peopleListContainer.appendChild(chip);
  });
}

// Render list of transactions with filtering
function renderTransactionList() {
  txListContainer.innerHTML = '';

  const searchQuery = searchBar.value.trim().toLowerCase();
  
  // Apply search query and people filters
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

  // Sort transactions by date (most recent first), then by insertion
  filteredTx.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (filteredTx.length === 0) {
    txListContainer.innerHTML = `
      <div class="empty-state">
        <p>${transactions.length === 0 ? "No transaction records saved yet." : "No matching records found."}</p>
      </div>
    `;
    return;
  }

  filteredTx.forEach(tx => {
    const item = document.createElement('div');
    item.className = 'tx-item';
    
    // Format date beautifully
    const formattedDate = new Date(tx.date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    item.innerHTML = `
      <div class="tx-info">
        <div class="tx-name">${escapeHTML(tx.name)}</div>
        <div class="tx-meta">
          <span class="tx-category">${escapeHTML(tx.category)}</span>
          <span>•</span>
          <span>${formattedDate}</span>
        </div>
      </div>
      <div class="tx-right">
        <div class="tx-amount">-${formatCurrency(tx.amount)}</div>
        <button class="btn-delete" title="Delete record" data-id="${tx.id}">
          <!-- Trash Can SVG -->
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
      </div>
    `;

    // Attach delete button handler
    const deleteBtn = item.querySelector('.btn-delete');
    deleteBtn.addEventListener('click', (e) => {
      const txId = e.currentTarget.getAttribute('data-id');
      deleteTransaction(txId);
    });

    txListContainer.appendChild(item);
  });
}

// Simple HTML escaping to prevent XSS injection
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
  
  // Find selected category radio
  const checkedRadio = document.querySelector('input[name="category"]:checked');
  const categoryValue = checkedRadio ? checkedRadio.value : 'Other';

  if (!nameValue || isNaN(amountValue) || !dateValue) return;

  const newTx = {
    id: Date.now().toString(), // unique timestamp ID
    name: nameValue,
    amount: amountValue,
    date: dateValue,
    category: categoryValue
  };

  transactions.push(newTx);
  saveData();
  calculateAndRender();

  // Reset name and amount fields
  inputName.value = '';
  inputAmount.value = '';
  setDefaultDate();
  
  // Focus back on name field for easy sequential typing
  inputName.focus();
});

// Delete a transaction
function deleteTransaction(id) {
  const targetTx = transactions.find(t => t.id === id);
  if (!targetTx) return;

  // Simple warning check (Memory friendly text)
  const confirmMsg = `Delete this transaction record?\n\nPaid: ${targetTx.name}\nAmount: -${formatCurrency(targetTx.amount)}\nDate: ${targetTx.date}`;
  if (confirm(confirmMsg)) {
    transactions = transactions.filter(t => t.id !== id);
    saveData();
    calculateAndRender();
  }
}

// Search bar keydown
searchBar.addEventListener('input', () => {
  renderTransactionList();
});

// --- SETTINGS MODAL DIALOG ---

openSettingsBtn.addEventListener('click', () => {
  savingsBudgetInput.value = initialSavings;
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
  if (!isNaN(newBudget) && newBudget >= 0) {
    initialSavings = newBudget;
    saveData();
    calculateAndRender();
    closeSettings();
  }
});

// --- EXPORT & IMPORT BACKUP SYSTEM ---

// Export transactions to JSON file
exportBtn.addEventListener('click', () => {
  const dataStr = JSON.stringify({
    initialSavings: initialSavings,
    transactions: transactions
  }, null, 2);
  
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const tempLink = document.createElement('a');
  tempLink.href = url;
  
  // File name format with current date
  const dateStr = new Date().toISOString().split('T')[0];
  tempLink.download = `memofinance_backup_${dateStr}.json`;
  
  document.body.appendChild(tempLink);
  tempLink.click();
  document.body.removeChild(tempLink);
  URL.revokeObjectURL(url);
});

// Import transactions from JSON file
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
      
      // Simple verification check
      if ('initialSavings' in parsedData && Array.isArray(parsedData.transactions)) {
        initialSavings = parseFloat(parsedData.initialSavings);
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
  
  // Reset file input value so same file can be selected again
  importFileInput.value = '';
});

// --- MAIN RUN ON PAGE LOAD ---
loadData();
setDefaultDate();
calculateAndRender();
