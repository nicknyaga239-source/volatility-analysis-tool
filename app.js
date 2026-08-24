let socket = null;

let ticks = [];

const MAX_TICKS = 5000;

const APP_ID = 1089;


// =====================================================
// INITIALIZE
// =====================================================

function createDigitCards() {

  const grid = document.getElementById("digitGrid");

  grid.innerHTML = "";

  for (let digit = 0; digit <= 9; digit++) {

    grid.innerHTML += `
      <div class="digit-card">

        <div class="digit-number">
          ${digit}
        </div>

        <div
          class="digit-percent"
          id="digit-${digit}">
          0%
        </div>

      </div>
    `;
  }
}


// =====================================================
// CONNECTION STATUS
// =====================================================

function setStatus(message, connected = false) {

  document.getElementById("statusText")
    .textContent = message;

  document.getElementById("statusDot")
    .classList.toggle(
      "connected",
      connected
    );
}


// =====================================================
// CONNECT TO LIVE TICKS
// =====================================================

function connect() {

  disconnect();

  const symbol =
    document.getElementById("symbol").value;

  setStatus("Connecting...");


  socket = new WebSocket(
    `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`
  );


  socket.onopen = function () {

    setStatus(
      "Connected",
      true
    );


    socket.send(
      JSON.stringify({

        ticks: symbol,

        subscribe: 1

      })
    );

  };


  socket.onmessage = function(event) {

    const data =
      JSON.parse(event.data);


    if (data.error) {

      console.error(
        data.error
      );

      setStatus(
        "Connection error"
      );

      return;
    }


    if (
      data.msg_type === "tick"
    ) {

      processTick(
        data.tick.quote
      );

    }

  };


  socket.onerror = function(error) {

    console.error(
      "WebSocket error:",
      error
    );

    setStatus(
      "Connection error"
    );

  };


  socket.onclose = function() {

    setStatus(
      "Disconnected"
    );

  };
}


// =====================================================
// DISCONNECT
// =====================================================

function disconnect() {

  if (socket) {

    socket.close();

    socket = null;

  }

  setStatus(
    "Disconnected"
  );
}


// =====================================================
// PROCESS TICK
// =====================================================

function processTick(price) {

  const number =
    Number(price);


  if (!Number.isFinite(number)) {
    return;
  }


  const text =
    number.toString();


  const digit =
    Number(
      text
        .replace(".", "")
        .slice(-1)
    );


  ticks.push({

    price: number,

    digit: digit,

    time: new Date()

  });


  if (
    ticks.length >
    MAX_TICKS
  ) {

    ticks.shift();

  }


  updateDashboard();
}


// =====================================================
// MAIN DASHBOARD UPDATE
// =====================================================

function updateDashboard() {

  const total =
    ticks.length;


  document.getElementById(
    "tickCount"
  ).textContent =
    total;


  document.getElementById(
    "sampleSize"
  ).textContent =
    total;


  if (!total) {
    return;
  }


  const latest =
    ticks[ticks.length - 1];


  document.getElementById(
    "currentPrice"
  ).textContent =
    latest.price;


  document.getElementById(
    "lastDigit"
  ).textContent =
    latest.digit;


  // Run the three analysis sections

  analyzeMatches();

  analyzeEvenOdd();

  analyzeOverUnder();

  analyzePatterns();

  updateTable();
}


// =====================================================
// 1. MATCHES / DIGIT HISTORICAL ANALYSIS
// =====================================================

function analyzeMatches() {

  if (!ticks.length) {
    return;
  }


  const counts =
    Array(10).fill(0);


  ticks.forEach(
    tick => {

      if (
        tick.digit >= 0 &&
        tick.digit <= 9
      ) {

        counts[tick.digit]++;

      }

    }
  );


  const total =
    ticks.length;


  for (
    let digit = 0;
    digit <= 9;
    digit++
  ) {

    const percentage =
      (
        counts[digit] /
        total
      ) * 100;


    const element =
      document.getElementById(
        `digit-${digit}`
      );


    if (element) {

      element.textContent =
        percentage.toFixed(2) +
        "%";

    }

  }


  /*
    Compare recent occurrence frequency
    with the full historical sample.
  */

  const recent =
    ticks.slice(-100);


  const recentCounts =
    Array(10).fill(0);


  recent.forEach(
    tick => {

      recentCounts[
        tick.digit
      ]++;

    }
  );


  const ranked =
    recentCounts
      .map(
        (count, digit) => ({

          digit,

          count,

          percentage:
            (
              count /
              recent.length
            ) * 100

        })
      )
      .sort(
        (a, b) =>
          b.count - a.count
      );


  console.log(
    "MATCHES HISTORICAL ANALYSIS"
  );


  console.table(
    ranked
  );


  /*
    Detect recurring sequences.
  */

  const sequences =
    findRepeatedSequences(
      ticks.map(
        tick => tick.digit
      ),
      3
    );


  console.log(
    "Repeated digit sequences:",
    sequences
  );
}


// =====================================================
// 2. EVEN / ODD ANALYSIS
// =====================================================

function analyzeEvenOdd() {

  if (!ticks.length) {
    return;
  }


  const even =
    ticks.filter(
      tick =>
        tick.digit % 2 === 0
    ).length;


  const odd =
    ticks.length - even;


  const evenPercentage =
    (
      even /
      ticks.length
    ) * 100;


  const oddPercentage =
    (
      odd /
      ticks.length
    ) * 100;


  document.getElementById(
    "evenPercent"
  ).textContent =
    evenPercentage.toFixed(2) +
    "%";


  document.getElementById(
    "oddPercent"
  ).textContent =
    oddPercentage.toFixed(2) +
    "%";


  document.getElementById(
    "evenBar"
  ).style.width =
    evenPercentage + "%";


  document.getElementById(
    "oddBar"
  ).style.width =
    oddPercentage + "%";


  console.log(
    "EVEN / ODD ANALYSIS",
    {
      even,
      odd,
      evenPercentage,
      oddPercentage
    }
  );
}


// =====================================================
// 3. OVER / UNDER ANALYSIS
// =====================================================

function analyzeOverUnder() {

  if (!ticks.length) {
    return;
  }


  const barrier =
    Number(
      document.getElementById(
        "barrier"
      ).value
    );


  const over =
    ticks.filter(
      tick =>
        tick.digit > barrier
    ).length;


  const under =
    ticks.filter(
      tick =>
        tick.digit < barrier
    ).length;


  const equal =
    ticks.filter(
      tick =>
        tick.digit === barrier
    ).length;


  const total =
    ticks.length;


  const overPercentage =
    (
      over /
      total
    ) * 100;


  const underPercentage =
    (
      under /
      total
    ) * 100;


  document.getElementById(
    "overPercent"
  ).textContent =
   
