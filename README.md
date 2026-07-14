# 📊 MemoFinance — Memory-Friendly Transaction Tracker

**MemoFinance** is a lightweight, high-contrast, and memory-friendly personal savings and transaction tracker. It is designed to help users record money sent to other individuals and monitor remaining balances in real-time, requiring very few navigation steps.

👉 **[Live Application Link](https://harisasi006.github.io/savings-tracker/)**

---

## 🌟 Key Features

* **Instant Dashboard Statistics**: View your starting savings, total money sent, and remaining balance at a single glance.
* **Large Touch-Friendly Input Fields**: Clean form inputs and large category chips (`🤝 Loan/Debt`, `❤️ Gift/Help`, `🍔 Food`, `🛍️ Shopping`, `💊 Medical`, `⚙️ Other`) designed for ease of use.
* **Quick-Filter People Directory**: Dynamically shows a list of unique individuals you have paid along with the total amount sent to them. Click a name to filter history instantly.
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
