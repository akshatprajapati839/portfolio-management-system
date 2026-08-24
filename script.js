// this file handles everything on the page - loading holdings, drawing the
// table, doing the math for the summary cards, and the add/edit/delete modal

const modal = document.getElementById("holdingModal");
const modalTitle = document.getElementById("modalTitle");
const form = document.getElementById("holdingForm");

const holdingIdInput = document.getElementById("holdingId");
const tickerInput = document.getElementById("ticker");
const quantityInput = document.getElementById("quantity");
const purchasePriceInput = document.getElementById("purchasePrice");
const currentPriceInput = document.getElementById("currentPrice");

// keeping the last loaded holdings around so we don't have to refetch
// every time we just need to redraw something
let currentHoldings = [];

// grab holdings from the backend and redraw the page
async function loadHoldings() {
  const res = await fetch("/api/holdings");
  currentHoldings = await res.json();

  renderTable(currentHoldings);
  renderSummary(currentHoldings);
}

function formatMoney(num) {
  // toFixed handles rounding, then we just stick a $ on front
  const sign = num < 0 ? "-" : "";
  return `${sign}$${Math.abs(num).toFixed(2)}`;
}

function renderTable(holdings) {
  const tbody = document.getElementById("holdingsBody");
  const emptyState = document.getElementById("emptyState");

  tbody.innerHTML = ""; // clear whatever was there before redrawing

  if (holdings.length === 0) {
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";

  holdings.forEach((h) => {
    const costBasis = h.quantity * h.purchase_price;
    const currentValue = h.quantity * h.current_price;
    const pl = currentValue - costBasis;
    const plClass = pl >= 0 ? "positive" : "negative";
    const plSign = pl >= 0 ? "+" : "";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${h.ticker}</td>
      <td>${h.quantity}</td>
      <td>${formatMoney(h.purchase_price)}</td>
      <td>${formatMoney(h.current_price)}</td>
      <td>${formatMoney(costBasis)}</td>
      <td>${formatMoney(currentValue)}</td>
      <td class="pl-cell ${plClass}">${plSign}${formatMoney(pl)}</td>
      <td>
        <button class="btn-icon edit-btn" data-id="${h.id}">edit</button>
        <button class="btn-icon delete-btn" data-id="${h.id}">delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  // hook up the edit/delete buttons we just created
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => openEditModal(btn.dataset.id));
  });
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => deleteHolding(btn.dataset.id));
  });
}

function renderSummary(holdings) {
  let totalInvested = 0;
  let totalValue = 0;

  holdings.forEach((h) => {
    totalInvested += h.quantity * h.purchase_price;
    totalValue += h.quantity * h.current_price;
  });

  const totalPL = totalValue - totalInvested;
  // avoid dividing by zero when there's nothing in the portfolio yet
  const totalPLPercent = totalInvested === 0 ? 0 : (totalPL / totalInvested) * 100;

  document.getElementById("totalInvested").textContent = formatMoney(totalInvested);
  document.getElementById("totalValue").textContent = formatMoney(totalValue);

  const plEl = document.getElementById("totalPL");
  const plPercentEl = document.getElementById("totalPLPercent");
  const plCard = document.getElementById("plCard");
  const plPercentCard = document.getElementById("plPercentCard");

  const sign = totalPL >= 0 ? "+" : "";
  plEl.textContent = `${sign}${formatMoney(totalPL)}`;
  plPercentEl.textContent = `${sign}${totalPLPercent.toFixed(2)}%`;

  // swap the color classes depending on whether we're up or down overall
  const cls = totalPL >= 0 ? "positive" : "negative";
  const oppositeCls = totalPL >= 0 ? "negative" : "positive";

  plEl.classList.add(cls);
  plEl.classList.remove(oppositeCls);
  plPercentEl.classList.add(cls);
  plPercentEl.classList.remove(oppositeCls);
  plCard.classList.add(cls);
  plCard.classList.remove(oppositeCls);
  plPercentCard.classList.add(cls);
  plPercentCard.classList.remove(oppositeCls);
}

function openAddModal() {
  modalTitle.textContent = "Add Holding";
  form.reset();
  holdingIdInput.value = ""; // blank id means we're adding, not editing
  modal.style.display = "flex";
  tickerInput.focus();
}

function openEditModal(id) {
  const holding = currentHoldings.find((h) => h.id === id);
  if (!holding) return;

  modalTitle.textContent = "Edit Holding";
  holdingIdInput.value = holding.id;
  tickerInput.value = holding.ticker;
  quantityInput.value = holding.quantity;
  purchasePriceInput.value = holding.purchase_price;
  currentPriceInput.value = holding.current_price;

  modal.style.display = "flex";
  tickerInput.focus();
}

function closeModal() {
  modal.style.display = "none";
}

async function deleteHolding(id) {
  // simple confirm so people don't nuke a holding by accident
  const confirmed = confirm("Delete this holding?");
  if (!confirmed) return;

  await fetch(`/api/holdings/${id}`, { method: "DELETE" });
  loadHoldings();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault(); // stop the page from reloading, we handle this with fetch instead

  const payload = {
    ticker: tickerInput.value,
    quantity: quantityInput.value,
    purchase_price: purchasePriceInput.value,
    current_price: currentPriceInput.value
  };

  const id = holdingIdInput.value;

  if (id) {
    // there's already an id, so this is an edit
    await fetch(`/api/holdings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } else {
    // no id yet, so it's a new holding
    await fetch("/api/holdings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  closeModal();
  loadHoldings();
});

document.getElementById("openAddModal").addEventListener("click", openAddModal);
document.getElementById("cancelModal").addEventListener("click", closeModal);

// clicking the dark overlay outside the modal box also closes it
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

// kick things off once the page loads
loadHoldings();
