/**
 * Updates the text content of an HTML element with the ID "finish".
 * Displays a congratulatory message if the cube is finished and the timer is not showing the initial state,
 * otherwise displays a thinking/checking message.
 *
 * @param {boolean} finish - Indicates whether the Rubik's Cube is currently in a solved state.
 */
export const setFinish = (finish: boolean) => {
    // Get the HTML element that displays the finish status.
    const finishEle = document.getElementById("finish");
    // Check if the element exists.
    if (finishEle) {
        // Get the HTML element that displays the timer.
        const timerEle = document.getElementById("timer");
        // Set the text based on the finish state and timer content.
        // If finished and timer is not the initial '😽', show success message.
        // Otherwise, show the 'checking' message.
        // The non-null assertion (!) assumes 'finishEle' is definitely found if the 'if' block is entered.
        finishEle!.innerText =
            finish && timerEle?.innerText !== "😽"
                ? "👏 ทำได้ไงงงงง" // Thai: "👏 How did you do it?"
                : "🤔 ไหนดูดิ๊"; // Thai: "🤔 Let's see..."
    }
};

/**
 * Updates the text content of an HTML element with the ID "timer".
 * Formats the given time in seconds into an MM:SS string.
 *
 * @param {number} seconds - The total elapsed time in seconds.
 */
export const setTime = (seconds: number) => {
    // Get the HTML element that displays the timer.
    const timerEle = document.getElementById("timer");
    // Check if the element exists.
    if (timerEle) {
        // Calculate minutes by dividing total seconds by 60 and taking the floor.
        const mins = Math.floor(seconds / 60);
        // Calculate remaining seconds using the modulo operator.
        const secs = Math.floor(seconds % 60);
        // Format the time as MM:SS, padding with leading zeros if necessary.
        const text = `${String(mins).padStart(2, "0")}:${String(secs).padStart(
            2,
            "0"
        )}`;
        // Update the timer element's text content.
        timerEle.innerText = text;
    }
};
