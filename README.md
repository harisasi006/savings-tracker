# 📊 MemoFinance — Memory-Friendly Transaction Tracker

**MemoFinance** is a lightweight, high-contrast, and memory-friendly personal savings and transaction tracker. It is designed to help users record money sent to other individuals (debits) or money received (credits), and monitor remaining balances in real-time with minimum complexity.

👉 **[Live Application Link](https://harisasi006.github.io/savings-tracker/)**

---

## 🌟 Key Features

* **Debit & Credit Support**: Toggle between recording **🔴 Money Sent (Debit)** and **🟢 Money Received (Credit)** dynamically. Form labels adjust automatically based on selection.
* **4-Metric Dashboard**: View your starting savings, total money received, total money sent, and current net balance at a single glance.
* **Symbol & Color Coding**: Payments are displayed with a red `-` prefix (e.g., `-₹500`) and deposits/refunds are shown with a green `+` prefix (e.g., `+₹500`).
* **Large Touch-Friendly Input Fields**: Clean form inputs and large category chips (`🤝 Loan/Debt`, `❤️ Gift/Help`, `🍔 Food`, `🛍️ Shopping`, `💊 Medical`, `⚙️ Other`) designed for ease of use.
* **Quick-Filter People Directory**: Shows a list of unique individuals you have transacted with. Displays their name and your **net balance** with them (e.g. `Paid ₹600` or `Recv ₹300`). Click a name to filter history instantly.
* **Local Persistent Memory**: All records are saved locally inside your web browser (`localStorage`). Data is preserved even if you close the tab or shut down your device.
* **Data Security & Backups**: Download your entire transaction log as a backup file (`.json`) or restore a previous backup with a single click.

---

## 🛠️ Technology Stack

* **Structure**: Semantic HTML5
* **Styles**: Vanilla CSS3 (High-contrast emerald-green & slate-dark glassmorphism design system)
* **Logic**: Vanilla JavaScript (ES6+ state calculations and event handling)

---

## 📂 Project Structure

```text
savings-tracker/
├── index.html   # Main layout structure & dashboard UI
├── styles.css   # Glassmorphic layout styling rules
├── app.js       # App calculations, database state & file backups
└── README.md    # Documentation file
```
