let returnUrl = new URLSearchParams(window.location.search).get('returnUrl');

document.getElementById('whitelistBtn').addEventListener('click', () => {
    document.getElementById('whitelistBtn').style.display = 'none';
    document.getElementById('challengeContainer').style.display = 'block';
});

document.getElementById('cancelBtn').addEventListener('click', () => {
    window.close();
});

document.getElementById('confirmBtn').addEventListener('click', () => {
    document.getElementById('questionText').style.display = 'none';
    document.querySelector('.actions').style.display = 'none';

    // Offer choice instead of random
    document.getElementById('challengeChoice').style.display = 'block';
});

document.getElementById('chooseMath').addEventListener('click', () => {
    document.getElementById('challengeChoice').style.display = 'none';
    startMathChallenge();
});

document.getElementById('chooseTimer').addEventListener('click', () => {
    document.getElementById('challengeChoice').style.display = 'none';
    startCountdown();
});

function startMathChallenge() {
    const mathSection = document.getElementById('mathSection');
    mathSection.style.display = 'block';

    const a = Math.floor(Math.random() * 90) + 10;
    const b = Math.floor(Math.random() * 90) + 10;
    const c = Math.floor(Math.random() * 90) + 10;
    const op1 = Math.random() > 0.5 ? '+' : '-';
    const op2 = Math.random() > 0.5 ? '+' : '-';

    const problem = `(${a} ${op1} ${b} ${op2} ${c})`;

    let result = a;
    if (op1 === '+') result += b; else result -= b;
    if (op2 === '+') result += c; else result -= c;
    const expected = result;

    document.getElementById('mathProblem').textContent = problem + ' = ?';

    document.getElementById('submitMath').onclick = async () => {
        const ans = parseInt(document.getElementById('mathAnswer').value);
        if (ans === expected) {
            await finishWhitelist();
        } else {
            alert('Incorrect. Try again to normalize your brain.');
            startMathChallenge(); // regenerate
        }
    };
}

function startCountdown() {
    const countdownSection = document.getElementById('countdownSection');
    countdownSection.style.display = 'block';

    let timeLeft = 60;
    const timerDisplay = document.getElementById('timer');

    const interval = setInterval(async () => {
        timeLeft--;
        timerDisplay.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(interval);
            await finishWhitelist();
        }
    }, 1000);
}

async function finishWhitelist() {
    if (returnUrl) {
        await addToWhitelist(returnUrl);
        window.location.href = returnUrl;
    } else {
        window.location.href = 'https://www.youtube.com';
    }
}
