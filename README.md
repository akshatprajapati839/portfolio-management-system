# Portfolio Manager

A simple web app to track your stock holdings — built with Flask on the
backend and plain HTML/CSS/JavaScript on the frontend. No frameworks on
the frontend, no external stock price API — you enter your own current
price, so it works fully offline.

## Features
- Add, edit, and delete holdings (ticker, quantity, purchase price, current price)
- Automatically calculates cost basis, current value, and profit/loss per holding
- Dashboard summary cards for total invested, total value, total P/L, and total return %
- Data is saved to `portfolio.json`, so it's still there next time you run it

## Tech Stack
- **Backend:** Python + Flask (serves the page and a small JSON API)
- **Frontend:** HTML, CSS, vanilla JavaScript (fetch calls to the API, no build step)

## Project Structure
```
portfolio-manager/
├── app.py                # Flask backend + API routes
├── requirements.txt
├── templates/
│   └── index.html        # the dashboard page
├── static/
│   ├── style.css
│   └── script.js
└── portfolio.json         # created automatically once you add a holding
```

## Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/YOUR-USERNAME/portfolio-manager.git
   cd portfolio-manager
   ```

2. **(Optional but recommended) create a virtual environment**
   ```bash
   python -m venv venv
   venv\Scripts\activate      # Windows
   source venv/bin/activate   # Mac/Linux
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the app**
   ```bash
   python app.py
   ```

5. **Open it in your browser**
   Go to `http://127.0.0.1:5000`

## How It Works
- `app.py` stores holdings as a list of dictionaries in `portfolio.json`
- The frontend calls the API (`/api/holdings`) using `fetch()` to load, add,
  edit, and delete holdings without reloading the page
- Profit/loss is calculated as `(current_price - purchase_price) * quantity`
  for each holding, and the totals across all holdings feed the summary cards

## Possible Future Improvements
- Pull live stock prices from a real API instead of manual entry
- Charts showing portfolio performance over time
- User accounts so multiple people can track separate portfolios
- Sorting/filtering the holdings table

## License
Free to use and modify for learning purposes.
