// Money Tracker Application JS - Emerald JAMstack Version

// Configuration
const SUPABASE_URL = 'https://wtkrqokdenvztpoimqao.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HfUJvh216mXGrUIw7etc5Q_Yjwl5kBO';

const { createClient } = window.supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const expenseCategories = [
    "Makanan & Minuman",
    "Belanja",
    "Tagihan",
    "Hiburan",
    "Transportasi",
    "Lainnya"
];

const incomeCategories = [
    "Gaji",
    "Pekerjaan Sampingan",
    "Investasi",
    "Hadiah / Bonus",
    "Lainnya"
];

// State variables
let currentType = 'expense';
let currentSession = null;
let isLoginMode = true;
let allTransactions = [];
let categoryChart = null;
let monthlyBudgetLimit = parseFloat(localStorage.getItem('emerald_budget_limit')) || 5000000;

// DOM Elements
const currentDayEl = document.getElementById('current-day');
const currentDateEl = document.getElementById('current-date');
const btnRunSetup = document.getElementById('btn-run-setup');
const btnClearData = document.getElementById('btn-clear-data');
const btnExportCSV = document.getElementById('btn-export-csv');
const spinnerSetup = document.getElementById('spinner-setup');
const bannerDbStatus = document.getElementById('banner-database-status');

// Card metric values
const valBalanceTotal = document.getElementById('val-balance-total');
const valIncomeMonth = document.getElementById('val-income-month');
const valSpendingMonth = document.getElementById('val-spending-month');
const valSpendingToday = document.getElementById('val-spending-today');
const valSpendingWeek = document.getElementById('val-spending-week');

// Form elements
const formTransaction = document.getElementById('form-transaction');
const inputType = document.getElementById('input-type');
const inputAmount = document.getElementById('input-amount');
const inputCategory = document.getElementById('input-category');
const inputDate = document.getElementById('input-date');
const inputDescription = document.getElementById('input-description');
const btnSubmit = document.getElementById('btn-submit');

const btnTypeExpense = document.getElementById('btn-type-expense');
const btnTypeIncome = document.getElementById('btn-type-income');

// Filter & Search elements
const filterSearch = document.getElementById('filter-search');
const filterType = document.getElementById('filter-type');
const filterCategory = document.getElementById('filter-category');

// Edit Modal elements
const modalEdit = document.getElementById('modal-edit');
const formEditTransaction = document.getElementById('form-edit-transaction');
const editId = document.getElementById('edit-id');
const editType = document.getElementById('edit-type');
const editAmount = document.getElementById('edit-amount');
const editCategory = document.getElementById('edit-category');
const editDate = document.getElementById('edit-date');
const editDescription = document.getElementById('edit-description');

// Errors
const errAmount = document.getElementById('err-amount');
const errCategory = document.getElementById('err-category');
const errDate = document.getElementById('err-date');
const errDescription = document.getElementById('err-description');

// Table elements
const tableLoader = document.getElementById('table-loader');
const tableEmpty = document.getElementById('table-empty');
const tableWrapper = document.getElementById('table-wrapper');
const tableBody = document.getElementById('table-body');
const lblTotalCount = document.getElementById('lbl-total-count');

// Auth elements
const authContainer = document.getElementById('auth-container');
const dashboardContainer = document.getElementById('dashboard-container');
const headerAuthActions = document.getElementById('header-auth-actions');
const userEmailDisplay = document.getElementById('user-email-display');
const formAuth = document.getElementById('form-auth');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const btnLogout = document.getElementById('btn-logout');

