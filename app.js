// ==========================================
// ADVANCED HISTORICAL PATTERN ANALYSIS
// ==========================================

function analyzeHistoricalPatterns() {

  if (ticks.length < 50) {
    return {
      status: "Not enough data",
      sample: ticks.length
    };
  }

  const digits = ticks.map(t => t.digit);

  const windows = {
    recent100: digits.slice(-100),
    recent500: digits.slice(-500),
    recent1000: digits.slice(-1000)
  };

  // ------------------------------------------
  // DIGIT FREQUENCY
  // ------------------------------------------

  function digitFrequency(data) {

    const counts = Array(10).fill(0);

    data.forEach(digit => {
      if (digit >= 0 && digit <= 9) {
        counts[digit]++;
      }
    });

    return counts.map((count, digit) => ({
      digit,
      count,
      percentage:
        data.length
          ? (count / data.length) * 100
          : 0
    }));
  }


  // ------------------------------------------
  // REPEATING SEQUENCES
  // ------------------------------------------

  function findSequences(data, length = 3) {

    const sequences = {};

    for (let i = 0; i <= data.length - length; i++) {

      const sequence =
        data
          .slice(i, i + length)
          .join("-");

      sequences[sequence] =
        (sequences[sequence] || 0) + 1;
    }

    return Object.entries(sequences)
      .map(([sequence, occurrences]) => ({
        sequence,
        occurrences
      }))
      .sort(
        (a, b) =>
          b.occurrences - a.occurrences
      );
  }


  // ------------------------------------------
  // DIGIT TRANSITIONS
  // ------------------------------------------

  function transitionAnalysis(data) {

    const transitions = {};

    for (let i = 0; i < data.length - 1; i++) {

      const from = data[i];
      const to = data[i + 1];

      const key = `${from}->${to}`;

      transitions[key] =
        (transitions[key] || 0) + 1;
    }

    return transitions;
  }


  // ------------------------------------------
  // STREAK ANALYSIS
  // ------------------------------------------

  function calculateStreaks(data) {

    const result = {};

    for (let digit = 0; digit <= 9; digit++) {

      let current = 0;
      let longest = 0;

      data.forEach(value => {

        if (value === digit) {

          current++;

          longest =
            Math.max(longest, current);

        } else {

          current = 0;

        }

      });

      result[digit] = longest;
    }

    return result;
  }


  // ------------------------------------------
  // BUILD REPORT
  // ------------------------------------------

  const report = {

    sampleSize: digits.length,

    recent100:
      digitFrequency(windows.recent100),

    recent500:
      digitFrequency(windows.recent500),

    recent1000:
      digitFrequency(windows.recent1000),

    repeating3:
      findSequences(digits, 3),

    repeating4:
      findSequences(digits, 4),

    transitions:
      transitionAnalysis(digits),

    digitStreaks:
      calculateStreaks(digits)
  };


  return report;
}


// ==========================================
// EVEN / ODD HISTORICAL ANALYSIS
// ==========================================

function analyzeEvenOdd() {

  if (!ticks.length) {
    return null;
  }

  const even =
    ticks.filter(
      t => t.digit % 2 === 0
    ).length;

  const odd =
    ticks.length - even;

  return {

    sampleSize: ticks.length,

    evenCount: even,

    oddCount: odd,

    evenPercentage:
      (even / ticks.length) * 100,

    oddPercentage:
      (odd / ticks.length) * 100
  };
}


// ==========================================
// OVER / UNDER HISTORICAL ANALYSIS
// ==========================================

function analyzeOverUnder(barrier) {

  if (!ticks.length) {
    return null;
  }

  barrier = Number(barrier);

  const over =
    ticks.filter(
      t => t.digit > barrier
    ).length;

  const under =
    ticks.filter(
      t => t.digit < barrier
    ).length;

  const equal =
    ticks.filter(
      t => t.digit === barrier
    ).length;

  return {

    barrier,

    sampleSize: ticks.length,

    overCount: over,

    underCount: under,

    equalCount: equal,

    overPercentage:
      (over / ticks.length) * 100,

    underPercentage:
      (under / ticks.length) * 100,

    equalPercentage:
      (equal / ticks.length) * 100
  };
}


// ==========================================
// RUN COMPLETE ANALYSIS
// ==========================================

function runAnalysis() {

  const patterns =
    analyzeHistoricalPatterns();

  const evenOdd =
    analyzeEvenOdd();

  const barrier =
    document.getElementById("barrier").value;

  const overUnder =
    analyzeOverUnder(barrier);


  console.log(
    "===== HISTORICAL ANALYSIS ====="
  );

  console.log(
    "Pattern analysis:",
    patterns
  );

  console.log(
    "Even/Odd:",
    evenOdd
  );

  console.log(
    "Over/Under:",
    overUnder
  );


  return {

    patterns,

    evenOdd,

    overUnder

  };
                         }
