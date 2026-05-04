## PwC Beverage Portal

A specialized inventory and consumption management system built for the **PwC Sydney** beverage team. This portal streamlines the lifecycle of beverage management—from supplier ordering to event consumption tracking and end-of-month reporting.

### 🚀 [Live Application](https://pwcstock.aayush.com.au)

-----

### 🛠️ Features

  * **Secure Access:** Restricted entry via team-specific authentication.
  * **Live Dashboard:** Real-time metrics for total items, stock status (In Stock, Low Stock, Out of Stock), and category-based visualizations using **Chart.js**.
  * **Inventory Management:** Full control over stock levels with a dedicated "Stocktake" mode for physical audits.
  * **Consumption Tracking:** Log beverage usage for specific functions (Luxe, Client, or Staff packages). The system automatically calculates consumption by comparing opening and closing counts.
  * **Automated Ordering:** Supplier-specific ordering logic that converts unit counts into cartons and generates email previews for seamless purchasing.
  * **Reporting:** Export inventory data to **Excel** or generate printable monthly reports.

-----

### 📂 Technical Stack

  * **Frontend:** HTML5, CSS3 (Custom Variables/Mobile-responsive), Vanilla JavaScript (ES6+).
  * **Backend/Database:** [Supabase](https://supabase.com/) for real-time data persistence and authentication.
  * **Data Visualization:** [Chart.js](https://www.chartjs.org/) for dashboard analytics.
  * **Exports:** [SheetJS (XLSX)](https://sheetjs.com/) for Excel generation.

-----

### 💻 Setup & Development

1.  **Clone the repo:**
    ```bash
    git clone https://github.com/hi-its-aayush/pwc_bev.git
    ```
2.  **Configuration:**
    Ensure your [Supabase](https://supabase.com/) credentials are correctly initialized in `app.js` to connect to your database instance.
3.  **Deployment:**
    The project is configured for [GitHub Pages](https://pages.github.com/). Any push to the `main` branch will update the live site via the `CNAME` configuration.

-----

### ⚖️ License

PwC Sydney Internal Use. Managed by [hi-its-aayush](https://github.com/hi-its-aayush).
