const prompt = require("prompt-sync")();

class BankAccount {
  constructor() {
    this.user = null; // Initially no user
  }

  createAccount(name, password) {
    if (!name || !password) return "Username and password are required!";
    this.user = {
      username: name,
      password: password,
    };
    return `Registration Successful for ${this.user.username}`;
  }

  userDetails() {
    return this.user ? this.user : "No user account found";
  }

  deleteAccount() {
    if (this.user) {
      const deletedUser = this.user.username;
      this.user = null;
      return `User ${deletedUser} deleted successfully.`;
    }
    return "No user account found to delete.";
  }
}

class ManageBankAccount extends BankAccount {
  constructor(bankAccount) {
    super();
    this.user = bankAccount.user; // Share user data with BankAccount instance
    this.balance = 0;
  }

  deposit(amount) {
    if (!this.user) return "No user account found!";
    if (amount <= 0) return "Deposit amount must be greater than 0.";
    this.balance += amount;
    return `Deposit successful to ${this.user.username}. Your new balance: ${this.balance}`;
  }

  withdraw(amount){
    if (!this.user) return "No user account found!";
    const password = prompt("Enter your password: ");
    if(password !== this.user.password) {
      return "Incorrect password. Withdrawal failed.";

    }

    if (amount <= 0) return "Withdrawal amount must be greater than 0.";
    if (amount > this.balance) return "Insufficient balance.";
    
    this.balance -= amount;
    return `Withdraw successful. New balance: ${this.balance}`;
  }

  getBalance() {
    const password = prompt("Enter your password: ");
    if(password !== this.user.password) {
      return "Incorrect password. Get balance failed.";

    }
    return this.user ? `Your balance: ${this.balance}` : "No user account found!";
  }
}

// Create a single bank account instance
const bankAccount = new BankAccount();

// Create account first
console.log(bankAccount.createAccount(prompt("Username: "), prompt("Password: ")));
console.log(bankAccount.userDetails()); // Should return user details

// Pass the same bankAccount instance to ManageBankAccount
const manageBankAccount = new ManageBankAccount(bankAccount);

// Now deposits and withdrawals will work correctly
console.log(manageBankAccount.deposit(Number(prompt("Enter amount to deposit: "))));
console.log(manageBankAccount.getBalance());

console.log(manageBankAccount.withdraw(Number(prompt("Enter amount to withdraw: "))));
console.log(manageBankAccount.getBalance());

console.log(bankAccount.userDetails());

console.log(bankAccount.deleteAccount()); // Deleting the account
console.log(bankAccount.userDetails()); // Should return "No user account found"