const authTitle = document.getElementById('auth-title');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authToggleText = document.getElementById('auth-toggle-text');
const authToggleLink = document.getElementById('auth-toggle-link');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    // 1. Setup date display
    const today = new Date();
    const optionsDay = { weekday: 'long', month: 'long', day: 'numeric' };
    if (currentDayEl) currentDayEl.textContent = today.toLocaleDateString('id-ID', optionsDay);
    
    const optionsDate = { year: 'numeric', month: '2-digit', day: '2-digit' };
    if (currentDateEl) currentDateEl.textContent = today.toLocaleDateString('id-ID', optionsDate);

    // 2. Set default form date & time to now
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60 * 1000;
    const localNow = new Date(now.getTime() - offsetMs);
    if (inputDate) inputDate.value = localNow.toISOString().slice(0, 16);

    // 3. Populate initial categories for Expense
    setTransactionType('expense');
    populateFilterCategories();

    // 4. Attach Listeners
    if (formTransaction) formTransaction.addEventListener('submit', handleAddTransaction);
    if (btnRunSetup) btnRunSetup.addEventListener('click', runDatabaseSetup);
    if (btnClearData) btnClearData.addEventListener('click', handleClearData);
    if (btnExportCSV) btnExportCSV.addEventListener('click', handleExportCSV);

    if (filterSearch) filterSearch.addEventListener('input', applyFilters);
    if (filterType) filterType.addEventListener('change', applyFilters);
    if (filterCategory) filterCategory.addEventListener('change', applyFilters);

    if (formEditTransaction) formEditTransaction.addEventListener('submit', handleSaveEdit);
    if (editType) editType.addEventListener('change', () => {
        populateCategoriesForSelect(editCategory, editType.value === 'expense' ? expenseCategories : incomeCategories);
    });

    if (formAuth) formAuth.addEventListener('submit', handleAuthSubmit);
    if (authToggleLink) authToggleLink.addEventListener('click', toggleAuthMode);
    if (btnLogout) btnLogout.addEventListener('click', handleLogout);

    // 5. Monitor Supabase Auth state changes
    supabaseClient.auth.onAuthStateChange((event, session) => {
        currentSession = session;
        if (session) {
            if (authContainer) authContainer.classList.add('hidden');
            if (dashboardContainer) dashboardContainer.classList.remove('hidden');
            if (headerAuthActions) headerAuthActions.classList.remove('hidden');
            
            if (userEmailDisplay) {
                userEmailDisplay.textContent = session.user.email;
                userEmailDisplay.classList.remove('hidden');
            }
            
            fetchDashboardData();
        } else {
            if (authContainer) authContainer.classList.remove('hidden');
            if (dashboardContainer) dashboardContainer.classList.add('hidden');
            if (headerAuthActions) headerAuthActions.classList.add('hidden');
            
            if (userEmailDisplay) {
                userEmailDisplay.textContent = '';
                userEmailDisplay.classList.add('hidden');
            }
            
            isLoginMode = true;
            updateAuthModeUI();

            if (authEmail) authEmail.value = '';
            if (authPassword) authPassword.value = '';
            clearValidationErrors();
        }
    });
});

// Switch Transaction Type (Expense vs Income)
function setTransactionType(type) {
    currentType = type;
    if (inputType) inputType.value = type;

    clearValidationErrors();

    if (type === 'expense') {
        if (btnTypeExpense) {
            btnTypeExpense.className = "py-2.5 px-4 rounded-xl text-sm font-semibold text-center transition-all duration-200 flex items-center justify-center gap-1.5 border border-red-500/40 bg-red-500/20 text-white shadow-lg";
            btnTypeExpense.querySelector('span').className = "w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse";
        }
        if (btnTypeIncome) {
            btnTypeIncome.className = "py-2.5 px-4 rounded-xl text-sm font-semibold text-center transition-all duration-200 flex items-center justify-center gap-1.5 border border-transparent text-gray-300 hover:text-white bg-white/5";
            btnTypeIncome.querySelector('span').className = "w-2.5 h-2.5 rounded-full bg-zinc-700";
        }
        populateCategoriesForSelect(inputCategory, expenseCategories);
    } else {
        if (btnTypeIncome) {
            btnTypeIncome.className = "py-2.5 px-4 rounded-xl text-sm font-semibold text-center transition-all duration-200 flex items-center justify-center gap-1.5 border border-emerald-500/40 bg-emerald-500/20 text-white shadow-lg";
            btnTypeIncome.querySelector('span').className = "w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse";
        }
        if (btnTypeExpense) {
            btnTypeExpense.className = "py-2.5 px-4 rounded-xl text-sm font-semibold text-center transition-all duration-200 flex items-center justify-center gap-1.5 border border-transparent text-gray-300 hover:text-white bg-white/5";
            btnTypeExpense.querySelector('span').className = "w-2.5 h-2.5 rounded-full bg-zinc-700";
        }
        populateCategoriesForSelect(inputCategory, incomeCategories);
    }
}

