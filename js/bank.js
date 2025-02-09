// Bank System Class
class BankSystem {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || {
            admin: {
                password: 'admin123',
                isAdmin: true,
                balance: 0,
                transactions: []
            }
        };
        this.currentUser = null;
        this.initializeEventListeners();
        this.checkLoginStatus();
    }

    // Authentication Methods
    registerUser(username, password) {
        if (this.users[username]) {
            throw new Error('Username already exists');
        }

        this.users[username] = {
            password: password,
            isAdmin: false,
            balance: 0,
            transactions: []
        };

        this.saveData();
        window.location.reload();
        return true;
    }

    loginUser(username, password) {
        const user = this.users[username];
        if (!user || user.password !== password) {
            throw new Error('Invalid username or password');
        }

        this.currentUser = username;
        localStorage.setItem('currentUser', username);
         window.location.reload();
        return user.isAdmin;

     
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.hideAllDashboards();
        this.showElement('loginBtn');
        this.showElement('registerBtn');

        window.location.reload();
    }

    // Transaction Methods
    deposit(amount) {
        amount = parseFloat(amount);
        if (amount <= 0) throw new Error('Please enter a valid amount');

        this.users[this.currentUser].balance += amount;
        this.addTransaction('deposit', amount);
        this.saveData();
        return 'Deposit successful';
    }

    withdraw(amount) {
        amount = parseFloat(amount);
        if (amount <= 0) throw new Error('Please enter a valid amount');
        if (amount > this.users[this.currentUser].balance) {
            throw new Error('Insufficient funds');
        }

        this.users[this.currentUser].balance -= amount;
        this.addTransaction('withdrawal', amount);
        this.saveData();
        return 'Withdrawal successful';
    }

    transfer(recipient, amount) {
        amount = parseFloat(amount);
        if (!this.users[recipient]) {
            throw new Error('Recipient not found');
        }
        if (amount <= 0) {
            throw new Error('Please enter a valid amount');
        }
        if (amount > this.users[this.currentUser].balance) {
            throw new Error('Insufficient funds');
        }

        // Perform transfer
        this.users[this.currentUser].balance -= amount;
        this.users[recipient].balance += amount;

        // Add transactions for both users
        this.addTransaction('transfer_out', amount, recipient);
        this.addTransactionToUser(recipient, 'transfer_in', amount, this.currentUser);

        this.saveData();
        return 'Transfer successful';
    }

    // Helper Methods
    addTransaction(type, amount, recipient = null) {
        const transaction = {
            type,
            amount,
            date: new Date().toISOString(),
            recipient,
            balance: this.users[this.currentUser].balance
        };
        this.users[this.currentUser].transactions.unshift(transaction);
    }

    addTransactionToUser(username, type, amount, sender) {
        const transaction = {
            type,
            amount,
            date: new Date().toISOString(),
            sender,
            balance: this.users[username].balance
        };
        this.users[username].transactions.unshift(transaction);
    }

    saveData() {
        localStorage.setItem('users', JSON.stringify(this.users));
        this.updateDashboard();
    }

    // UI Methods
    initializeEventListeners() {
        // Modal Controls
        document.getElementById('loginBtn').addEventListener('click', () => this.showModal('loginModal'));
        document.getElementById('registerBtn').addEventListener('click', () => this.showModal('registerModal'));
        
        // Close buttons
        document.querySelectorAll('.close').forEach(button => {
            button.addEventListener('click', () => this.closeAllModals());
        });

        // Forms
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('depositForm').addEventListener('submit', (e) => this.handleDeposit(e));
        document.getElementById('withdrawForm').addEventListener('submit', (e) => this.handleWithdraw(e));
        document.getElementById('transferForm').addEventListener('submit', (e) => this.handleTransfer(e));
        document.getElementById('settingsForm').addEventListener('submit', (e) => this.handleSettings(e));

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('adminLogoutBtn').addEventListener('click', () => this.logout());

        // Tab Navigation
        document.querySelectorAll('.sidebar-menu li[data-tab]').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Transaction Filters
        document.getElementById('transactionType').addEventListener('change', () => this.updateTransactionList());
        document.getElementById('dateFilter').addEventListener('change', () => this.updateTransactionList());
    }

    showModal(modalId) {
        this.closeAllModals();
        document.getElementById(modalId).style.display = 'block';
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    hideAllDashboards() {
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('adminDashboard').classList.add('hidden');
    }

    switchTab(tabId) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Remove active class from all menu items
        document.querySelectorAll('.sidebar-menu li').forEach(item => {
            item.classList.remove('active');
        });

        // Show selected tab
        document.getElementById(tabId).classList.add('active');
        document.querySelector(`li[data-tab="${tabId}"]`).classList.add('active');
    }

    updateDashboard() {
        if (!this.currentUser) return;

        const user = this.users[this.currentUser];
        
        // Update balance
        document.getElementById('balance').textContent = `$${user.balance}`;
        
        // Update user welcome message
        document.getElementById('userWelcome').textContent = this.currentUser;

        // Update totals
        const totals = this.calculateTotals();
        document.getElementById('totalDeposits').textContent = `$${totals.deposits}`;
        document.getElementById('totalWithdrawals').textContent = `$${totals.withdrawals}`;

        // Update transaction list
        this.updateTransactionList();

        // Update admin dashboard if applicable
        if (user.isAdmin) {
            this.updateAdminDashboard();
        }
    }

    updateTransactionList() {
        const transactionList = document.getElementById('transaction-body');
        const type = document.getElementById('transactionType').value;
        const date = document.getElementById('dateFilter').value;
        
        let transactions = this.users[this.currentUser].transactions;

        // Apply filters
        if (type !== 'all') {
            transactions = transactions.filter(t => t.type === type);
        }
        if (date) {
            const filterDate = new Date(date).toDateString();
            transactions = transactions.filter(t => new Date(t.date).toDateString() === filterDate);
        }

        // Clear existing list
        transactionList.innerHTML = '';

        const tableBody = document.getElementById("transaction-body");

        // Add transactions
        transactions.forEach(transaction => {
            const row = document.createElement("tr");
        
            let description = '';
            let amountClass = '';
            let amountPrefix = '';
        
            switch (transaction.type) {
                case 'deposit':
                    description = 'Deposit';
                    amountClass = 'deposit';
                    amountPrefix = '+';
                    break;
                case 'withdrawal':
                    description = 'Withdrawal';
                    amountClass = 'withdrawal';
                    amountPrefix = '-';
                    break;
                case 'transfer_out':
                    description = `Transfer to ${transaction.recipient}`;
                    amountClass = 'withdrawal';
                    amountPrefix = '-';
                    break;
                case 'transfer_in':
                    description = `Transfer from ${transaction.sender}`;
                    amountClass = 'deposit';
                    amountPrefix = '+';
                    break;
            }
        
            row.innerHTML = `
                <td class="transaction-date">${new Date(transaction.date).toLocaleString()}</td>
                <td class="transaction-description">${description}</td>
                <td class="transaction-amount ${amountClass}">${amountPrefix}$${transaction.amount}</td>
                <td class="transaction-balance">Balance: $${transaction.balance}</td>
            `;
        
            tableBody.appendChild(row);
        });
        
    }

    updateAdminDashboard() {
        const userList = document.getElementById('adminUserList');
        userList.innerHTML = '';

        Object.entries(this.users).forEach(([username, userData]) => {
            if (username !== 'admin') {
                const userCard = document.createElement('div');
                userCard.className = 'user-card';
                userCard.innerHTML = `
                    <h3>${username}</h3>
                    <p>Balance: $${userData.balance}</p>
                    <p>Total Transactions: ${userData.transactions.length}</p>
                    <button onclick="bankSystem.toggleUserAccount('${username}')">
                        ${userData.isLocked ? 'Unlock' : 'Lock'} Account
                    </button>
                `;
                userList.appendChild(userCard);
            }
        });
    }

    calculateTotals() {
        const transactions = this.users[this.currentUser].transactions;
        return transactions.reduce((totals, transaction) => {
            if (transaction.type === 'deposit' || transaction.type === 'transfer_in') {
                totals.deposits += transaction.amount;
            } else if (transaction.type === 'withdrawal' || transaction.type === 'transfer_out') {
                totals.withdrawals += transaction.amount;
            }
            return totals;
        }, { deposits: 0, withdrawals: 0 });
    }

    // Event Handlers
    handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const messageElement = document.getElementById('loginMessage');

        try {
            const isAdmin = this.loginUser(username, password);
            this.closeAllModals();
            this.hideElement('loginBtn');
            this.hideElement('registerBtn');
            
            if (isAdmin) {
                document.getElementById('adminDashboard').classList.remove('hidden');
            } else {
                document.getElementById('dashboard').classList.remove('hidden');
            }
            
            this.updateDashboard();
        } catch (error) {
            messageElement.textContent = error.message;
            messageElement.className = 'error message';
        }
    }

    handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const messageElement = document.getElementById('registerMessage');

        if (password !== confirmPassword) {
            messageElement.textContent = 'Passwords do not match';
            messageElement.className = 'error message';
            return;
        }

        try {
            this.registerUser(username, password);
            messageElement.textContent = 'Registration successful! Please login.';
            messageElement.className = 'success message';
            setTimeout(() => this.showModal('loginModal'), 1500);
        } catch (error) {
            messageElement.textContent = error.message;
            messageElement.className = 'error message';
        }
    }

    handleDeposit(e) {
        e.preventDefault();
        const amount = document.getElementById('depositAmount').value;
        const messageElement = document.getElementById('depositMessage');

        try {
            const message = this.deposit(amount);
            messageElement.textContent = message;
            messageElement.className = 'success message';
            e.target.reset();
            window.location.reload();
        } catch (error) {
            messageElement.textContent = error.message;
            messageElement.className = 'error message';
            window.location.reload();
        }
    }

    handleWithdraw(e) {
        e.preventDefault();
        const amount = document.getElementById('withdrawAmount').value;
        const messageElement = document.getElementById('withdrawMessage');

        try {
            const message = this.withdraw(amount);
            messageElement.textContent = message;
            messageElement.className = 'success message';
            e.target.reset();
            window.location.reload();
        } catch (error) {
            messageElement.textContent = error.message;
            messageElement.className = 'error message';
            window.location.reload();
        }
    }

    handleTransfer(e) {
        e.preventDefault();
        const recipient = document.getElementById('recipientUsername').value;
        const amount = document.getElementById('transferAmount').value;
        const messageElement = document.getElementById('transferMessage');

        try {
            const message = this.transfer(recipient, amount);
            messageElement.textContent = message;
            messageElement.className = 'success message';
            e.target.reset();
            window.location.reload();
        } catch (error) {
            messageElement.textContent = error.message;
            messageElement.className = 'error message';
            window.location.reload();
        }
    }

    handleSettings(e) {
        e.preventDefault();
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;
        const messageElement = document.getElementById('settingsMessage');

        if (newPassword !== confirmPassword) {
            messageElement.textContent = 'Passwords do not match';
            messageElement.className = 'error message';
            return;
        }

        try {
            this.users[this.currentUser].password = newPassword;
            this.saveData();
            messageElement.textContent = 'Password updated successfully';
            messageElement.className = 'success message';
            e.target.reset();
            window.location.reload();
        } catch (error) {
            messageElement.textContent = error.message;
            messageElement.className = 'error message';
            window.location.reload();
        }
    }

    // Utility Methods
    showElement(elementId) {
        document.getElementById(elementId).style.display = 'block';
    }

    hideElement(elementId) {
        document.getElementById(elementId).style.display = 'none';
    }

    checkLoginStatus() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = savedUser;
            this.hideElement('loginBtn');
            this.hideElement('registerBtn');
            
            if (this.users[savedUser].isAdmin) {
                document.getElementById('adminDashboard').classList.remove('hidden');
            } else {
                document.getElementById('dashboard').classList.remove('hidden');
            }
            
            this.updateDashboard();
        }
    }

    toggleUserAccount(username) {
        this.users[username].isLocked = !this.users[username].isLocked;
        this.saveData();
        this.updateAdminDashboard();
    }

    // Admin Methods
    getSystemStats() {
        const stats = {
            totalUsers: Object.keys(this.users).length - 1, // Excluding admin
            totalTransactions: 0,
            totalBalance: 0,
            averageBalance: 0
        };

        Object.entries(this.users).forEach(([username, userData]) => {
            if (username !== 'admin') {
                stats.totalTransactions += userData.transactions.length;
                stats.totalBalance += userData.balance;
            }
        });

        stats.averageBalance = stats.totalBalance / stats.totalUsers;
        return stats;
    }

    // Error Handling Methods
    validateAmount(amount) {
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            throw new Error('Please enter a valid amount');
        }
        return parsedAmount;
    }

    validateUser(username) {
        const user = this.users[username];
        if (!user) {
            throw new Error('User not found');
        }
        if (user.isLocked) {
            throw new Error('This account is locked');
        }
        return user;
    }
}

// Initialize the bank system
const bankSystem = new BankSystem();


const main = document.getElementById('main');
const logoutBtn = document.querySelector('.logout');
const navlink = document.querySelector('.nav-links')
const footer = document.querySelector('.footer')
console.log(localStorage.getItem('currentUser'), main, logoutBtn);
localStorage.getItem('currentUser') ? (main.style.display = 'none', navlink.style.display = 'none', footer.style.display = 'none') : logoutBtn.style.display = 'none';
document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".sidebar-menu li");
    const tabContents = document.querySelectorAll(".tab-content");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const selectedTab = tab.getAttribute("data-tab");

            // Remove active class from all tabs and add to the clicked tab
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            // Hide all tab contents and show the selected one
            tabContents.forEach(content => {
                if (content.id === selectedTab) {
                    content.classList.add("active");
                } else {
                    content.classList.remove("active");
                }
            });
        });
    });
});
