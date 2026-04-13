class ResponseFormatter {
    static formatBalance(customer) {
        return `Your current account balance is ₹${customer.accountBalance.toLocaleString('en-IN')}`;
    }

    static formatCreditCard(customer) {
        const status = customer.creditCardStatus;
        let response = `Your credit card status: ${status}`;

        if (status === 'Delivered' && customer.creditCardLimit) {
            response += `\nCredit limit: ₹${customer.creditCardLimit.toLocaleString('en-IN')}`;
            if (customer.creditCardFeatures && customer.creditCardFeatures.length > 0) {
                response += `\nFeatures: ${customer.creditCardFeatures.join(', ')}`;
            }
        }

        return response;
    }

    static formatCheque(customer) {
        let response = `Your cheque book status is: ${customer.chequeBookStatus}`;
        if (customer.chequeIssuedDate) {
            response += `\nIssued on: ${customer.chequeIssuedDate.toDateString()}`;
        }
        return response;
    }

    static formatLoan(customer) {
        if (customer.loanStatus === 'No Active Loan') {
            return 'You have no active loans';
        }

        let response = `Loan Status: ${customer.loanStatus}`;
        if (customer.loanType) response += `\nLoan Type: ${customer.loanType}`;
        if (customer.loanAmount) response += `\nLoan Amount: ₹${customer.loanAmount.toLocaleString('en-IN')}`;
        if (customer.loanEMI) response += `\nMonthly EMI: ₹${customer.loanEMI.toLocaleString('en-IN')}`;

        return response;
    }

    static formatKYC(customer) {
        let response = `Your KYC status is: ${customer.kycStatus}`;
        if (customer.lastKYCUpdate) {
            response += `\nLast updated: ${customer.lastKYCUpdate.toDateString()}`;
        }
        return response;
    }

    static formatTransactions(customer) {
        if (!customer.recentTransactions || customer.recentTransactions.length === 0) {
            return 'No recent transactions found';
        }

        let response = 'Recent Transactions:\n';
        customer.recentTransactions.slice(0, 5).forEach((txn, index) => {
            response += `${index + 1}. ${txn.description} - ${txn.type} ₹${txn.amount.toLocaleString('en-IN')} (${txn.date.toDateString()})\n`;
        });

        return response.trim();
    }

    static formatAccountInfo(customer) {
        return `Account Details:\n
Name: ${customer.name}\n
Email: ${customer.email || 'Not provided'}\n
Mobile: ${customer.mobile || 'Not provided'}\n
Account Type: ${customer.accountType}\n
Account Number: ${customer.accountNumber}`;
    }

    static formatGeneral(customer) {
        return `Account Summary for ${customer.name}:\n
• Balance: ₹${customer.accountBalance.toLocaleString('en-IN')}\n
• Account Type: ${customer.accountType}\n
• KYC Status: ${customer.kycStatus}\n
• Credit Card: ${customer.creditCardStatus}\n
• Loan Status: ${customer.loanStatus}`;
    }
}

module.exports = ResponseFormatter;