function populateCategoriesForSelect(selectEl, categories) {
    if (!selectEl) return;
    selectEl.innerHTML = '';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        selectEl.appendChild(option);
    });
}

function populateFilterCategories() {
    if (!filterCategory) return;
    filterCategory.innerHTML = '<option value="all">Semua Kategori</option>';
    const allCats = Array.from(new Set([...expenseCategories, ...incomeCategories]));
    allCats.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        filterCategory.appendChild(opt);
    });
}

// Fetch dashboard stats & transactions
async function fetchDashboardData() {
    if (!currentSession || !currentSession.user) {
        showLedgerState('empty');
        return;
    }
    
    showLedgerState('loading');
    
    try {
        const { data: transactions, error } = await supabaseClient
            .from('transactions')
            .select('*')
            .eq('user_id', currentSession.user.id)
            .order('date', { ascending: false });

        if (error) throw error;

        allTransactions = transactions || [];

        // Aggregations
        const today = new Date();
        let spendingToday = 0;
        let spendingWeek = 0;
        let spendingMonth = 0;
        let incomeMonth = 0;
        let totalExpenseAll = 0;
        let totalIncomeAll = 0;

        const categoryExpensesMonth = {};

        allTransactions.forEach(tx => {
            const txDate = new Date(tx.date);
            const amount = parseFloat(tx.amount) || 0;
            const isExpense = tx.type === 'expense';

            if (isExpense) {
                totalExpenseAll += amount;

                if (txDate.toDateString() === today.toDateString()) {
                    spendingToday += amount;
                }
                if (isSameWeek(txDate, today)) {
                    spendingWeek += amount;
                }
                if (txDate.getFullYear() === today.getFullYear() && txDate.getMonth() === today.getMonth()) {
                    spendingMonth += amount;
                    categoryExpensesMonth[tx.category] = (categoryExpensesMonth[tx.category] || 0) + amount;
                }
            } else {
                totalIncomeAll += amount;
                if (txDate.getFullYear() === today.getFullYear() && txDate.getMonth() === today.getMonth()) {
                    incomeMonth += amount;
                }
            }
        });

        const netBalance = totalIncomeAll - totalExpenseAll;

        // Update Metric Cards
        if (valBalanceTotal) valBalanceTotal.textContent = formatCurrency(netBalance);
        if (valIncomeMonth) valIncomeMonth.textContent = formatCurrency(incomeMonth);
        if (valSpendingMonth) valSpendingMonth.textContent = formatCurrency(spendingMonth);
        if (valSpendingToday) valSpendingToday.textContent = formatCurrency(spendingToday);
        if (valSpendingWeek) valSpendingWeek.textContent = formatCurrency(spendingWeek);

        // Update Budget Widget
        renderBudgetTracker(spendingMonth);

        // Update Category Donut Chart
        renderCategoryChart(categoryExpensesMonth);

        // Apply search/filters & render table
        applyFilters();

        if (bannerDbStatus) bannerDbStatus.classList.add('hidden');
        if (btnRunSetup) btnRunSetup.classList.remove('hidden');
        if (btnClearData) btnClearData.classList.remove('hidden');
    } catch (error) {
        console.error('Fetch dashboard failed:', error);
        showToast(error.message || 'Gagal terhubung ke Supabase. Harap periksa database Anda.', 'error');
        
        if (bannerDbStatus) bannerDbStatus.classList.remove('hidden');
        if (btnRunSetup) btnRunSetup.classList.remove('hidden');
        if (btnClearData) btnClearData.classList.add('hidden');
        showLedgerState('empty');
    }
}

