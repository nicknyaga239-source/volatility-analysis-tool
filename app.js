let socket = null;

let ticks = [];

const MAX_TICKS = 1000;


// -----------------------------
// INITIALIZE DIGIT CARDS
// -----------------------------

function createDigitCards() {

  const grid = document.getElementById("digitGrid");

  grid.innerHTML = "";

  for (let digit = 0; digit <= 9; digit++) {

    const card = document.createElement("div");

    card.className = "digit-card";

    card.innerHTML = `
      <div class="digit-number">${digit}</div>
      <div class="digit-percent" id="digit-${digit}">
        0%
      </div>
    `;

    grid.appendChild(card);
  }
}


// -----------------------------
// STATUS
// -----------------------------

function setStatus(message, connected = false) {

  document.getElementById("statusText").textContent =
    message;

  const dot = document.getElementById("statusDot");

  dot.classList.toggle(
    "connected",
    connected
  );
}


// -----------------------------
// CONNECT
// -----------------------------

function connect() {

  const token =
    document.getElementById("apiToken").value.trim();

  if (!token) {

    alert("Please enter your API token.");

    return;
  }

  disconnect();

  setStatus("Preparing connection...");

  /*
    LIVE DERIV WEBSOCKET CONNECTION
    WILL BE ADDED IN THE NEXT STAGE.

    Never place your real API token directly
    inside this JavaScript file.
  */

  setStatus(
    "Token ready — live connection module next"
  );
}


// -----------------------------
// DISCONNECT
// -----------------------------

function disconnect() {

  if (socket) {

    socket.close();

    socket = null;
  }

  setStatus("Disconnected");
}


// -----------------------------
// PROCESS TICK
// -----------------------------

function processTick(price) {

  const number = Number(price);

  if (!Number.isFinite(number)) {
    return;
  }

  const priceString =
    number.toString();

  const digit =
    Number(
      priceString
        .replace(".", "")
        .slice(-1)
    );

  ticks.push({

    price: number,

    digit: digit,

    time: new Date()

  });


  if (ticks.length > MAX_TICKS) {

    ticks.shift();

  }

  updateDashboard();
}


// -----------------------------
// UPDATE DASHBOARD
// -----------------------------

function updateDashboard() {

  const total = ticks.length;

  document.getElementById("tickCount")
    .textContent = total;

  document.getElementById("sampleSize")
    .textContent = total;


  if (total === 0) {
    return;
  }


  const latest =
    ticks[ticks.length - 1];


  document.getElementById("currentPrice")
    .textContent = latest.price;

  document.getElementById("lastDigit")
    .textContent = latest.digit;


  // DIGIT COUNTS

  const counts =
    Array(10).fill(0);


  ticks.forEach(tick => {

    if (
      tick.digit >= 0 &&
      tick.digit <= 9
    ) {

      counts[tick.digit]++;

    }

  });


  for (let digit = 0; digit <= 9; digit++) {

    const percentage =
      (counts[digit] / total) * 100;

    document.getElementById(
      `digit-${digit}`
    ).textContent =
      percentage.toFixed(1) + "%";
  }


  // EVEN / ODD

  const even =
    ticks.filter(
      tick => tick.digit % 2 === 0
    ).length;

  const odd =
    total - even;


  const evenPercent =
    (even / total) * 100;

  const oddPercent =
    (odd / total) * 100;


  document.getElementById("evenPercent")
    .textContent =
    evenPercent.toFixed(1) + "%";

  document.getElementById("oddPercent")
    .textContent =
    oddPercent.toFixed(1) + "%";


  document.getElementById("evenBar")
    .style.width =
    evenPercent + "%";

  document.getElementById("oddBar")
    .style.width =
    oddPercent + "%";


  updateOverUnder();

  calculatePatterns();

  updateTable();
}


// -----------------------------
// OVER / UNDER
// -----------------------------

function updateOverUnder() {

  if (!ticks.length) {
    return;
  }


  const barrier =
    Number(
      document.getElementById("barrier").value
    );


  const over =
    ticks.filter(
      tick => tick.digit > barrier
    ).length;


  const under =
    ticks.filter(
      tick => tick.digit < barrier
    ).length;


  const total =
    over + under;


  if (!total) {
    return;
  }


  document.getElementById("overPercent")
    .textContent =
    ((over / total) * 100)
      .toFixed(1) + "%";


  document.getElementById("underPercent")
    .textContent =
    ((under / total) * 100)
      .toFixed(1) + "%";
}


// -----------------------------
// PATTERN ANALYSIS
// -----------------------------

function calculatePatterns() {

  let evenCurrent = 0;

  let oddCurrent = 0;

  let maxEven = 0;

  let maxOdd = 0;


  for (const tick of ticks) {

    if (tick.digit % 2 === 0) {

      evenCurrent++;

      oddCurrent = 0;

      maxEven =
        Math.max(
          maxEven,
          evenCurrent
        );

    } else {

      oddCurrent++;

      evenCurrent = 0;

      maxOdd =
        Math.max(
          maxOdd,
          oddCurrent
        );
    }
  }


  document.getElementById("evenStreak")
    .textContent = maxEven;

  document.getElementById("oddStreak")
    .textContent = maxOdd;


  let repeated = 0;


  for (
    let i = 2;
    i < ticks.length;
    i++
  ) {

    if (
      ticks[i].digit ===
      ticks[i - 2].digit
    ) {

      repeated++;

    }

  }


  document.getElementById(
    "repeatedPatterns"
  ).textContent = repeated;


  document.getElementById(
    "dataQuality"
  ).textContent =
    ticks.length >= 100
      ? "Sufficient sample"
      : "Collecting data";
}


// -----------------------------
// TABLE
// -----------------------------

function updateTable() {

  const table =
    document.getElementById("tickTable");


  const recent =
    ticks.slice(-15).reverse();


  table.innerHTML = "";


  recent.forEach(tick => {

    const row =
      document.createElement("tr");


    const type =
      tick.digit % 2 === 0
        ? "Even"
        : "Odd";


    row.innerHTML = `
      <td>
        ${tick.time.toLocaleTimeString()}
      </td>

      <td>
        ${tick.price}
      </td>

      <td>
        ${tick.digit}
      </td>

      <td>
        ${type}
      </td>
    `;


    table.appendChild(row);

  });
}


// -----------------------------
// MARKET SELECTOR
// -----------------------------

document
  .getElementById("symbol")
  .addEventListener(
    "change",
    function () {

      const selected =
        this.options[
          this.selectedIndex
        ].text;


      document.getElementById(
        "marketName"
      ).textContent =
        selected;


      // Clear old market data
      ticks = [];

      updateDashboard();
    }
  );


// -----------------------------
// BARRIER
// -----------------------------

document
  .getElementById("barrier")
  .addEventListener(
    "change",
    updateOverUnder
  );


// -----------------------------
// BUTTONS
// -----------------------------

document
  .getElementById("connectBtn")
  .addEventListener(
    "click",
    connect
  );


document
  .getElementById("disconnectBtn")
  .addEventListener(
    "click",
    disconnect
  );


document
  .getElementById("clearBtn")
  .addEventListener(
    "click",
    function () {

      ticks = [];

      updateDashboard();

      document.getElementById(
        "tickTable"
      ).innerHTML = `
        <tr>
          <td
            colspan="4"
            class="empty"
          >
            Tick history cleared.
          </td>
        </tr>
      `;
    }
  );


// -----------------------------
// START
// -----------------------------

createDigitCards();

setStatus("Disconnected");
