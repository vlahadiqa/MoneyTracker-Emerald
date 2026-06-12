// Money Tracker Application JS

// Configuration
const API_STATS = 'api/get_dashboard_data.php';
const API_ADD = 'api/add_transaction.php';
const API_DELETE = 'api/delete_transaction.php';
const API_SETUP = 'setup.php';

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
    "Lainnya"
];

// State variables
let currentType = 'expense';

// DOM Elements
const currentDayEl = document.getElementById('current-day');
const currentDateEl = document.getElementById('current-date');
const btnRunSetup = document.getElementById('btn-run-setup');
const btnClearData = document.getElementById('btn-clear-data');
const spinnerSetup = document.getElementById('spinner-setup');
const bannerDbStatus = document.getElementById('banner-database-status');

// Card values
const valSpendingToday = document.getElementById('val-spending-today');
const valSpendingWeek = document.getElementById('val-spending-week');
const valSpendingMonth = document.getElementById('val-spending-month');

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

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    // 1. Setup today's date displays
    const today = new Date();
    
    // Formatting date (e.g., Jumat, 12 Juni)
    const optionsDay = { weekday: 'long', month: 'long', day: 'numeric' };
    currentDayEl.textContent = today.toLocaleDateString('id-ID', optionsDay);
    
    // Formatting numerical date (e.g., 12/06/2026)
    const optionsDate = { year: 'numeric', month: '2-digit', day: '2-digit' };
    currentDateEl.textContent = today.toLocaleDateString('id-ID', optionsDate);

    // 2. Set default form date & time to now
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const hh = String(today.getHours()).padStart(2, '0');
    const min = String(today.getMinutes()).padStart(2, '0');
    inputDate.value = `${yyyy}-${mm}-${dd}T${hh}:${min}`;

    // 3. Load dashboard data
    fetchDashboardData();

    // 4. Attach form submit listener
    formTransaction.addEventListener('submit', handleAddTransaction);

    // 5. Attach setup triggers
    btnRunSetup.addEventListener('click', runDatabaseSetup);
    btnClearData.addEventListener('click', handleClearData);
});

// Switch Transaction Type
function setTransactionType(type) {
    currentType = type;
    inputType.value = type;

    // Reset error styling
    clearValidationErrors();

    // Update buttons visuals
    if (type === 'expense') {
        // Active Expense style
        btnTypeExpense.className = "py-2.5 px-4 rounded-xl text-sm font-semibold text-center transition-all duration-200 flex items-center justify-center gap-1.5 border border-white/30 bg-white/20 text-white shadow-lg";
        btnTypeExpense.querySelector('span').className = "w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse";

        // Inactive Income style
        btnTypeIncome.className = "py-2.5 px-4 rounded-xl text-sm font-semibold text-center transition-all duration-200 flex items-center justify-center gap-1.5 border border-transparent text-gray-300 hover:text-white bg-white/5";
        btnTypeIncome.querySelector('span').className = "w-2.5 h-2.5 rounded-full bg-zinc-700";

        // Populate Expense categories
        populateCategories(expenseCategories);
    } else {
        // Active Income style
        btnTypeIncome.className = "py-2.5 px-4 rounded-xl text-sm font-semibold text-center transition-all duration-200 flex items-center justify-center gap-1.5 border border-white/30 bg-white/20 text-white shadow-lg";
        btnTypeIncome.querySelector('span').className = "w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse";

        // Inactive Expense style
        btnTypeExpense.className = "py-2.5 px-4 rounded-xl text-sm font-semibold text-center transition-all duration-200 flex items-center justify-center gap-1.5 border border-transparent text-gray-300 hover:text-white bg-white/5";
        btnTypeExpense.querySelector('span').className = "w-2.5 h-2.5 rounded-full bg-zinc-700";

        // Populate Income categories
        populateCategories(incomeCategories);
    }
}

// Populate Category options dropdown
function populateCategories(categories) {
    inputCategory.innerHTML = '';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        inputCategory.appendChild(option);
    });
}

// Fetch dashboard stats & transactions
async function fetchDashboardData() {
    showLedgerState('loading');
    
    try {
        const response = await fetch(API_STATS);
        
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `HTTP error! Status: ${response.status}`);
        }

        const res = await response.json();
        
        if (res.success) {
            updateDashboardUI(res.data);
            bannerDbStatus.classList.add('hidden');
            btnRunSetup.classList.remove('hidden');
            btnClearData.classList.remove('hidden');
        } else {
            throw new Error(res.message || 'Unknown server error');
        }
    } catch (error) {
        console.error('Fetch dashboard failed:', error);
        showToast(error.message || 'Gagal terhubung ke database. Harap jalankan pengaturan database.', 'error');
        
        // Show banner to guide user to setup
        bannerDbStatus.classList.remove('hidden');
        btnRunSetup.classList.remove('hidden');
        btnClearData.classList.add('hidden');
        showLedgerState('empty');
    }
}