// Budget Tracker Render & Settings
function renderBudgetTracker(spendingMonth) {
    const progressText = document.getElementById('budget-progress-text');
    const progressBar = document.getElementById('budget-progress-bar');
    if (!progressText || !progressBar) return;

    const percentage = monthlyBudgetLimit > 0 ? Math.min(Math.round((spendingMonth / monthlyBudgetLimit) * 100), 100) : 0;
    progressText.textContent = `${formatCurrency(spendingMonth)} / ${formatCurrency(monthlyBudgetLimit)} (${percentage}%)`;
    progressBar.style.width = `${percentage}%`;

    if (percentage >= 100) {
        progressBar.className = "h-full bg-red-500 animate-pulse transition-all duration-500 rounded-full";
    } else if (percentage >= 80) {
        progressBar.className = "h-full bg-amber-400 transition-all duration-500 rounded-full";
    } else {
        progressBar.className = "h-full bg-emerald-400 transition-all duration-500 rounded-full";
    }
}

function promptSetBudget() {
    const input = prompt('Masukkan target batas anggaran bulanan Anda (dalam Rupiah):', monthlyBudgetLimit);
    if (input !== null) {
        const val = parseFloat(input.replace(/[^0-9]/g, ''));
        if (!isNaN(val) && val > 0) {
            monthlyBudgetLimit = val;
            localStorage.setItem('emerald_budget_limit', val);
            showToast('Target anggaran bulanan berhasil diperbarui!', 'success');
            fetchDashboardData();
        } else {
            showToast('Target anggaran harus berupa angka positif.', 'error');
        }
    }
}

// Chart.js Category Breakdown Rendering
function renderCategoryChart(categoryData) {
    const canvas = document.getElementById('chart-category');
    const emptyMsg = document.getElementById('chart-empty-msg');
    if (!canvas) return;

    const labels = Object.keys(categoryData);
    const dataValues = Object.values(categoryData);

    if (labels.length === 0) {
        if (emptyMsg) emptyMsg.classList.remove('hidden');
        if (categoryChart) categoryChart.destroy();
        return;
    } else {
        if (emptyMsg) emptyMsg.classList.add('hidden');
    }

    const colors = [
        '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#6366f1'
    ];

    if (categoryChart) {
        categoryChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: colors.slice(0, labels.length),
                borderColor: 'rgba(255, 255, 255, 0.15)',
                borderWidth: 2,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#E5E7EB',
                        font: { family: 'Outfit', size: 12 },
                        padding: 14,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const val = context.parsed || 0;
                            return ` ${context.label}: ${formatCurrency(val)}`;
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });
}

// Apply Filters (Search, Type, Category)
function applyFilters() {
    const searchTerm = (filterSearch ? filterSearch.value : '').toLowerCase().trim();
    const typeVal = filterType ? filterType.value : 'all';
    const catVal = filterCategory ? filterCategory.value : 'all';

    const filtered = allTransactions.filter(tx => {
        // Search match
        const descMatch = (tx.description || '').toLowerCase().includes(searchTerm);
        const catMatchSearch = (tx.category || '').toLowerCase().includes(searchTerm);
        const amountMatch = (tx.amount || '').toString().includes(searchTerm);
        const matchesSearch = !searchTerm || descMatch || catMatchSearch || amountMatch;

        // Type match
        const matchesType = typeVal === 'all' || tx.type === typeVal;

        // Category match
        const matchesCat = catVal === 'all' || tx.category === catVal;

        return matchesSearch && matchesType && matchesCat;
    });

    renderTransactionsTable(filtered);
}

