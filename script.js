document.addEventListener("DOMContentLoaded", function () {
  const startButton = document.getElementById("start-round");
  const statusBlock = document.getElementById("top-running-status");
  const holeView = document.getElementById("hole-view");

  if (!startButton || !statusBlock || !holeView) return;

  startButton.addEventListener("click", function () {
    const courseName = document.getElementById("courseName")?.value || "Unnamed Course";
    const roundDate = document.getElementById("roundDate")?.value || "Unknown Date";
    const handicap = document.getElementById("handicap")?.value || "N/A";

    const selectedStats = Array.from(
      document.querySelectorAll("#stat-selector input[type='checkbox']:checked")
    ).map((checkbox) => checkbox.value);

    const roundData = {
      courseName,
      roundDate,
      handicap,
      selectedStats,
    };

    statusBlock.textContent = `✅ Round started at ${courseName} on ${roundDate}`;
    holeView.innerHTML = `<p>Hole tracking will appear here.</p>`;
  });
});
