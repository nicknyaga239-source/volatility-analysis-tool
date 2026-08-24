let socket = null;
let ticks = [];

const MAX_TICKS = 1000;

const APP_ID = 1089;


// -----------------------------
// DIGIT CARDS
// -----------------------------

function createDigitCards() {
  const grid = document.getElementById("digitGrid");

  grid.innerHTML = "";

  for (let digit = 0; digit <= 9; digit++) {
    grid.innerHTML += `
      <div class="digit-card">
        <div class="digit-number">${digit}</div>
        <div class="digit-percent" id="digit-${digit}">
          0%
        </div>
      </div>
    `;
  }
}


// -----------------------------
// STATUS
// -----------------------------

function setStatus(message, connected = false) {
  document.getElementById("statusText").textContent = message;

  document
    .getElementById("statusDot")
    .classList.toggle("connected", connected);
}


// -----------------------------
// CONNECT
// -----------------------------

function connect() {

  disconnect();

  const symbol =
    document.getElementById("symbol").value;

  setStatus("Connecting...");

  socket = new WebSocket(
    `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`
  );


  socket.onopen = function () {

    setStatus("Connected", true);

    socket.send(
      JSON.stringify({
        ticks: symbol,
        subscribe: 1
      })
    );

  };


  socket.onmessage = function (event) {

    const data = JSON.parse(event.data);

    if (data.error) {

      console.error(data.error);

      setStatus("Connection error");

      return;
    }


    if (data.msg_type === "tick") {

      const quote = data.tick.quote;

      processTick(quote);

    }

  };


  socket.onerror = function (error) {

    console.error("WebSocket error:", error);

    setStatus("Connection error");

  };


  socket.onclose = function () {

    setStatus("Disconnected");

  };
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


  /*
    Get the final displayed decimal digit.
  */

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
// DASHBOARD
// -----------------------------

function updateDashboard() {

  const total = ticks.length;

  document.getElementById("tickCount")
    .textContent = total;

  document.getElementById("sampleSize")
    .textContent = total;


  if (!total) {
    return;
  }


  const latest =
    ticks[ticks.length - 1];


  document.getElementById("currentPrice")
    .textContent = latest.price;

  document.getElementById("lastDigit")
    .textContent = latest.digit;


  // Digit distribution

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


    const element =
      document.getElementById(
        `digit-${digit}`
      );


    if (element) {

      element.textContent =
        percentage.toFixed(1) + "%";

    }

  }


  // Even / Odd

  const even =
    ticks.filter(
      tick => tick.digit % 2 === 0
    ).length;


  const odd =
    total - even;


  const evenPercent =
    even / total * 100;


  const oddPercent =
    odd / total * 100;


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
// OVER / UNDER STATISTICS
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
    (over / total * 100).toFixed(1) + "%";


  document.getElementById("underPercent")
    .textContent =
    (under / total * 100).toFixed(1) + "%";
}


// -----------------------------
// PATTERN STATISTICS
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
        Math.max(maxEven, evenCurrent);

    } else {

      oddCurrent++;
      evenCurrent = 0;

      maxOdd =
        Math.max(maxOdd, oddCurrent);

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
// RECENT TICKS
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
      <td>${tick.time.toLocaleTimeString()}</td>
      <td>${tick.price}</td>
      <td>${tick.digit}</td>
      <td>${type}</td>
    `;


    table.appendChild(row);

  });
}


// -----------------------------
// MARKET SELECTOR
// -----------------------------

document
  .getElementById("symbol")
  .addEventListener("change", function () {

    const selected =
      this.options[this.selectedIndex].text;


    document.getElementById(
      "marketName"
    ).textContent = selected;


    ticks = [];

    updateDashboard();

  });


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


// -----------------------------
// CLEAR
// -----------------------------

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
          <td colspan="4" class="empty">
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