// Render Transactions Table UI
function renderTransactionsTable(list) {
    if (lblTotalCount) lblTotalCount.textContent = `${list.length} transaksi`;

    if (list.length === 0) {
        showLedgerState('empty');
    } else {
        showLedgerState('table');
        tableBody.innerHTML = '';
        list.forEach(tx => {
            const row = document.createElement('tr');
            row.className = "hover:bg-white/5 transition-colors group";
            
            const isIncome = tx.type === 'income';
            const badgeBg = isIncome ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20' : 'bg-red-500/20 text-red-300 border border-red-500/20';
            const sign = isIncome ? '+' : '-';
            const textClass = isIncome ? 'text-emerald-300 font-semibold' : 'text-zinc-200 font-medium';
            const formattedDate = formatDateString(tx.date);

            row.innerHTML = `
                <td class="py-3.5 pr-2">
                    <span class="inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${badgeBg}">
                        ${escapeHtml(tx.category)}
                    </span>
                </td>
                <td class="py-3.5 pr-2 text-xs text-gray-300 font-semibold">${formattedDate}</td>
                <td class="py-3.5 pr-2 text-xs text-gray-300 max-w-[180px] truncate hidden md:table-cell" title="${escapeHtml(tx.description || '')}">
                    ${escapeHtml(tx.description || '—')}
                </td>
                <td class="py-3.5 pr-2 text-right ${textClass}">
                    ${sign} ${formatCurrency(tx.amount)}
                </td>
                <td class="py-3.5 text-center w-[70px]">
                    <div class="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                        <button onclick="openEditModal(${tx.id})" class="p-1 text-gray-400 hover:text-emerald-300 rounded transition-colors" title="Edit Transaksi">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button onclick="handleDeleteTransaction(${tx.id})" class="p-1 text-gray-400 hover:text-red-400 rounded transition-colors" title="Hapus Transaksi">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
}

function showLedgerState(state) {
    if (state === 'loading') {
        if (tableLoader) tableLoader.classList.remove('hidden');
        if (tableEmpty) tableEmpty.classList.add('hidden');
        if (tableWrapper) tableWrapper.classList.add('hidden');
    } else if (state === 'empty') {
        if (tableLoader) tableLoader.classList.add('hidden');
        if (tableEmpty) tableEmpty.classList.remove('hidden');
        if (tableWrapper) tableWrapper.classList.add('hidden');
    } else {
        if (tableLoader) tableLoader.classList.add('hidden');
        if (tableEmpty) tableEmpty.classList.add('hidden');
        if (tableWrapper) tableWrapper.classList.remove('hidden');
    }
}

// Add Transaction Form Submission
async function handleAddTransaction(e) {
    e.preventDefault();
    clearValidationErrors();

    const originalBtnContent = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Menyimpan...
    `;

    const amount = parseFloat(inputAmount.value);
    const type = inputType.value;
    const category = inputCategory.value;
    const dateVal = inputDate.value;
    const description = inputDescription.value.trim();

    const errors = {};
    if (isNaN(amount) || amount <= 0) {
        errors.amount = 'Nominal harus berupa angka positif.';
    }
    if (!category) {
        errors.category = 'Kategori wajib diisi.';
    }
    if (!dateVal) {
        errors.date = 'Tanggal & waktu wajib diisi.';
    }

    if (Object.keys(errors).length > 0) {
        displayValidationErrors(errors);
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalBtnContent;
        return;
    }

    const formattedDate = new Date(dateVal).toISOString();

    const txData = {
        amount,
        type,
        category,
        date: formattedDate,
        description: description || null
    };

    if (currentSession && currentSession.user) {
        txData.user_id = currentSession.user.id;
    }

    try {
        const { error } = await supabaseClient
            .from('transactions')
            .insert([txData]);

        if (error) throw error;

        showToast('Transaksi berhasil ditambahkan!', 'success');
        
        inputAmount.value = '';
        inputDescription.value = '';
        
        fetchDashboardData();
    } catch (error) {
        console.error('Add transaction failed:', error);
        showToast(error.message || 'Gagal menyimpan transaksi.', 'error');
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalBtnContent;
    }
}

// Edit Modal Functions
function openEditModal(id) {
    const tx = allTransactions.find(t => t.id === id);
    if (!tx) return;

    if (editId) editId.value = tx.id;
    if (editType) editType.value = tx.type;
    if (editAmount) editAmount.value = tx.amount;
    
    // Populate categories based on type
    const categories = tx.type === 'expense' ? expenseCategories : incomeCategories;
    populateCategoriesForSelect(editCategory, categories);
    if (editCategory) editCategory.value = tx.category;

    if (editDate) {
        const dateObj = new Date(tx.date);
        const offsetMs = dateObj.getTimezoneOffset() * 60 * 1000;
        const localDate = new Date(dateObj.getTime() - offsetMs);
        editDate.value = localDate.toISOString().slice(0, 16);
    }

    if (editDescription) editDescription.value = tx.description || '';

    if (modalEdit) modalEdit.classList.remove('hidden');
}

function closeEditModal() {
    if (modalEdit) modalEdit.classList.add('hidden');
}

async function handleSaveEdit(e) {
    e.preventDefault();
    if (!editId) return;

    const id = editId.value;
    const amount = parseFloat(editAmount.value);
    const type = editType.value;
    const category = editCategory.value;
    const dateVal = editDate.value;
    const description = editDescription.value.trim();

    if (isNaN(amount) || amount <= 0 || !category || !dateVal) {
        showToast('Harap lengkapi semua kolom wajib dengan benar.', 'error');
        return;
    }

    const btnSave = document.getElementById('btn-save-edit');
    if (btnSave) btnSave.disabled = true;

    try {
        const formattedDate = new Date(dateVal).toISOString();

        const { error } = await supabaseClient
            .from('transactions')
            .update({
                amount,
                type,
                category,
                date: formattedDate,
                description: description || null
            })
            .eq('id', id)
            .eq('user_id', currentSession.user.id);

        if (error) throw error;

        showToast('Perubahan berhasil disimpan!', 'success');
        closeEditModal();
        fetchDashboardData();
    } catch (error) {
        console.error('Update transaction error:', error);
        showToast(error.message || 'Gagal menyukai transaksi.', 'error');
    } finally {
        if (btnSave) btnSave.disabled = false;
    }
}

// Delete Transaction
async function handleDeleteTransaction(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan transaksi ini secara permanen?')) {
        return;
    }

    try {
        const query = supabaseClient
            .from('transactions')
            .delete()
            .eq('id', id);

        if (currentSession && currentSession.user) {
            query.eq('user_id', currentSession.user.id);
        }

        const { error } = await query;
        if (error) throw error;

        showToast('Transaksi berhasil dihapus.', 'success');
        fetchDashboardData();
    } catch (error) {
        console.error('Delete transaction error:', error);
        showToast(error.message || 'Gagal menghapus transaksi.', 'error');
    }
}

// Export CSV Feature
function handleExportCSV() {
    if (allTransactions.length === 0) {
        showToast('Tidak ada data transaksi untuk diekspor.', 'warning');
        return;
    }

    let csvContent = "\uFEFFTanggal,Tipe,Kategori,Nominal (IDR),Deskripsi\n";

    allTransactions.forEach(tx => {
        const dateStr = formatDateString(tx.date).replace(/,/g, '');
        const typeStr = tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
        const categoryStr = `"${(tx.category || '').replace(/"/g, '""')}"`;
        const amountStr = tx.amount;
        const descStr = `"${(tx.description || '').replace(/"/g, '""')}"`;

        csvContent += `${dateStr},${typeStr},${categoryStr},${amountStr},${descStr}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Emerald_Transaksi_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('File CSV berhasil diunduh!', 'success');
}

// Automated Setup and Seeding with Dual Types (Expense + Income)
async function runDatabaseSetup() {
    if (spinnerSetup) spinnerSetup.classList.remove('hidden');
    if (btnRunSetup) btnRunSetup.disabled = true;

    try {
        showToast('Menginisialisasi data contoh, mohon tunggu...', 'warning');

        const today = new Date();
        const formatOffsetDate = (daysAgo, timeStr) => {
            const d = new Date();
            d.setDate(today.getDate() - daysAgo);
            const [hh, mm, ss] = timeStr.split(':');
            d.setHours(hh, mm, ss || 0, 0);
            return d.toISOString();
        };

        const mockTransactions = [
            {
                amount: 8500000.00,
                type: 'income',
                category: 'Gaji',
                date: formatOffsetDate(12, '09:00:00'),
                description: 'Gaji Bulanan Pekerjaan Utama'
            },
            {
                amount: 1200000.00,
                type: 'income',
                category: 'Pekerjaan Sampingan',
                date: formatOffsetDate(8, '14:30:00'),
                description: 'Proyek Desain Web Freelance'
            },
            {
                amount: 3500000.00,
                type: 'expense',
                category: 'Tagihan',
                date: formatOffsetDate(10, '10:30:00'),
                description: 'Biaya sewa apartemen bulanan'
            },
            {
                amount: 120000.00,
                type: 'expense',
                category: 'Makanan & Minuman',
                date: formatOffsetDate(5, '13:15:00'),
                description: 'Makan siang di Restoran Sushi'
            },
            {
                amount: 450000.00,
                type: 'expense',
                category: 'Belanja',
                date: formatOffsetDate(3, '18:20:00'),
                description: 'Pembelian mouse ergonomis & mousepad'
            },
            {
                amount: 186000.00,
                type: 'expense',
                category: 'Hiburan',
                date: formatOffsetDate(1, '20:00:00'),
                description: 'Langganan Netflix Premium'
            },
            {
                amount: 350000.00,
                type: 'expense',
                category: 'Makanan & Minuman',
                date: formatOffsetDate(0, '11:30:00'),
                description: 'Belanja bahan makanan mingguan di supermarket'
            }
        ];

        const userId = currentSession && currentSession.user ? currentSession.user.id : null;
        const mockTransactionsWithUser = mockTransactions.map(tx => {
            const newTx = { ...tx };
            if (userId) newTx.user_id = userId;
            return newTx;
        });

        const { error } = await supabaseClient
            .from('transactions')
            .insert(mockTransactionsWithUser);

        if (error) throw error;

        showToast('Basis data berhasil diisi dengan data simulasi!', 'success');
        if (bannerDbStatus) bannerDbStatus.classList.add('hidden');
        fetchDashboardData();
    } catch (error) {
        console.error('Database setup failed:', error);
        showToast(error.message || 'Skrip inisialisasi basis data gagal.', 'error');
    } finally {
        if (spinnerSetup) spinnerSetup.classList.add('hidden');
        if (btnRunSetup) btnRunSetup.disabled = false;
    }
}

// Helpers & Validation
function displayValidationErrors(errors) {
    if (errors.amount && errAmount) {
        errAmount.textContent = errors.amount;
        errAmount.classList.remove('hidden');
        inputAmount.classList.add('border-red-400/50');
    }
    if (errors.category && errCategory) {
        errCategory.textContent = errors.category;
        errCategory.classList.remove('hidden');
        inputCategory.classList.add('border-red-400/50');
    }
    if (errors.date && errDate) {
        errDate.textContent = errors.date;
        errDate.classList.remove('hidden');
        inputDate.classList.add('border-red-400/50');
    }
}

function clearValidationErrors() {
    const errorContainers = [errAmount, errCategory, errDate, errDescription];
    errorContainers.forEach(container => {
        if (container) {
            container.textContent = '';
            container.classList.add('hidden');
        }
    });

    const inputs = [inputAmount, inputCategory, inputDate, inputDescription];
    inputs.forEach(input => {
        if (input) input.classList.remove('border-red-400/50');
    });
}

function formatCurrency(amount) {
    const formatted = new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(Math.abs(amount));
    
    return (amount < 0 ? '- Rp ' : 'Rp ') + formatted;
}

function formatDateString(dateStr) {
    if (!dateStr) return '';
    let normalized = dateStr;
    if (typeof normalized === 'string' && !normalized.endsWith('Z') && !normalized.includes('+', 10) && !normalized.includes('-', 10)) {
        normalized = normalized.replace(' ', 'T') + 'Z';
    }
    const dateObj = new Date(normalized);
    if (isNaN(dateObj.getTime())) return dateStr;
    
    return dateObj.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).replace(':', '.');
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast-enter max-w-sm w-full bg-white/20 border border-white/30 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.3)] rounded-2xl p-4 flex items-start gap-3 pointer-events-auto transition-all duration-300';
    
    let iconColor = 'text-emerald-300 bg-emerald-500/20';
    let iconSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    `;

    if (type === 'error') {
        iconColor = 'text-red-300 bg-red-500/20';
        iconSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        `;
    } else if (type === 'warning') {
        iconColor = 'text-amber-300 bg-amber-500/20';
        iconSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        `;
    }

    toast.innerHTML = `
        <div class="p-1.5 rounded-lg ${iconColor} flex-shrink-0">
            ${iconSvg}
        </div>
        <div class="flex-1">
            <p class="text-xs font-semibold text-white leading-relaxed">${escapeHtml(message)}</p>
        </div>
        <button onclick="this.parentElement.remove()" class="text-gray-300 hover:text-white transition-colors p-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
    }, 4500);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

async function handleClearData() {
    if (!confirm('Apakah Anda yakin ingin mengosongkan semua data transaksi? Tindakan ini tidak dapat dibatalkan.')) {
        return;
    }

    try {
        showToast('Mengosongkan data...', 'warning');
        const query = supabaseClient.from('transactions').delete();

        if (currentSession && currentSession.user) {
            query.eq('user_id', currentSession.user.id);
        } else {
            query.neq('id', 0);
        }

        const { error } = await query;
        if (error) throw error;

        showToast('Semua data transaksi berhasil dikosongkan.', 'success');
        fetchDashboardData();
    } catch (error) {
        console.error('Clear data error:', error);
        showToast(error.message || 'Gagal mengosongkan data.', 'error');
    }
}

function isSameWeek(txDate, refDate) {
    const refDay = refDate.getDay();
    const diffToMonday = refDay === 0 ? -6 : 1 - refDay;
    const monday = new Date(refDate);
    monday.setDate(refDate.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return txDate >= monday && txDate <= sunday;
}

// Authentication Handlers
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    updateAuthModeUI();
    clearValidationErrors();
}

function updateAuthModeUI() {
    if (!authTitle || !authSubmitBtn || !authToggleText || !authToggleLink) return;

    if (isLoginMode) {
        authTitle.textContent = "Masuk ke Emerald";
        authSubmitBtn.textContent = "Masuk";
        authToggleText.textContent = "Belum punya akun?";
        authToggleLink.textContent = "Daftar di sini";
    } else {
        authTitle.textContent = "Daftar Akun Baru";
        authSubmitBtn.textContent = "Daftar";
        authToggleText.textContent = "Sudah punya akun?";
        authToggleLink.textContent = "Masuk di sini";
    }
}

async function handleAuthSubmit(e) {
    if (e) e.preventDefault();
    clearValidationErrors();

    if (!authEmail || !authPassword) return;
    
    const email = authEmail.value.trim();
    const password = authPassword.value;
    
    if (!email || !password) {
        showToast('Email dan password wajib diisi.', 'error');
        return;
    }

    if (!isLoginMode && password.length < 6) {
        showToast('Password minimal harus 6 karakter.', 'error');
        return;
    }
    
    const originalBtnText = authSubmitBtn ? authSubmitBtn.innerHTML : (isLoginMode ? 'Masuk' : 'Daftar');
    if (authSubmitBtn) {
        authSubmitBtn.disabled = true;
        authSubmitBtn.innerHTML = 'Memproses...';
    }
    
    try {
        if (isLoginMode) {
            const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) throw error;
            showToast('Berhasil masuk!', 'success');
        } else {
            const { data, error } = await supabaseClient.auth.signUp({ email, password });
            if (error) throw error;
            
            if (data.user && data.session === null) {
                showToast('Pendaftaran berhasil! Silakan konfirmasi pendaftaran melalui email Anda.', 'warning');
            } else {
                showToast('Pendaftaran berhasil! Anda telah otomatis masuk.', 'success');
            }
        }
    } catch (error) {
        console.error('Authentication error:', error);
        showToast(error.message || 'Gagal memproses permintaan Anda.', 'error');
    } finally {
        if (authSubmitBtn) {
            authSubmitBtn.disabled = false;
            authSubmitBtn.innerHTML = originalBtnText;
        }
    }
}

async function handleLogout() {
    if (!confirm('Apakah Anda yakin ingin keluar dari aplikasi?')) {
        return;
    }
    
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        showToast('Berhasil keluar.', 'success');
    } catch (error) {
        console.error('Logout error:', error);
        showToast(error.message || 'Gagal keluar dari aplikasi.', 'error');
    }
}