export const setFinish = (finish: boolean) => {
    const finishEle = document.getElementById("finish");
    if (finishEle) {
        const timerEle = document.getElementById("timer");
        finishEle!.innerText =
            finish && timerEle?.innerText !== "😽"
                ? "👏 ทำได้ไงงงงง"
                : "🤔 ไหนดูดิ๊";
    }
};

/**
 * Update the timer display (in MM:SS format).
 */
export const setTime = (seconds: number) => {
    const timerEle = document.getElementById("timer");
    if (timerEle) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const text = `${String(mins).padStart(2, "0")}:${String(secs).padStart(
            2,
            "0"
        )}`;
        timerEle.innerText = text;
    }
};
