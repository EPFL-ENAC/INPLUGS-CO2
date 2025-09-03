console.log("svg-animate.js loaded");
const svg = document.getElementById("mysvg");
const steps = [
  document.getElementById("step1"),
  document.getElementById("step2"),
  document.getElementById("step3"),
  document.getElementById("step4"),
  document.getElementById("step5")
];

// Reset everything before playing
function resetSteps() {
  steps.forEach(s => {
    // For <animateTransform> set repeatCount=0
    if (s.tagName === "animateTransform") s.setAttribute("repeatCount","0");
    // For <g> (step3) hide it
    if (s.tagName === "g") s.setAttribute("visibility","hidden");
  });
}

// Landing page: full sequence loop
function playFull(startStep = 0) {
  svg.pauseAnimations();
  svg.setCurrentTime(0);
  resetSteps();

  function runStep(i) {
    const s = steps[i];

    if (s.tagName === "animateTransform") {
      s.beginElement();
      s.addEventListener("endEvent", function handler() {
        s.removeEventListener("endEvent", handler);
        runStep((i+1) % steps.length);
      });
    } else if (s.tagName === "g") {
      s.setAttribute("visibility","visible");
      // Step 3: let arrows run for 10s then move to next step
      setTimeout(() => {
        s.setAttribute("visibility","hidden");
        runStep((i+1) % steps.length);
      }, 10000); // 10s
    }
  }

  runStep(startStep);
  svg.unpauseAnimations();
}

// Interactive mode: loop only selected step
function showStep(step) {
  svg.pauseAnimations();
  svg.setCurrentTime(0);
  resetSteps();

  const s = steps[step-1];

  if (s.tagName === "animateTransform") {
    s.setAttribute("repeatCount","indefinite");
    s.beginElement();
  } else if (s.tagName === "g") {
    s.setAttribute("visibility","visible");
    // Arrows already repeat indefinitely
  }

  svg.unpauseAnimations();
}