// Update DOM elements with dashboard data
function updateDashboardUI(data) {
    // Format values to currency format
    valSpendingToday.textContent = formatCurrency(data.spending_today);
    valSpendingWeek.textContent = formatCurrency(data.spending_week);
    valSpendingMonth.textContent = formatCurrency(data.spending_month);

    // Update transactions table
    const list = data.transactions;
    lblTotalCount.textContent = `${list.length} transaksi`;

    if (list.length === 0) {
        showLedgerState('table');
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-12 text-white/50 text-sm">Belum ada transaksi. Catat pengeluaran pertamamu hari ini!</td>
            </tr>
        `;
        // Show warning helper banner if database has no records at all
        if (data.spending_today === 0 && data.spending_week === 0 && data.spending_month === 0) {
            bannerDbStatus.classList.remove('hidden');
        }
    } else {
        showLedgerState('table');
        tableBody.innerHTML = '';
        list.forEach(tx => {
            const row = document.createElement('tr');
            row.className = "hover:bg-white/5 transition-colors group";
            
            // Format category badge type color styling
            const isIncome = tx.type === 'income';
            const badgeBg = isIncome ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20' : 'bg-red-500/20 text-red-300 border border-red-500/20';
            const sign = isIncome ? '+' : '-';
            const textClass = isIncome ? 'text-emerald-300 font-semibold' : 'text-zinc-200 font-medium';
            
            // Formatted Date output
            const formattedDate = formatDateString(tx.date);

            row.innerHTML = `
                <td class="py-3.5 pr-2">
                    <span class="inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${badgeBg}">
                        ${escapeHtml(tx.category)}
                    </span>
                </td>
                <td class="py-3.5 pr-2 text-xs text-gray-300 font-semibold">${formattedDate}</td>
                <td class="py-3.5 pr-2 text-xs text-gray-300 max-w-[200px] truncate hidden md:table-cell" title="${escapeHtml(tx.description || '')}">
                    ${escapeHtml(tx.description || '—')}
                </td>
                <td class="py-3.5 pr-2 text-right ${textClass}">
                    ${sign} ${formatCurrency(tx.amount)}
                </td>
                <td class="py-3.5 text-right w-[40px]">
                    <button onclick="handleDeleteTransaction(${tx.id})" class="p-1 text-gray-400 hover:text-red-400 rounded transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-white/10" title="Hapus Transaksi">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
}

// Toggle loading/empty/table state views
function showLedgerState(state) {
    if (state === 'loading') {
        tableLoader.classList.remove('hidden');
        tableEmpty.classList.add('hidden');
        tableWrapper.classList.add('hidden');
    } else if (state === 'empty') {
        tableLoader.classList.add('hidden');
        tableEmpty.classList.remove('hidden');
        tableWrapper.classList.add('hidden');
    } else {
        tableLoader.classList.add('hidden');
        tableEmpty.classList.add('hidden');
        tableWrapper.classList.remove('hidden');
    }
}

// Add Transaction Form Submission
async function handleAddTransaction(e) {
    e.preventDefault();
    clearValidationErrors();

    // Set saving loading state
    const originalBtnContent = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Menyimpan...
    `;

    const payload = {
        amount: parseFloat(inputAmount.value),
        type: inputType.value,
        category: inputCategory.value,
        date: inputDate.value,
        description: inputDescription.value
    };

    try {
        const response = await fetch(API_ADD, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const res = await response.json();

        if (response.ok && res.success) {
            showToast(res.message || 'Transaction saved successfully!', 'success');
            
            // Clear inputs (keeping type and date intact)
            inputAmount.value = '';
            inputDescription.value = '';
            
            // Reload dashboard data
            fetchDashboardData();
        } else {
            // Handle validation errors from backend
            if (res.errors) {
                displayValidationErrors(res.errors);
            }
            throw new Error(res.message || 'Failed to add transaction.');
        }
    } catch (error) {
        console.error('Add transaction failed:', error);
        showToast(error.message, 'error');
    } finally {
        // Restore button state
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalBtnContent;
    }
}

// Delete Transaction
async function handleDeleteTransaction(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan transaksi ini secara permanen?')) {
        return;
    }

    try {
        const response = await fetch(API_DELETE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: id })
        });

        const res = await response.json();

        if (response.ok && res.success) {
            showToast(res.message || 'Transaction successfully deleted.', 'success');
            fetchDashboardData();
        } else {
            throw new Error(res.message || 'Failed to delete transaction.');
        }
    } catch (error) {
        console.error('Delete transaction error:', error);
        showToast(error.message, 'error');
    }
}

// Automated Setup and Database Seeding
async function runDatabaseSetup() {
    spinnerSetup.classList.remove('hidden');
    btnRunSetup.disabled = true;

    try {
        showToast('Menginisialisasi basis data, mohon tunggu...', 'warning');
        const response = await fetch(API_SETUP);
        const text = await response.text();
        
        if (response.ok && text.includes('completed successfully')) {
            showToast('Basis data berhasil dibuat dan diisi dengan data simulasi!', 'success');
            bannerDbStatus.classList.add('hidden');
            fetchDashboardData();
        } else {
            throw new Error(text || 'Skrip pengaturan database keluar dengan kegagalan.');
        }
    } catch (error) {
        console.error('Database setup failed:', error);
        showToast(error.message || 'Skrip inisialisasi basis data gagal.', 'error');
    } finally {
        spinnerSetup.classList.add('hidden');
        btnRunSetup.disabled = false;
    }
}

// Helper: Show input fields validation errors
function displayValidationErrors(errors) {
    if (errors.amount) {
        errAmount.textContent = errors.amount;
        errAmount.classList.remove('hidden');
        inputAmount.classList.add('border-red-400/50', 'focus:border-red-400/50', 'focus:ring-red-400/50');
    }
    if (errors.category) {
        errCategory.textContent = errors.category;
        errCategory.classList.remove('hidden');
        inputCategory.classList.add('border-red-400/50', 'focus:border-red-400/50', 'focus:ring-red-400/50');
    }
    if (errors.date) {
        errDate.textContent = errors.date;
        errDate.classList.remove('hidden');
        inputDate.classList.add('border-red-400/50', 'focus:border-red-400/50', 'focus:ring-red-400/50');
    }
    if (errors.description) {
        errDescription.textContent = errors.description;
        errDescription.classList.remove('hidden');
        inputDescription.classList.add('border-red-400/50', 'focus:border-red-400/50', 'focus:ring-red-400/50');
    }
}

// Helper: Clear validation errors state
function clearValidationErrors() {
    const errorContainers = [errAmount, errCategory, errDate, errDescription];
    errorContainers.forEach(container => {
        container.textContent = '';
        container.classList.add('hidden');
    });

    const inputs = [inputAmount, inputCategory, inputDate, inputDescription];
    inputs.forEach(input => {
        input.classList.remove('border-red-400/50', 'focus:border-red-400/50', 'focus:ring-red-400/50');
    });
}

// Helper: Format Currency as IDR (Rp)
function formatCurrency(amount) {
    const formatted = new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
    return 'Rp ' + formatted;
}

// Helper: Format DB YYYY-MM-DD HH:MM:SS Date to readable string
function formatDateString(dateStr) {
    if (!dateStr) return '';
    const normalizedStr = dateStr.replace(' ', 'T');
    const date = new Date(normalizedStr);
    
    // Check if valid date
    if (isNaN(date.getTime())) return dateStr;
    
    const formattedDate = date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
    
    const formattedTime = date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    
    return `${formattedDate}, ${formattedTime}`;
}

// Helper: Toast alerts generator
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;    const toast = document.createElement('div');
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

    // Auto-remove after 4.5 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
    }, 4500);
}

// Helper: Escape HTML string to prevent XSS
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

// Clear all transaction data
async function handleClearData() {
    if (!confirm('Apakah Anda yakin ingin mengosongkan semua data transaksi? Tindakan ini tidak dapat dibatalkan.')) {
        return;
    }

    try {
        showToast('Mengosongkan data...', 'warning');
        const response = await fetch('api/clear_data.php');
        const res = await response.json();

        if (response.ok && res.success) {
            showToast(res.message || 'Semua data transaksi berhasil dikosongkan.', 'success');
            fetchDashboardData();
        } else {
            throw new Error(res.message || 'Gagal mengosongkan data.');
        }
    } catch (error) {
        console.error('Clear data error:', error);
        showToast(error.message, 'error');
    }
}
